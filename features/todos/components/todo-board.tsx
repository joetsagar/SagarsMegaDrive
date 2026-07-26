"use client";

import { useState, type DragEvent, type ComponentType } from "react";
import { Briefcase, Check, GripVertical, Home as HomeIcon, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  TODO_CATEGORIES,
  TODO_CATEGORY_META,
  type TodoCategory,
} from "@/features/todos/lib/categories";

export type TodoItemDto = {
  id: string;
  title: string;
  category: TodoCategory;
  completed: boolean;
  position: number;
};

const CATEGORY_ICON: Record<TodoCategory, ComponentType<{ className?: string }>> = {
  HOME: HomeIcon,
  WORK: Briefcase,
};

const todayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

function byCategory(todos: TodoItemDto[], category: TodoCategory) {
  return todos.filter((t) => t.category === category).sort((a, b) => a.position - b.position);
}

export function TodoBoard({ initialTodos }: { initialTodos: TodoItemDto[] }) {
  const [todos, setTodos] = useState(initialTodos);
  const [draftTitle, setDraftTitle] = useState<Record<TodoCategory, string>>({
    HOME: "",
    WORK: "",
  });
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  async function persistOrder(next: TodoItemDto[]) {
    try {
      const res = await fetch("/api/todos/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          HOME: byCategory(next, "HOME").map((t) => t.id),
          WORK: byCategory(next, "WORK").map((t) => t.id),
        }),
      });
      if (!res.ok) throw new Error();
    } catch {
      toast.error("Failed to save new order");
    }
  }

  function moveItem(id: string, targetCategory: TodoCategory, targetId: string | null) {
    setTodos((prev) => {
      const item = prev.find((t) => t.id === id);
      if (!item) return prev;
      if (item.category === targetCategory && item.id === targetId) return prev;

      const withoutItem = prev.filter((t) => t.id !== id);
      const targetList = byCategory(withoutItem, targetCategory);
      const otherList = withoutItem.filter((t) => t.category !== targetCategory);

      let insertAt = targetList.length;
      if (targetId) {
        const idx = targetList.findIndex((t) => t.id === targetId);
        if (idx !== -1) insertAt = idx;
      }
      targetList.splice(insertAt, 0, { ...item, category: targetCategory });

      const reindexed = targetList.map((t, i) => ({ ...t, position: i }));
      const next = [...otherList, ...reindexed];
      persistOrder(next);
      return next;
    });
  }

  function handleDrop(e: DragEvent, targetCategory: TodoCategory, targetId: string | null) {
    e.preventDefault();
    e.stopPropagation();
    setDragOverId(null);
    const id = e.dataTransfer.getData("text/plain");
    if (id) moveItem(id, targetCategory, targetId);
  }

  async function addTodo(category: TodoCategory) {
    const title = draftTitle[category].trim();
    if (!title) return;
    setDraftTitle((prev) => ({ ...prev, [category]: "" }));
    try {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category }),
      });
      if (!res.ok) throw new Error();
      const created: TodoItemDto = await res.json();
      setTodos((prev) => [...prev, created]);
    } catch {
      toast.error("Failed to add task");
    }
  }

  async function toggleComplete(id: string, completed: boolean) {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed } : t)));
    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });
      if (!res.ok) throw new Error();
    } catch {
      toast.error("Failed to update task");
    }
  }

  async function deleteTodo(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    try {
      const res = await fetch(`/api/todos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      toast.error("Failed to delete task");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-black tracking-tight uppercase sm:text-3xl">To-Do List</h1>
        <div className="shrink-0 rounded-lg border px-3 py-1.5 text-right text-xs text-muted-foreground">
          {todayFormatter.format(new Date())}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 landscape:grid-cols-2 lg:grid-cols-2">
        {TODO_CATEGORIES.map((category) => {
          const items = byCategory(todos, category);
          const Icon = CATEGORY_ICON[category];
          const remaining = items.filter((t) => !t.completed).length;

          return (
            <div key={category} className="flex flex-col overflow-hidden rounded-lg border">
              <div className="flex items-center justify-between gap-2 bg-foreground px-4 py-2.5 text-background">
                <div className="flex items-center gap-2">
                  <Icon className="size-4" />
                  <span className="text-sm font-bold tracking-wide uppercase">
                    {TODO_CATEGORY_META[category].label}
                  </span>
                </div>
                <span className="text-xs text-background/70">{remaining} left</span>
              </div>

              <div
                className="flex min-h-16 flex-1 flex-col"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, category, null)}
              >
                {items.length === 0 && (
                  <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                    No tasks yet
                  </p>
                )}
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", item.id);
                      setDraggedId(item.id);
                    }}
                    onDragEnd={() => {
                      setDraggedId(null);
                      setDragOverId(null);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragOverId(item.id);
                    }}
                    onDrop={(e) => handleDrop(e, category, item.id)}
                    className={cn(
                      "group flex items-center gap-2 border-b px-2 py-3 last:border-b-0",
                      dragOverId === item.id && draggedId !== item.id && "bg-primary/10",
                      draggedId === item.id && "opacity-40"
                    )}
                  >
                    <GripVertical className="size-5 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing" />
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                      {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleComplete(item.id, !item.completed)}
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded border-2 border-foreground/50",
                        item.completed && "border-foreground bg-foreground text-background"
                      )}
                    >
                      {item.completed && <Check className="size-4" />}
                      <span className="sr-only">Toggle complete</span>
                    </button>
                    <span
                      className={cn(
                        "flex-1 text-sm break-words",
                        item.completed && "text-muted-foreground line-through"
                      )}
                    >
                      {item.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteTodo(item.id)}
                      className="flex size-8 shrink-0 items-center justify-center text-muted-foreground/60 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                      <span className="sr-only">Delete task</span>
                    </button>
                  </div>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addTodo(category);
                }}
                className="flex items-center gap-2 border-t bg-muted/30 p-2"
              >
                <Input
                  value={draftTitle[category]}
                  onChange={(e) =>
                    setDraftTitle((prev) => ({ ...prev, [category]: e.target.value }))
                  }
                  placeholder={`Add a ${TODO_CATEGORY_META[category].label.toLowerCase()} task`}
                  className="h-9"
                />
                <Button type="submit" size="icon-sm">
                  <Plus />
                  <span className="sr-only">Add task</span>
                </Button>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
