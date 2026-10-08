"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpIcon, LockKeyholeIcon, SquareIcon } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { Markdown } from "@/components/chat/markdown";
import { TypingIndicator } from "@/components/chat/message-bubble";
import { Button, buttonVariants } from "@/components/ui/button";
import { streamChat } from "@/lib/chat-client";
import { LIMITS } from "@/lib/constants";
import { ERRORS } from "@/lib/errors";
import { cn } from "@/lib/utils";

type GuestMessage = { role: "user" | "assistant"; content: string; status?: "streaming" | "error" | "blocked" };

const FREE_QUESTIONS = 3;
const STORAGE_KEY = "aqilbek-guest-remaining";
const SUGGESTIONS = ["Kasrlarni qo‘shishni tushuntir", "Fotosintez nima?", "Present Simple qachon ishlatiladi?"];

// Per-browser hint only; the server enforces the real per-IP limit.
function readRemaining() {
  try {
    const v = Number(localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(v) && localStorage.getItem(STORAGE_KEY) !== null ? v : FREE_QUESTIONS;
  } catch {
    return FREE_QUESTIONS;
  }
}
function writeRemaining(v: number) {
  try {
    localStorage.setItem(STORAGE_KEY, String(v));
  } catch {
    // storage unavailable (private mode) — fine
  }
}

/** "Try Aqilbek" chat on the landing page: a few free questions, then a sign-up prompt. */
export function GuestChat() {
  const [messages, setMessages] = useState<GuestMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [remaining, setRemaining] = useState(FREE_QUESTIONS);
  const abortRef = useRef<AbortController | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  // localStorage is browser-only; sync after hydration.
  useEffect(() => {
    const stored = readRemaining();
    if (stored !== FREE_QUESTIONS) setRemaining(stored); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const locked = remaining <= 0 && !streaming;

  function patchLast(update: (m: GuestMessage) => GuestMessage) {
    setMessages((list) => list.map((m, i) => (i === list.length - 1 ? update(m) : m)));
  }

  function setLeft(value: number) {
    setRemaining(value);
    writeRemaining(value);
  }

  async function ask(text: string) {
    const message = text.trim();
    if (!message || streaming || locked) return;
    if (message.length > LIMITS.guestMessageMaxChars) {
      setMessages((list) => [...list, { role: "assistant", content: ERRORS.tooLong, status: "error" }]);
      return;
    }
    const history = messages
      .filter((m) => !m.status && m.content)
      .slice(-6)
      .map(({ role, content }) => ({ role, content }));

    setInput("");
    setMessages((list) => [...list, { role: "user", content: message }, { role: "assistant", content: "", status: "streaming" }]);
    setStreaming(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const outcome = await streamChat(
        { message, history },
        controller.signal,
        (event) => {
          if (event.type === "guest") setLeft(event.remaining);
          else if (event.type === "delta") patchLast((m) => ({ ...m, content: m.content + event.text }));
          else if (event.type === "replace") patchLast((m) => ({ ...m, content: event.text, status: "blocked" }));
          else if (event.type === "error") patchLast((m) => ({ ...m, status: "error", content: m.content || event.message }));
        },
        "/api/guest-chat",
      );
      if (outcome.kind === "blocked") patchLast(() => ({ role: "assistant", content: outcome.reply, status: "blocked" }));
      if (outcome.kind === "error") patchLast(() => ({ role: "assistant", content: outcome.message, status: "error" }));
      if (outcome.kind === "limit") {
        setLeft(0);
        setMessages((list) => list.slice(0, -2));
      }
    } catch {
      // stopped by the visitor
    } finally {
      patchLast((m) => (m.status === "streaming" ? { ...m, status: undefined } : m));
      abortRef.current = null;
      setStreaming(false);
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-md">
      <div aria-hidden className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/15 to-sun/15 blur-2xl" />
      <div className="flex h-[480px] flex-col rounded-3xl border bg-card shadow-xl shadow-primary/5">
        <div className="flex items-center gap-2.5 border-b px-4 py-3">
          <LogoMark className="size-8" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Aqilbekdan so‘rab ko‘r</p>
            <p className="text-xs text-muted-foreground">Ro‘yxatdan o‘tmasdan · bepul</p>
          </div>
          <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-primary tabular-nums" aria-live="polite">
            {Math.max(remaining, 0)}/{FREE_QUESTIONS} savol
          </span>
        </div>

        <div ref={scroller} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm" aria-live="polite">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col justify-center gap-3">
              <p className="text-center text-muted-foreground">
                Salom! Men Aqilbekman 👋
                <br />
                Istalgan fandan savol ber:
              </p>
              <div className="flex flex-col gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => ask(s)}
                    disabled={locked}
                    className="rounded-xl border bg-background px-3 py-2.5 text-left transition hover:border-primary/50 hover:bg-brand-soft"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2 whitespace-pre-wrap text-primary-foreground">
                  {m.content}
                </div>
              ) : (
                <div
                  key={i}
                  className={cn(
                    "max-w-[95%] rounded-2xl rounded-bl-md bg-muted px-3.5 py-2.5",
                    m.status === "error" && "bg-destructive/10 text-destructive",
                    m.status === "blocked" && "bg-sun-soft",
                  )}
                >
                  {m.status === "streaming" && !m.content ? (
                    <TypingIndicator />
                  ) : (
                    <Markdown content={m.content} className="text-sm leading-6" />
                  )}
                </div>
              ),
            )
          )}
        </div>

        {locked ? (
          <div className="border-t bg-brand-soft/60 px-4 py-4 text-center">
            <LockKeyholeIcon className="mx-auto size-5 text-primary" />
            <p className="mt-1.5 text-sm font-semibold">Bepul savollar tugadi</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Ro‘yxatdan o‘ting — cheksiz suhbat, testlar va tarix sizni kutmoqda.
            </p>
            <div className="mt-3 flex justify-center gap-2">
              <Link href="/register" className={cn(buttonVariants(), "h-9 px-4")}>
                Ro‘yxatdan o‘tish
              </Link>
              <Link href="/login" className={cn(buttonVariants({ variant: "outline" }), "h-9 px-4")}>
                Kirish
              </Link>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void ask(input);
            }}
            className="flex items-end gap-2 border-t p-3"
          >
            <label htmlFor="guest-input" className="sr-only">
              Savolingiz
            </label>
            <textarea
              id="guest-input"
              rows={1}
              value={input}
              maxLength={LIMITS.guestMessageMaxChars}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  void ask(input);
                }
              }}
              placeholder="Savolingni yoz..."
              className="max-h-28 min-h-10 flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 sm:text-sm"
            />
            {streaming ? (
              <Button type="button" size="icon" variant="secondary" className="size-10 rounded-xl" aria-label="To‘xtatish" onClick={() => abortRef.current?.abort()}>
                <SquareIcon className="size-4 fill-current" />
              </Button>
            ) : (
              <Button type="submit" size="icon" className="size-10 rounded-xl" aria-label="Yuborish" disabled={!input.trim()}>
                <ArrowUpIcon className="size-5" />
              </Button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
