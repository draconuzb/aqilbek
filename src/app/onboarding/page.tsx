import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { Skeleton } from "@/components/ui/skeleton";
import { requireProfile } from "@/lib/auth";
import { getUserSubjects } from "@/lib/data/subjects";
import { createClient } from "@/lib/supabase/server";
import { OnboardingFlow } from "./onboarding-flow";

export const metadata: Metadata = { title: "Sozlash" };

export default function OnboardingPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="mx-auto flex h-16 w-full max-w-3xl items-center px-4 sm:px-6">
        <Logo href="/dashboard" />
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 sm:px-6">
        <Suspense fallback={<Skeleton className="mt-6 h-[460px] rounded-3xl" />}>
          <Onboarding />
        </Suspense>
      </main>
    </div>
  );
}

async function Onboarding() {
  const profile = await requireProfile({ allowNotOnboarded: true });
  if (profile.onboarded) redirect("/dashboard");
  const subjects = await getUserSubjects(await createClient(), profile.id);
  return (
    <OnboardingFlow
      firstName={profile.first_name}
      initialGrade={profile.grade}
      initialSubjects={subjects.map((s) => s.slug)}
      initialPurposes={profile.purposes}
    />
  );
}
