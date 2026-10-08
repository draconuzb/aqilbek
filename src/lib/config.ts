import "server-only";
import { z } from "zod";

/**
 * Central server configuration. Every AI / limit setting is read from here —
 * never from process.env directly elsewhere.
 */

const bool = z
  .enum(["true", "false", "1", "0"])
  .transform((v) => v === "true" || v === "1");

const schema = z.object({
  MISTRAL_API_KEY: z.string().min(1).optional(),
  MISTRAL_API_URL: z.url().default("https://api.mistral.ai/v1"),
  MISTRAL_MODEL: z.string().min(1).default("mistral-large-latest"),
  MISTRAL_QUIZ_MODEL: z.string().min(1).optional(),
  MISTRAL_MODERATION_MODEL: z.string().min(1).default("mistral-moderation-latest"),
  MISTRAL_AGENT_ID: z.string().min(1).optional(),
  GROQ_API_KEY: z.string().min(1).optional(),
  GROQ_API_URL: z.url().default("https://api.groq.com/openai/v1"),
  GROQ_MODEL: z.string().min(1).default("llama-3.3-70b-versatile"),
  GROQ_GUARD_MODEL: z.string().min(1).default("meta-llama/llama-guard-4-12b"),
  AI_TEMPERATURE: z.coerce.number().min(0).max(1.5).default(0.4),
  AI_MAX_TOKENS: z.coerce.number().int().min(128).max(16000).default(2048),
  AI_QUIZ_MAX_TOKENS: z.coerce.number().int().min(256).max(16000).default(6000),
  AI_TIMEOUT_MS: z.coerce.number().int().min(5000).max(300000).default(60000),
  AI_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(2),
  AI_SAFE_PROMPT: bool.default(true),
  AI_MODERATION_ENABLED: bool.default(true),
  AI_MODERATION_BLOCK_CATEGORIES: z
    .string()
    .default(
      "sexual,hate_and_discrimination,violence_and_threats,dangerous_and_criminal_content,dangerous,criminal,selfharm,jailbreaking",
    ),
  AI_MODERATION_THRESHOLD: z.coerce.number().min(0).max(1).default(0.7),
  LIMIT_CHAT_PER_DAY: z.coerce.number().int().min(0).default(60),
  LIMIT_GENERATIONS_PER_DAY: z.coerce.number().int().min(0).default(15),
  LIMIT_REQUESTS_PER_MINUTE: z.coerce.number().int().min(1).default(8),
  APP_TIMEZONE: z.string().default("Asia/Tashkent"),
});

export type ServerConfig = ReturnType<typeof buildConfig>;

function buildConfig() {
  // Treat `KEY=` (empty) the same as an unset variable.
  const source = Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== undefined && v.trim() !== ""));
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Noto‘g‘ri environment o‘zgaruvchilari: ${fields}`);
  }
  const env = parsed.data;

  return {
    mistral: {
      apiKey: env.MISTRAL_API_KEY,
      baseUrl: env.MISTRAL_API_URL.replace(/\/$/, ""),
      model: env.MISTRAL_MODEL,
      quizModel: env.MISTRAL_QUIZ_MODEL ?? env.MISTRAL_MODEL,
      moderationModel: env.MISTRAL_MODERATION_MODEL,
      temperature: env.AI_TEMPERATURE,
      maxTokens: env.AI_MAX_TOKENS,
      quizMaxTokens: env.AI_QUIZ_MAX_TOKENS,
      timeoutMs: env.AI_TIMEOUT_MS,
      maxRetries: env.AI_MAX_RETRIES,
      safePrompt: env.AI_SAFE_PROMPT,
      agentId: env.MISTRAL_AGENT_ID,
    },
    /** Optional fallback provider (OpenAI-compatible) used when Mistral is unavailable or not configured. */
    groq: {
      apiKey: env.GROQ_API_KEY,
      baseUrl: env.GROQ_API_URL.replace(/\/$/, ""),
      model: env.GROQ_MODEL,
      guardModel: env.GROQ_GUARD_MODEL,
    },
    moderation: {
      enabled: env.AI_MODERATION_ENABLED,
      blockCategories: env.AI_MODERATION_BLOCK_CATEGORIES.split(",")
        .map((c) => c.trim())
        .filter(Boolean),
      threshold: env.AI_MODERATION_THRESHOLD,
    },
    /** Defaults; an admin can override the daily values from /admin/settings. */
    limits: {
      chatPerDay: env.LIMIT_CHAT_PER_DAY,
      generationsPerDay: env.LIMIT_GENERATIONS_PER_DAY,
      requestsPerMinute: env.LIMIT_REQUESTS_PER_MINUTE,
    },
    timezone: env.APP_TIMEZONE,
  };
}

let cached: ServerConfig | undefined;

export function getConfig(): ServerConfig {
  cached ??= buildConfig();
  return cached;
}
