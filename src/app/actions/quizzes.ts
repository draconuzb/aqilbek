"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { AppError } from "@/lib/errors";
import type { QuizContent, QuizResult } from "@/lib/types";
import { quizAttemptSchema } from "@/lib/validation";
import { assertOk, withUser } from "./_shared";

/** Scores the attempt on the server from the stored quiz — the browser never decides the score. */
export async function submitQuizAttempt(input: { quizId: string; answers: number[] }) {
  return withUser<QuizResult>(async ({ profile, supabase }) => {
    const parsed = quizAttemptSchema.safeParse(input);
    if (!parsed.success) throw new AppError("invalidInput");

    const { data: quiz } = await supabase
      .from("quizzes")
      .select("id, quiz_json")
      .eq("id", parsed.data.quizId)
      .eq("user_id", profile.id)
      .maybeSingle<{ id: string; quiz_json: QuizContent }>();
    if (!quiz) throw new AppError("notFound", 404);

    const questions = quiz.quiz_json.questions;
    const answers = questions.map((_, i) => {
      const a = parsed.data.answers[i];
      return typeof a === "number" && a >= 0 && a <= 3 ? a : null;
    });
    const score = questions.reduce((sum, q, i) => sum + (answers[i] === q.correctAnswer ? 1 : 0), 0);

    const { data: attempt, error } = await supabase
      .from("quiz_attempts")
      .insert({ quiz_id: quiz.id, user_id: profile.id, score, total: questions.length, answers_json: answers })
      .select("id")
      .single<{ id: string }>();
    if (error || !attempt) throw new AppError("generic", 500);

    return {
      attemptId: attempt.id,
      score,
      total: questions.length,
      review: questions.map((q, i) => ({
        question: q.question,
        options: q.options,
        selected: answers[i],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      })),
    };
  });
}

export async function deleteQuiz(quizId: string) {
  return withUser(async ({ profile, supabase }) => {
    const parsed = z.uuid().safeParse(quizId);
    if (!parsed.success) throw new AppError("invalidInput");
    assertOk(await supabase.from("quizzes").delete().eq("id", parsed.data).eq("user_id", profile.id));
    refresh();
  });
}
