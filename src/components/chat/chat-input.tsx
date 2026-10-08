"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { ArrowUpIcon, SquareIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LIMITS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type ChatInputHandle = { focus: () => void };

export const ChatInput = forwardRef<
  ChatInputHandle,
  {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    onStop: () => void;
    streaming: boolean;
    placeholder?: string;
  }
>(function ChatInput({ value, onChange, onSubmit, onStop, streaming, placeholder }, ref) {
  const textarea = useRef<HTMLTextAreaElement>(null);
  useImperativeHandle(ref, () => ({ focus: () => textarea.current?.focus() }));

  // Auto-grow up to ~8 lines.
  useEffect(() => {
    const el = textarea.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, [value]);

  const tooLong = value.length > LIMITS.messageMaxChars;
  const nearLimit = value.length > LIMITS.messageMaxChars * 0.8;
  const canSend = value.trim().length > 0 && !tooLong && !streaming;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSend) onSubmit();
      }}
      className="relative rounded-2xl border bg-card shadow-sm transition focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30"
    >
      <label htmlFor="chat-input" className="sr-only">
        Savolingizni yozing
      </label>
      <textarea
        id="chat-input"
        ref={textarea}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            if (canSend) onSubmit();
          }
        }}
        placeholder={placeholder ?? "Savolingni yoz... (Enter — yuborish, Shift+Enter — yangi qator)"}
        className="block max-h-[220px] min-h-[52px] w-full resize-none bg-transparent py-3.5 pr-14 pl-4 text-base outline-none placeholder:text-muted-foreground sm:text-[15px]"
        aria-invalid={tooLong}
        aria-describedby={nearLimit ? "chat-input-count" : undefined}
      />
      <div className="absolute right-2 bottom-2 flex items-center gap-2">
        {nearLimit && (
          <span id="chat-input-count" className={cn("text-xs tabular-nums text-muted-foreground", tooLong && "font-semibold text-destructive")}>
            {value.length}/{LIMITS.messageMaxChars}
          </span>
        )}
        {streaming ? (
          <Button type="button" size="icon" variant="secondary" onClick={onStop} aria-label="To‘xtatish" className="size-10 rounded-xl">
            <SquareIcon className="size-4 fill-current" />
          </Button>
        ) : (
          <Button type="submit" size="icon" disabled={!canSend} aria-label="Yuborish" className="size-10 rounded-xl">
            <ArrowUpIcon className="size-5" />
          </Button>
        )}
      </div>
    </form>
  );
});
