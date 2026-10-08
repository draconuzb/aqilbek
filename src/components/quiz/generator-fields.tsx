"use client";

import { Field, NativeSelect } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { GRADES, LIMITS, SUBJECT_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Subject / topic / grade inputs shared by the quiz and practice generators. */
export function GeneratorFields({
  subject,
  onSubject,
  topic,
  onTopic,
  grade,
  onGrade,
}: {
  subject: string;
  onSubject: (v: string) => void;
  topic: string;
  onTopic: (v: string) => void;
  grade: number;
  onGrade: (v: number) => void;
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Fan" htmlFor="subject">
          <NativeSelect id="subject" value={subject} onChange={(e) => onSubject(e.target.value)}>
            {SUBJECT_OPTIONS.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.icon} {s.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Sinf" htmlFor="grade">
          <NativeSelect id="grade" value={grade} onChange={(e) => onGrade(Number(e.target.value))}>
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {g}-sinf
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>
      <Field label="Mavzu" htmlFor="topic" hint="Masalan: Kvadrat tenglama, Fotosintez, Present Simple">
        <Input
          id="topic"
          value={topic}
          onChange={(e) => onTopic(e.target.value)}
          maxLength={LIMITS.topicMaxChars}
          placeholder="Mavzuni yozing"
          className="h-11"
          required
        />
      </Field>
    </>
  );
}

export function PillGroup<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="grid gap-1.5">
      <legend className="mb-1.5 text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "h-10 min-w-16 rounded-xl border px-4 text-sm font-medium transition hover:border-primary/50",
              value === o.value && "border-primary bg-brand-soft text-primary ring-2 ring-primary/25",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
