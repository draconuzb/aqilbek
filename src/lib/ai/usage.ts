import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getConfig } from "@/lib/config";
import { AppError } from "@/lib/errors";
import type { Profile } from "@/lib/types";

export type UsageKind = "chat" | "quiz" | "practice";

type Settings = {
  ai_enabled: boolean;
  daily_chat_limit: number | null;
  daily_generation_limit: number | null;
};

/** Effective limits: env defaults, optionally overridden by an admin in `app_settings`. */
export async function getEffectiveLimits(supabase: SupabaseClient) {
  const { limits } = getConfig();
  const { data } = await supabase
    .from("app_settings")
    .select("ai_enabled, daily_chat_limit, daily_generation_limit")
    .eq("id", 1)
    .maybeSingle<Settings>();

  return {
    aiEnabled: data?.ai_enabled ?? true,
    chatPerDay: data?.daily_chat_limit ?? limits.chatPerDay,
    generationsPerDay: data?.daily_generation_limit ?? limits.generationsPerDay,
    requestsPerMinute: limits.requestsPerMinute,
  };
}

/** Start of "today" in the app timezone (default Asia/Tashkent), as an ISO string. */
export function startOfToday(timeZone = getConfig().timezone) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const zonedAsUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  const offsetMs = zonedAsUtc - now.getTime();
  const midnightZonedAsUtc = Date.UTC(get("year"), get("month") - 1, get("day"));
  return new Date(midnightZonedAsUtc - offsetMs).toISOString();
}

// Per-instance burst limiter. The daily limit below is the durable, DB-backed guard.
const recent = new Map<string, number[]>();

function checkBurst(userId: string, perMinute: number) {
  const now = Date.now();
  const windowStart = now - 60_000;
  const hits = (recent.get(userId) ?? []).filter((t) => t > windowStart);
  if (hits.length >= perMinute) throw new AppError("tooFast", 429);
  hits.push(now);
  recent.set(userId, hits);
  if (recent.size > 5000) {
    for (const [key, times] of recent) if (times.every((t) => t <= windowStart)) recent.delete(key);
  }
}

async function countToday(supabase: SupabaseClient, userId: string, kinds: UsageKind[]) {
  const { count } = await supabase
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("kind", kinds)
    .eq("status", "ok")
    .gte("created_at", startOfToday());
  return count ?? 0;
}

/** Throws a friendly AppError when the student may not make this AI request right now. */
export async function assertCanUseAi(supabase: SupabaseClient, profile: Profile, kind: UsageKind) {
  if (profile.is_blocked) throw new AppError("accountBlocked", 403);

  const limits = await getEffectiveLimits(supabase);
  if (!limits.aiEnabled && profile.role !== "admin") throw new AppError("aiDisabled", 503);

  checkBurst(profile.id, limits.requestsPerMinute);

  if (kind === "chat") {
    if ((await countToday(supabase, profile.id, ["chat"])) >= limits.chatPerDay) throw new AppError("dailyLimit", 429);
  } else if ((await countToday(supabase, profile.id, ["quiz", "practice"])) >= limits.generationsPerDay) {
    throw new AppError("generationLimit", 429);
  }
}

export async function getUsageToday(supabase: SupabaseClient, userId: string) {
  const [limits, chat, generations] = await Promise.all([
    getEffectiveLimits(supabase),
    countToday(supabase, userId, ["chat"]),
    countToday(supabase, userId, ["quiz", "practice"]),
  ]);
  return { chat, generations, chatLimit: limits.chatPerDay, generationLimit: limits.generationsPerDay };
}

/** Records minimal metadata only — never the prompt or the answer text. */
export async function logUsage(
  supabase: SupabaseClient,
  entry: {
    userId: string;
    kind: UsageKind;
    status: "ok" | "blocked" | "error";
    model?: string;
    promptTokens?: number;
    completionTokens?: number;
    safetyCategory?: string | null;
  },
) {
  const { error } = await supabase.from("ai_usage").insert({
    user_id: entry.userId,
    kind: entry.kind,
    status: entry.status,
    model: entry.model ?? null,
    prompt_tokens: entry.promptTokens ?? null,
    completion_tokens: entry.completionTokens ?? null,
    safety_category: entry.safetyCategory ?? null,
  });
  if (error) console.error("[usage] failed to log", { code: error.code });
}
