import { getCurrentProfile } from "@/lib/auth";
import { generatePractice } from "@/lib/ai/generate";
import { isAiConfigured } from "@/lib/ai/mistral";
import { checkInput, checkOutput } from "@/lib/ai/safety";
import { assertCanUseAi, logUsage } from "@/lib/ai/usage";
import { getSubjectBySlug } from "@/lib/data/subjects";
import { AppError, ERRORS } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { practiceGenerateSchema } from "@/lib/validation";

export const maxDuration = 120;

export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return Response.json({ error: ERRORS.unauthorized }, { status: 401 });

  const parsed = practiceGenerateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: ERRORS.invalidInput }, { status: 400 });
  const input = parsed.data;
  if (input.easy + input.medium + input.hard === 0) return Response.json({ error: ERRORS.invalidInput }, { status: 400 });

  const supabase = await createClient();
  try {
    if (!isAiConfigured()) throw new AppError("aiUnavailable", 503);
    await assertCanUseAi(supabase, profile, "practice");

    const subject = await getSubjectBySlug(input.subject);
    if (!subject) throw new AppError("invalidInput", 400);

    const inputVerdict = await checkInput(input.topic, request.signal);
    if (!inputVerdict.allowed) {
      await logUsage(supabase, { userId: profile.id, kind: "practice", status: "blocked", safetyCategory: inputVerdict.category });
      return Response.json({ error: ERRORS.blocked }, { status: 422 });
    }

    const { data, usage, model } = await generatePractice({
      subject: subject.name,
      topic: input.topic,
      grade: input.grade ?? profile.grade,
      easy: input.easy,
      medium: input.medium,
      hard: input.hard,
    });

    const outputVerdict = await checkOutput(data.exercises.map((e) => `${e.question}\n${e.solution}`).join("\n"));
    if (!outputVerdict.allowed) {
      await logUsage(supabase, { userId: profile.id, kind: "practice", status: "blocked", model, safetyCategory: outputVerdict.category });
      return Response.json({ error: ERRORS.blocked }, { status: 422 });
    }

    await logUsage(supabase, {
      userId: profile.id,
      kind: "practice",
      status: "ok",
      model,
      promptTokens: usage?.promptTokens,
      completionTokens: usage?.completionTokens,
    });

    return Response.json({ practice: data, subject: subject.name });
  } catch (err) {
    if (err instanceof AppError) {
      if (err.code === "aiUnavailable" || err.code === "quizInvalid") {
        await logUsage(supabase, { userId: profile.id, kind: "practice", status: "error" });
      }
      return Response.json({ error: err.message }, { status: err.status });
    }
    console.error("[practice] unexpected error", { reason: err instanceof Error ? err.message : "unknown" });
    return Response.json({ error: ERRORS.generic }, { status: 500 });
  }
}
