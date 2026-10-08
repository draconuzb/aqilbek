import { ERRORS } from "@/lib/errors";
import type { ChatStreamEvent } from "@/lib/types";

export type ChatRequestBody = {
  conversationId?: string;
  message?: string;
  subject?: string;
  mode?: string;
  regenerate?: boolean;
};

export type GuestChatBody = {
  message: string;
  history: { role: "user" | "assistant"; content: string }[];
};

export type StreamOutcome =
  | { kind: "stream" }
  | { kind: "blocked"; reply: string }
  | { kind: "error"; message: string }
  | { kind: "limit"; message: string };

/**
 * POSTs to /api/chat and dispatches NDJSON events as they arrive.
 * Non-stream JSON responses are either friendly errors or safety blocks.
 */
export async function streamChat(
  body: ChatRequestBody | GuestChatBody,
  signal: AbortSignal,
  onEvent: (event: ChatStreamEvent) => void,
  url = "/api/chat",
): Promise<StreamOutcome> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (signal.aborted) throw err;
    return { kind: "error", message: navigator.onLine ? ERRORS.aiUnavailable : ERRORS.offline };
  }

  const type = res.headers.get("content-type") ?? "";
  if (!res.ok || type.includes("application/json")) {
    const data = (await res.json().catch(() => ({}))) as { error?: string; blocked?: boolean; reply?: string };
    if (data.blocked && data.reply) return { kind: "blocked", reply: data.reply };
    if (res.status === 401) return { kind: "error", message: ERRORS.unauthorized };
    if (res.status === 429 && data.error === ERRORS.guestLimit) return { kind: "limit", message: data.error };
    return { kind: "error", message: data.error ?? ERRORS.aiUnavailable };
  }
  if (!res.body) return { kind: "error", message: ERRORS.aiUnavailable };

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += value;
      let newline: number;
      while ((newline = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        if (!line) continue;
        try {
          onEvent(JSON.parse(line) as ChatStreamEvent);
        } catch {
          // ignore malformed line
        }
      }
    }
  } catch (err) {
    if (signal.aborted) throw err;
    onEvent({ type: "error", message: navigator.onLine ? ERRORS.aiUnavailable : ERRORS.offline });
  }
  return { kind: "stream" };
}
