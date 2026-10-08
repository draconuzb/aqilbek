import { z } from "zod";
import { LIMITS } from "@/lib/constants";

/** Zod schemas validate model output before anything is saved or shown. */

export const quizQuestionSchema = z.object({
  question: z.string().trim().min(3).max(1000),
  options: z.array(z.string().trim().min(1).max(400)).length(4),
  correctAnswer: z.number().int().min(0).max(3),
  explanation: z.string().trim().min(1).max(1500),
});

export const quizSchema = z.object({
  title: z.string().trim().min(1).max(200),
  subject: z.string().trim().min(1).max(100),
  questions: z.array(quizQuestionSchema).min(1).max(LIMITS.quizMaxQuestions),
});

export const practiceSchema = z.object({
  title: z.string().trim().min(1).max(200),
  exercises: z
    .array(
      z.object({
        level: z.enum(["easy", "medium", "hard"]),
        question: z.string().trim().min(3).max(2000),
        hint: z.string().trim().max(1000),
        answer: z.string().trim().min(1).max(1000),
        solution: z.string().trim().min(1).max(4000),
      }),
    )
    .min(1)
    .max(LIMITS.practiceMaxPerLevel * 3),
});

/** JSON Schemas sent to Mistral as `response_format.json_schema` (kept in sync with the zod schemas above). */
export const QUIZ_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "subject", "questions"],
  properties: {
    title: { type: "string" },
    subject: { type: "string" },
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["question", "options", "correctAnswer", "explanation"],
        properties: {
          question: { type: "string" },
          options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
          correctAnswer: { type: "integer", minimum: 0, maximum: 3 },
          explanation: { type: "string" },
        },
      },
    },
  },
} as const;

export const PRACTICE_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "exercises"],
  properties: {
    title: { type: "string" },
    exercises: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["level", "question", "hint", "answer", "solution"],
        properties: {
          level: { type: "string", enum: ["easy", "medium", "hard"] },
          question: { type: "string" },
          hint: { type: "string" },
          answer: { type: "string" },
          solution: { type: "string" },
        },
      },
    },
  },
} as const;
