import type { Metadata } from "next";
import { PageShell } from "@/components/app/page-shell";
import { PracticeGenerator } from "@/components/quiz/practice-generator";
import { requireProfile } from "@/lib/auth";
import { getUserSubjects } from "@/lib/data/subjects";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Mashqlar" };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PracticePage({ searchParams }: PageProps<"/practice">) {
  const [query, profile] = await Promise.all([searchParams, requireProfile()]);
  const mine = await getUserSubjects(await createClient(), profile.id);

  return (
    <PageShell title="Mashqlar 🧩" description="Oson, o‘rta va qiyin mashqlar. Avval o‘zing yech — keyin javobni tekshir!">
      <PracticeGenerator
        defaultSubject={first(query.subject) ?? mine[0]?.slug}
        defaultTopic={first(query.topic)}
        defaultGrade={profile.grade}
      />
    </PageShell>
  );
}
