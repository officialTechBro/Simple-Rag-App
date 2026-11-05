"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowUp,
  FileText,
  Menu,
  Minus,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ask, type KBSource } from "@/lib/api";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: KBSource[];
  confidence?: number;
  error?: boolean;
};

const SUGGESTIONS = [
  "Summarize the text I added",
  "What are the key points?",
  "List any dates, names or numbers mentioned",
];

const uid = () => Math.random().toString(36).slice(2);

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1" role="status" aria-label="Assistant is thinking">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="size-2 rounded-full bg-muted-foreground motion-safe:animate-bounce"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}

function ConfidencePill({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const label = pct >= 70 ? "High" : pct >= 40 ? "Medium" : "Low";
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-2.5 py-1 text-xs text-muted-foreground"
      title="Average similarity of the retrieved chunks"
    >
      <span className="h-1.5 w-10 overflow-hidden rounded-full bg-border" aria-hidden>
        <span className="block h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </span>
      <span className="tabular-nums">
        {label} confidence · {pct}%
      </span>
    </span>
  );
}

function MessageBubble({ m }: { m: Message }) {
  if (m.role === "user") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-[15px] leading-relaxed text-primary-foreground sm:max-w-[75%]">
          {m.content}
        </p>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <span
        className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full ${
          m.error ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary"
        }`}
        aria-hidden
      >
        {m.error ? <AlertCircle className="size-4" /> : <Sparkles className="size-4" />}
      </span>
      <div className="min-w-0 max-w-[85%] space-y-3 sm:max-w-[75%]">
        <div
          className={`whitespace-pre-wrap rounded-2xl rounded-tl-md border px-4 py-3 text-[15px] leading-relaxed ${
            m.error
              ? "border-destructive/30 bg-destructive/10 text-foreground"
              : "border-border bg-card"
          }`}
        >
          {m.content}
        </div>
        {!m.error && (m.sources?.length || m.confidence !== undefined) && (
          <div className="flex flex-wrap items-center gap-2">
            {m.confidence !== undefined && <ConfidencePill value={m.confidence} />}
            {m.sources?.map((s, i) => (
              <span
                key={`${s.source}-${s.chunkId}-${i}`}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground"
              >
                <FileText className="size-3 shrink-0" aria-hidden />
                <span className="truncate">
                  {s.source} · chunk {s.chunkId}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function Chat({ onOpenPanel, hasKnowledge }: { onOpenPanel: () => void; hasKnowledge: boolean }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [k, setK] = useState(2);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [input]);

  async function send(text: string) {
    const query = text.trim();
    if (query.length < 3 || loading) return;
    setMessages((prev) => [...prev, { id: uid(), role: "user", content: query }]);
    setInput("");
    setLoading(true);
    try {
      const r = await ask(query, k);
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "assistant", content: r.answer, sources: r.sources, confidence: r.confidence },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          error: true,
          content: err instanceof Error ? err.message : "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  }

  const canSend = input.trim().length >= 3 && !loading;

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-3 sm:px-6">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-11 cursor-pointer lg:hidden"
            onClick={onOpenPanel}
            aria-label="Open knowledge panel"
          >
            <Menu />
          </Button>
          <h1 className="text-sm font-semibold sm:text-base">Chat with your knowledge</h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-11 cursor-pointer gap-1.5 text-muted-foreground"
          onClick={() => setMessages([])}
          disabled={messages.length === 0 || loading}
        >
          <Trash2 className="size-4" /> <span className="hidden sm:inline">Clear chat</span>
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto" aria-live="polite">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6">
          {messages.length === 0 && !loading ? (
            <div className="flex flex-col items-center gap-6 py-12 text-center sm:py-20">
              <span className="grid size-14 place-items-center rounded-2xl bg-primary/15 text-primary">
                <Sparkles className="size-7" aria-hidden />
              </span>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight">Ask anything about your text</h2>
                <p className="mx-auto max-w-md text-sm text-muted-foreground">
                  {hasKnowledge
                    ? "Answers come only from what you've added, with the sources they were drawn from."
                    : "Start by adding some text in the knowledge panel, then ask a question here."}
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="min-h-11 cursor-pointer rounded-full border border-border bg-card px-4 text-sm text-muted-foreground transition-colors duration-200 hover:border-primary/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => <MessageBubble key={m.id} m={m} />)
          )}

          {loading && (
            <div className="flex gap-3">
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-primary/15 text-primary" aria-hidden>
                <Sparkles className="size-4" />
              </span>
              <div className="rounded-2xl rounded-tl-md border border-border bg-card px-4 py-3">
                <TypingDots />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-border px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-6">
        <form
          className="mx-auto w-full max-w-3xl"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <div className="rounded-2xl border border-input bg-card p-2 transition-colors duration-200 focus-within:border-primary/60">
            <label htmlFor="chat-input" className="sr-only">
              Your question
            </label>
            <textarea
              id="chat-input"
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="Ask a question…"
              className="max-h-44 w-full resize-none bg-transparent px-2 py-2 text-[16px] leading-relaxed outline-none placeholder:text-muted-foreground"
            />
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground" role="group" aria-label="Chunks to retrieve">
                <span className="mr-1 hidden sm:inline">Context chunks</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-11 cursor-pointer"
                  onClick={() => setK((v) => Math.max(1, v - 1))}
                  disabled={k <= 1}
                  aria-label="Fewer chunks"
                >
                  <Minus className="size-4" />
                </Button>
                <span className="w-5 text-center text-sm tabular-nums text-foreground" aria-live="polite">
                  {k}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-11 cursor-pointer"
                  onClick={() => setK((v) => Math.min(10, v + 1))}
                  disabled={k >= 10}
                  aria-label="More chunks"
                >
                  <Plus className="size-4" />
                </Button>
              </div>
              <Button
                type="submit"
                size="icon"
                className="size-11 cursor-pointer rounded-xl"
                disabled={!canSend}
                aria-label="Send question"
              >
                <ArrowUp />
              </Button>
            </div>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Enter to send · Shift+Enter for a new line
          </p>
        </form>
      </div>
    </div>
  );
}
