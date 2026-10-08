import "server-only";
import type { z } from "zod";
import { chatCompletionJson, type Usage } from "@/lib/ai/mistral";
import { buildPracticePrompt, buildQuizPrompt } from "@/lib/ai/prompts";
import { PRACTICE_JSON_SCHEMA, QUIZ_JSON_SCHEMA, practiceSchema, quizSchema } from "@/lib/ai/schemas";
import { getConfig } from "@/lib/config";
import type { Difficulty } from "@/lib/constants";
import { AppError } from "@/lib/errors";

type Generated<T> = { data: T; usage?: Usage; model: string };

/** Requests structured JSON and validates it; retries once if the output fails validation. */
async function generateValidated<S extends z.ZodType>(
  system: string,
  user: string,
  name: string,
  jsonSchema: Record<string, unknown>,
  validator: S,
  accept: (value: z.infer<S>) => boolean,
): Promise<Generated<z.infer<S>>> {
  const { mistral } = getConfig();
  let lastModel = mistral.quizModel;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await chatCompletionJson(
        [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        { name, schema: jsonSchema },
        { task: "generation", maxTokens: mistral.quizMaxTokens, temperature: attempt === 0 ? 0.5 : 0.3 },
      );
      lastModel = result.model;
      const parsed = validator.safeParse(result.data);
      if (parsed.success && accept(parsed.data)) return { data: parsed.data, usage: result.usage, model: result.model };
      console.warn("[generate] invalid structured output", { name, attempt });
    } catch (err) {
      console.warn("[generate] request failed", { name, attempt, reason: err instanceof Error ? err.message : "unknown" });
      if (attempt === 1) throw new AppError("aiUnavailable", 502);
    }
  }
  console.warn("[generate] giving up", { name, model: lastModel });
  throw new AppError("quizInvalid", 502);
}

export async function generateQuiz(input: {
  subject: string;
  topic: string;
  grade: number | null;
  count: number;
  difficulty: Difficulty;
}) {
  const result = await generateValidated(
    buildQuizPrompt(input),
    `Mavzu: ${input.topic}. ${input.count} ta savoldan iborat test tuz.`,
    "quiz",
    QUIZ_JSON_SCHEMA,
    quizSchema,
    (quiz) => quiz.questions.length >= Math.min(input.count, 3),
  );
  // Never keep more questions than requested.
  result.data.questions = result.data.questions.slice(0, input.count);
  return result;
}

export async function generatePractice(input: {
  subject: string;
  topic: string;
  grade: number | null;
  easy: number;
  medium: number;
  hard: number;
}) {
  const total = input.easy + input.medium + input.hard;
  return generateValidated(
    buildPracticePrompt(input),
    `Mavzu: ${input.topic}. Jami ${total} ta mashq tuz.`,
    "practice",
    PRACTICE_JSON_SCHEMA,
    practiceSchema,
    (set) => set.exercises.length >= 1,
  );
}
