import "server-only";
import { getCurrentProfile } from "@/lib/auth";
import { AppError, ERRORS, toUserMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

type Ctx = { profile: Profile; supabase: Awaited<ReturnType<typeof createClient>> };

/**
 * Wraps a server action: re-verifies the session (never trusting the client),
 * and converts failures into friendly Uzbek messages.
 */
export async function withUser<T>(
  fn: (ctx: Ctx) => Promise<T>,
  options: { admin?: boolean } = {},
): Promise<ActionResult<T>> {
  try {
    const profile = await getCurrentProfile();
    if (!profile) return { ok: false, error: ERRORS.unauthorized };
    if (options.admin && profile.role !== "admin") return { ok: false, error: ERRORS.unauthorized };
    const supabase = await createClient();
    return { ok: true, data: await fn({ profile, supabase }) };
  } catch (err) {
    if (!(err instanceof AppError)) {
      console.error("[action] failed", { reason: err instanceof Error ? err.message : "unknown" });
    }
    return { ok: false, error: toUserMessage(err) };
  }
}

/** Throws when a Supabase write failed or affected nothing. */
export function assertOk(result: { error: unknown }) {
  if (result.error) throw new AppError("generic", 500);
}
