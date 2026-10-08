"use client";

import { useState, useTransition } from "react";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { completeOnboarding } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { GRADES, OTHER_SUBJECT, PURPOSES, SUBJECT_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const STEPS = [
  "Siz nechanchi sinfda o‘qiysiz?",
  "Qaysi fanlar sizga kerak?",
  "Aqilbekdan qanday foydalanmoqchisiz?",
];

export function OnboardingFlow(props: {
  firstName: string;
  initialGrade: number | null;
  initialSubjects: string[];
  initialPurposes: string[];
}) {
  const [step, setStep] = useState(0);
  const [grade, setGrade] = useState<number | null>(props.initialGrade);
  const [subjects, setSubjects] = useState<string[]>(props.initialSubjects);
  const [purposes, setPurposes] = useState<string[]>(props.initialPurposes);
  const [pending, startTransition] = useTransition();

  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const canContinue = step === 0 ? grade !== null : step === 1 ? subjects.length > 0 : purposes.length > 0;

  function finish() {
    if (grade === null) return;
    startTransition(async () => {
      const result = await completeOnboarding({
        grade,
        subjects: subjects.filter((s) => s !== OTHER_SUBJECT.slug),
        purposes,
      });
      if (result && !result.ok) toast.error(result.error);
    });
  }

  return (
    <div className="mt-4 rounded-3xl border bg-card p-5 shadow-sm sm:p-8">
      <div className="flex items-center gap-2" aria-label={`Qadam ${step + 1} / ${STEPS.length}`}>
        {STEPS.map((_, i) => (
          <span key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors", i <= step ? "bg-primary" : "bg-muted")} />
        ))}
      </div>

      <p className="mt-6 text-sm font-medium text-primary">
        {step === 0 ? `Salom${props.firstName ? `, ${props.firstName}` : ""}! Keling, tanishib olamiz 👋` : `Qadam ${step + 1} / 3`}
      </p>
      <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{STEPS[step]}</h1>

      <div className="mt-6">
        {step === 0 && (
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4" role="radiogroup" aria-label="Sinf">
            {GRADES.map((g) => (
              <button
                key={g}
                type="button"
                role="radio"
                aria-checked={grade === g}
                onClick={() => setGrade(g)}
                className={cn(
                  "h-14 rounded-xl border text-base font-semibold transition hover:border-primary/50",
                  grade === g && "border-primary bg-brand-soft text-primary ring-2 ring-primary/30",
                )}
              >
                {g}-sinf
              </button>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3" role="group" aria-label="Fanlar">
            {[...SUBJECT_OPTIONS, OTHER_SUBJECT].map((s) => {
              const active = subjects.includes(s.slug);
              return (
                <button
                  key={s.slug}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSubjects((list) => toggle(list, s.slug))}
                  className={cn(
                    "flex min-h-14 items-center gap-2.5 rounded-xl border px-3.5 py-3 text-left font-medium transition hover:border-primary/50",
                    active && "border-primary bg-brand-soft text-primary ring-2 ring-primary/30",
                  )}
                >
                  <span className="text-xl" aria-hidden>{s.icon}</span>
                  <span className="flex-1">{s.name}</span>
                  {active && <CheckIcon className="size-4" />}
                </button>
              );
            })}
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-2.5 sm:grid-cols-2" role="group" aria-label="Maqsadlar">
            {PURPOSES.map((p) => {
              const active = purposes.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setPurposes((list) => toggle(list, p.id))}
                  className={cn(
                    "flex min-h-14 items-center gap-3 rounded-xl border px-4 py-3 text-left font-medium transition hover:border-primary/50",
                    active && "border-primary bg-brand-soft text-primary ring-2 ring-primary/30",
                  )}
                >
                  <span className="text-xl" aria-hidden>{p.icon}</span>
                  <span className="flex-1">{p.label}</span>
                  {active && <CheckIcon className="size-4" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between gap-3">
        <Button variant="ghost" className="h-11 px-4" onClick={() => setStep((s) => s - 1)} disabled={step === 0 || pending}>
          <ArrowLeftIcon /> Orqaga
        </Button>
        {step < STEPS.length - 1 ? (
          <Button className="h-11 px-6" onClick={() => setStep((s) => s + 1)} disabled={!canContinue}>
            Davom etish <ArrowRightIcon />
          </Button>
        ) : (
          <Button className="h-11 px-6" onClick={finish} disabled={!canContinue || pending}>
            {pending ? <Loader2Icon className="animate-spin" /> : <CheckIcon />} Boshlash
          </Button>
        )}
      </div>
    </div>
  );
}
