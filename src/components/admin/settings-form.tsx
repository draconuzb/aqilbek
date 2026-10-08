"use client";

import { useState, useTransition } from "react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { saveSettings } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

function toLimit(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isInteger(n) && n >= 0 ? n : NaN;
}

export function SettingsForm(props: {
  aiEnabled: boolean;
  dailyChatLimit: number | null;
  dailyGenerationLimit: number | null;
  announcement: string;
  defaults: { chat: number; generations: number };
}) {
  const [aiEnabled, setAiEnabled] = useState(props.aiEnabled);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const dailyChatLimit = toLimit(String(form.get("chat") ?? ""));
    const dailyGenerationLimit = toLimit(String(form.get("generations") ?? ""));
    if (Number.isNaN(dailyChatLimit) || Number.isNaN(dailyGenerationLimit)) {
      toast.error("Limit musbat butun son bo‘lishi kerak.");
      return;
    }
    startTransition(async () => {
      const result = await saveSettings({
        aiEnabled,
        dailyChatLimit,
        dailyGenerationLimit,
        announcement: String(form.get("announcement") ?? "") || null,
      });
      if (result.ok) toast.success("Sozlamalar saqlandi");
      else toast.error(result.error);
    });
  }

  return (
    <form onSubmit={submit} className="grid content-start gap-5 rounded-3xl border bg-card p-5 sm:p-6">
      <label className="flex items-center justify-between gap-4 rounded-2xl border px-4 py-3">
        <span>
          <span className="block font-medium">AI xizmati yoqilgan</span>
          <span className="text-xs text-muted-foreground">O‘chirilsa, o‘quvchilar “texnik xizmat” xabarini ko‘radi.</span>
        </span>
        <Switch checked={aiEnabled} onCheckedChange={setAiEnabled} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kunlik chat limiti" htmlFor="chat" hint={`Bo‘sh = standart (${props.defaults.chat})`}>
          <Input id="chat" name="chat" type="number" min={0} defaultValue={props.dailyChatLimit ?? ""} className="h-10" />
        </Field>
        <Field label="Kunlik test/mashq limiti" htmlFor="generations" hint={`Bo‘sh = standart (${props.defaults.generations})`}>
          <Input id="generations" name="generations" type="number" min={0} defaultValue={props.dailyGenerationLimit ?? ""} className="h-10" />
        </Field>
      </div>
      <Field label="E’lon (bosh sahifada ko‘rinadi)" htmlFor="announcement">
        <Input id="announcement" name="announcement" defaultValue={props.announcement} maxLength={300} className="h-10" placeholder="Masalan: Yangi fanlar qo‘shildi!" />
      </Field>
      <Button type="submit" className="sm:justify-self-end" disabled={pending}>
        {pending && <Loader2Icon className="animate-spin" />} Saqlash
      </Button>
    </form>
  );
}
