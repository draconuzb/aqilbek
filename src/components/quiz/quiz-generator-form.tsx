"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2Icon, SparklesIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DIFFICULTIES, SUBJECT_OPTIONS, type Difficulty } from "@/lib/constants";
import { ERRORS } from "@/lib/errors";
import { GeneratorFields, PillGroup } from "./generator-fields";

const COUNTS = [5, 10, 15, 20];

export function QuizGeneratorForm(props: {
  defaultSubject?: string;
  defaultTopic?: string;
  defaultGrade: number | null;
  remaining: number;
}) {
  const router = useRouter();
  const [subject, setSubject] = useState(
    SUBJECT_OPTIONS.some((s) => s.slug === props.defaultSubject) ? props.defaultSubject! : SUBJECT_OPTIONS[0].slug,
  );
  const [topic, setTopic] = useState(props.defaultTopic ?? "");
  const [grade, setGrade] = useState(props.defaultGrade ?? 7);
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (topic.trim().length < 2) {
      toast.error("Mavzuni yozing.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/quizzes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, topic: topic.trim(), grade, count, difficulty }),
      });
      const data = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
      if (!res.ok || !data.id) throw new Error(data.error ?? ERRORS.quizInvalid);
      toast.success("Test tayyor! Omad! 🍀");
      router.push(`/quizzes/${data.id}`);
    } catch (err) {
      toast.error(navigator.onLine ? (err instanceof Error ? err.message : ERRORS.generic) : ERRORS.offline);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid max-w-2xl gap-5 rounded-3xl border bg-card p-5 sm:p-7">
      <GeneratorFields subject={subject} onSubject={setSubject} topic={topic} onTopic={setTopic} grade={grade} onGrade={setGrade} />
      <PillGroup label="Savollar soni" options={COUNTS.map((c) => ({ value: c, label: `${c} ta` }))} value={count} onChange={setCount} />
      <PillGroup
        label="Qiyinlik darajasi"
        options={DIFFICULTIES.map((d) => ({ value: d.id, label: d.label }))}
        value={difficulty}
        onChange={setDifficulty}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">Bugun yana {props.remaining} ta test yoki mashq tuzish mumkin.</p>
        <Button type="submit" className="h-11 px-6" disabled={loading || props.remaining === 0}>
          {loading ? <Loader2Icon className="animate-spin" /> : <SparklesIcon />}
          {loading ? "Aqilbek test tuzyapti..." : "Test tuzish"}
        </Button>
      </div>
    </form>
  );
}
