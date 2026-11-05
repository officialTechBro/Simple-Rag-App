"use client";

import { useState } from "react";
import { BookOpen, FileText, Loader2, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ingest, resetKB } from "@/lib/api";

const MAX_CHARS = 100_000;

export type IngestedItem = { source: string; chunkCount: number };

export function KnowledgePanel({
  items,
  onIngested,
  onReset,
  onClose,
}: {
  items: IngestedItem[];
  onIngested: (item: IngestedItem) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const [source, setSource] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  const tooLong = text.length > MAX_CHARS;
  const canSubmit = text.trim().length > 0 && !tooLong && !loading;
  const totalChunks = items.reduce((n, i) => n + i.chunkCount, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      const r = await ingest(text.trim(), source.trim() || undefined);
      toast.success(`Added "${r.source}"`, {
        description: `${r.chunkCount} chunk${r.chunkCount === 1 ? "" : "s"} stored in memory.`,
      });
      onIngested({ source: r.source, chunkCount: r.chunkCount });
      setText("");
      setSource("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to ingest text");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    if (!window.confirm("Clear everything from the knowledge base?")) return;
    setResetting(true);
    try {
      await resetKB();
      onReset();
      toast.success("Knowledge base cleared");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-lg bg-primary/15 text-primary">
            <BookOpen className="size-5" aria-hidden />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Simple RAG</p>
            <p className="text-xs text-muted-foreground">In-memory knowledge base</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-11 lg:hidden"
          onClick={onClose}
          aria-label="Close knowledge panel"
        >
          <X />
        </Button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Add knowledge
          </h2>
          <div className="flex flex-col gap-2">
            <Label htmlFor="source">Source name</Label>
            <Input
              id="source"
              placeholder="e.g. handbook.md (optional)"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="h-11 bg-secondary/60"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="text">Text</Label>
            <Textarea
              id="text"
              placeholder="Paste the content you want to chat with…"
              className="min-h-44 resize-y bg-secondary/60"
              value={text}
              onChange={(e) => setText(e.target.value)}
              aria-describedby="text-count"
            />
            <p
              id="text-count"
              className={`text-right text-xs tabular-nums ${
                tooLong ? "text-destructive" : "text-muted-foreground"
              }`}
            >
              {text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
              {tooLong && " — too long, trim your text"}
            </p>
          </div>
          <Button type="submit" disabled={!canSubmit} className="h-11 cursor-pointer">
            {loading ? <Loader2 className="animate-spin" /> : <Plus />}
            {loading ? "Ingesting…" : "Add to memory"}
          </Button>
        </form>

        <section aria-label="Ingested sources" className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Sources this session
            {items.length > 0 && (
              <span className="ml-2 normal-case tracking-normal tabular-nums">
                {items.length} · {totalChunks} chunks
              </span>
            )}
          </h2>
          {items.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-4 py-5 text-center text-sm text-muted-foreground">
              Nothing ingested yet. Paste some text above to get started.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {items.map((item, i) => (
                <li
                  key={`${item.source}-${i}`}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
                >
                  <FileText className="size-4 shrink-0 text-primary" aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-sm" title={item.source}>
                    {item.source}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {item.chunkCount} chunk{item.chunkCount === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="border-t border-border p-4">
        <Button
          variant="outline"
          className="h-11 w-full cursor-pointer text-muted-foreground hover:text-destructive"
          onClick={handleReset}
          disabled={resetting}
        >
          {resetting ? <Loader2 className="animate-spin" /> : <Trash2 />}
          Reset memory
        </Button>
      </div>
    </div>
  );
}
