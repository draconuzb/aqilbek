"use client";

import { useState, useTransition } from "react";
import { Loader2Icon, PencilIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { saveSubject } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Subject } from "@/lib/types";
import { cn } from "@/lib/utils";

type Draft = Omit<Subject, "id"> & { id: number | null };

const EMPTY: Draft = { id: null, name: "", slug: "", description: "", icon: "📘", topics: [], sort_order: 100, is_active: true };

export function SubjectsManager({ subjects }: { subjects: Subject[] }) {
  const [editing, setEditing] = useState<Draft | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      slug: String(form.get("slug") ?? "").toLowerCase(),
      description: String(form.get("description") ?? ""),
      icon: String(form.get("icon") ?? ""),
      topics: String(form.get("topics") ?? "")
        .split("\n")
        .map((t) => t.trim())
        .filter(Boolean),
      sortOrder: Number(form.get("sortOrder") ?? 0),
      isActive: editing.is_active,
    };
    startTransition(async () => {
      const result = await saveSubject(editing.id, payload);
      if (result.ok) {
        toast.success("Saqlandi");
        setEditing(null);
      } else toast.error(result.error);
    });
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setEditing(EMPTY)}>
          <PlusIcon /> Yangi fan
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.map((s) => (
          <div key={s.id} className={cn("flex items-start gap-3 rounded-2xl border bg-card p-4", !s.is_active && "opacity-60")}>
            <span className="text-2xl" aria-hidden>{s.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{s.name}</p>
              <p className="text-xs text-muted-foreground">
                /{s.slug} · {s.topics.length} ta mavzu {s.is_active ? "" : "· yashirin"}
              </p>
            </div>
            <Button variant="ghost" size="icon-sm" aria-label={`${s.name}ni tahrirlash`} onClick={() => setEditing({ ...s })}>
              <PencilIcon />
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Fanni tahrirlash" : "Yangi fan"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <form onSubmit={submit} className="grid gap-4" key={editing.id ?? "new"}>
              <div className="grid grid-cols-[1fr_5rem] gap-3">
                <Field label="Nomi" htmlFor="name">
                  <Input id="name" name="name" defaultValue={editing.name} required maxLength={60} className="h-10" />
                </Field>
                <Field label="Belgi" htmlFor="icon">
                  <Input id="icon" name="icon" defaultValue={editing.icon} required maxLength={8} className="h-10 text-center text-lg" />
                </Field>
              </div>
              <div className="grid grid-cols-[1fr_6rem] gap-3">
                <Field label="Slug (URL)" htmlFor="slug" hint="Faqat kichik lotin harflari, raqam va -">
                  <Input id="slug" name="slug" defaultValue={editing.slug} required pattern="[a-z0-9-]+" maxLength={40} className="h-10" />
                </Field>
                <Field label="Tartib" htmlFor="sortOrder">
                  <Input id="sortOrder" name="sortOrder" type="number" min={0} max={1000} defaultValue={editing.sort_order} className="h-10" />
                </Field>
              </div>
              <Field label="Tavsif" htmlFor="description">
                <Input id="description" name="description" defaultValue={editing.description} maxLength={200} className="h-10" />
              </Field>
              <Field label="Mavzular (har biri yangi qatorda)" htmlFor="topics">
                <Textarea id="topics" name="topics" defaultValue={editing.topics.join("\n")} rows={8} />
              </Field>
              <label className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-sm">
                Faol (o‘quvchilarga ko‘rinadi)
                <Switch checked={editing.is_active} onCheckedChange={(v) => setEditing((d) => d && { ...d, is_active: v })} />
              </label>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                  Bekor qilish
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending && <Loader2Icon className="animate-spin" />} Saqlash
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
