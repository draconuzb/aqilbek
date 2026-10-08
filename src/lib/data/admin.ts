import "server-only";
import { createClient } from "@/lib/supabase/server";

/** Admin reads go through security-definer RPCs that re-check `is_admin()` in the database. */

export type AdminStats = {
  total_users: number;
  active_users_7d: number;
  active_users_today: number;
  total_conversations: number;
  total_messages: number;
  total_ai_requests: number;
  total_quizzes: number;
  total_attempts: number;
  blocked_requests: number;
  failed_requests: number;
  total_tokens: number;
};

export type DailyUsage = { day: string; chat: number; quiz: number; practice: number; blocked: number; users: number };

export async function getAdminStats() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_stats");
  if (error) throw new Error(`admin_stats failed: ${error.code}`);
  return data as AdminStats;
}

export async function getDailyUsage(days = 14) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_daily_usage", { days });
  if (error) throw new Error(`admin_daily_usage failed: ${error.code}`);
  return ((data ?? []) as DailyUsage[]).map((d) => ({
    ...d,
    chat: Number(d.chat),
    quiz: Number(d.quiz),
    practice: Number(d.practice),
    blocked: Number(d.blocked),
    users: Number(d.users),
  }));
}
