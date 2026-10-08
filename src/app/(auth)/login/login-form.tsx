"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Loader2Icon } from "lucide-react";
import { GoogleButton } from "@/components/auth/google-button";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authErrorMessage, safeNext } from "@/lib/auth-errors";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [error, setError] = useState<string | null>(params.get("error") ? "Kirishda xatolik yuz berdi. Qayta urinib ko‘ring." : null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    if (!email || !password) {
      setError("Email va parolni kiriting.");
      return;
    }

    setLoading(true);
    setError(null);
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    if (error) {
      setError(authErrorMessage(error));
      setLoading(false);
      return;
    }
    router.replace(next);
    router.refresh();
  }

  return (
    <>
      <form onSubmit={onSubmit} className="mt-6 grid gap-4" noValidate>
        <Field label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" placeholder="ism@misol.uz" className="h-11" required />
        </Field>
        <Field label="Parol" htmlFor="password">
          <Input id="password" name="password" type="password" autoComplete="current-password" placeholder="••••••••" className="h-11" required />
        </Field>
        {error && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" className="h-11 text-[15px]" disabled={loading}>
          {loading && <Loader2Icon className="animate-spin" />} Kirish
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> yoki <span className="h-px flex-1 bg-border" />
      </div>
      <GoogleButton next={next} />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Hisobingiz yo‘qmi?{" "}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          Ro‘yxatdan o‘tish
        </Link>
      </p>
    </>
  );
}
