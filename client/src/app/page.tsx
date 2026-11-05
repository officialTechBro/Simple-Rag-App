"use client";

import { useState } from "react";

import { Chat } from "@/components/chat";
import { KnowledgePanel, type IngestedItem } from "@/components/knowledge-panel";

export default function Home() {
  const [items, setItems] = useState<IngestedItem[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <div className="flex h-dvh w-full">
      <aside
        aria-label="Knowledge base"
        className={`${
          panelOpen ? "fixed inset-0 z-40 flex" : "hidden"
        } w-full flex-col bg-background lg:static lg:z-auto lg:flex lg:w-[380px] lg:shrink-0 lg:border-r lg:border-border`}
      >
        <KnowledgePanel
          items={items}
          onIngested={(item) => setItems((prev) => [...prev, item])}
          onReset={() => setItems([])}
          onClose={() => setPanelOpen(false)}
        />
      </aside>
      <main className="flex min-w-0 flex-1">
        <Chat onOpenPanel={() => setPanelOpen(true)} hasKnowledge={items.length > 0} />
      </main>
    </div>
  );
}
