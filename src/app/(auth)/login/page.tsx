import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Kirish" };

export default function LoginPage() {
  return (
    <div className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-bold">Xush kelibsiz! 👋</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">Aqilbek bilan o‘qishni davom ettirish uchun tizimga kiring.</p>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
