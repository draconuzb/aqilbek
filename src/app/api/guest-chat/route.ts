import { chatStream, isAiConfigured, type ChatMessage } from "@/lib/ai/mistral";
import { buildGuestSystemPrompt } from "@/lib/ai/prompts";
import { checkInput, checkOutput } from "@/lib/ai/safety";
import { clientIp, takeGuestQuestion } from "@/lib/ai/usage";
import { LIMITS } from "@/lib/constants";
import { AppError, ERRORS } from "@/lib/errors";
import type { ChatStreamEvent } from "@/lib/types";
import { guestChatSchema } from "@/lib/validation";

export const maxDuration = 60;

/**
 * Landing-page "try it" chat for visitors without an account.
 * Limited per IP per day (LIMIT_GUEST_QUESTIONS); nothing is stored.
 */
export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ error: ERRORS.invalidInput }, { status: 400 });
  }
  const rawMessage = (raw as { message?: unknown })?.message;
  if (typeof rawMessage === "string" && rawMessage.trim().length > LIMITS.guestMessageMaxChars) {
    return Response.json({ error: ERRORS.tooLong }, { status: 400 });
  }
  const parsed = guestChatSchema.safeParse(raw);
  if (!parsed.success) return Response.json({ error: ERRORS.invalidInput }, { status: 400 });
  if (!isAiConfigured()) return Response.json({ error: ERRORS.aiUnavailable }, { status: 503 });

  let remaining: number;
  try {
    remaining = takeGuestQuestion(clientIp(request.headers));
  } catch (err) {
    if (err instanceof AppError) return Response.json({ error: err.message }, { status: err.status });
    throw err;
  }

  const { message, history } = parsed.data;
  const verdict = await checkInput(message, request.signal);
  if (!verdict.allowed) return Response.json({ blocked: true, reply: verdict.reply });

  const messages: ChatMessage[] = [
    { role: "system", content: buildGuestSystemPrompt() },
    ...history,
    { role: "user", content: message },
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

      send({ type: "guest", remaining });
      let full = "";
      try {
        const result = await chatStream(messages, { signal: upstream.signal, maxTokens: 900 });
        for await (const delta of result.deltas) {
          full += delta;
          send({ type: "delta", text: delta });
        }
        if (full.trim()) {
          const out = await checkOutput(full);
          if (!out.allowed) send({ type: "replace", text: out.reply });
        }
      } catch (err) {
        if (!upstream.signal.aborted) {
          console.error("[guest-chat] stream failed", { reason: err instanceof Error ? err.message : "unknown" });
          send({ type: "error", message: ERRORS.aiUnavailable });
        }
      }

      send({ type: "done", messageId: null });
      if (open) {
        open = false;
        try {
          controller.close();
        } catch {
          // client already gone
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
