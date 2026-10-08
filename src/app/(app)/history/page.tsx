import type { Metadata } from "next";
import { PageShell } from "@/components/app/page-shell";
import { HistoryList } from "@/components/chat/history-list";
import { requireProfile } from "@/lib/auth";
import { getSubjects } from "@/lib/data/subjects";
import { createClient } from "@/lib/supabase/server";
import type { Conversation } from "@/lib/types";

export const metadata: Metadata = { title: "Tarix" };

export default async function HistoryPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const [{ data }, subjects] = await Promise.all([
    supabase
      .from("conversations")
      .select("id, title, subject_id, mode, is_favorite, created_at, updated_at")
      .eq("user_id", profile.id)
      .order("updated_at", { ascending: false })
      .limit(300),
    getSubjects(),
  ]);

  return (
    <PageShell title="Tarix 🕘" description="Oldingi suhbatlaringiz. Faqat siz ko‘ra olasiz.">
      <HistoryList
        conversations={(data ?? []) as Conversation[]}
        subjects={subjects.map((s) => ({ id: s.id, name: s.name, icon: s.icon }))}
      />
    </PageShell>
  );
}
