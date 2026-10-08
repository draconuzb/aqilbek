"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2Icon, MailCheckIcon } from "lucide-react";
import { GoogleButton } from "@/components/auth/google-button";
import { Button } from "@/components/ui/button";
import { Field, NativeSelect } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authErrorMessage } from "@/lib/auth-errors";
import { GRADES, LIMITS, SUBJECT_OPTIONS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

type Errors = Partial<Record<"firstName" | "email" | "password" | "confirm" | "grade" | "form", string>>;

function validate(form: FormData): Errors {
  const errors: Errors = {};
  const firstName = String(form.get("firstName") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const confirm = String(form.get("confirm") ?? "");
  if (!firstName) errors.firstName = "Ismingizni kiriting.";
  else if (firstName.length > LIMITS.firstNameMaxChars) errors.firstName = "Ism juda uzun.";
  if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = "To‘g‘ri email kiriting.";
  if (password.length < 8) errors.password = "Parol kamida 8 ta belgidan iborat bo‘lsin.";
  else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) errors.password = "Parolda harf va raqam bo‘lsin.";
  if (confirm !== password) errors.confirm = "Parollar mos kelmadi.";
  if (!form.get("grade")) errors.grade = "Sinfingizni tanlang.";
  return errors;
}

export function RegisterForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    setLoading(true);
    const email = String(form.get("email")).trim();
    const { data, error } = await createClient().auth.signUp({
      email,
      password: String(form.get("password")),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
        data: {
          first_name: String(form.get("firstName")).trim(),
          grade: Number(form.get("grade")),
          main_subject: String(form.get("mainSubject") ?? ""),
        },
      },
    });

    if (error) {
      setErrors({ form: authErrorMessage(error) });
      setLoading(false);
      return;
    }
    if (data.session) {
      router.replace("/onboarding");
      router.refresh();
      return;
    }
    // Email confirmation is enabled in Supabase.
    setSentTo(email);
    setLoading(false);
  }

  if (sentTo) {
    return (
      <div className="mt-6 rounded-2xl bg-success-soft p-5 text-center">
        <MailCheckIcon className="mx-auto size-10 text-success" />
        <h2 className="mt-3 font-semibold">Emailingizni tekshiring</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          <b>{sentTo}</b> manziliga tasdiqlash havolasi yubordik. Havolani bosganingizdan so‘ng Aqilbekdan foydalanishni
          boshlaysiz.
        </p>
        <Link href="/login" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
          Kirish sahifasiga o‘tish
        </Link>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={onSubmit} className="mt-6 grid gap-4" noValidate>
        <Field label="Ism" htmlFor="firstName" error={errors.firstName}>
          <Input id="firstName" name="firstName" autoComplete="given-name" placeholder="Masalan: Aziza" maxLength={LIMITS.firstNameMaxChars} className="h-11" aria-invalid={!!errors.firstName} />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email}>
          <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" placeholder="ism@misol.uz" className="h-11" aria-invalid={!!errors.email} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Parol" htmlFor="password" error={errors.password}>
            <Input id="password" name="password" type="password" autoComplete="new-password" className="h-11" aria-invalid={!!errors.password} />
          </Field>
          <Field label="Parolni tasdiqlang" htmlFor="confirm" error={errors.confirm}>
            <Input id="confirm" name="confirm" type="password" autoComplete="new-password" className="h-11" aria-invalid={!!errors.confirm} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Sinf" htmlFor="grade" error={errors.grade}>
            <NativeSelect id="grade" name="grade" defaultValue="" aria-invalid={!!errors.grade}>
              <option value="" disabled>Tanlang</option>
              {GRADES.map((g) => (
                <option key={g} value={g}>{g}-sinf</option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Asosiy fan / yo‘nalish" htmlFor="mainSubject">
            <NativeSelect id="mainSubject" name="mainSubject" defaultValue="">
              <option value="">Keyinroq tanlayman</option>
              {SUBJECT_OPTIONS.map((s) => (
                <option key={s.slug} value={s.slug}>{s.name}</option>
              ))}
            </NativeSelect>
          </Field>
        </div>
        {errors.form && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errors.form}
          </p>
        )}
        <Button type="submit" className="h-11 text-[15px]" disabled={loading}>
          {loading && <Loader2Icon className="animate-spin" />} Ro‘yxatdan o‘tish
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> yoki <span className="h-px flex-1 bg-border" />
      </div>
      <GoogleButton next="/onboarding" />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Hisobingiz bormi?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Kirish
        </Link>
      </p>
    </>
  );
}
