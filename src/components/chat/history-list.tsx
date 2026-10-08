"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SearchIcon, StarIcon } from "lucide-react";
import { EmptyState } from "@/components/app/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CHAT_MODES } from "@/lib/constants";
import type { Conversation } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ConversationMenu, useConversationActions } from "./chat-list";

// Fixed time zone so server and browser render the same text (no hydration mismatch).
const dateFormat = new Intl.DateTimeFormat("uz-UZ", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Tashkent",
});

export function HistoryList({
  conversations,
  subjects,
}: {
  conversations: Conversation[];
  subjects: { id: number; name: string; icon: string }[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "favorites" | `subject:${number}`>("all");
  const actions = useConversationActions();

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return conversations.filter((c) => {
      if (q && !c.title.toLowerCase().includes(q)) return false;
      if (filter === "favorites") return c.is_favorite;
      if (filter.startsWith("subject:")) return c.subject_id === Number(filter.slice(8));
      return true;
    });
  }, [conversations, filter, query]);

  if (conversations.length === 0) {
    return (
      <EmptyState
        icon="🕘"
        title="Tarix bo‘sh"
        text="Aqilbek bilan suhbatlaringiz shu yerda saqlanadi."
        action={
          <Link href="/chat" className={cn(buttonVariants(), "h-10 px-5")}>
            Suhbat boshlash
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suhbatlarni qidirish"
            aria-label="Suhbatlarni qidirish"
            className="h-11 pl-9"
          />
        </div>
        <NativeSelect
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="sm:w-56"
          aria-label="Filtr"
        >
          <option value="all">Barcha suhbatlar</option>
          <option value="favorites">⭐ Sevimlilar</option>
          {subjects.map((s) => (
            <option key={s.id} value={`subject:${s.id}`}>
              {s.icon} {s.name}
            </option>
          ))}
        </NativeSelect>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">Hech narsa topilmadi.</p>
      ) : (
        <ul className="grid gap-2">
          {visible.map((c) => {
            const subject = subjects.find((s) => s.id === c.subject_id);
            const mode = CHAT_MODES.find((m) => m.id === c.mode);
            return (
              <li key={c.id} className="flex items-center gap-2 rounded-2xl border bg-card p-2 pr-2.5 transition hover:border-primary/40">
                <Link href={`/chat/${c.id}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-1.5">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-lg" aria-hidden>
                    {subject?.icon ?? "💬"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate font-medium">{c.title}</span>
                      {c.is_favorite && <StarIcon className="size-3.5 shrink-0 fill-sun text-sun" aria-label="Sevimli" />}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {[subject?.name, mode?.title, dateFormat.format(new Date(c.updated_at))].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                </Link>
                <ConversationMenu conversation={c} actions={actions} />
              </li>
            );
          })}
        </ul>
      )}
      {actions.dialogs}
    </div>
  );
}
