import type { Metadata } from "next";
import { PageShell } from "@/components/app/page-shell";
import { QuizGeneratorForm } from "@/components/quiz/quiz-generator-form";
import { getUsageToday } from "@/lib/ai/usage";
import { requireProfile } from "@/lib/auth";
import { getUserSubjects } from "@/lib/data/subjects";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Test tuzish" };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewQuizPage({ searchParams }: PageProps<"/quizzes/new">) {
  const [query, profile] = await Promise.all([searchParams, requireProfile()]);
  const supabase = await createClient();
  const [mine, usage] = await Promise.all([getUserSubjects(supabase, profile.id), getUsageToday(supabase, profile.id)]);

  return (
    <PageShell title="Test tuzuvchi 🧠" description="Fan, mavzu va qiyinlikni tanlang — Aqilbek test tayyorlaydi.">
      <QuizGeneratorForm
        defaultSubject={first(query.subject) ?? mine[0]?.slug}
        defaultTopic={first(query.topic)}
        defaultGrade={profile.grade}
        remaining={Math.max(usage.generationLimit - usage.generations, 0)}
      />
    </PageShell>
  );
}
