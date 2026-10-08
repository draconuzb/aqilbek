import type { Metadata } from "next";
import { PageShell } from "@/components/app/page-shell";
import { UsageChart } from "@/components/admin/usage-chart";
import { requireAdmin } from "@/lib/auth";
import { getAdminStats, getDailyUsage } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Admin" };

const nf = new Intl.NumberFormat("uz-UZ");

export default async function AdminDashboardPage() {
  await requireAdmin();
  const [stats, daily] = await Promise.all([getAdminStats(), getDailyUsage(14)]);
  const today = daily.at(-1);

  const tiles = [
    { label: "Jami foydalanuvchilar", value: stats.total_users },
    { label: "Faol (7 kun)", value: stats.active_users_7d },
    { label: "Faol (bugun)", value: stats.active_users_today },
    { label: "Suhbatlar", value: stats.total_conversations },
    { label: "Jami AI so‘rovlar", value: stats.total_ai_requests },
    { label: "Testlar", value: stats.total_quizzes },
    { label: "Test urinishlari", value: stats.total_attempts },
    { label: "Bloklangan so‘rovlar", value: stats.blocked_requests },
  ];

  return (
    <PageShell title="Statistika" description="Platformaning umumiy ko‘rsatkichlari.">
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Ko‘rsatkichlar">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground">{t.label}</p>
            <p className="mt-1.5 text-2xl font-bold tabular-nums">{nf.format(t.value)}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-3xl border bg-card p-5 sm:p-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-semibold">Kunlik AI so‘rovlar (14 kun)</h2>
            <p className="text-sm text-muted-foreground">Chat, test va mashq generatsiyalari</p>
          </div>
          {today && (
            <p className="text-sm text-muted-foreground">
              Bugun: <span className="font-semibold text-foreground tabular-nums">{today.chat + today.quiz + today.practice}</span>
            </p>
          )}
        </div>
        <UsageChart data={daily} />
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Xabarlar</p>
          <p className="mt-1 text-xl font-bold tabular-nums">{nf.format(stats.total_messages)}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Ishlatilgan tokenlar</p>
          <p className="mt-1 text-xl font-bold tabular-nums">{nf.format(stats.total_tokens)}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Xatolik bilan tugagan so‘rovlar</p>
          <p className="mt-1 text-xl font-bold tabular-nums">{nf.format(stats.failed_requests)}</p>
        </div>
      </section>
    </PageShell>
  );
}
