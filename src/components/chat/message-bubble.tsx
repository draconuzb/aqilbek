"use client";

import { useState } from "react";
import { BookmarkIcon, CheckIcon, CopyIcon, RefreshCwIcon, RotateCcwIcon, TriangleAlertIcon } from "lucide-react";
import { toast } from "sonner";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Markdown } from "./markdown";

export type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: "done" | "streaming" | "error" | "blocked" | "stopped";
  error?: string;
  /** For assistant replies: whether the server stored the question (so retry can regenerate). */
  requestPersisted?: boolean;
};

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status" aria-live="polite">
      <span className="flex gap-1" aria-hidden>
        <span className="typing-dot size-1.5 rounded-full bg-primary" />
        <span className="typing-dot size-1.5 rounded-full bg-primary" />
        <span className="typing-dot size-1.5 rounded-full bg-primary" />
      </span>
      Aqilbek o‘ylayapti...
    </div>
  );
}

function IconAction({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label={label} onClick={onClick} className="text-muted-foreground hover:text-foreground" />}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function MessageBubble({
  message,
  isLast,
  busy,
  onRegenerate,
  onRetry,
  onSave,
}: {
  message: UiMessage;
  isLast: boolean;
  busy: boolean;
  onRegenerate: () => void;
  onRetry: () => void;
  onSave: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Nusxa olib bo‘lmadi");
    }
  }

  if (message.role === "user") {
    return (
      <div className="group flex flex-col items-end gap-1">
        <div className="max-w-[88%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap text-primary-foreground sm:max-w-[75%]">
          {message.content}
        </div>
        <div className="flex gap-0.5 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
          <IconAction label={copied ? "Nusxa olindi" : "Nusxa olish"} onClick={copy}>
            {copied ? <CheckIcon /> : <CopyIcon />}
          </IconAction>
          <IconAction label="Savolni saqlash" onClick={onSave}>
            <BookmarkIcon />
          </IconAction>
        </div>
      </div>
    );
  }

  const streaming = message.status === "streaming";
  return (
    <div className="flex gap-3">
      <LogoMark className="mt-0.5 size-8" />
      <div className="min-w-0 flex-1">
        {streaming && !message.content ? (
          <div className="pt-1.5">
            <TypingIndicator />
          </div>
        ) : (
          <div
            className={cn(
              "rounded-2xl rounded-tl-md",
              message.status === "blocked" && "border border-sun/40 bg-sun-soft px-4 py-3",
            )}
          >
            {message.content && <Markdown content={message.content} />}
            {streaming && <span className="streaming-caret" aria-hidden />}
          </div>
        )}

        {message.status === "error" && (
          <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
            <TriangleAlertIcon className="size-4 shrink-0" />
            <span className="flex-1">{message.error}</span>
            {isLast && (
              <Button size="sm" variant="outline" onClick={onRetry} disabled={busy}>
                <RotateCcwIcon /> Qayta urinish
              </Button>
            )}
          </div>
        )}
        {message.status === "stopped" && <p className="mt-1 text-xs text-muted-foreground">⏹ Javob to‘xtatildi</p>}

        {!streaming && message.content && message.status !== "blocked" && (
          <div className="mt-1.5 flex gap-0.5">
            <IconAction label={copied ? "Nusxa olindi" : "Nusxa olish"} onClick={copy}>
              {copied ? <CheckIcon /> : <CopyIcon />}
            </IconAction>
            <IconAction label="Saqlash" onClick={onSave}>
              <BookmarkIcon />
            </IconAction>
            {isLast && (
              <IconAction label="Qayta yaratish" onClick={() => !busy && onRegenerate()}>
                <RefreshCwIcon />
              </IconAction>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
