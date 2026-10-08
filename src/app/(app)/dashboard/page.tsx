import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, FlameIcon, MessagesSquareIcon, TrophyIcon, ZapIcon } from "lucide-react";
import { EmptyState, PageShell } from "@/components/app/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { getUsageToday } from "@/lib/ai/usage";
import { displayName, requireProfile } from "@/lib/auth";
import { getStudentStats } from "@/lib/data/stats";
import { getUserSubjects } from "@/lib/data/subjects";
import { createClient } from "@/lib/supabase/server";
import type { Conversation } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Bosh sahifa" };

const QUICK_ACTIONS = [
  { label: "Savol berish", emoji: "💬", href: "/chat", tone: "bg-brand-soft" },
  { label: "Mavzuni tushuntirish", emoji: "💡", href: "/chat?mode=explain&q=" + encodeURIComponent("Menga bir mavzuni sodda tushuntirib ber: "), tone: "bg-sun-soft" },
  { label: "Test tuzish", emoji: "📝", href: "/quizzes/new", tone: "bg-success-soft" },
  { label: "Qisqa konspekt", emoji: "🗒️", href: "/chat?mode=summary", tone: "bg-brand-soft" },
  { label: "Misollar berish", emoji: "🧩", href: "/practice", tone: "bg-sun-soft" },
];

export default async function DashboardPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [stats, subjects, usage, { data: recent }, { data: settings }] = await Promise.all([
    getStudentStats(supabase, profile.id),
    getUserSubjects(supabase, profile.id),
    getUsageToday(supabase, profile.id),
    supabase
      .from("conversations")
      .select("id, title, subject_id, mode, is_favorite, created_at, updated_at")
      .eq("user_id", profile.id)
      .order("updated_at", { ascending: false })
      .limit(4),
    supabase.from("app_settings").select("announcement").eq("id", 1).maybeSingle<{ announcement: string | null }>(),
  ]);
  const conversations = (recent ?? []) as Conversation[];
  const name = displayName(profile);

  return (
    <PageShell>
      {settings?.announcement && (
        <div className="mb-5 rounded-2xl border border-sun/40 bg-sun-soft px-4 py-3 text-sm">📣 {settings.announcement}</div>
      )}

      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Salom, {name}! 👋</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {profile.grade && <span className="rounded-full bg-brand-soft px-2.5 py-0.5 font-medium text-primary">{profile.grade}-sinf</span>}
            {subjects.slice(0, 5).map((s) => (
              <span key={s.id} className="rounded-full border bg-card px-2.5 py-0.5">
                {s.icon} {s.name}
              </span>
            ))}
            {subjects.length > 5 && <span>+{subjects.length - 5}</span>}
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Statistika">
        <StatCard icon={<MessagesSquareIcon className="size-4" />} label="Suhbatlar" value={stats.conversations} />
        <StatCard icon={<TrophyIcon className="size-4" />} label="Yechilgan testlar" value={stats.quizzesCompleted} hint={stats.averageScore !== null ? `o‘rtacha ${stats.averageScore}%` : undefined} />
        <StatCard icon={<FlameIcon className="size-4" />} label="Ketma-ket kunlar" value={stats.streak} hint={stats.streak > 0 ? "zo‘r ketyapsan! 🔥" : "bugun boshla"} />
        <StatCard icon={<ZapIcon className="size-4" />} label="Bugungi savollar" value={`${usage.chat} / ${usage.chatLimit}`} />
      </section>

      <section className="mt-6 rounded-3xl border bg-card p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-bold">Bugun nimani o‘rganamiz?</h2>
        <p className="mt-1 text-sm text-muted-foreground">Tezkor amalni tanlang yoki Aqilbekka to‘g‘ridan-to‘g‘ri yozing.</p>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className="group flex flex-col gap-3 rounded-2xl border bg-background p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <span className={cn("flex size-11 items-center justify-center rounded-xl text-xl", a.tone)} aria-hidden>
                {a.emoji}
              </span>
              <span className="text-sm font-semibold leading-tight">{a.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">So‘nggi suhbatlar</h2>
          {conversations.length > 0 && (
            <Link href="/history" className="text-sm font-medium text-primary hover:underline">
              Barchasi
            </Link>
          )}
        </div>
        {conversations.length === 0 ? (
          <EmptyState
            icon="🤖"
            title="Hali suhbat yo‘q"
            text="Birinchi savolingni ber — Aqilbek senga sinfingga mos tushuntiradi."
            action={
              <Link href="/chat" className={cn(buttonVariants(), "h-10 px-5")}>
                Savol berish <ArrowRightIcon />
              </Link>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {conversations.map((c) => (
              <Link
                key={c.id}
                href={`/chat/${c.id}`}
                className="flex items-center gap-3 rounded-2xl border bg-card p-4 transition hover:border-primary/40"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-lg" aria-hidden>
                  {subjects.find((s) => s.id === c.subject_id)?.icon ?? "💬"}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">{c.title}</span>
                <ArrowRightIcon className="size-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}

function StatCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <span className="text-primary">{icon}</span> {label}
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
