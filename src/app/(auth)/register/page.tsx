import type { Metadata } from "next";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Ro‘yxatdan o‘tish" };

export default function RegisterPage() {
  return (
    <div className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-bold">Aqilbek bilan tanishing ✨</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Bir daqiqada ro‘yxatdan o‘ting. Faqat o‘qish uchun kerakli ma’lumotlarni so‘raymiz.
      </p>
      <RegisterForm />
    </div>
  );
}
