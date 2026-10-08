import Link from "next/link";
import {
  ArrowRightIcon,
  BookOpenCheckIcon,
  ChartNoAxesColumnIncreasingIcon,
  ClipboardCheckIcon,
  GraduationCapIcon,
  HeartHandshakeIcon,
  LanguagesIcon,
  MessageCircleQuestionIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "lucide-react";
import { Logo, LogoMark } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { SUBJECT_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: MessageCircleQuestionIcon,
    title: "Savol ber",
    text: "Tushunmagan mavzularingni Aqilbekdan so‘ra.",
  },
  {
    icon: SparklesIcon,
    title: "Sodda tushuntirish",
    text: "Murakkab mavzularni sinfingga mos qilib tushuntiradi.",
  },
  {
    icon: ClipboardCheckIcon,
    title: "Test tuz",
    text: "Istalgan fan va mavzudan test yarat.",
  },
  {
    icon: ChartNoAxesColumnIncreasingIcon,
    title: "Natijangni ko‘r",
    text: "O‘z bilimlaringni testlar orqali tekshir.",
  },
];

const STEPS = [
  { title: "Ro‘yxatdan o‘t", text: "Sinfing va kerakli fanlaringni tanla — bir daqiqa ham ketmaydi." },
  { title: "Savolingni yoz", text: "O‘zbek, rus yoki ingliz tilida — qanday qulay bo‘lsa." },
  { title: "Tushun va mashq qil", text: "Bosqichma-bosqich tushuntirish, misollar va testlar bilan mustahkamla." },
];

const REASONS = [
  {
    icon: GraduationCapIcon,
    title: "Sinfingga moslashadi",
    text: "3-sinf o‘quvchisiga ham, 11-sinf bitiruvchisiga ham — har kimga o‘z darajasida.",
  },
  {
    icon: BookOpenCheckIcon,
    title: "Javob emas, tushuncha",
    text: "Aqilbek tayyor javobni ko‘chirtirmaydi — yechish yo‘lini o‘rgatadi.",
  },
  {
    icon: LanguagesIcon,
    title: "Uch tilda",
    text: "O‘zbekcha, ruscha va inglizcha savollarni tushunadi va o‘sha tilda javob beradi.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Xavfsiz muhit",
    text: "O‘quvchilar uchun moslashtirilgan filtrlar. Suhbatlaring faqat o‘zingga ko‘rinadi.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          <div className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
            <a href="#imkoniyatlar" className="hover:text-foreground">Imkoniyatlar</a>
            <a href="#fanlar" className="hover:text-foreground">Fanlar</a>
            <a href="#qanday" className="hover:text-foreground">Qanday ishlaydi</a>
          </div>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Link href="/login" className={cn(buttonVariants({ variant: "ghost" }), "h-9 px-3")}>
              Kirish
            </Link>
            <Link href="/register" className={cn(buttonVariants(), "hidden h-9 px-4 sm:inline-flex")}>
              Boshlash
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-40 -z-10 mx-auto h-[480px] max-w-4xl rounded-full bg-primary/12 blur-3xl"
          />
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-14 pb-20 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-24">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-brand-soft px-3 py-1 text-xs font-semibold text-primary">
                <SparklesIcon className="size-3.5" /> Maktab o‘quvchilari uchun AI yordamchi
              </span>
              <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] sm:text-5xl lg:text-6xl">
                Bilimingga <span className="text-primary">aqlli</span> yordamchi.
              </h1>
              <p className="mt-5 max-w-xl text-lg text-muted-foreground">
                Aqilbek — maktab o‘quvchilari uchun tushuntiradi, mashq qildiradi va bilimni mustahkamlashga yordam
                beradi.
              </p>
              <p className="mt-2 max-w-xl text-muted-foreground">
                Savollaringni ber, mavzularni tushun, testlar tuzdir va bilimlaringni mustahkamla.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className={cn(buttonVariants(), "h-12 px-6 text-base")}>
                  Aqilbekni sinab ko‘rish <ArrowRightIcon className="size-4" />
                </Link>
                <Link href="/login" className={cn(buttonVariants({ variant: "outline" }), "h-12 px-6 text-base")}>
                  Kirish
                </Link>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">Bepul · 1–11-sinflar · O‘zbek, rus, ingliz tillarida</p>
            </div>

            <HeroPreview />
          </div>
        </section>

        {/* Features */}
        <section id="imkoniyatlar" className="scroll-mt-20 border-y border-border/60 bg-card/50 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading eyebrow="Imkoniyatlar" title="Aqilbek nimalar qila oladi?" />
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((f) => (
                <div key={f.title} className="rounded-2xl border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-brand-soft text-primary">
                    <f.icon className="size-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Subjects */}
        <section id="fanlar" className="scroll-mt-20 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading eyebrow="Fanlar" title="Barcha asosiy maktab fanlari" subtitle="Matematikadan tortib tillargacha — bitta yordamchida." />
            <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {SUBJECT_OPTIONS.map((s) => (
                <div key={s.slug} className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-4">
                  <span className="text-2xl" aria-hidden>{s.icon}</span>
                  <span className="font-medium">{s.name}</span>
                </div>
              ))}
              <div className="flex items-center gap-3 rounded-2xl border border-dashed px-4 py-4 text-muted-foreground">
                <span className="text-2xl" aria-hidden>✨</span>
                <span className="font-medium">va boshqalar</span>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="qanday" className="scroll-mt-20 border-y border-border/60 bg-card/50 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading eyebrow="Qanday ishlaydi" title="Uch qadamda boshlang" />
            <ol className="mt-12 grid gap-5 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <li key={step.title} className="relative rounded-2xl border bg-card p-6">
                  <span className="flex size-10 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Why */}
        <section className="py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading eyebrow="Nega Aqilbek?" title="Haqiqiy repetitor kabi — istalgan vaqtda" />
            <div className="mt-12 grid gap-5 sm:grid-cols-2">
              {REASONS.map((r) => (
                <div key={r.title} className="flex gap-4 rounded-2xl border bg-card p-6">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sun-soft text-[oklch(0.5_0.12_70)] dark:text-sun">
                    <r.icon className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{r.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{r.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 pb-20 sm:px-6">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-primary px-6 py-14 text-center text-primary-foreground sm:px-12">
            <HeartHandshakeIcon className="mx-auto size-10 opacity-90" />
            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Savolingni ber. Aqilbek bilan o‘rgan.</h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
              Bugunoq boshlang — ro‘yxatdan o‘tish bepul va bir daqiqa vaqt oladi.
            </p>
            <Link
              href="/register"
              className={cn(buttonVariants({ variant: "secondary" }), "mt-8 h-12 px-7 text-base font-semibold")}
            >
              Aqilbekni sinab ko‘rish <ArrowRightIcon className="size-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <LogoMark className="size-6" />
            <span>
              © Aqilbek.uz — <span className="italic">Bilimingga aqlli yordamchi.</span>
            </span>
          </div>
          <div className="flex gap-5">
            <Link href="/login" className="hover:text-foreground">Kirish</Link>
            <Link href="/register" className="hover:text-foreground">Ro‘yxatdan o‘tish</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-primary">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-bold sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

/** Static illustration of a tutoring exchange. */
function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden>
      <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/15 to-sun/15 blur-2xl" />
      <div className="rounded-3xl border bg-card p-4 shadow-xl shadow-primary/5 sm:p-5">
        <div className="flex items-center gap-2.5 border-b pb-3">
          <LogoMark className="size-7" />
          <div>
            <p className="text-sm font-semibold">Aqilbek</p>
            <p className="text-xs text-muted-foreground">Matematika · 7-sinf</p>
          </div>
        </div>
        <div className="space-y-3 pt-4 text-sm">
          <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-primary-foreground">
            Kasrlarni qo‘shishni tushuntirib ber
          </div>
          <div className="max-w-[92%] space-y-2 rounded-2xl rounded-bl-md bg-muted px-4 py-3">
            <p>
              Albatta! 😊 Kasrlarni qo‘shish uchun avval <b>maxrajlarni bir xil</b> qilamiz.
            </p>
            <p className="rounded-lg bg-card px-3 py-2 font-mono text-[13px]">1/2 + 1/3 = 3/6 + 2/6 = 5/6</p>
            <p className="text-muted-foreground">Endi o‘zing sinab ko‘r: 1/4 + 2/4 = ?</p>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="rounded-full border bg-background px-3 py-1 text-xs">Menga 5 ta mashq tuzib ber</span>
            <span className="rounded-full border bg-background px-3 py-1 text-xs">Qisqa qilib ber</span>
          </div>
        </div>
      </div>
    </div>
  );
}
