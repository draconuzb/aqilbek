import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ChatView } from "@/components/chat/chat-view";
import { displayName, requireProfile } from "@/lib/auth";
import { CHAT_MODES, LIMITS, type ChatMode } from "@/lib/constants";
import { getSubjects } from "@/lib/data/subjects";
import { createClient } from "@/lib/supabase/server";
import type { Conversation, Message } from "@/lib/types";

export const metadata: Metadata = { title: "Aqilbek" };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ChatPage({ params, searchParams }: PageProps<"/chat/[[...id]]">) {
  const [{ id }, query, profile, subjects] = await Promise.all([params, searchParams, requireProfile(), getSubjects()]);
  const conversationId = id?.[0];

  let conversation: Conversation | null = null;
  let messages: Message[] = [];

  if (conversationId) {
    if (!z.uuid().safeParse(conversationId).success || id!.length > 1) notFound();
    const supabase = await createClient();
    const [{ data: conv }, { data: rows }] = await Promise.all([
      supabase
        .from("conversations")
        .select("id, title, subject_id, mode, is_favorite, created_at, updated_at")
        .eq("id", conversationId)
        .eq("user_id", profile.id)
        .maybeSingle<Conversation>(),
      supabase
        .from("messages")
        .select("id, role, content, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(500),
    ]);
    if (!conv) notFound();
    conversation = conv;
    messages = (rows ?? []) as Message[];
  }

  const modeParam = first(query.mode);
  const initialMode = CHAT_MODES.some((m) => m.id === modeParam) ? (modeParam as ChatMode) : undefined;
  const subjectParam = first(query.subject);
  const prompt = first(query.q)?.slice(0, LIMITS.messageMaxChars);

  return (
    <ChatView
      key={conversation?.id ?? "new"}
      conversation={
        conversation && {
          id: conversation.id,
          title: conversation.title,
          isFavorite: conversation.is_favorite,
          mode: conversation.mode,
          subject: subjects.find((s) => s.id === conversation.subject_id)?.slug ?? null,
        }
      }
      initialMessages={messages}
      student={{ name: displayName(profile), grade: profile.grade }}
      subjects={subjects.map((s) => ({ slug: s.slug, name: s.name, icon: s.icon }))}
      initialPrompt={conversation ? undefined : prompt}
      autoSend={!conversation && first(query.send) === "1"}
      initialMode={initialMode}
      initialSubject={subjects.some((s) => s.slug === subjectParam) ? subjectParam : undefined}
    />
  );
}
