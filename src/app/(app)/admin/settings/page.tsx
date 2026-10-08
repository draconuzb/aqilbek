import type { Metadata } from "next";
import { PageShell } from "@/components/app/page-shell";
import { SettingsForm } from "@/components/admin/settings-form";
import { requireAdmin } from "@/lib/auth";
import { getConfig } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Tizim sozlamalari" };

type SettingsRow = {
  ai_enabled: boolean;
  daily_chat_limit: number | null;
  daily_generation_limit: number | null;
  announcement: string | null;
};

export default async function AdminSettingsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_settings")
    .select("ai_enabled, daily_chat_limit, daily_generation_limit, announcement")
    .eq("id", 1)
    .maybeSingle<SettingsRow>();
  const config = getConfig();

  // Show configuration *status* only — never secret values.
  const env = [
    { label: "Mistral API kaliti", value: config.mistral.apiKey ? "✅ sozlangan" : "❌ yo‘q" },
    { label: "Chat modeli", value: config.mistral.model },
    { label: "Test modeli", value: config.mistral.quizModel },
    { label: "Mistral Agent", value: config.mistral.agentId ? "✅ yoqilgan" : "—" },
    { label: "Groq (zaxira)", value: config.groq.apiKey ? `✅ ${config.groq.model}` : "—" },
    { label: "Moderatsiya", value: config.moderation.enabled ? "✅ yoqilgan" : "⚠️ o‘chirilgan" },
    { label: "safe_prompt", value: config.mistral.safePrompt ? "✅" : "—" },
    { label: "Daqiqalik limit", value: `${config.limits.requestsPerMinute} so‘rov` },
  ];

  return (
    <PageShell title="Tizim sozlamalari" description="AI xizmati va foydalanish limitlari.">
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <SettingsForm
          aiEnabled={data?.ai_enabled ?? true}
          dailyChatLimit={data?.daily_chat_limit ?? null}
          dailyGenerationLimit={data?.daily_generation_limit ?? null}
          announcement={data?.announcement ?? ""}
          defaults={{ chat: config.limits.chatPerDay, generations: config.limits.generationsPerDay }}
        />
        <section className="rounded-3xl border bg-card p-5">
          <h2 className="font-semibold">Server konfiguratsiyasi</h2>
          <p className="mt-1 text-xs text-muted-foreground">Environment o‘zgaruvchilaridan o‘qiladi (faqat holat ko‘rsatiladi).</p>
          <dl className="mt-4 grid gap-2 text-sm">
            {env.map((e) => (
              <div key={e.label} className="flex justify-between gap-3 rounded-xl bg-muted/60 px-3 py-2">
                <dt className="text-muted-foreground">{e.label}</dt>
                <dd className="truncate font-medium">{e.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </PageShell>
  );
}
