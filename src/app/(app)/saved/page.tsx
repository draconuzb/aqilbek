import type { Metadata } from "next";
import { PageShell } from "@/components/app/page-shell";
import { SavedList } from "@/components/saved/saved-list";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { SavedItem } from "@/lib/types";

export const metadata: Metadata = { title: "Saqlanganlar" };

export default async function SavedPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data } = await supabase
    .from("saved_items")
    .select("id, type, title, content, conversation_id, created_at")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(300);

  return (
    <PageShell title="Saqlanganlar ⭐" description="Foydali tushuntirishlar, savollar va konspektlaringiz.">
      <SavedList items={(data ?? []) as SavedItem[]} />
    </PageShell>
  );
}
