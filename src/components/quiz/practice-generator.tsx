"use client";

import { useState } from "react";
import { BookmarkIcon, EyeIcon, LightbulbIcon, Loader2Icon, SparklesIcon } from "lucide-react";
import { toast } from "sonner";
import { saveItem } from "@/app/actions/saved";
import { Markdown } from "@/components/chat/markdown";
import { Button } from "@/components/ui/button";
import { LIMITS, SUBJECT_OPTIONS } from "@/lib/constants";
import { ERRORS } from "@/lib/errors";
import type { PracticeExercise, PracticeSet } from "@/lib/types";
import { cn } from "@/lib/utils";
import { GeneratorFields } from "./generator-fields";

const LEVELS: Record<PracticeExercise["level"], { label: string; className: string }> = {
  easy: { label: "Oson", className: "bg-success-soft text-success" },
  medium: { label: "O‘rta", className: "bg-sun-soft text-[oklch(0.5_0.12_70)] dark:text-sun" },
  hard: { label: "Qiyin", className: "bg-destructive/10 text-destructive" },
};

function Counter({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border px-3 py-2">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-1">
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => onChange(Math.max(0, value - 1))} aria-label={`${label}: kamaytirish`}>
          −
        </Button>
        <span className="w-5 text-center tabular-nums" aria-live="polite">{value}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onChange(Math.min(LIMITS.practiceMaxPerLevel, value + 1))}
          aria-label={`${label}: ko‘paytirish`}
        >
          +
        </Button>
      </div>
    </div>
  );
}

export function PracticeGenerator(props: { defaultSubject?: string; defaultTopic?: string; defaultGrade: number | null }) {
  const [subject, setSubject] = useState(
    SUBJECT_OPTIONS.some((s) => s.slug === props.defaultSubject) ? props.defaultSubject! : SUBJECT_OPTIONS[0].slug,
  );
  const [topic, setTopic] = useState(props.defaultTopic ?? "");
  const [grade, setGrade] = useState(props.defaultGrade ?? 7);
  const [counts, setCounts] = useState({ easy: 5, medium: 3, hard: 2 });
  const [loading, setLoading] = useState(false);
  const [practice, setPractice] = useState<(PracticeSet & { subject: string }) | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (topic.trim().length < 2) {
      toast.error("Mavzuni yozing.");
      return;
    }
    if (counts.easy + counts.medium + counts.hard === 0) {
      toast.error("Kamida bitta mashq tanlang.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, topic: topic.trim(), grade, ...counts }),
      });
      const data = (await res.json().catch(() => ({}))) as { practice?: PracticeSet; subject?: string; error?: string };
      if (!res.ok || !data.practice) throw new Error(data.error ?? ERRORS.generic);
      setPractice({ ...data.practice, subject: data.subject ?? "" });
    } catch (err) {
      toast.error(navigator.onLine ? (err instanceof Error ? err.message : ERRORS.generic) : ERRORS.offline);
    } finally {
      setLoading(false);
    }
  }

  async function saveAll() {
    if (!practice) return;
    const content = practice.exercises
      .map(
        (ex, i) =>
          `### ${i + 1}. ${LEVELS[ex.level].label}\n\n${ex.question}\n\n**Javob:** ${ex.answer}\n\n**Yechim:**\n\n${ex.solution}`,
      )
      .join("\n\n---\n\n");
    const result = await saveItem({ type: "note", title: `Mashqlar: ${practice.title}`, content });
    if (result.ok) toast.success("Mashqlar saqlandi ⭐");
    else toast.error(result.error);
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={onSubmit} className="grid max-w-2xl gap-5 rounded-3xl border bg-card p-5 sm:p-7">
        <GeneratorFields subject={subject} onSubject={setSubject} topic={topic} onTopic={setTopic} grade={grade} onGrade={setGrade} />
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Mashqlar soni</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            <Counter label="Oson" value={counts.easy} onChange={(easy) => setCounts((c) => ({ ...c, easy }))} />
            <Counter label="O‘rta" value={counts.medium} onChange={(medium) => setCounts((c) => ({ ...c, medium }))} />
            <Counter label="Qiyin" value={counts.hard} onChange={(hard) => setCounts((c) => ({ ...c, hard }))} />
          </div>
        </fieldset>
        <Button type="submit" className="h-11 px-6 sm:justify-self-end" disabled={loading}>
          {loading ? <Loader2Icon className="animate-spin" /> : <SparklesIcon />}
          {loading ? "Aqilbek mashq tuzyapti..." : "Mashq tuzish"}
        </Button>
      </form>

      {practice && (
        <section aria-label="Mashqlar">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">{practice.title}</h2>
              <p className="text-sm text-muted-foreground">{practice.subject} · {practice.exercises.length} ta mashq</p>
            </div>
            <Button variant="outline" onClick={saveAll}>
              <BookmarkIcon /> Saqlash
            </Button>
          </div>
          <ol className="grid gap-3">
            {practice.exercises.map((ex, i) => (
              <ExerciseCard key={i} exercise={ex} index={i} />
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

function ExerciseCard({ exercise, index }: { exercise: PracticeExercise; index: number }) {
  const [hint, setHint] = useState(false);
  const [answer, setAnswer] = useState(false);
  const level = LEVELS[exercise.level];
  return (
    <li className="rounded-2xl border bg-card p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-muted-foreground">{index + 1}.</span>
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", level.className)}>{level.label}</span>
      </div>
      <Markdown content={exercise.question} className="mt-2" />

      {hint && exercise.hint && (
        <div className="mt-3 rounded-xl bg-sun-soft px-3 py-2 text-sm">
          <span className="font-semibold">💡 Maslahat: </span>
          {exercise.hint}
        </div>
      )}
      {answer && (
        <div className="mt-3 rounded-xl border border-success/30 bg-success-soft/60 px-4 py-3">
          <p className="text-sm">
            <span className="font-semibold">✅ Javob: </span>
            {exercise.answer}
          </p>
          <div className="mt-2 border-t border-success/20 pt-2">
            <Markdown content={exercise.solution} className="text-sm leading-6" />
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {exercise.hint && !hint && (
          <Button variant="ghost" size="sm" onClick={() => setHint(true)}>
            <LightbulbIcon /> Maslahat
          </Button>
        )}
        <Button variant={answer ? "ghost" : "outline"} size="sm" onClick={() => setAnswer((v) => !v)} aria-expanded={answer}>
          <EyeIcon /> {answer ? "Javobni yashirish" : "Javobni ko‘rish"}
        </Button>
      </div>
    </li>
  );
}
