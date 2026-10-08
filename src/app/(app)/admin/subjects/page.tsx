import type { Metadata } from "next";
import { PageShell } from "@/components/app/page-shell";
import { SubjectsManager } from "@/components/admin/subjects-manager";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Subject } from "@/lib/types";

export const metadata: Metadata = { title: "Fanlarni boshqarish" };

export default async function AdminSubjectsPage() {
  await requireAdmin();
  const supabase = await createClient();
  // Admins also see inactive subjects (RLS: is_active or is_admin()).
  const { data } = await supabase
    .from("subjects")
    .select("id, name, slug, description, icon, topics, sort_order, is_active")
    .order("sort_order");

  return (
    <PageShell title="Fanlar" description="Fanlar, ularning tavsifi va mavzular ro‘yxati.">
      <SubjectsManager subjects={(data ?? []) as Subject[]} />
    </PageShell>
  );
}
