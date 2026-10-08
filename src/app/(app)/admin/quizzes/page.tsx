import type { Metadata } from "next";
import { PageShell } from "@/components/app/page-shell";
import { AdminQuizDelete } from "@/components/admin/admin-quiz-delete";
import { requireAdmin } from "@/lib/auth";
import { DIFFICULTIES } from "@/lib/constants";
import { getSubjects } from "@/lib/data/subjects";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Testlarni boshqarish" };

type Row = {
  id: string;
  title: string;
  topic: string;
  grade: number | null;
  difficulty: string;
  subject_id: number | null;
  created_at: string;
  profiles: { first_name: string } | null;
};

const dateFmt = new Intl.DateTimeFormat("uz-UZ", { dateStyle: "medium", timeZone: "Asia/Tashkent" });

export default async function AdminQuizzesPage() {
  await requireAdmin();
  const supabase = await createClient();
  const [{ data }, subjects] = await Promise.all([
    supabase
      .from("quizzes")
      .select("id, title, topic, grade, difficulty, subject_id, created_at, profiles(first_name)")
      .order("created_at", { ascending: false })
      .limit(100),
    getSubjects(),
  ]);
  const rows = (data ?? []) as unknown as Row[];

  return (
    <PageShell title="Testlar" description="AI yaratgan testlar — sifat nazorati uchun.">
      <div className="overflow-x-auto rounded-3xl border bg-card">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Test</th>
              <th className="px-4 py-3 font-medium">Fan</th>
              <th className="px-4 py-3 font-medium">Sinf</th>
              <th className="px-4 py-3 font-medium">Qiyinlik</th>
              <th className="px-4 py-3 font-medium">Muallif</th>
              <th className="px-4 py-3 font-medium">Sana</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((q) => (
              <tr key={q.id} className="border-b last:border-0">
                <td className="max-w-64 px-4 py-3">
                  <p className="truncate font-medium">{q.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{q.topic}</p>
                </td>
                <td className="px-4 py-3">{subjects.find((s) => s.id === q.subject_id)?.name ?? "—"}</td>
                <td className="px-4 py-3">{q.grade ?? "—"}</td>
                <td className="px-4 py-3">{DIFFICULTIES.find((d) => d.id === q.difficulty)?.label}</td>
                <td className="px-4 py-3">{q.profiles?.first_name || "—"}</td>
                <td className="px-4 py-3 whitespace-nowrap">{dateFmt.format(new Date(q.created_at))}</td>
                <td className="px-4 py-3 text-right">
                  <AdminQuizDelete quizId={q.id} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Hali testlar yo‘q.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
