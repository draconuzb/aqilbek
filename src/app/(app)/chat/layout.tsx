import { Suspense } from "react";
import { ChatList, ChatListProvider, type ChatListItem } from "@/components/chat/chat-list";
import { Skeleton } from "@/components/ui/skeleton";
import { getSessionUserId } from "@/lib/auth";
import { getSubjects } from "@/lib/data/subjects";
import { createClient } from "@/lib/supabase/server";
import type { Conversation } from "@/lib/types";

async function ChatFrame({ children }: { children: React.ReactNode }) {
  const userId = await getSessionUserId();
  let conversations: ChatListItem[] = [];
  if (userId) {
    const supabase = await createClient();
    const [{ data }, subjects] = await Promise.all([
      supabase
        .from("conversations")
        .select("id, title, subject_id, is_favorite, updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(100),
      getSubjects(),
    ]);
    conversations = ((data ?? []) as Pick<Conversation, "id" | "title" | "subject_id" | "is_favorite" | "updated_at">[]).map(
      (c) => ({ ...c, icon: subjects.find((s) => s.id === c.subject_id)?.icon ?? "💬" }),
    );
  }

  return (
    <ChatListProvider conversations={conversations}>
      <div className="flex h-[calc(100svh-3.5rem)] min-h-0 lg:h-svh">
        <aside className="hidden w-72 shrink-0 flex-col border-r bg-sidebar/60 md:flex" aria-label="Suhbatlar ro‘yxati">
          <ChatList />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </ChatListProvider>
  );
}

function ChatSkeleton() {
  return (
    <div className="flex h-[calc(100svh-3.5rem)] lg:h-svh">
      <div className="hidden w-72 flex-col gap-2 border-r p-3 md:flex">
        <Skeleton className="h-10 rounded-lg" />
        <Skeleton className="h-9 rounded-lg" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 rounded-lg" />
        ))}
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6">
        <Skeleton className="size-14 rounded-2xl" />
        <Skeleton className="h-6 w-64 rounded-lg" />
        <Skeleton className="h-4 w-80 max-w-full rounded-lg" />
      </div>
    </div>
  );
}

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<ChatSkeleton />}>
      <ChatFrame>{children}</ChatFrame>
    </Suspense>
  );
}
