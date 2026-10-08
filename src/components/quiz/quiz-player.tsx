"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  Loader2Icon,
  MessageCircleQuestionIcon,
  RotateCcwIcon,
  XCircleIcon,
} from "lucide-react";
import { toast } from "sonner";
import { submitQuizAttempt } from "@/app/actions/quizzes";
import { Markdown } from "@/components/chat/markdown";
import { ConfirmDialog } from "@/components/common/dialogs";
import { Button, buttonVariants } from "@/components/ui/button";
import { DIFFICULTIES } from "@/lib/constants";
import type { PublicQuiz, QuizResult } from "@/lib/types";
import { cn } from "@/lib/utils";

const LETTERS = ["A", "B", "C", "D"];

export function QuizPlayer({ quiz, subjectSlug }: { quiz: PublicQuiz; subjectSlug: string | null }) {
  const total = quiz.questions.length;
  const [answers, setAnswers] = useState<(number | null)[]>(() => Array(total).fill(null));
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [pending, startTransition] = useTransition();

  const answered = answers.filter((a) => a !== null).length;
  const question = quiz.questions[index];

  const [confirmOpen, setConfirmOpen] = useState(false);

  function submit(force = false) {
    if (answered < total && !force) {
      setConfirmOpen(true);
      return;
    }
    startTransition(async () => {
      const res = await submitQuizAttempt({ quizId: quiz.id, answers: answers.map((a) => a ?? -1) });
      if (res.ok) {
        setResult(res.data);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else toast.error(res.error);
    });
  }

  function restart() {
    setAnswers(Array(total).fill(null));
    setIndex(0);
    setResult(null);
  }

  if (result) return <QuizResultView quiz={quiz} result={result} subjectSlug={subjectSlug} onRetry={restart} />;

  return (
    <div>
      <Link href="/quizzes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4" /> Testlar
      </Link>
      <div className="rounded-3xl border bg-card p-5 sm:p-7">
        <p className="text-sm text-muted-foreground">
          {quiz.subject} · {DIFFICULTIES.find((d) => d.id === quiz.difficulty)?.label}
        </p>
        <h1 className="mt-1 text-xl font-bold sm:text-2xl">{quiz.title}</h1>

        <div className="mt-5 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={answered}>
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(answered / total) * 100}%` }} />
          </div>
          <span className="text-sm font-medium tabular-nums">
            {answered}/{total}
          </span>
        </div>

        <div className="mt-6">
          <p className="text-sm font-semibold text-primary">
            {index + 1}-savol / {total}
          </p>
          <div className="mt-2 text-lg font-medium">
            <Markdown content={question.question} className="text-lg" />
          </div>
          <div className="mt-5 grid gap-2.5" role="radiogroup" aria-label={`${index + 1}-savol variantlari`}>
            {question.options.map((option, i) => {
              const selected = answers[index] === i;
              return (
                <button
                  key={i}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setAnswers((list) => list.map((a, qi) => (qi === index ? i : a)))}
                  className={cn(
                    "flex min-h-14 items-center gap-3 rounded-2xl border px-4 py-3 text-left transition hover:border-primary/50",
                    selected && "border-primary bg-brand-soft ring-2 ring-primary/25",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg border text-sm font-bold",
                      selected && "border-primary bg-primary text-primary-foreground",
                    )}
                  >
                    {LETTERS[i]}
                  </span>
                  <Markdown content={option} className="flex-1 text-[15px] leading-6" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-1.5" aria-label="Savollar">
          {quiz.questions.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`${i + 1}-savolga o‘tish`}
              aria-current={i === index ? "step" : undefined}
              className={cn(
                "size-9 rounded-lg border text-sm font-medium tabular-nums transition",
                answers[i] !== null && "border-primary/40 bg-brand-soft text-primary",
                i === index && "ring-2 ring-primary",
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <Button variant="outline" className="h-11 px-4" onClick={() => setIndex((i) => i - 1)} disabled={index === 0}>
            <ArrowLeftIcon /> Oldingi
          </Button>
          {index < total - 1 ? (
            <Button className="h-11 px-5" onClick={() => setIndex((i) => i + 1)}>
              Keyingi <ArrowRightIcon />
            </Button>
          ) : (
            <Button className="h-11 px-5" onClick={() => submit()} disabled={pending}>
              {pending ? <Loader2Icon className="animate-spin" /> : <CheckCircle2Icon />} Yakunlash
            </Button>
          )}
        </div>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Testni yakunlaysizmi?"
        description={`${total - answered} ta savolga javob berilmagan. Ular xato deb hisoblanadi.`}
        confirmLabel="Yakunlash"
        confirmVariant="default"
        onConfirm={() => submit(true)}
      />
    </div>
  );
}

function QuizResultView({
  quiz,
  result,
  subjectSlug,
  onRetry,
}: {
  quiz: PublicQuiz;
  result: QuizResult;
  subjectSlug: string | null;
  onRetry: () => void;
}) {
  const [onlyWrong, setOnlyWrong] = useState(false);
  const pct = Math.round((result.score / result.total) * 100);
  const wrong = result.total - result.score;
  const message =
    pct >= 90 ? "Ajoyib natija! 🏆" : pct >= 70 ? "Juda yaxshi! 👏" : pct >= 50 ? "Yomon emas, yana bir oz mashq qilamiz 💪" : "Xavotir olma — xatolar ustida ishlaymiz 📚";

  const items = result.review.map((r, i) => ({ ...r, i })).filter((r) => !onlyWrong || r.selected !== r.correctAnswer);

  return (
    <div>
      <section className="rounded-3xl border bg-card p-6 text-center sm:p-8">
        <p className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Natijangiz</p>
        <p className="mt-2 text-5xl font-extrabold tabular-nums">
          {result.score} <span className="text-muted-foreground">/ {result.total}</span>
        </p>
        <p className={cn("mt-1 text-2xl font-bold", pct >= 70 ? "text-success" : pct >= 50 ? "text-[oklch(0.62_0.14_70)]" : "text-destructive")}>
          {pct}%
        </p>
        <p className="mt-2 text-muted-foreground">{message}</p>
        <div className="mx-auto mt-5 flex max-w-xs justify-center gap-6 text-sm">
          <span className="flex items-center gap-1.5">
            <CheckCircle2Icon className="size-4 text-success" /> {result.score} to‘g‘ri
          </span>
          <span className="flex items-center gap-1.5">
            <XCircleIcon className="size-4 text-destructive" /> {wrong} xato
          </span>
        </div>
        <div className="mt-6 flex flex-col justify-center gap-2.5 sm:flex-row">
          <Button className="h-11 px-5" onClick={onRetry}>
            <RotateCcwIcon /> Qayta ishlash
          </Button>
          <Link href="/quizzes/new" className={cn(buttonVariants({ variant: "outline" }), "h-11 px-5")}>
            Yangi test
          </Link>
          <Link href="/quizzes" className={cn(buttonVariants({ variant: "ghost" }), "h-11 px-5")}>
            Testlar ro‘yxati
          </Link>
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Javoblar tahlili</h2>
          {wrong > 0 && (
            <Button variant="outline" size="sm" onClick={() => setOnlyWrong((v) => !v)}>
              {onlyWrong ? "Hammasini ko‘rsatish" : "Faqat xatolar"}
            </Button>
          )}
        </div>
        <ol className="grid gap-3">
          {items.map((r) => {
            const correct = r.selected === r.correctAnswer;
            return (
              <li key={r.i} className={cn("rounded-2xl border bg-card p-4 sm:p-5", !correct && "border-destructive/30")}>
                <div className="flex items-start gap-2.5">
                  {correct ? (
                    <CheckCircle2Icon className="mt-0.5 size-5 shrink-0 text-success" aria-label="To‘g‘ri" />
                  ) : (
                    <XCircleIcon className="mt-0.5 size-5 shrink-0 text-destructive" aria-label="Xato" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-muted-foreground">{r.i + 1}-savol</p>
                    <Markdown content={r.question} className="font-medium" />
                    <ul className="mt-3 grid gap-1.5 text-sm">
                      {r.options.map((o, oi) => (
                        <li
                          key={oi}
                          className={cn(
                            "flex items-start gap-2 rounded-lg px-2.5 py-1.5",
                            oi === r.correctAnswer && "bg-success-soft font-medium",
                            oi === r.selected && oi !== r.correctAnswer && "bg-destructive/10 line-through decoration-destructive/60",
                          )}
                        >
                          <span className="font-bold">{LETTERS[oi]}.</span>
                          <Markdown content={o} className="text-sm leading-6" />
                        </li>
                      ))}
                    </ul>
                    {r.selected === null && <p className="mt-2 text-xs text-muted-foreground">Javob berilmagan</p>}
                    <div className="mt-3 rounded-xl bg-muted/60 px-3 py-2 text-sm">
                      <span className="font-semibold">💡 Izoh: </span>
                      {r.explanation}
                    </div>
                    {!correct && (
                      <Link
                        href={`/chat?${new URLSearchParams({
                          q: `Testda shu savolda xato qildim, tushuntirib ber: ${r.question}`,
                          send: "1",
                          ...(subjectSlug ? { subject: subjectSlug } : {}),
                        }).toString()}`}
                        className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                      >
                        <MessageCircleQuestionIcon className="size-4" /> Aqilbekdan tushuntirish so‘rash
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
      <p className="mt-6 text-center text-xs text-muted-foreground">{quiz.topic}</p>
    </div>
  );
}
