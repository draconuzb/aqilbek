import { getCurrentProfile } from "@/lib/auth";
import { chatStream, isAiConfigured, type ChatMessage, type Usage } from "@/lib/ai/mistral";
import { buildSystemPrompt } from "@/lib/ai/prompts";
import { checkInput, checkOutput } from "@/lib/ai/safety";
import { assertCanUseAi, logUsage } from "@/lib/ai/usage";
import { getConfig } from "@/lib/config";
import { LIMITS, type ChatMode } from "@/lib/constants";
import { getSubjectById, getSubjectBySlug, getUserSubjects } from "@/lib/data/subjects";
import { AppError, ERRORS } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { ChatStreamEvent } from "@/lib/types";
import { chatRequestSchema } from "@/lib/validation";

export const maxDuration = 120;

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function makeTitle(text: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= 60) return clean || "Yangi suhbat";
  const cut = clean.slice(0, 60);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 30 ? cut.lastIndexOf(" ") : 60)}…`;
}

type ConversationRow = { id: string; title: string; subject_id: number | null; mode: ChatMode };

export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return jsonError(ERRORS.unauthorized, 401);

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return jsonError(ERRORS.invalidInput, 400);
  }
  const rawMessage = (raw as { message?: unknown })?.message;
  if (typeof rawMessage === "string" && rawMessage.trim().length > LIMITS.messageMaxChars) {
    return jsonError(ERRORS.tooLong, 400);
  }
  const parsed = chatRequestSchema.safeParse(raw);
  if (!parsed.success) return jsonError(ERRORS.invalidInput, 400);
  const input = parsed.data;
  if (!input.regenerate && !input.message) return jsonError(ERRORS.invalidInput, 400);
  if (input.regenerate && !input.conversationId) return jsonError(ERRORS.invalidInput, 400);

  const supabase = await createClient();

  try {
    await assertCanUseAi(supabase, profile, "chat");
  } catch (err) {
    if (err instanceof AppError) return jsonError(err.message, err.status);
    throw err;
  }

  // Load the conversation (RLS guarantees it belongs to this student).
  let conversation: ConversationRow | null = null;
  if (input.conversationId) {
    const { data } = await supabase
      .from("conversations")
      .select("id, title, subject_id, mode")
      .eq("id", input.conversationId)
      .maybeSingle<ConversationRow>();
    if (!data) return jsonError(ERRORS.notFound, 404);
    conversation = data;
  }

  // Work out the prompt text.
  let userText = input.message ?? "";
  if (input.regenerate && conversation) {
    const { data: last } = await supabase
      .from("messages")
      .select("id, role, content")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: false })
      .limit(2);
    const rows = (last ?? []) as { id: string; role: string; content: string }[];
    if (rows[0]?.role === "assistant") {
      await supabase.from("messages").delete().eq("id", rows[0].id);
      rows.shift();
    }
    if (rows[0]?.role !== "user") return jsonError(ERRORS.invalidInput, 400);
    userText = rows[0].content;
  }

  if (!isAiConfigured()) return jsonError(ERRORS.aiUnavailable, 503);
  let model = getConfig().mistral.model;

  // Input moderation — inappropriate prompts never reach the model and are not stored.
  const inputVerdict = await checkInput(userText, request.signal);
  if (!inputVerdict.allowed) {
    await logUsage(supabase, {
      userId: profile.id,
      kind: "chat",
      status: "blocked",
      model,
      safetyCategory: inputVerdict.category,
    });
    return Response.json({ blocked: true, reply: inputVerdict.reply });
  }

  // Resolve subject & mode.
  const requestedSubject = input.subject ? await getSubjectBySlug(input.subject) : null;
  const mode = (input.mode as ChatMode | undefined) ?? conversation?.mode ?? "explain";

  if (!conversation) {
    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: profile.id, title: makeTitle(userText), subject_id: requestedSubject?.id ?? null, mode })
      .select("id, title, subject_id, mode")
      .single<ConversationRow>();
    if (error || !data) return jsonError(ERRORS.generic, 500);
    conversation = data;
  } else {
    const updates: Partial<ConversationRow> = {};
    if (mode !== conversation.mode) updates.mode = mode;
    if (requestedSubject && requestedSubject.id !== conversation.subject_id) updates.subject_id = requestedSubject.id;
    if (Object.keys(updates).length) {
      await supabase.from("conversations").update(updates).eq("id", conversation.id);
      conversation = { ...conversation, ...updates };
    }
  }
  const conversationId = conversation.id;

  let userMessageId: string | null = null;
  if (!input.regenerate) {
    const { data, error } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, user_id: profile.id, role: "user", content: userText })
      .select("id")
      .single<{ id: string }>();
    if (error || !data) return jsonError(ERRORS.generic, 500);
    userMessageId = data.id;
  }

  // Conversation history for context (most recent N, oldest first).
  const [{ data: historyRows }, userSubjects, currentSubject] = await Promise.all([
    supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .eq("flagged", false)
      .order("created_at", { ascending: false })
      .limit(LIMITS.historyContextMessages),
    getUserSubjects(supabase, profile.id),
    getSubjectById(conversation.subject_id),
  ]);

  const history = ((historyRows ?? []) as ChatMessage[]).reverse();
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: buildSystemPrompt(
        {
          name: profile.first_name,
          grade: profile.grade,
          subjects: userSubjects.map((s) => s.name),
          currentSubject: currentSubject?.name ?? null,
          preferredLanguage: profile.preferred_language,
        },
        mode,
      ),
    },
    ...history,
  ];

  const encoder = new TextEncoder();
  const upstream = new AbortController();
  request.signal.addEventListener("abort", () => upstream.abort());

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let open = true;
      const send = (event: ChatStreamEvent) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          open = false;
        }
      };

      send({ type: "meta", conversationId, userMessageId, title: conversation.title });

      let full = "";
      let usage: Usage | undefined;
      let failed = false;

      try {
        const result = await chatStream(messages, { signal: upstream.signal }, (u) => (usage = u));
        model = result.model;
        for await (const delta of result.deltas) {
          full += delta;
          send({ type: "delta", text: delta });
        }
      } catch (err) {
        if (!upstream.signal.aborted) {
          failed = true;
          console.error("[chat] stream failed", { reason: err instanceof Error ? err.message : "unknown" });
          send({ type: "error", message: ERRORS.aiUnavailable });
        }
      }

      // Persist whatever was generated (including a partial answer after "stop").
      let messageId: string | null = null;
      if (full.trim()) {
        let content = full.slice(0, 40000);
        let safetyCategory: string | null = null;
        const outputVerdict = await checkOutput(content);
        if (!outputVerdict.allowed) {
          safetyCategory = outputVerdict.category;
          content = outputVerdict.reply;
          send({ type: "replace", text: outputVerdict.reply });
        }
        const flagged = safetyCategory !== null;
        const { data } = await supabase
          .from("messages")
          .insert({ conversation_id: conversationId, user_id: profile.id, role: "assistant", content, flagged })
          .select("id")
          .single<{ id: string }>();
        messageId = data?.id ?? null;

        await logUsage(supabase, {
          userId: profile.id,
          kind: "chat",
          status: flagged ? "blocked" : "ok",
          model,
          promptTokens: usage?.promptTokens,
          completionTokens: usage?.completionTokens,
          safetyCategory,
        });
      } else if (failed) {
        await logUsage(supabase, { userId: profile.id, kind: "chat", status: "error", model });
      }

      send({ type: "done", messageId });
      if (open) {
        open = false;
        try {
          controller.close();
        } catch {
          // already closed by the client
        }
      }
    },
    cancel() {
      upstream.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
