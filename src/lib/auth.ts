import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/**
 * Data Access Layer for identity. The user id always comes from the verified
 * session on the server — never from the browser.
 */

export const getSessionUserId = cache(async (): Promise<string | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return data.claims.sub;
});

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, first_name, email, grade, preferred_language, purposes, role, onboarded, is_blocked, created_at")
    .eq("id", userId)
    .maybeSingle<Profile>();

  if (data) return data;

  // Profile row missing (e.g. user created before the trigger existed) — create a minimal one.
  const { data: user } = await supabase.auth.getUser();
  const { data: created } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      email: user.user?.email ?? null,
      first_name: String(user.user?.user_metadata?.first_name ?? user.user?.user_metadata?.name ?? "").slice(0, 60),
    })
    .select("id, first_name, email, grade, preferred_language, purposes, role, onboarded, is_blocked, created_at")
    .maybeSingle<Profile>();
  return created ?? null;
});

/** For pages: redirects to /login when signed out and to /onboarding when setup isn't finished. */
export async function requireProfile(options: { allowNotOnboarded?: boolean } = {}): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!options.allowNotOnboarded && !profile.onboarded) redirect("/onboarding");
  return profile;
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "admin") redirect("/dashboard");
  return profile;
}

export function displayName(profile: Pick<Profile, "first_name" | "email">) {
  return profile.first_name || profile.email?.split("@")[0] || "O‘quvchi";
}
