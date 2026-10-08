import { z } from "zod";
import { CHAT_MODES, DIFFICULTIES, GRADES, LANGUAGES, LIMITS, PURPOSES, SAVED_TYPES, SUBJECT_OPTIONS } from "@/lib/constants";

/** Server-side input schemas. Every route handler and server action validates with these. */

const subjectSlug = z.enum(SUBJECT_OPTIONS.map((s) => s.slug) as [string, ...string[]]);
const grade = z.coerce
  .number()
  .int()
  .refine((g) => (GRADES as readonly number[]).includes(g), "Sinf noto‘g‘ri");

export const chatRequestSchema = z.object({
  conversationId: z.uuid().optional(),
  message: z.string().trim().max(LIMITS.messageMaxChars).optional(),
  subject: subjectSlug.optional(),
  mode: z.enum(CHAT_MODES.map((m) => m.id) as [string, ...string[]]).optional(),
  regenerate: z.boolean().optional(),
});

export const quizGenerateSchema = z.object({
  subject: subjectSlug,
  topic: z.string().trim().min(2).max(LIMITS.topicMaxChars),
  grade: grade.optional(),
  count: z.coerce.number().int().min(LIMITS.quizMinQuestions).max(LIMITS.quizMaxQuestions),
  difficulty: z.enum(DIFFICULTIES.map((d) => d.id) as [string, ...string[]]),
});

export const practiceGenerateSchema = z.object({
  subject: subjectSlug,
  topic: z.string().trim().min(2).max(LIMITS.topicMaxChars),
  grade: grade.optional(),
  easy: z.coerce.number().int().min(0).max(LIMITS.practiceMaxPerLevel),
  medium: z.coerce.number().int().min(0).max(LIMITS.practiceMaxPerLevel),
  hard: z.coerce.number().int().min(0).max(LIMITS.practiceMaxPerLevel),
});

export const onboardingSchema = z.object({
  grade,
  subjects: z.array(z.string()).max(20),
  purposes: z.array(z.enum(PURPOSES.map((p) => p.id) as [string, ...string[]])).max(PURPOSES.length),
});

export const profileUpdateSchema = z.object({
  firstName: z.string().trim().min(1).max(LIMITS.firstNameMaxChars),
  grade,
  preferredLanguage: z.enum(LANGUAGES.map((l) => l.id) as [string, ...string[]]),
  subjects: z.array(z.string()).max(20),
});

export const titleSchema = z.string().trim().min(1).max(LIMITS.titleMaxChars);

export const savedItemSchema = z.object({
  type: z.enum(SAVED_TYPES.map((t) => t.id) as [string, ...string[]]),
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(LIMITS.noteMaxChars),
  conversationId: z.uuid().optional(),
});

export const quizAttemptSchema = z.object({
  quizId: z.uuid(),
  answers: z.array(z.number().int().min(-1).max(3)).max(LIMITS.quizMaxQuestions),
});

export const guestChatSchema = z.object({
  message: z.string().trim().min(1).max(LIMITS.guestMessageMaxChars),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(LIMITS.messageMaxChars) }))
    .max(6),
});
