import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PageShell } from "@/components/app/page-shell";
import { QuizPlayer } from "@/components/quiz/quiz-player";
import { requireProfile } from "@/lib/auth";
import { getSubjectById } from "@/lib/data/subjects";
import { createClient } from "@/lib/supabase/server";
import type { PublicQuiz, QuizRow } from "@/lib/types";

export const metadata: Metadata = { title: "Test" };

export default async function QuizPage({ params }: PageProps<"/quizzes/[id]">) {
  const [{ id }, profile] = await Promise.all([params, requireProfile()]);
  if (!z.uuid().safeParse(id).success) notFound();

  const supabase = await createClient();
  const { data } = await supabase
    .from("quizzes")
    .select("id, title, topic, grade, difficulty, subject_id, quiz_json, created_at")
    .eq("id", id)
    .eq("user_id", profile.id)
    .maybeSingle<QuizRow>();
  if (!data) notFound();
  const subject = await getSubjectById(data.subject_id);

  // Correct answers and explanations stay on the server until the attempt is submitted.
  const quiz: PublicQuiz = {
    id: data.id,
    title: data.title,
    topic: data.topic,
    subject: subject?.name ?? data.quiz_json.subject,
    difficulty: data.difficulty,
    questions: data.quiz_json.questions.map((q) => ({ question: q.question, options: q.options })),
  };

  return (
    <PageShell className="max-w-3xl">
      <QuizPlayer quiz={quiz} subjectSlug={subject?.slug ?? null} />
    </PageShell>
  );
}
