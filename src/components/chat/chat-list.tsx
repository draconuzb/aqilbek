"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, use, useMemo, useState } from "react";
import { MoreHorizontalIcon, PencilIcon, PlusIcon, SearchIcon, StarIcon, StarOffIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { deleteConversation, renameConversation, setConversationFavorite } from "@/app/actions/conversations";
import { ConfirmDialog, RenameDialog } from "@/components/common/dialogs";
import { Button, buttonVariants } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { Conversation } from "@/lib/types";
import { cn } from "@/lib/utils";

export type ChatListItem = Pick<Conversation, "id" | "title" | "is_favorite" | "updated_at"> & { icon: string };

const ChatListContext = createContext<ChatListItem[]>([]);

export function ChatListProvider({ conversations, children }: { conversations: ChatListItem[]; children: React.ReactNode }) {
  return <ChatListContext value={conversations}>{children}</ChatListContext>;
}

export function useChatList() {
  return use(ChatListContext);
}

/** Shared conversation actions (rename / favorite / delete) with their dialogs. */
export function useConversationActions() {
  const router = useRouter();
  const pathname = usePathname();
  const [renaming, setRenaming] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function toggleFavorite(id: string, favorite: boolean) {
    const result = await setConversationFavorite(id, favorite);
    if (!result.ok) toast.error(result.error);
    else toast.success(favorite ? "Sevimlilarga qo‘shildi ⭐" : "Sevimlilardan olib tashlandi");
  }

  const dialogs = (
    <>
      <RenameDialog
        open={renaming !== null}
        onOpenChange={(open) => !open && setRenaming(null)}
        initialValue={renaming?.title ?? ""}
        onSave={async (title) => {
          if (!renaming) return;
          const result = await renameConversation(renaming.id, title);
          if (!result.ok) toast.error(result.error);
        }}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Suhbatni o‘chirasizmi?"
        description="Bu suhbat va undagi barcha xabarlar butunlay o‘chiriladi."
        onConfirm={async () => {
          if (!deleting) return;
          const id = deleting;
          const result = await deleteConversation(id);
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          toast.success("Suhbat o‘chirildi");
          if (pathname === `/chat/${id}`) router.replace("/chat");
        }}
      />
    </>
  );

  return {
    dialogs,
    rename: (id: string, title: string) => setRenaming({ id, title }),
    remove: (id: string) => setDeleting(id),
    toggleFavorite,
  };
}

export function ConversationMenu({
  conversation,
  actions,
  className,
}: {
  conversation: Pick<ChatListItem, "id" | "title" | "is_favorite">;
  actions: ReturnType<typeof useConversationActions>;
  className?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-sm" className={className} aria-label="Suhbat amallari" />}
      >
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => actions.rename(conversation.id, conversation.title)}>
          <PencilIcon /> Nomini o‘zgartirish
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => actions.toggleFavorite(conversation.id, !conversation.is_favorite)}>
          {conversation.is_favorite ? <StarOffIcon /> : <StarIcon />}
          {conversation.is_favorite ? "Sevimlilardan olish" : "Sevimlilarga qo‘shish"}
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => actions.remove(conversation.id)}>
          <Trash2Icon /> O‘chirish
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ChatList({ onNavigate }: { onNavigate?: () => void }) {
  const conversations = useChatList();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const actions = useConversationActions();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? conversations.filter((c) => c.title.toLowerCase().includes(q)) : conversations;
  }, [conversations, query]);
  const favorites = filtered.filter((c) => c.is_favorite);
  const others = filtered.filter((c) => !c.is_favorite);

  const renderItem = (c: ChatListItem) => {
    const active = pathname === `/chat/${c.id}`;
    return (
      <li key={c.id} className="group relative">
        <Link
          href={`/chat/${c.id}`}
          onClick={onNavigate}
          aria-current={active ? "page" : undefined}
          className={cn(
            "flex h-10 items-center gap-2.5 rounded-lg pr-9 pl-2.5 text-sm transition hover:bg-sidebar-accent",
            active && "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
          )}
        >
          <span aria-hidden>{c.icon}</span>
          <span className="truncate">{c.title}</span>
        </Link>
        <ConversationMenu
          conversation={c}
          actions={actions}
          className="absolute top-1/2 right-1 -translate-y-1/2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100 data-popup-open:opacity-100"
        />
      </li>
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="grid gap-2 p-3">
        <Link href="/chat" onClick={onNavigate} className={cn(buttonVariants(), "h-10 justify-start gap-2 px-3")}>
          <PlusIcon /> Yangi suhbat
        </Link>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suhbatlarni qidirish"
            aria-label="Suhbatlarni qidirish"
            className="h-9 pl-8"
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {favorites.length > 0 && (
          <section className="mb-3">
            <h3 className="px-2.5 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">⭐ Sevimlilar</h3>
            <ul>{favorites.map(renderItem)}</ul>
          </section>
        )}
        <section>
          <h3 className="px-2.5 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Suhbatlar</h3>
          {others.length === 0 ? (
            <p className="px-2.5 py-2 text-sm text-muted-foreground">
              {query ? "Hech narsa topilmadi." : "Hali suhbatlar yo‘q."}
            </p>
          ) : (
            <ul>{others.map(renderItem)}</ul>
          )}
        </section>
      </div>
      {actions.dialogs}
    </div>
  );
}
