import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { EmptyState, PageShell } from "@/components/app/page-shell";
import { QuizCardActions } from "@/components/quiz/quiz-card-actions";
import { buttonVariants } from "@/components/ui/button";
import { requireProfile } from "@/lib/auth";
import { DIFFICULTIES, type Difficulty } from "@/lib/constants";
import { getSubjects } from "@/lib/data/subjects";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Testlar" };

type QuizListRow = {
  id: string;
  title: string;
  topic: string;
  subject_id: number | null;
  difficulty: Difficulty;
  created_at: string;
  quiz_json: { questions: unknown[] };
};

export default async function QuizzesPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const [{ data: quizzes }, { data: attempts }, subjects] = await Promise.all([
    supabase
      .from("quizzes")
      .select("id, title, topic, subject_id, difficulty, created_at, quiz_json")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(60),
    supabase
      .from("quiz_attempts")
      .select("quiz_id, score, total, created_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(300),
    getSubjects(),
  ]);

  const best = new Map<string, { score: number; total: number; count: number }>();
  for (const a of (attempts ?? []) as { quiz_id: string; score: number; total: number }[]) {
    const prev = best.get(a.quiz_id);
    if (!prev) best.set(a.quiz_id, { score: a.score, total: a.total, count: 1 });
    else best.set(a.quiz_id, { score: Math.max(prev.score, a.score), total: a.total, count: prev.count + 1 });
  }
  const rows = (quizzes ?? []) as QuizListRow[];

  return (
    <PageShell
      title="Testlar 📝"
      description="AI yordamida istalgan mavzudan test tuzing va bilimingizni tekshiring."
      actions={
        <Link href="/quizzes/new" className={cn(buttonVariants(), "h-10 px-4")}>
          <PlusIcon /> Yangi test
        </Link>
      }
    >
      {rows.length === 0 ? (
        <EmptyState
          icon="📝"
          title="Hali testlar yo‘q"
          text="Fan va mavzuni tanlang — Aqilbek siz uchun test tuzib beradi."
          action={
            <Link href="/quizzes/new" className={cn(buttonVariants(), "h-10 px-5")}>
              Test tuzish
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((q) => {
            const subject = subjects.find((s) => s.id === q.subject_id);
            const stats = best.get(q.id);
            const pct = stats ? Math.round((stats.score / stats.total) * 100) : null;
            return (
              <div key={q.id} className="flex flex-col rounded-2xl border bg-card p-5">
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-medium text-primary">
                    {subject ? `${subject.icon} ${subject.name}` : "Test"}
                  </span>
                  <QuizCardActions quizId={q.id} />
                </div>
                <h2 className="mt-3 line-clamp-2 font-semibold">{q.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {q.quiz_json.questions.length} ta savol · {DIFFICULTIES.find((d) => d.id === q.difficulty)?.label}
                </p>
                <div className="mt-4 flex items-center justify-between gap-2">
                  {pct !== null ? (
                    <span className={cn("text-sm font-semibold", pct >= 70 ? "text-success" : pct >= 40 ? "text-[oklch(0.6_0.13_70)]" : "text-destructive")}>
                      Eng yaxshi: {stats!.score}/{stats!.total} ({pct}%)
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Hali ishlanmagan</span>
                  )}
                  <Link href={`/quizzes/${q.id}`} className={cn(buttonVariants({ variant: pct === null ? "default" : "outline", size: "sm" }), "h-8 px-3")}>
                    {pct === null ? "Boshlash" : "Qayta ishlash"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
