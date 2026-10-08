"use client";

import Link from "next/link";
import { useState } from "react";
import { CopyIcon, ExternalLinkIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { deleteSavedItem } from "@/app/actions/saved";
import { EmptyState } from "@/components/app/page-shell";
import { Markdown } from "@/components/chat/markdown";
import { ConfirmDialog } from "@/components/common/dialogs";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SAVED_TYPES, type SavedType } from "@/lib/constants";
import type { SavedItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SavedList({ items }: { items: SavedItem[] }) {
  const [tab, setTab] = useState<SavedType | "all">("all");
  const [open, setOpen] = useState<SavedItem | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const visible = tab === "all" ? items : items.filter((i) => i.type === tab);
  const count = (type: SavedType) => items.filter((i) => i.type === type).length;

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Nusxa olindi");
    } catch {
      toast.error("Nusxa olib bo‘lmadi");
    }
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon="⭐"
        title="Hali hech narsa saqlanmagan"
        text="Chatda foydali javob ostidagi 🔖 belgisini bosing — u shu yerda paydo bo‘ladi."
        action={
          <Link href="/chat" className={cn(buttonVariants(), "h-10 px-5")}>
            Aqilbekka o‘tish
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <div className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Turlar">
        {[{ id: "all" as const, label: "Barchasi", icon: "📁" }, ...SAVED_TYPES].map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "h-10 shrink-0 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition",
              tab === t.id ? "border-primary bg-brand-soft text-primary" : "bg-card hover:border-primary/40",
            )}
          >
            {t.icon} {t.label}{" "}
            <span className="text-muted-foreground">({t.id === "all" ? items.length : count(t.id)})</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">Bu bo‘limda hali narsa yo‘q.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((item) => {
            const type = SAVED_TYPES.find((t) => t.id === item.type);
            return (
              <article key={item.id} className="flex flex-col rounded-2xl border bg-card p-4">
                <span className="text-xs font-medium text-muted-foreground">
                  {type?.icon} {type?.label}
                </span>
                <h2 className="mt-1.5 line-clamp-2 font-semibold">{item.title}</h2>
                <p className="mt-1.5 line-clamp-3 flex-1 text-sm text-muted-foreground">
                  {item.content.replace(/[#*`>$_\-]/g, "").slice(0, 220)}
                </p>
                <div className="mt-3 flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => setOpen(item)}>
                    Ochish
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label="Nusxa olish" onClick={() => copy(item.content)}>
                    <CopyIcon />
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label="O‘chirish" onClick={() => setDeleting(item.id)} className="ml-auto text-muted-foreground">
                    <Trash2Icon />
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Dialog open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-h-[85svh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="pr-8">{open?.title}</DialogTitle>
          </DialogHeader>
          {open && <Markdown content={open.content} />}
          <div className="flex flex-wrap gap-2 border-t pt-3">
            <Button variant="outline" size="sm" onClick={() => open && copy(open.content)}>
              <CopyIcon /> Nusxa olish
            </Button>
            {open?.conversation_id && (
              <Link href={`/chat/${open.conversation_id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                <ExternalLinkIcon /> Suhbatga o‘tish
              </Link>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="O‘chirilsinmi?"
        description="Saqlangan element butunlay o‘chiriladi."
        onConfirm={async () => {
          if (!deleting) return;
          const result = await deleteSavedItem(deleting);
          if (result.ok) toast.success("O‘chirildi");
          else toast.error(result.error);
        }}
      />
    </div>
  );
}
