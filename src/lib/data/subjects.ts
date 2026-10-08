import "server-only";
import { createClient as createAnonClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getPublicEnv, isSupabaseConfigured } from "@/lib/env.public";
import type { Subject } from "@/lib/types";

export const SUBJECTS_TAG = "subjects";

const SUBJECT_COLUMNS = "id, name, slug, description, icon, topics, sort_order, is_active";

/** Active subjects are public and identical for everyone, so they are cached across requests. */
export async function getSubjects(): Promise<Subject[]> {
  "use cache";
  cacheTag(SUBJECTS_TAG);
  cacheLife("hours");

  // NEXT_PUBLIC_* values are fixed at build time, so an unconfigured build simply has no subjects.
  if (!isSupabaseConfigured()) return [];
  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();
  const supabase = createAnonClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data, error } = await supabase
    .from("subjects")
    .select(SUBJECT_COLUMNS)
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw new Error(`Failed to load subjects: ${error.code}`);
  return (data ?? []) as Subject[];
}

export async function getSubjectBySlug(slug: string) {
  return (await getSubjects()).find((s) => s.slug === slug) ?? null;
}

export async function getSubjectById(id: number | null) {
  if (id == null) return null;
  return (await getSubjects()).find((s) => s.id === id) ?? null;
}

export async function getUserSubjects(supabase: SupabaseClient, userId: string): Promise<Subject[]> {
  const [{ data }, subjects] = await Promise.all([
    supabase.from("user_subjects").select("subject_id").eq("user_id", userId),
    getSubjects(),
  ]);
  const ids = new Set((data ?? []).map((r: { subject_id: number }) => r.subject_id));
  return subjects.filter((s) => ids.has(s.id));
}

/** Replaces the student's subject list with the given slugs (unknown slugs are ignored). */
export async function setUserSubjects(supabase: SupabaseClient, userId: string, slugs: string[]) {
  const subjects = await getSubjects();
  const ids = subjects.filter((s) => slugs.includes(s.slug)).map((s) => s.id);

  const { error: delError } = await supabase.from("user_subjects").delete().eq("user_id", userId);
  if (delError) throw delError;
  if (ids.length === 0) return;
  const { error } = await supabase
    .from("user_subjects")
    .insert(ids.map((subject_id) => ({ user_id: userId, subject_id })));
  if (error) throw error;
}
