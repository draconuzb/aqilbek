"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { setUserSubjects } from "@/lib/data/subjects";
import { AppError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { onboardingSchema, profileUpdateSchema } from "@/lib/validation";
import { assertOk, withUser } from "./_shared";

export async function completeOnboarding(input: { grade: number; subjects: string[]; purposes: string[] }) {
  const result = await withUser(async ({ profile, supabase }) => {
    const parsed = onboardingSchema.safeParse(input);
    if (!parsed.success) throw new AppError("invalidInput");
    const { grade, subjects, purposes } = parsed.data;

    await setUserSubjects(supabase, profile.id, subjects);
    assertOk(await supabase.from("profiles").update({ grade, purposes, onboarded: true }).eq("id", profile.id));
  });
  if (result.ok) redirect("/dashboard");
  return result;
}

export async function updateProfile(input: {
  firstName: string;
  grade: number;
  preferredLanguage: string;
  subjects: string[];
}) {
  return withUser(async ({ profile, supabase }) => {
    const parsed = profileUpdateSchema.safeParse(input);
    if (!parsed.success) throw new AppError("invalidInput");
    const { firstName, grade, preferredLanguage, subjects } = parsed.data;

    assertOk(
      await supabase
        .from("profiles")
        .update({ first_name: firstName, grade, preferred_language: preferredLanguage })
        .eq("id", profile.id),
    );
    await setUserSubjects(supabase, profile.id, subjects);
    refresh();
  });
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
