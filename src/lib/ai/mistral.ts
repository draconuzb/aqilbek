import "server-only";
import { getConfig } from "@/lib/config";

/**
 * Server-only AI client.
 *
 * Primary provider is the Mistral REST API:
 *   - POST /v1/agents/completions  (when MISTRAL_AGENT_ID is set)
 *   - POST /v1/chat/completions    (normal, streaming, JSON-schema structured output)
 *   - POST /v1/moderations
 * Groq (OpenAI-compatible) is an optional fallback when Mistral fails or is not configured.
 * API keys never leave the server and are never logged.
 */

export type ChatRole = "system" | "user" | "assistant";
export type ChatMessage = { role: ChatRole; content: string };
export type Usage = { promptTokens: number; completionTokens: number };

type JsonSchema = { name: string; schema: Record<string, unknown> };

export type CompletionOptions = {
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
  /** Use the quiz model (MISTRAL_QUIZ_MODEL) instead of the chat model. */
  task?: "chat" | "generation";
};

export class AiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly retryable = false,
  ) {
    super(message);
    this.name = "AiError";
  }
}

const log = {
  warn: (msg: string, meta?: Record<string, unknown>) => console.warn(`[ai] ${msg}`, meta ?? ""),
  error: (msg: string, meta?: Record<string, unknown>) => console.error(`[ai] ${msg}`, meta ?? ""),
};

type Provider = {
  /** Human-readable id stored in usage logs, e.g. "mistral:mistral-large-latest". */
  label: string;
  url: string;
  apiKey: string;
  body: (messages: ChatMessage[], stream: boolean, json?: JsonSchema) => Record<string, unknown>;
};

/** Ordered list of providers to try for a request. */
function providers(opts: CompletionOptions, json?: JsonSchema): Provider[] {
  const { mistral, groq } = getConfig();
  const temperature = opts.temperature ?? mistral.temperature;
  const maxTokens = opts.maxTokens ?? mistral.maxTokens;
  const list: Provider[] = [];

  const mistralFormat = json
    ? { type: "json_schema", json_schema: { name: json.name, schema: json.schema, strict: true } }
    : undefined;

  if (mistral.apiKey) {
    if (mistral.agentId && opts.task !== "generation") {
      list.push({
        label: `mistral-agent:${mistral.agentId}`,
        url: `${mistral.baseUrl}/agents/completions`,
        apiKey: mistral.apiKey,
        body: (messages, stream) => ({ agent_id: mistral.agentId, messages, max_tokens: maxTokens, stream }),
      });
    }
    const model = opts.task === "generation" ? mistral.quizModel : mistral.model;
    list.push({
      label: `mistral:${model}`,
      url: `${mistral.baseUrl}/chat/completions`,
      apiKey: mistral.apiKey,
      body: (messages, stream) => ({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        safe_prompt: mistral.safePrompt,
        stream,
        ...(mistralFormat ? { response_format: mistralFormat } : {}),
      }),
    });
  }

  if (groq.apiKey) {
    list.push({
      label: `groq:${groq.model}`,
      url: `${groq.baseUrl}/chat/completions`,
      apiKey: groq.apiKey,
      body: (messages, stream, schema) => ({
        model: groq.model,
        // JSON mode + the schema in the prompt; the result is validated with zod afterwards anyway.
        messages: schema ? withSchemaInstruction(messages, schema) : messages,
        temperature,
        max_tokens: maxTokens,
        stream,
        // gpt-oss models reason first; keep the reasoning out of the answer.
        reasoning_effort: groq.reasoningEffort,
        include_reasoning: false,
        ...(schema ? { response_format: { type: "json_object" } } : {}),
      }),
    });
  }

  if (list.length === 0) throw new AiError("No AI provider configured (set MISTRAL_API_KEY or GROQ_API_KEY)");
  return list;
}

function withSchemaInstruction(messages: ChatMessage[], schema: JsonSchema): ChatMessage[] {
  const instruction = `\n\nRespond ONLY with a JSON object that matches this JSON Schema exactly:\n${JSON.stringify(schema.schema)}`;
  const [first, ...rest] = messages;
  if (first?.role === "system") return [{ ...first, content: first.content + instruction }, ...rest];
  return [{ role: "system", content: instruction.trim() }, ...messages];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * POST with timeout + retries (429, 5xx, network). Retries only happen before a body
 * is consumed, so streamed answers are never duplicated. For streams the timeout
 * guards the connection only, so long answers can keep streaming.
 */
async function post(
  url: string,
  apiKey: string,
  body: unknown,
  signal?: AbortSignal,
  { streaming = false } = {},
): Promise<Response> {
  const cfg = getConfig().mistral;
  let lastError: unknown;

  for (let attempt = 0; attempt <= cfg.maxRetries; attempt++) {
    const timeout = new AbortController();
    const timer = setTimeout(() => timeout.abort(), cfg.timeoutMs);
    const combined = signal ? AbortSignal.any([signal, timeout.signal]) : timeout.signal;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: streaming ? "text/event-stream" : "application/json",
        },
        body: JSON.stringify(body),
        signal: combined,
      });

      if (streaming) clearTimeout(timer);
      // Non-streaming bodies stay under the timeout until read; a late abort after that is a no-op.
      if (res.ok) return res;
      clearTimeout(timer);

      const retryable = res.status === 429 || res.status >= 500;
      const detail = (await res.text().catch(() => "")).slice(0, 300);
      lastError = new AiError(`AI request failed with ${res.status}`, res.status, retryable);
      log.warn("request failed", { host: new URL(url).host, status: res.status, attempt, detail });
      if (!retryable) break;

      const retryAfter = Number(res.headers.get("retry-after"));
      await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter, 10) * 1000 : 500 * 2 ** attempt);
    } catch (err) {
      clearTimeout(timer);
      if (signal?.aborted) throw err; // caller cancelled — do not retry
      const timedOut = timeout.signal.aborted;
      lastError = new AiError(timedOut ? "AI request timed out" : "AI network error", undefined, true);
      log.warn(timedOut ? "timeout" : "network error", { host: new URL(url).host, attempt });
      await sleep(500 * 2 ** attempt);
    }
  }

  throw lastError instanceof Error ? lastError : new AiError("AI request failed");
}

/** Tries each provider in order until one accepts the request. */
async function connect(
  messages: ChatMessage[],
  opts: CompletionOptions,
  stream: boolean,
  json?: JsonSchema,
): Promise<{ res: Response; label: string }> {
  let lastError: unknown;
  for (const provider of providers(opts, json)) {
    try {
      const res = await post(provider.url, provider.apiKey, provider.body(messages, stream, json), opts.signal, {
        streaming: stream,
      });
      return { res, label: provider.label };
    } catch (err) {
      if (opts.signal?.aborted) throw err;
      lastError = err;
      log.warn("provider failed, trying next", { provider: provider.label.split(":")[0] });
    }
  }
  throw lastError instanceof Error ? lastError : new AiError("All AI providers failed");
}

type RawContent = string | { type?: string; text?: string }[] | null | undefined;

function contentToText(content: RawContent): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  return content.map((c) => (c.type === undefined || c.type === "text" ? (c.text ?? "") : "")).join("");
}

function readUsage(raw: unknown): Usage | undefined {
  const u = raw as { prompt_tokens?: number; completion_tokens?: number } | undefined;
  if (!u || (u.prompt_tokens === undefined && u.completion_tokens === undefined)) return undefined;
  return { promptTokens: u.prompt_tokens ?? 0, completionTokens: u.completion_tokens ?? 0 };
}

/** Non-streaming chat completion. */
export async function chatCompletion(messages: ChatMessage[], opts: CompletionOptions = {}, json?: JsonSchema) {
  const { res, label } = await connect(messages, opts, false, json);
  const body = (await res.json()) as {
    choices?: { message?: { content?: RawContent }; finish_reason?: string }[];
    usage?: unknown;
  };
  const choice = body.choices?.[0];
  return {
    text: contentToText(choice?.message?.content),
    finishReason: choice?.finish_reason ?? null,
    usage: readUsage(body.usage),
    model: label,
  };
}

/** Structured output: returns parsed JSON. Always validate it with zod before use. */
export async function chatCompletionJson(messages: ChatMessage[], json: JsonSchema, opts: CompletionOptions = {}) {
  const result = await chatCompletion(messages, opts, json);
  const text = result.text.trim().replace(/^```(?:json)?\s*|\s*```$/g, "");
  try {
    return { data: JSON.parse(text) as unknown, usage: result.usage, model: result.model };
  } catch {
    throw new AiError("Model returned invalid JSON");
  }
}

/**
 * Streaming chat completion (OpenAI-style SSE: `data: {...}` lines ending with `data: [DONE]`).
 * Returns the provider label and an async iterator of text deltas.
 */
export async function chatStream(
  messages: ChatMessage[],
  opts: CompletionOptions = {},
  onUsage?: (usage: Usage) => void,
): Promise<{ model: string; deltas: AsyncGenerator<string> }> {
  const { res, label } = await connect(messages, opts, true);
  if (!res.body) throw new AiError("Empty stream");
  return { model: label, deltas: readSse(res.body, onUsage) };
}

async function* readSse(body: ReadableStream<Uint8Array>, onUsage?: (usage: Usage) => void): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newline: number;
      while ((newline = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        if (!line.startsWith("data:")) continue;

        const payload = line.slice(5).trim();
        if (payload === "[DONE]") return;

        let chunk: { choices?: { delta?: { content?: RawContent } }[]; usage?: unknown; x_groq?: { usage?: unknown } };
        try {
          chunk = JSON.parse(payload);
        } catch {
          continue;
        }
        const usage = readUsage(chunk.usage) ?? readUsage(chunk.x_groq?.usage);
        if (usage && onUsage) onUsage(usage);
        const text = contentToText(chunk.choices?.[0]?.delta?.content);
        if (text) yield text;
      }
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
}

export type ModerationResult = { flagged: boolean; category: string | null };

/**
 * Classifies text with the Mistral moderation model. Fails open on API errors so an
 * outage does not block learning; `safe_prompt` and the system prompt still apply.
 */
export async function moderate(text: string, signal?: AbortSignal): Promise<ModerationResult> {
  const { moderation, mistral, groq } = getConfig();
  if (!moderation.enabled || !text.trim()) return { flagged: false, category: null };
  if (!mistral.apiKey) return groq.apiKey ? moderateWithGuardModel(text, signal) : { flagged: false, category: null };

  try {
    const res = await post(
      `${mistral.baseUrl}/moderations`,
      mistral.apiKey,
      { model: mistral.moderationModel, input: [text.slice(0, 20000)] },
      signal,
    );
    const body = (await res.json()) as {
      results?: { categories?: Record<string, boolean>; category_scores?: Record<string, number> }[];
    };
    const result = body.results?.[0];
    if (!result) return { flagged: false, category: null };

    for (const category of moderation.blockCategories) {
      const flagged = result.categories?.[category] === true;
      const score = result.category_scores?.[category] ?? 1;
      if (flagged && score >= moderation.threshold) return { flagged: true, category };
    }
    return { flagged: false, category: null };
  } catch (err) {
    if (signal?.aborted) throw err;
    log.error("moderation unavailable, failing open", { reason: err instanceof Error ? err.message : "unknown" });
    return { flagged: false, category: null };
  }
}

const GUARD_CATEGORIES = [
  "sexual",
  "hate_and_discrimination",
  "violence_and_threats",
  "dangerous_and_criminal_content",
  "selfharm",
] as const;

const GUARD_POLICY = `You are a content safety classifier for a school learning platform (students aged 6-17).
Classify the USER content. Answer with exactly one token: safe, ${GUARD_CATEGORIES.join(", ")}.
Educational discussion of history, science, biology, literature or health is safe.`;

/** Fallback moderation via a safety model on Groq, used only when no Mistral key is configured. */
async function moderateWithGuardModel(text: string, signal?: AbortSignal): Promise<ModerationResult> {
  const { groq } = getConfig();
  try {
    const res = await post(
      `${groq.baseUrl}/chat/completions`,
      groq.apiKey!,
      {
        model: groq.guardModel,
        messages: [
          { role: "system", content: GUARD_POLICY },
          { role: "user", content: text.slice(0, 12000) },
        ],
        max_tokens: 200,
        temperature: 0,
        reasoning_effort: "low",
        include_reasoning: false,
      },
      signal,
    );
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const verdict = (body.choices?.[0]?.message?.content ?? "").trim().toLowerCase();
    const category = GUARD_CATEGORIES.find((c) => verdict.includes(c));
    return category ? { flagged: true, category } : { flagged: false, category: null };
  } catch (err) {
    if (signal?.aborted) throw err;
    log.error("guard model unavailable, failing open", { reason: err instanceof Error ? err.message : "unknown" });
    return { flagged: false, category: null };
  }
}

/** True when at least one AI provider is configured. */
export function isAiConfigured() {
  const { mistral, groq } = getConfig();
  return Boolean(mistral.apiKey || groq.apiKey);
}
