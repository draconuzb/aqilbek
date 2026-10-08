import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getConfig } from "@/lib/config";

function dayKey(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

/** Consecutive days (ending today or yesterday) on which the student used Aqilbek. */
function computeStreak(dates: string[], timeZone: string) {
  const days = new Set(dates.map((d) => dayKey(new Date(d), timeZone)));
  const cursor = new Date();
  if (!days.has(dayKey(cursor, timeZone))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(cursor, timeZone))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export async function getStudentStats(supabase: SupabaseClient, userId: string) {
  const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();

  const [conversations, attempts, saved, activity] = await Promise.all([
    supabase.from("conversations").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("quiz_attempts").select("score, total").eq("user_id", userId),
    supabase.from("saved_items").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("ai_usage").select("created_at").eq("user_id", userId).eq("status", "ok").gte("created_at", since),
  ]);

  const attemptRows = (attempts.data ?? []) as { score: number; total: number }[];
  const avgScore = attemptRows.length
    ? Math.round((attemptRows.reduce((sum, a) => sum + a.score / a.total, 0) / attemptRows.length) * 100)
    : null;

  return {
    conversations: conversations.count ?? 0,
    quizzesCompleted: attemptRows.length,
    averageScore: avgScore,
    savedItems: saved.count ?? 0,
    streak: computeStreak(
      ((activity.data ?? []) as { created_at: string }[]).map((r) => r.created_at),
      getConfig().timezone,
    ),
  };
}
