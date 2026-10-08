import { getCurrentProfile } from "@/lib/auth";
import { generateQuiz } from "@/lib/ai/generate";
import { isAiConfigured } from "@/lib/ai/mistral";
import { checkInput, checkOutput } from "@/lib/ai/safety";
import { assertCanUseAi, logUsage } from "@/lib/ai/usage";
import { type Difficulty } from "@/lib/constants";
import { getSubjectBySlug } from "@/lib/data/subjects";
import { AppError, ERRORS } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { quizGenerateSchema } from "@/lib/validation";

export const maxDuration = 120;

export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return Response.json({ error: ERRORS.unauthorized }, { status: 401 });

  const parsed = quizGenerateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: ERRORS.invalidInput }, { status: 400 });
  const input = parsed.data;

  const supabase = await createClient();
  try {
    if (!isAiConfigured()) throw new AppError("aiUnavailable", 503);
    await assertCanUseAi(supabase, profile, "quiz");

    const subject = await getSubjectBySlug(input.subject);
    if (!subject) throw new AppError("invalidInput", 400);

    const inputVerdict = await checkInput(input.topic, request.signal);
    if (!inputVerdict.allowed) {
      await logUsage(supabase, { userId: profile.id, kind: "quiz", status: "blocked", safetyCategory: inputVerdict.category });
      return Response.json({ error: ERRORS.blocked }, { status: 422 });
    }

    const grade = input.grade ?? profile.grade;
    const difficulty = input.difficulty as Difficulty;
    const { data: quiz, usage, model } = await generateQuiz({
      subject: subject.name,
      topic: input.topic,
      grade,
      count: input.count,
      difficulty,
    });

    const outputVerdict = await checkOutput(quiz.questions.map((q) => `${q.question} ${q.options.join(" ")}`).join("\n"));
    if (!outputVerdict.allowed) {
      await logUsage(supabase, { userId: profile.id, kind: "quiz", status: "blocked", model, safetyCategory: outputVerdict.category });
      return Response.json({ error: ERRORS.blocked }, { status: 422 });
    }

    const { data: saved, error } = await supabase
      .from("quizzes")
      .insert({
        user_id: profile.id,
        subject_id: subject.id,
        title: quiz.title.slice(0, 200),
        topic: input.topic,
        grade,
        difficulty,
        quiz_json: { ...quiz, subject: subject.name },
      })
      .select("id")
      .single<{ id: string }>();
    if (error || !saved) throw new AppError("generic", 500);

    await logUsage(supabase, {
      userId: profile.id,
      kind: "quiz",
      status: "ok",
      model,
      promptTokens: usage?.promptTokens,
      completionTokens: usage?.completionTokens,
    });

    return Response.json({ id: saved.id });
  } catch (err) {
    if (err instanceof AppError) {
      if (err.code === "aiUnavailable" || err.code === "quizInvalid") {
        await logUsage(supabase, { userId: profile.id, kind: "quiz", status: "error" });
      }
      return Response.json({ error: err.message }, { status: err.status });
    }
    console.error("[quiz] unexpected error", { reason: err instanceof Error ? err.message : "unknown" });
    return Response.json({ error: ERRORS.generic }, { status: 500 });
  }
}
