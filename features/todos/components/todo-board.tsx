"use client";

import { useState, type ComponentType } from "react";
import {
  ArrowRightLeft,
  Briefcase,
  Check,
  ChevronDown,
  ChevronUp,
  Home as HomeIcon,
  Plus,
  Trash2,
} from "lucide-react";
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

function otherCategory(category: TodoCategory): TodoCategory {
  return category === "HOME" ? "WORK" : "HOME";
}

function TodoRow({
  item,
  index,
  isFirst,
  isLast,
  showCategoryBadge,
  onToggle,
  onDelete,
  onMoveUp,
  onMoveDown,
  onSwitchCategory,
}: {
  item: TodoItemDto;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  showCategoryBadge: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onSwitchCategory: () => void;
}) {
  const Icon = CATEGORY_ICON[item.category];
  const color = TODO_CATEGORY_META[item.category].color;

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
        style={item.completed ? { borderColor: color, backgroundColor: color } : { borderColor: `${color}80` }}
        className="flex size-7 shrink-0 items-center justify-center rounded border-2 text-white"
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
      {showCategoryBadge && (
        <span
          style={{ backgroundColor: `${color}26`, borderColor: color, color }}
          className="flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
        >
          <Icon className="size-3" />
          {TODO_CATEGORY_META[item.category].label}
        </span>
      )}
      <button
        type="button"
        onClick={onSwitchCategory}
        className="flex size-8 shrink-0 items-center justify-center text-muted-foreground/60 hover:text-foreground"
      >
        <ArrowRightLeft className="size-4" />
        <span className="sr-only">Move to {TODO_CATEGORY_META[otherCategory(item.category)].label}</span>
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="flex size-8 shrink-0 items-center justify-center text-muted-foreground/60 hover:text-destructive"
      >
        <Trash2 className="size-4" />
        <span className="sr-only">Delete task</span>
      </button>
    </div>
  );
}

export function TodoBoard({
  initialTodos,
  persist = true,
}: {
  initialTodos: TodoItemDto[];
  /** When false, all edits stay in local state only — no network calls. Used for the unauthenticated preview. */
  persist?: boolean;
}) {
  const [todos, setTodos] = useState(initialTodos);
  const [view, setView] = useState<"split" | "combined">("split");
  const [draftTitle, setDraftTitle] = useState<Record<TodoCategory, string>>({
    HOME: "",
    WORK: "",
  });
  const [combinedCategory, setCombinedCategory] = useState<TodoCategory>("HOME");

  async function persistOrder(next: TodoItemDto[]) {
    if (!persist) return;
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

  function reorderWithinCategory(id: string, direction: -1 | 1) {
    setTodos((prev) => {
      const item = prev.find((t) => t.id === id);
      if (!item) return prev;
      const list = byCategory(prev, item.category);
      const idx = list.findIndex((t) => t.id === id);
      const swapIdx = idx + direction;
      if (swapIdx < 0 || swapIdx >= list.length) return prev;

      [list[idx], list[swapIdx]] = [list[swapIdx], list[idx]];
      const reindexed = list.map((t, i) => ({ ...t, position: i }));
      const others = prev.filter((t) => t.category !== item.category);
      const next = [...others, ...reindexed];
      persistOrder(next);
      return next;
    });
  }

  function switchCategory(id: string) {
    setTodos((prev) => {
      const item = prev.find((t) => t.id === id);
      if (!item) return prev;
      const target = otherCategory(item.category);

      const sourceList = byCategory(prev, item.category)
        .filter((t) => t.id !== id)
        .map((t, i) => ({ ...t, position: i }));
      const targetList = byCategory(prev, target);
      const moved = { ...item, category: target, position: targetList.length };

      const next = [...sourceList, ...targetList, moved];
      persistOrder(next);
      return next;
    });
  }

  async function addTodo(category: TodoCategory) {
    const title = draftTitle[category].trim();
    if (!title) return;
    setDraftTitle((prev) => ({ ...prev, [category]: "" }));

    if (!persist) {
      const list = byCategory(todos, category);
      setTodos((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          title,
          category,
          completed: false,
          position: list.length,
        },
      ]);
      return;
    }

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
    if (!persist) return;
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
    if (!persist) return;
    try {
      const res = await fetch(`/api/todos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      toast.error("Failed to delete task");
    }
  }

  const combinedItems = [...byCategory(todos, "HOME"), ...byCategory(todos, "WORK")];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-black tracking-tight uppercase sm:text-3xl">To-Do List</h1>
        <div className="shrink-0 rounded-lg border px-3 py-1.5 text-right text-xs text-muted-foreground">
          {todayFormatter.format(new Date())}
        </div>
      </div>

      <div className="flex gap-1">
        <Button
          type="button"
          size="sm"
          variant={view === "split" ? "secondary" : "ghost"}
          onClick={() => setView("split")}
        >
          Home &amp; Work
        </Button>
        <Button
          type="button"
          size="sm"
          variant={view === "combined" ? "secondary" : "ghost"}
          onClick={() => setView("combined")}
        >
          Combined
        </Button>
      </div>

      {view === "split" ? (
        <div className="grid grid-cols-1 gap-4 landscape:grid-cols-2 lg:grid-cols-2">
          {TODO_CATEGORIES.map((category) => {
            const items = byCategory(todos, category);
            const Icon = CATEGORY_ICON[category];
            const remaining = items.filter((t) => !t.completed).length;

            return (
              <div key={category} className="flex flex-col overflow-hidden rounded-lg border">
                <div
                  style={{ backgroundColor: TODO_CATEGORY_META[category].color }}
                  className="flex items-center justify-between gap-2 px-4 py-2.5 text-white"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="size-4" />
                    <span className="text-sm font-bold tracking-wide uppercase">
                      {TODO_CATEGORY_META[category].label}
                    </span>
                  </div>
                  <span className="text-xs text-white/70">{remaining} left</span>
                </div>

                <div className="flex min-h-16 flex-1 flex-col">
                  {items.length === 0 && (
                    <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                      No tasks yet
                    </p>
                  )}
                  {items.map((item, index) => (
                    <TodoRow
                      key={item.id}
                      item={item}
                      index={index}
                      isFirst={index === 0}
                      isLast={index === items.length - 1}
                      showCategoryBadge={false}
                      onToggle={() => toggleComplete(item.id, !item.completed)}
                      onDelete={() => deleteTodo(item.id)}
                      onMoveUp={() => reorderWithinCategory(item.id, -1)}
                      onMoveDown={() => reorderWithinCategory(item.id, 1)}
                      onSwitchCategory={() => switchCategory(item.id)}
                    />
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
      ) : (
        <div className="flex flex-col overflow-hidden rounded-lg border">
          <div className="flex items-center justify-between gap-2 bg-foreground px-4 py-2.5 text-background">
            <span className="text-sm font-bold tracking-wide uppercase">All tasks</span>
            <span className="text-xs text-background/70">
              {combinedItems.filter((t) => !t.completed).length} left
            </span>
          </div>

          <div className="flex min-h-16 flex-1 flex-col">
            {combinedItems.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">No tasks yet</p>
            )}
            {TODO_CATEGORIES.map((category) => {
              const items = byCategory(todos, category);
              return items.map((item, index) => (
                <TodoRow
                  key={item.id}
                  item={item}
                  index={index}
                  isFirst={index === 0}
                  isLast={index === items.length - 1}
                  showCategoryBadge
                  onToggle={() => toggleComplete(item.id, !item.completed)}
                  onDelete={() => deleteTodo(item.id)}
                  onMoveUp={() => reorderWithinCategory(item.id, -1)}
                  onMoveDown={() => reorderWithinCategory(item.id, 1)}
                  onSwitchCategory={() => switchCategory(item.id)}
                />
              ));
            })}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              addTodo(combinedCategory);
            }}
            className="flex items-center gap-2 border-t bg-muted/30 p-2"
          >
            <div className="flex shrink-0 gap-1">
              {TODO_CATEGORIES.map((category) => {
                const isSelected = combinedCategory === category;
                const color = TODO_CATEGORY_META[category].color;
                return (
                  <Button
                    key={category}
                    type="button"
                    size="sm"
                    variant="ghost"
                    style={
                      isSelected
                        ? { backgroundColor: `${color}26`, color }
                        : undefined
                    }
                    onClick={() => setCombinedCategory(category)}
                  >
                    {TODO_CATEGORY_META[category].label}
                  </Button>
                );
              })}
            </div>
            <Input
              value={draftTitle[combinedCategory]}
              onChange={(e) =>
                setDraftTitle((prev) => ({ ...prev, [combinedCategory]: e.target.value }))
              }
              placeholder="Add a task"
              className="h-9"
            />
            <Button type="submit" size="icon-sm">
              <Plus />
              <span className="sr-only">Add task</span>
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
