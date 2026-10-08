import type { Metadata } from "next";
import { PageShell } from "@/components/app/page-shell";
import { UserAvatar } from "@/components/app/user-avatar";
import { ProfileSettings } from "@/components/profile/profile-settings";
import { getUsageToday } from "@/lib/ai/usage";
import { displayName, requireProfile } from "@/lib/auth";
import { getStudentStats } from "@/lib/data/stats";
import { getUserSubjects } from "@/lib/data/subjects";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Profil" };

export default async function ProfilePage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const [stats, subjects, usage] = await Promise.all([
    getStudentStats(supabase, profile.id),
    getUserSubjects(supabase, profile.id),
    getUsageToday(supabase, profile.id),
  ]);
  const name = displayName(profile);

  const tiles = [
    { label: "Suhbatlar", value: stats.conversations },
    { label: "Yechilgan testlar", value: stats.quizzesCompleted },
    { label: "O‘rtacha natija", value: stats.averageScore !== null ? `${stats.averageScore}%` : "—" },
    { label: "Saqlanganlar", value: stats.savedItems },
    { label: "Ketma-ket kunlar", value: `${stats.streak} 🔥` },
    { label: "Bugungi AI so‘rovlar", value: `${usage.chat}/${usage.chatLimit}` },
  ];

  return (
    <PageShell title="Profil 👤">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="grid content-start gap-6">
          <section className="rounded-3xl border bg-card p-6 text-center">
            <UserAvatar name={name} className="mx-auto size-20 text-2xl" />
            <h2 className="mt-4 text-xl font-bold">{name}</h2>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {profile.grade && (
                <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-primary">{profile.grade}-sinf</span>
              )}
              {subjects.map((s) => (
                <span key={s.id} className="rounded-full border px-2.5 py-0.5 text-xs">
                  {s.icon} {s.name}
                </span>
              ))}
            </div>
          </section>
          <section className="rounded-3xl border bg-card p-5">
            <h2 className="font-semibold">Statistika</h2>
            <dl className="mt-4 grid grid-cols-2 gap-3">
              {tiles.map((t) => (
                <div key={t.label} className="rounded-2xl bg-muted/60 p-3">
                  <dt className="text-xs text-muted-foreground">{t.label}</dt>
                  <dd className="mt-1 text-lg font-bold tabular-nums">{t.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <ProfileSettings
          firstName={profile.first_name}
          grade={profile.grade ?? 7}
          preferredLanguage={profile.preferred_language}
          subjects={subjects.map((s) => s.slug)}
        />
      </div>
    </PageShell>
  );
}
