"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDownIcon, ClipboardListIcon, DumbbellIcon, HistoryIcon, PlusIcon, StarIcon } from "lucide-react";
import { toast } from "sonner";
import { saveItem } from "@/app/actions/saved";
import { LogoMark } from "@/components/brand/logo";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { streamChat, type ChatRequestBody } from "@/lib/chat-client";
import { CHAT_MODES, LIMITS, QUICK_PROMPTS, WELCOME_SUBJECTS, type ChatMode } from "@/lib/constants";
import { ERRORS } from "@/lib/errors";
import type { Message } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ChatInput, type ChatInputHandle } from "./chat-input";
import { ChatList, ConversationMenu, useConversationActions } from "./chat-list";
import { MessageBubble, type UiMessage } from "./message-bubble";

type SubjectOption = { slug: string; name: string; icon: string };

export type ChatViewProps = {
  conversation: { id: string; title: string; isFavorite: boolean; mode: ChatMode; subject: string | null } | null;
  initialMessages: Message[];
  student: { name: string; grade: number | null };
  subjects: SubjectOption[];
  initialPrompt?: string;
  autoSend?: boolean;
  initialMode?: ChatMode;
  initialSubject?: string;
};

let localId = 0;
const nextId = () => `local-${Date.now()}-${++localId}`;

export function ChatView(props: ChatViewProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<UiMessage[]>(() =>
    props.initialMessages.map((m) => ({ id: m.id, role: m.role, content: m.content, status: "done", requestPersisted: true })),
  );
  const [input, setInput] = useState(props.initialPrompt ?? "");
  const [streaming, setStreaming] = useState(false);
  const [mode, setMode] = useState<ChatMode>(props.conversation?.mode ?? props.initialMode ?? "explain");
  const [subject, setSubject] = useState<string | null>(props.conversation?.subject ?? props.initialSubject ?? null);
  const [title, setTitle] = useState(props.conversation?.title ?? null);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Ref for callbacks (always current), state for rendering.
  const conversationId = useRef<string | null>(props.conversation?.id ?? null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(props.conversation?.id ?? null);
  const abortRef = useRef<AbortController | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const inputRef = useRef<ChatInputHandle>(null);
  const actions = useConversationActions();

  const subjectInfo = props.subjects.find((s) => s.slug === subject) ?? null;
  const modeInfo = CHAT_MODES.find((m) => m.id === mode)!;

  // Keep the newest content in view unless the student scrolled up to read.
  useEffect(() => {
    const el = scroller.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const patch = useCallback((id: string, update: Partial<UiMessage> | ((m: UiMessage) => Partial<UiMessage>)) => {
    setMessages((list) => list.map((m) => (m.id === id ? { ...m, ...(typeof update === "function" ? update(m) : update) } : m)));
  }, []);

  const run = useCallback(
    async (body: ChatRequestBody, assistantId: string) => {
      const controller = new AbortController();
      abortRef.current = controller;
      setStreaming(true);
      stickToBottom.current = true;
      let persisted = false;

      try {
        const outcome = await streamChat(body, controller.signal, (event) => {
          switch (event.type) {
            case "meta":
              persisted = true;
              patch(assistantId, { requestPersisted: true });
              if (!conversationId.current) {
                conversationId.current = event.conversationId;
                setActiveConversationId(event.conversationId);
                setTitle(event.title);
                // Update the URL without a navigation so the stream keeps running.
                window.history.replaceState(null, "", `/chat/${event.conversationId}`);
              }
              break;
            case "delta":
              patch(assistantId, (m) => ({ content: m.content + event.text }));
              break;
            case "replace":
              patch(assistantId, { content: event.text, status: "blocked" });
              break;
            case "error":
              patch(assistantId, { status: "error", error: event.message });
              break;
            case "done":
              patch(assistantId, (m) => (m.status === "streaming" ? { status: "done" } : {}));
              break;
          }
        });
        if (outcome.kind === "blocked") patch(assistantId, { content: outcome.reply, status: "blocked" });
        if (outcome.kind === "error") patch(assistantId, { status: "error", error: outcome.message });
      } catch {
        // Aborted by the student ("To‘xtatish"). The server keeps the partial answer.
        patch(assistantId, (m) => ({ status: m.content ? "stopped" : "error", error: m.content ? undefined : "Javob to‘xtatildi." }));
      } finally {
        patch(assistantId, (m) => (m.status === "streaming" ? { status: "done" } : {}));
        abortRef.current = null;
        setStreaming(false);
        if (persisted) router.refresh(); // update the conversation list
      }
    },
    [patch, router],
  );

  const send = useCallback(
    (text: string) => {
      const message = text.trim();
      if (!message || streaming) return;
      if (message.length > LIMITS.messageMaxChars) {
        toast.error(ERRORS.tooLong);
        return;
      }
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        toast.error(ERRORS.offline);
        return;
      }
      const assistantId = nextId();
      setMessages((list) => [
        ...list,
        { id: nextId(), role: "user", content: message, status: "done" },
        { id: assistantId, role: "assistant", content: "", status: "streaming" },
      ]);
      setInput("");
      void run(
        { conversationId: conversationId.current ?? undefined, message, mode, subject: subject ?? undefined },
        assistantId,
      );
    },
    [mode, run, streaming, subject],
  );

  const regenerate = useCallback(() => {
    if (streaming || !conversationId.current) return;
    const assistantId = nextId();
    setMessages((list) => {
      const trimmed = list.at(-1)?.role === "assistant" ? list.slice(0, -1) : list;
      return [...trimmed, { id: assistantId, role: "assistant", content: "", status: "streaming" }];
    });
    void run({ conversationId: conversationId.current, regenerate: true, mode, subject: subject ?? undefined }, assistantId);
  }, [mode, run, streaming, subject]);

  const retry = useCallback(() => {
    const last = messages.at(-1);
    const question = messages.at(-2);
    if (!last || last.role !== "assistant" || !question || question.role !== "user") return;
    if (last.requestPersisted && conversationId.current) {
      regenerate();
    } else {
      setMessages((list) => list.slice(0, -2));
      send(question.content);
    }
  }, [messages, regenerate, send]);

  // Optional one-time auto-send (e.g. a topic opened from a subject page).
  const autoSent = useRef(false);
  useEffect(() => {
    if (props.autoSend && props.initialPrompt && !autoSent.current && messages.length === 0) {
      autoSent.current = true;
      send(props.initialPrompt);
    }
  }, [messages.length, props.autoSend, props.initialPrompt, send]);

  async function save(message: UiMessage, index: number) {
    const question = message.role === "assistant" ? messages[index - 1]?.content : message.content;
    const result = await saveItem({
      type: message.role === "user" ? "question" : mode === "summary" ? "note" : "explanation",
      title: (question ?? title ?? "Aqilbek javobi").replace(/\s+/g, " ").slice(0, 120),
      content: message.content,
      conversationId: conversationId.current ?? undefined,
    });
    if (result.ok) toast.success("Saqlanganlarga qo‘shildi ⭐");
    else toast.error(result.error);
  }

  const quickPrompts = [
    ...QUICK_PROMPTS,
    props.student.grade ? `Men ${props.student.grade}-sinf o‘quvchisiman, menga mos tushuntir` : null,
  ].filter(Boolean) as string[];

  const lastAssistant = messages.at(-1)?.role === "assistant" ? messages.at(-1) : null;
  const showFollowUps = !streaming && lastAssistant?.status === "done";

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3 sm:px-4">
        <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
          <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" aria-label="Suhbatlar tarixi" />}>
            <HistoryIcon className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] max-w-xs p-0">
            <SheetHeader className="border-b px-4 py-3">
              <SheetTitle>Suhbatlar</SheetTitle>
            </SheetHeader>
            <ChatList onNavigate={() => setHistoryOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[15px] font-semibold">{title ?? "Yangi suhbat"}</h1>
          <p className="truncate text-xs text-muted-foreground">
            {modeInfo.icon} {modeInfo.title}
            {subjectInfo ? ` · ${subjectInfo.name}` : ""}
          </p>
        </div>

        {activeConversationId && props.conversation && (
          <Button
            variant="ghost"
            size="icon"
            aria-label={props.conversation.isFavorite ? "Sevimlilardan olish" : "Sevimlilarga qo‘shish"}
            onClick={() => actions.toggleFavorite(props.conversation!.id, !props.conversation!.isFavorite)}
          >
            <StarIcon className={cn("size-[1.1rem]", props.conversation.isFavorite && "fill-sun text-sun")} />
          </Button>
        )}
        {activeConversationId && (
          <ConversationMenu
            conversation={{
              id: activeConversationId,
              title: title ?? "Yangi suhbat",
              is_favorite: props.conversation?.isFavorite ?? false,
            }}
            actions={actions}
          />
        )}
        <Link href="/chat" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "hidden h-8 sm:inline-flex")}>
          <PlusIcon /> Yangi
        </Link>
      </header>

      {/* Messages */}
      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
        }}
        className="min-h-0 flex-1 overflow-y-auto"
        aria-live="polite"
        aria-busy={streaming}
      >
        <div className="mx-auto w-full max-w-3xl px-3 py-6 sm:px-6">
          {messages.length === 0 ? (
            <Welcome
              name={props.student.name}
              onSubject={(slug) => {
                setSubject(slug);
                inputRef.current?.focus();
              }}
              onOther={() => {
                setSubject(null);
                inputRef.current?.focus();
              }}
              activeSubject={subject}
            />
          ) : (
            <div className="grid gap-6">
              {messages.map((m, i) => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  isLast={i === messages.length - 1}
                  busy={streaming}
                  onRegenerate={regenerate}
                  onRetry={retry}
                  onSave={() => save(m, i)}
                />
              ))}
              {showFollowUps && (
                <div className="flex flex-wrap gap-2 pl-11">
                  {["Menga 5 ta mashq tuzib ber", "Misollar bilan tushuntir", "Qisqa qilib ber"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => send(p)}
                      className="rounded-full border bg-card px-3 py-1.5 text-sm transition hover:border-primary/50 hover:bg-brand-soft"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t bg-background/95 px-3 pt-2 pb-3 backdrop-blur pb-safe sm:px-6">
        <div className="mx-auto w-full max-w-3xl">
          <div className="-mx-1 mb-2 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
            <ModePicker mode={mode} onChange={setMode} />
            <SubjectPicker subjects={props.subjects} value={subject} onChange={setSubject} />
            {messages.length === 0 && <PromptChips prompts={quickPrompts} disabled={streaming} onPick={send} />}
          </div>
          <ChatInput
            ref={inputRef}
            value={input}
            onChange={setInput}
            onSubmit={() => send(input)}
            onStop={() => abortRef.current?.abort()}
            streaming={streaming}
            placeholder={subjectInfo ? `${subjectInfo.name} bo‘yicha savolingni yoz...` : undefined}
          />
          <p className="mt-1.5 hidden text-center text-[11px] text-muted-foreground sm:block">
            Aqilbek xato qilishi mumkin. Muhim ma’lumotlarni darslik yoki o‘qituvching bilan tekshir.
          </p>
        </div>
      </div>
      {actions.dialogs}
    </div>
  );
}

function PromptChips({ prompts, disabled, onPick }: { prompts: string[]; disabled: boolean; onPick: (p: string) => void }) {
  return prompts.map((p) => (
    <button
      key={p}
      type="button"
      disabled={disabled}
      onClick={() => onPick(p)}
      className="h-8 shrink-0 rounded-full border bg-card px-3 text-[13px] whitespace-nowrap transition hover:border-primary/50 hover:bg-brand-soft"
    >
      {p}
    </button>
  ));
}

function Welcome({
  name,
  onSubject,
  onOther,
  activeSubject,
}: {
  name: string;
  onSubject: (slug: string) => void;
  onOther: () => void;
  activeSubject: string | null;
}) {
  return (
    <div className="flex flex-col items-center pt-6 text-center sm:pt-14">
      <LogoMark className="size-16" />
      <h2 className="mt-5 text-2xl font-bold sm:text-3xl">Salom! Men Aqilbekman 👋</h2>
      <p className="mt-2 text-muted-foreground">
        {name ? `${name}, q` : "Q"}aysi fan yoki mavzu bo‘yicha yordam kerak?
      </p>
      <div className="mt-7 flex max-w-xl flex-wrap justify-center gap-2.5">
        {WELCOME_SUBJECTS.map((s) => (
          <button
            key={s.slug}
            type="button"
            onClick={() => onSubject(s.slug)}
            aria-pressed={activeSubject === s.slug}
            className={cn(
              "h-11 rounded-full border bg-card px-4 text-[15px] font-medium transition hover:border-primary/50 hover:bg-brand-soft",
              activeSubject === s.slug && "border-primary bg-brand-soft text-primary",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
      <button type="button" onClick={onOther} className="mt-4 text-sm font-semibold text-primary hover:underline">
        Boshqa savolim bor
      </button>
    </div>
  );
}

function ModePicker({ mode, onChange }: { mode: ChatMode; onChange: (mode: ChatMode) => void }) {
  const current = CHAT_MODES.find((m) => m.id === mode)!;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" className="h-8 shrink-0 rounded-full px-3 text-[13px]" aria-label="AI rejimini tanlash" />
        }
      >
        {current.icon} {current.title} <ChevronDownIcon className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-72">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Aqilbek rejimi</DropdownMenuLabel>
          {CHAT_MODES.map((m) => (
            <DropdownMenuItem key={m.id} onClick={() => onChange(m.id)} className={cn("items-start py-2", m.id === mode && "bg-accent")}>
              <span className="text-base leading-5">{m.icon}</span>
              <span className="grid">
                <span className="font-medium">{m.title}</span>
                <span className="text-xs text-muted-foreground">{m.description}</span>
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/quizzes/new" />} className="py-2">
          <ClipboardListIcon /> Test tuzuvchi
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/practice" />} className="py-2">
          <DumbbellIcon /> Mashqlar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SubjectPicker({
  subjects,
  value,
  onChange,
}: {
  subjects: SubjectOption[];
  value: string | null;
  onChange: (slug: string | null) => void;
}) {
  const current = subjects.find((s) => s.slug === value);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="sm" className="h-8 shrink-0 rounded-full px-3 text-[13px]" aria-label="Fanni tanlash" />}
      >
        {current ? `${current.icon} ${current.name}` : "📚 Fan tanlanmagan"} <ChevronDownIcon className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="max-h-80 w-56">
        <DropdownMenuItem onClick={() => onChange(null)}>✨ Umumiy</DropdownMenuItem>
        {subjects.map((s) => (
          <DropdownMenuItem key={s.slug} onClick={() => onChange(s.slug)} className={cn(s.slug === value && "bg-accent")}>
            {s.icon} {s.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
