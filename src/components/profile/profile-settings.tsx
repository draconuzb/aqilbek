"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { useTheme } from "next-themes";
import { CheckIcon, Loader2Icon, LogOutIcon, MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { toast } from "sonner";
import { signOut, updateProfile } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Field, NativeSelect } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { GRADES, LANGUAGES, LIMITS, SUBJECT_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const THEMES = [
  { id: "light", label: "Yorug‘", icon: SunIcon },
  { id: "dark", label: "Qorong‘i", icon: MoonIcon },
  { id: "system", label: "Tizim", icon: MonitorIcon },
];

export function ProfileSettings(props: { firstName: string; grade: number; preferredLanguage: string; subjects: string[] }) {
  const [firstName, setFirstName] = useState(props.firstName);
  const [grade, setGrade] = useState(props.grade);
  const [language, setLanguage] = useState(props.preferredLanguage);
  const [subjects, setSubjects] = useState(props.subjects);
  const [pending, startTransition] = useTransition();
  const { theme: rawTheme, setTheme } = useTheme();
  // next-themes only knows the theme in the browser; avoid a hydration mismatch.
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const theme = mounted ? rawTheme : undefined;

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim()) {
      toast.error("Ismingizni kiriting.");
      return;
    }
    startTransition(async () => {
      const result = await updateProfile({ firstName: firstName.trim(), grade, preferredLanguage: language, subjects });
      if (result.ok) toast.success("Sozlamalar saqlandi ✅");
      else toast.error(result.error);
    });
  }

  return (
    <div className="grid content-start gap-6">
      <form onSubmit={save} className="grid gap-5 rounded-3xl border bg-card p-5 sm:p-6">
        <h2 className="font-semibold">Sozlamalar</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ism" htmlFor="firstName">
            <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} maxLength={LIMITS.firstNameMaxChars} className="h-11" />
          </Field>
          <Field label="Sinf" htmlFor="grade">
            <NativeSelect id="grade" value={grade} onChange={(e) => setGrade(Number(e.target.value))}>
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  {g}-sinf
                </option>
              ))}
            </NativeSelect>
          </Field>
        </div>
        <Field label="Javob tili" htmlFor="language" hint="Aqilbek qaysi tilda javob berishi">
          <NativeSelect id="language" value={language} onChange={(e) => setLanguage(e.target.value)}>
            {LANGUAGES.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Fanlarim</legend>
          <div className="flex flex-wrap gap-2">
            {SUBJECT_OPTIONS.map((s) => {
              const active = subjects.includes(s.slug);
              return (
                <button
                  key={s.slug}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSubjects((list) => (active ? list.filter((x) => x !== s.slug) : [...list, s.slug]))}
                  className={cn(
                    "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm transition",
                    active ? "border-primary bg-brand-soft font-medium text-primary" : "hover:border-primary/40",
                  )}
                >
                  {s.icon} {s.name} {active && <CheckIcon className="size-3.5" />}
                </button>
              );
            })}
          </div>
        </fieldset>
        <Button type="submit" className="h-11 sm:justify-self-end sm:px-6" disabled={pending}>
          {pending && <Loader2Icon className="animate-spin" />} Saqlash
        </Button>
      </form>

      <section className="grid gap-4 rounded-3xl border bg-card p-5 sm:p-6">
        <h2 className="font-semibold">Ko‘rinish</h2>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Mavzu">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={theme === t.id}
              onClick={() => setTheme(t.id)}
              className={cn(
                "flex h-16 flex-col items-center justify-center gap-1 rounded-xl border text-sm transition",
                theme === t.id ? "border-primary bg-brand-soft font-medium text-primary" : "hover:border-primary/40",
              )}
            >
              <t.icon className="size-4" /> {t.label}
            </button>
          ))}
        </div>
      </section>

      <form action={signOut}>
        <Button type="submit" variant="destructive" className="h-11 w-full">
          <LogOutIcon /> Chiqish
        </Button>
      </form>
    </div>
  );
}
