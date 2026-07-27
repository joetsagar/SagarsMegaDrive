"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Import, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InlineEdit } from "@/components/ui/inline-edit";

export type TemplateItemDto = {
  id: string;
  title: string;
  position: number;
};

function byPosition(items: TemplateItemDto[]) {
  return [...items].sort((a, b) => a.position - b.position);
}

function TemplateRow({
  item,
  index,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onRename,
  onDelete,
}: {
  item: TemplateItemDto;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-2 border-b px-2 py-3 last:border-b-0">
      <div className="flex shrink-0 flex-col">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={isFirst}
          className="flex size-6 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-20"
        >
          <ChevronUp className="size-4" />
          <span className="sr-only">Move up</span>
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={isLast}
          className="flex size-6 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-20"
        >
          <ChevronDown className="size-4" />
          <span className="sr-only">Move down</span>
        </button>
      </div>
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
        {index + 1}
      </span>
      <InlineEdit
        value={item.title}
        onSave={onRename}
        textClassName="flex-1 text-base break-words"
        inputClassName="h-8 min-w-0 flex-1 rounded border px-2 text-base focus:outline-none focus:ring-1 focus:ring-ring"
        iconClassName="shrink-0 text-muted-foreground/60 hover:text-foreground"
      />
      <button
        type="button"
        onClick={onDelete}
        className="flex size-8 shrink-0 items-center justify-center text-muted-foreground/60 hover:text-destructive"
      >
        <Trash2 className="size-4" />
        <span className="sr-only">Delete template task</span>
      </button>
    </div>
  );
}

export function WorkTasksTemplate<TImported>({
  initialItems,
  persist = true,
  onImport,
}: {
  initialItems: TemplateItemDto[];
  persist?: boolean;
  /** Performs the actual import (network call or local fabrication) and returns
   *  the number of tasks imported, or null if the import failed. */
  onImport: (templateTitles: string[]) => Promise<TImported[] | null>;
}) {
  const [items, setItems] = useState(initialItems);
  const [draftTitle, setDraftTitle] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  async function persistOrder(next: TemplateItemDto[]) {
    if (!persist) return;
    try {
      const res = await fetch("/api/todos/templates/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: byPosition(next).map((i) => i.id) }),
      });
      if (!res.ok) throw new Error();
    } catch {
      toast.error("Failed to save new order");
    }
  }

  function reorder(id: string, direction: -1 | 1) {
    setItems((prev) => {
      const sorted = byPosition(prev);
      const idx = sorted.findIndex((i) => i.id === id);
      const swapIdx = idx + direction;
      if (swapIdx < 0 || swapIdx >= sorted.length) return prev;

      const current = sorted[idx];
      const other = sorted[swapIdx];
      const next = prev.map((i) => {
        if (i.id === current.id) return { ...i, position: other.position };
        if (i.id === other.id) return { ...i, position: current.position };
        return i;
      });
      persistOrder(next);
      return next;
    });
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    const title = draftTitle.trim();
    if (!title) return;
    setDraftTitle("");

    if (!persist) {
      setItems((prev) => [...prev, { id: crypto.randomUUID(), title, position: prev.length }]);
      return;
    }

    try {
      const res = await fetch("/api/todos/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error();
      const created: TemplateItemDto = await res.json();
      setItems((prev) => [...prev, created]);
    } catch {
      toast.error("Failed to add template task");
    }
  }

  async function renameItem(id: string, title: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, title } : i)));
    if (!persist) return;
    try {
      const res = await fetch(`/api/todos/templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error();
    } catch {
      toast.error("Failed to rename template task");
    }
  }

  async function deleteItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (!persist) return;
    try {
      const res = await fetch(`/api/todos/templates/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      toast.error("Failed to delete template task");
    }
  }

  async function handleImport() {
    if (items.length === 0) {
      toast.error("Add some tasks to the template first");
      return;
    }
    setIsImporting(true);
    try {
      const titles = byPosition(items).map((i) => i.title);
      const result = await onImport(titles);
      if (!result) throw new Error();
      toast.success(`Imported ${result.length} task${result.length === 1 ? "" : "s"} into Work`);
    } catch {
      toast.error("Failed to import tasks");
    } finally {
      setIsImporting(false);
    }
  }

  const sorted = byPosition(items);

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border">
      <div className="flex items-center justify-between gap-2 bg-foreground px-4 py-2.5 text-background">
        <span className="text-sm font-bold tracking-wide uppercase">Work Tasks</span>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={handleImport}
          disabled={isImporting || items.length === 0}
        >
          {isImporting ? <Loader2 className="animate-spin" /> : <Import />}
          Import to Work
        </Button>
      </div>

      <div className="flex min-h-16 flex-1 flex-col">
        {items.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            No template tasks yet — add the tasks you repeat often, then import them into
            Work whenever you need them.
          </p>
        )}
        {sorted.map((item, index) => (
          <TemplateRow
            key={item.id}
            item={item}
            index={index}
            isFirst={index === 0}
            isLast={index === sorted.length - 1}
            onMoveUp={() => reorder(item.id, -1)}
            onMoveDown={() => reorder(item.id, 1)}
            onRename={(title) => renameItem(item.id, title)}
            onDelete={() => deleteItem(item.id)}
          />
        ))}
      </div>

      <form onSubmit={addItem} className="flex items-center gap-2 border-t bg-muted/30 p-2">
        <Input
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          placeholder="Add a template task"
          className="h-9"
        />
        <Button type="submit" size="icon-sm">
          <Plus />
          <span className="sr-only">Add template task</span>
        </Button>
      </form>
    </div>
  );
}
