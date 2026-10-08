import type { Metadata } from "next";
import { PageShell } from "@/components/app/page-shell";
import { requireAdmin } from "@/lib/auth";
import { getDailyUsage } from "@/lib/data/admin";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Hisobotlar" };

const dateTime = new Intl.DateTimeFormat("uz-UZ", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Tashkent" });
const dateOnly = new Intl.DateTimeFormat("uz-UZ", { dateStyle: "medium", timeZone: "UTC" });

const CATEGORY_LABELS: Record<string, string> = {
  sexual: "Jinsiy kontent",
  hate_and_discrimination: "Nafrat / kamsitish",
  violence_and_threats: "Zo‘ravonlik / tahdid",
  dangerous_and_criminal_content: "Xavfli / jinoiy",
  dangerous: "Xavfli",
  criminal: "Jinoiy",
  selfharm: "O‘ziga zarar",
  jailbreaking: "Cheklovlarni chetlab o‘tish",
};

function daysAgoIso(days: number) {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

type BlockedRow = {
  id: number;
  kind: string;
  safety_category: string | null;
  created_at: string;
  profiles: { first_name: string; email: string | null } | null;
};

type ModelRow = { model: string | null; prompt_tokens: number | null; completion_tokens: number | null };

export default async function ReportsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const since = daysAgoIso(30);
  const [daily, { data: blocked }, { data: models }] = await Promise.all([
    getDailyUsage(30),
    supabase
      .from("ai_usage")
      .select("id, kind, safety_category, created_at, profiles(first_name, email)")
      .eq("status", "blocked")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("ai_usage").select("model, prompt_tokens, completion_tokens").gte("created_at", since).limit(5000),
  ]);

  const byModel = new Map<string, { requests: number; tokens: number }>();
  for (const row of (models ?? []) as ModelRow[]) {
    const key = row.model ?? "—";
    const entry = byModel.get(key) ?? { requests: 0, tokens: 0 };
    entry.requests++;
    entry.tokens += (row.prompt_tokens ?? 0) + (row.completion_tokens ?? 0);
    byModel.set(key, entry);
  }

  return (
    <PageShell title="Hisobotlar" description="AI foydalanish va xavfsizlik hisobotlari (so‘nggi 30 kun).">
      <section className="rounded-3xl border bg-card p-5">
        <h2 className="font-semibold">Kunlik foydalanish</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="py-2 font-medium">Sana</th>
                <th className="py-2 text-right font-medium">Chat</th>
                <th className="py-2 text-right font-medium">Testlar</th>
                <th className="py-2 text-right font-medium">Mashqlar</th>
                <th className="py-2 text-right font-medium">Bloklangan</th>
                <th className="py-2 text-right font-medium">Faol o‘quvchilar</th>
              </tr>
            </thead>
            <tbody>
              {[...daily].reverse().map((d) => (
                <tr key={d.day} className="border-b last:border-0">
                  <td className="py-2">{dateOnly.format(new Date(d.day))}</td>
                  <td className="py-2 text-right tabular-nums">{d.chat}</td>
                  <td className="py-2 text-right tabular-nums">{d.quiz}</td>
                  <td className="py-2 text-right tabular-nums">{d.practice}</td>
                  <td className="py-2 text-right tabular-nums">{d.blocked}</td>
                  <td className="py-2 text-right tabular-nums">{d.users}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border bg-card p-5">
        <h2 className="font-semibold">Modellar bo‘yicha</h2>
        <ul className="mt-3 grid gap-2 text-sm">
          {[...byModel.entries()].map(([model, v]) => (
            <li key={model} className="flex flex-wrap justify-between gap-2 rounded-xl bg-muted/60 px-3 py-2">
              <code className="font-mono text-xs">{model}</code>
              <span className="text-muted-foreground tabular-nums">
                {v.requests} so‘rov · {v.tokens.toLocaleString("uz-UZ")} token
              </span>
            </li>
          ))}
          {byModel.size === 0 && <li className="text-muted-foreground">Ma’lumot yo‘q.</li>}
        </ul>
      </section>

      <section className="mt-6 rounded-3xl border bg-card p-5">
        <h2 className="font-semibold">Bloklangan so‘rovlar</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Faqat minimal metama’lumot saqlanadi — so‘rov matni saqlanmaydi.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="py-2 font-medium">Vaqt</th>
                <th className="py-2 font-medium">Foydalanuvchi</th>
                <th className="py-2 font-medium">Turi</th>
                <th className="py-2 font-medium">Kategoriya</th>
              </tr>
            </thead>
            <tbody>
              {((blocked ?? []) as unknown as BlockedRow[]).map((b) => (
                <tr key={b.id} className="border-b last:border-0">
                  <td className="py-2 whitespace-nowrap">{dateTime.format(new Date(b.created_at))}</td>
                  <td className="py-2">{b.profiles?.first_name || b.profiles?.email || "—"}</td>
                  <td className="py-2">{b.kind}</td>
                  <td className="py-2">{CATEGORY_LABELS[b.safety_category ?? ""] ?? b.safety_category ?? "—"}</td>
                </tr>
              ))}
              {(blocked ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-muted-foreground">
                    Bloklangan so‘rovlar yo‘q 🎉
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </PageShell>
  );
}
