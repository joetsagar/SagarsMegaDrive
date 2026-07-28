"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CopyShoppingListButton } from "@/features/shopping/components/copy-shopping-list-button";

type Item = {
  id: string;
  title: string;
  quantity: number;
  completed: boolean;
};

export function SharedShoppingListView({ token, initialItems }: { token: string; initialItems: Item[] }) {
  const [items, setItems] = useState(initialItems);

  async function toggle(id: string, completed: boolean) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, completed } : i)));
    try {
      const res = await fetch(`/api/share/${token}/shopping/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });
      if (!res.ok) throw new Error();
    } catch {
      toast.error("Failed to update item");
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, completed: !completed } : i)));
    }
  }

  const active = items.filter((i) => !i.completed);
  const inCart = items.filter((i) => i.completed);

  return (
    <div className="flex flex-col gap-4">
      {items.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">List is empty</p>
      ) : (
        <div className="flex flex-col gap-1">
          {[...active, ...inCart].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => toggle(item.id, !item.completed)}
              className="flex items-center justify-between gap-2 border-b py-2 text-left last:border-b-0"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded border-2 border-foreground/50",
                    item.completed && "border-foreground bg-foreground text-background"
                  )}
                >
                  {item.completed && <Check className="size-4" />}
                </span>
                <span
                  className={cn(
                    "truncate text-sm",
                    item.completed && "text-muted-foreground line-through"
                  )}
                >
                  {item.title}
                </span>
              </span>
              {item.quantity > 1 && (
                <span
                  className={cn(
                    "shrink-0 text-sm font-semibold",
                    item.completed ? "text-muted-foreground" : "text-primary"
                  )}
                >
                  ×{item.quantity}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
      <CopyShoppingListButton items={active.map((i) => ({ title: i.title, quantity: i.quantity }))} />
    </div>
  );
}
