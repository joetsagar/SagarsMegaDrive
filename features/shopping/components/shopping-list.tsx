"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Copy, Plus, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatDate } from "@/features/files/lib/format";

export type ShoppingItemDto = {
  id: string;
  title: string;
  quantity: number;
  completed: boolean;
  position: number;
};

function byPosition(items: ShoppingItemDto[]) {
  return [...items].sort((a, b) => a.position - b.position);
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b bg-muted/50 px-4 py-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
      {children}
    </div>
  );
}

function QuantityControl({
  quantity,
  onChange,
}: {
  quantity: number;
  onChange: (next: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(quantity));

  function commit() {
    const parsed = parseInt(draft, 10);
    setEditing(false);
    if (Number.isFinite(parsed) && parsed >= 1 && parsed !== quantity) {
      onChange(Math.min(999, parsed));
    } else {
      setDraft(String(quantity));
    }
  }

  if (editing) {
    return (
      <input
        type="number"
        min={1}
        max={999}
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => e.target.select()}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
          if (e.key === "Escape") {
            setDraft(String(quantity));
            setEditing(false);
          }
        }}
        className="h-7 w-14 shrink-0 rounded border px-1.5 text-center text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(String(quantity));
        setEditing(true);
      }}
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-sm tabular-nums",
        quantity > 1
          ? "bg-primary/10 font-semibold text-primary"
          : "text-muted-foreground/40 hover:text-muted-foreground"
      )}
    >
      ×{quantity}
    </button>
  );
}

export function ShoppingList({
  initialItems,
  persist = true,
}: {
  initialItems: ShoppingItemDto[];
  persist?: boolean;
}) {
  const [items, setItems] = useState(initialItems);
  const [draftTitle, setDraftTitle] = useState("");
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareExpiresAt, setShareExpiresAt] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  async function openShare() {
    setIsShareOpen(true);
    setShareUrl(null);
    setShareExpiresAt(null);
    setIsSharing(true);
    try {
      const res = await fetch("/api/shopping/share", { method: "POST" });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? "Failed to create share link");
      }
      const { token, expiresAt } = await res.json();
      setShareUrl(`${window.location.origin}/share/${token}`);
      setShareExpiresAt(expiresAt);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create share link");
    } finally {
      setIsSharing(false);
    }
  }

  async function copyShareUrl() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function persistOrder(next: ShoppingItemDto[]) {
    if (!persist) return;
    try {
      const res = await fetch("/api/shopping/reorder", {
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
      const item = prev.find((i) => i.id === id);
      if (!item) return prev;
      const group = byPosition(prev.filter((i) => i.completed === item.completed));
      const idx = group.findIndex((i) => i.id === id);
      const swapIdx = idx + direction;
      if (swapIdx < 0 || swapIdx >= group.length) return prev;

      const other = group[swapIdx];
      const next = prev.map((i) => {
        if (i.id === item.id) return { ...i, position: other.position };
        if (i.id === other.id) return { ...i, position: item.position };
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
      setItems((prev) => {
        const existing = prev.find(
          (i) => !i.completed && i.title.toLowerCase() === title.toLowerCase()
        );
        if (existing) {
          return prev.map((i) =>
            i.id === existing.id ? { ...i, quantity: i.quantity + 1 } : i
          );
        }
        return [
          ...prev,
          { id: crypto.randomUUID(), title, completed: false, position: prev.length, quantity: 1 },
        ];
      });
      return;
    }

    try {
      const res = await fetch("/api/shopping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error();
      const result: ShoppingItemDto = await res.json();
      setItems((prev) => {
        const idx = prev.findIndex((i) => i.id === result.id);
        if (idx === -1) return [...prev, result];
        const next = [...prev];
        next[idx] = result;
        return next;
      });
    } catch {
      toast.error("Failed to add item");
    }
  }

  async function toggleComplete(id: string, completed: boolean) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, completed } : i)));
    if (!persist) return;
    try {
      const res = await fetch(`/api/shopping/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });
      if (!res.ok) throw new Error();
    } catch {
      toast.error("Failed to update item");
    }
  }

  async function setQuantity(id: string, quantity: number) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
    if (!persist) return;
    try {
      const res = await fetch(`/api/shopping/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      if (!res.ok) throw new Error();
    } catch {
      toast.error("Failed to update quantity");
    }
  }

  async function deleteItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (!persist) return;
    try {
      const res = await fetch(`/api/shopping/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      toast.error("Failed to delete item");
    }
  }

  const completed = byPosition(items.filter((i) => i.completed));
  const active = byPosition(items.filter((i) => !i.completed));

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border">
      <div className="flex items-center justify-between gap-2 bg-foreground px-4 py-2.5 text-background">
        <span className="text-sm font-bold tracking-wide uppercase">Shopping List</span>
        <div className="flex items-center gap-2">
          {persist && (
            <button
              type="button"
              onClick={openShare}
              className="flex items-center gap-1 text-xs text-background/70 hover:text-background"
            >
              <Share2 className="size-3.5" />
              Share
            </button>
          )}
          <span className="text-xs text-background/70">{active.length} to buy</span>
        </div>
      </div>

      <div className="flex min-h-16 flex-1 flex-col">
        {items.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">List is empty</p>
        )}
        {completed.length > 0 && <SectionLabel>In cart</SectionLabel>}
        {completed.map((item, index) => (
          <ShoppingRow
            key={item.id}
            item={item}
            index={index}
            isFirst={index === 0}
            isLast={index === completed.length - 1}
            onToggle={() => toggleComplete(item.id, !item.completed)}
            onDelete={() => deleteItem(item.id)}
            onMoveUp={() => reorder(item.id, -1)}
            onMoveDown={() => reorder(item.id, 1)}
            onQuantityChange={(q) => setQuantity(item.id, q)}
          />
        ))}
        {active.map((item, index) => (
          <ShoppingRow
            key={item.id}
            item={item}
            index={index}
            isFirst={index === 0}
            isLast={index === active.length - 1}
            onToggle={() => toggleComplete(item.id, !item.completed)}
            onDelete={() => deleteItem(item.id)}
            onMoveUp={() => reorder(item.id, -1)}
            onMoveDown={() => reorder(item.id, 1)}
            onQuantityChange={(q) => setQuantity(item.id, q)}
          />
        ))}
      </div>

      <form onSubmit={addItem} className="flex items-center gap-2 border-t bg-muted/30 p-2">
        <Input
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          placeholder="Add an item"
          className="h-9"
        />
        <Button type="submit" size="icon-sm">
          <Plus />
          <span className="sr-only">Add item</span>
        </Button>
      </form>

      {persist && (
        <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share your shopping list</DialogTitle>
              <DialogDescription>
                Anyone with this link can view the list and copy it — no sign-in or access to the
                rest of your drive, and items can&apos;t be added or changed here. The link
                expires 72 hours after it&apos;s created.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2">
              <Input value={shareUrl ?? "Generating link..."} readOnly />
              <Button
                variant="outline"
                size="icon"
                onClick={copyShareUrl}
                disabled={!shareUrl || isSharing}
              >
                {copied ? <Check /> : <Copy />}
                <span className="sr-only">Copy link</span>
              </Button>
            </div>
            {shareExpiresAt && (
              <p className="text-xs text-muted-foreground">
                Expires {formatDate(new Date(shareExpiresAt))}
              </p>
            )}
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>Close</DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function ShoppingRow({
  item,
  index,
  isFirst,
  isLast,
  onToggle,
  onDelete,
  onMoveUp,
  onMoveDown,
  onQuantityChange,
}: {
  item: ShoppingItemDto;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onQuantityChange: (quantity: number) => void;
}) {
  return (
    <div className="group flex items-center gap-2 border-b px-2 py-2.5 last:border-b-0">
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
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
        {index + 1}
      </span>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded border-2 border-foreground/50",
          item.completed && "border-foreground bg-foreground text-background"
        )}
      >
        {item.completed && <Check className="size-4" />}
        <span className="sr-only">Toggle in cart</span>
      </button>
      <span
        className={cn(
          "flex-1 text-sm break-words",
          item.completed && "text-muted-foreground line-through"
        )}
      >
        {item.title}
      </span>
      <QuantityControl quantity={item.quantity} onChange={onQuantityChange} />
      <button
        type="button"
        onClick={onDelete}
        className="flex size-8 shrink-0 items-center justify-center text-muted-foreground/60 hover:text-destructive"
      >
        <Trash2 className="size-4" />
        <span className="sr-only">Delete item</span>
      </button>
    </div>
  );
}
