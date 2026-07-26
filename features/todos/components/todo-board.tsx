"use client";

import { useEffect, useState, type ComponentType } from "react";
import {
  ArrowRightLeft,
  Briefcase,
  Check,
  ChevronDown,
  ChevronUp,
  Home as HomeIcon,
  Maximize2,
  Minimize2,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InlineEdit } from "@/components/ui/inline-edit";
import { useFullScreen } from "@/components/layout/fullscreen-provider";
import { cn } from "@/lib/utils";
import {
  TODO_CATEGORIES,
  TODO_CATEGORY_META,
  type TodoCategory,
} from "@/features/todos/lib/categories";
import { ShoppingList, type ShoppingItemDto } from "@/features/shopping/components/shopping-list";

export type TodoItemDto = {
  id: string;
  title: string;
  category: TodoCategory;
  completed: boolean;
  archived: boolean;
  position: number;
  combinedPosition: number;
  createdAt: string;
};

const CATEGORY_ICON: Record<TodoCategory, ComponentType<{ className?: string }>> = {
  HOME: HomeIcon,
  WORK: Briefcase,
};

const shortDateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

function daysSince(iso: string): number {
  const created = new Date(iso);
  const createdMidnight = Date.UTC(created.getFullYear(), created.getMonth(), created.getDate());
  const now = new Date();
  const nowMidnight = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((nowMidnight - createdMidnight) / 86_400_000);
}

function ageLabel(item: TodoItemDto): string {
  const added = shortDateFormatter.format(new Date(item.createdAt));
  const days = daysSince(item.createdAt);
  if (item.completed) return `Added ${added}`;
  if (days <= 0) return "Added today";
  return `Added ${added} · ${days}d outstanding`;
}

function byCategory(todos: TodoItemDto[], category: TodoCategory) {
  return todos
    .filter((t) => t.category === category && !t.archived)
    .sort((a, b) => a.position - b.position);
}

function getGroup(todos: TodoItemDto[], category: TodoCategory, completed: boolean) {
  return todos
    .filter((t) => t.category === category && t.completed === completed && !t.archived)
    .sort((a, b) => a.position - b.position);
}

function getCombinedGroup(todos: TodoItemDto[], completed: boolean) {
  return todos
    .filter((t) => t.completed === completed && !t.archived)
    .sort((a, b) => a.combinedPosition - b.combinedPosition);
}

function otherCategory(category: TodoCategory): TodoCategory {
  return category === "HOME" ? "WORK" : "HOME";
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b bg-muted/50 px-4 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
      {children}
    </div>
  );
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
  onRename,
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
  onRename: (title: string) => void;
}) {
  const Icon = CATEGORY_ICON[item.category];
  const color = TODO_CATEGORY_META[item.category].color;

  return (
    <div className="group flex items-center gap-2 border-b px-2 py-3 last:border-b-0">
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
      <button
        type="button"
        onClick={onToggle}
        style={
          item.completed
            ? { borderColor: color, backgroundColor: color }
            : { borderColor: `${color}80` }
        }
        className="flex size-8 shrink-0 items-center justify-center rounded border-2 text-white"
      >
        {item.completed && <Check className="size-5" />}
        <span className="sr-only">Toggle complete</span>
      </button>
      <div className="flex min-w-0 flex-1 flex-col">
        <InlineEdit
          value={item.title}
          onSave={onRename}
          textClassName={cn(
            "text-base break-words",
            item.completed && "text-muted-foreground line-through"
          )}
          inputClassName="h-8 min-w-0 flex-1 rounded border px-2 text-base focus:outline-none focus:ring-1 focus:ring-ring"
          iconClassName="shrink-0 text-muted-foreground/60 hover:text-foreground"
        />
        <span className="text-xs text-muted-foreground/70">{ageLabel(item)}</span>
      </div>
      {showCategoryBadge && (
        <span
          style={{ backgroundColor: `${color}26`, borderColor: color, color }}
          className="flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-sm"
        >
          <Icon className="size-3.5" />
          {TODO_CATEGORY_META[item.category].label}
        </span>
      )}
      <button
        type="button"
        onClick={onSwitchCategory}
        className="flex size-8 shrink-0 items-center justify-center text-muted-foreground/60 hover:text-foreground"
      >
        <ArrowRightLeft className="size-4" />
        <span className="sr-only">
          Move to {TODO_CATEGORY_META[otherCategory(item.category)].label}
        </span>
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

function CompletedRow({
  item,
  onRestore,
  onDelete,
  onRename,
}: {
  item: TodoItemDto;
  onRestore: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
}) {
  const Icon = CATEGORY_ICON[item.category];
  const color = TODO_CATEGORY_META[item.category].color;

  return (
    <div className="flex items-center gap-2 border-b px-2 py-3 last:border-b-0">
      <button
        type="button"
        onClick={onRestore}
        style={{ borderColor: color, backgroundColor: color }}
        className="flex size-8 shrink-0 items-center justify-center rounded border-2 text-white"
      >
        <Check className="size-5" />
        <span className="sr-only">Restore to outstanding</span>
      </button>
      <div className="flex min-w-0 flex-1 flex-col">
        <InlineEdit
          value={item.title}
          onSave={onRename}
          textClassName="text-base text-muted-foreground break-words line-through"
          inputClassName="h-8 min-w-0 flex-1 rounded border px-2 text-base focus:outline-none focus:ring-1 focus:ring-ring"
          iconClassName="shrink-0 text-muted-foreground/60 hover:text-foreground"
        />
        <span className="text-xs text-muted-foreground/70">{ageLabel(item)}</span>
      </div>
      <span
        style={{ backgroundColor: `${color}26`, borderColor: color, color }}
        className="flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-sm"
      >
        <Icon className="size-3.5" />
        {TODO_CATEGORY_META[item.category].label}
      </span>
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
  initialShoppingItems,
  persist = true,
}: {
  initialTodos: TodoItemDto[];
  initialShoppingItems: ShoppingItemDto[];
  /** When false, all edits stay in local state only — no network calls. Used for the unauthenticated preview. */
  persist?: boolean;
}) {
  const [todos, setTodos] = useState(initialTodos);
  const [view, setView] = useState<"split" | "combined" | "shopping" | "completed">("split");
  const [draftTitle, setDraftTitle] = useState<Record<TodoCategory, string>>({
    HOME: "",
    WORK: "",
  });
  const [combinedCategory, setCombinedCategory] = useState<TodoCategory>("HOME");
  const { isFullScreen, setIsFullScreen } = useFullScreen();

  useEffect(() => {
    if (!isFullScreen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsFullScreen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullScreen, setIsFullScreen]);

  // Always leave full-screen mode when this page unmounts, so the sidebar
  // doesn't stay hidden after navigating away.
  useEffect(() => () => setIsFullScreen(false), [setIsFullScreen]);

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

  async function persistCombinedOrder(next: TodoItemDto[]) {
    if (!persist) return;
    try {
      const res = await fetch("/api/todos/reorder-combined", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderedIds: [...next].sort((a, b) => a.combinedPosition - b.combinedPosition).map((t) => t.id),
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
      const group = getGroup(prev, item.category, item.completed);
      const idx = group.findIndex((t) => t.id === id);
      const swapIdx = idx + direction;
      if (swapIdx < 0 || swapIdx >= group.length) return prev;

      const other = group[swapIdx];
      const next = prev.map((t) => {
        if (t.id === item.id) return { ...t, position: other.position };
        if (t.id === other.id) return { ...t, position: item.position };
        return t;
      });
      persistOrder(next);
      return next;
    });
  }

  function reorderCombined(id: string, direction: -1 | 1) {
    setTodos((prev) => {
      const item = prev.find((t) => t.id === id);
      if (!item) return prev;
      const group = getCombinedGroup(prev, item.completed);
      const idx = group.findIndex((t) => t.id === id);
      const swapIdx = idx + direction;
      if (swapIdx < 0 || swapIdx >= group.length) return prev;

      const other = group[swapIdx];
      const next = prev.map((t) => {
        if (t.id === item.id) return { ...t, combinedPosition: other.combinedPosition };
        if (t.id === other.id) return { ...t, combinedPosition: item.combinedPosition };
        return t;
      });
      persistCombinedOrder(next);
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
          archived: false,
          position: list.length,
          combinedPosition: prev.length,
          createdAt: new Date().toISOString(),
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

  async function renameTodo(id: string, title: string) {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, title } : t)));
    if (!persist) return;
    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error();
    } catch {
      toast.error("Failed to rename task");
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

  async function clearCompleted(ids: string[]) {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    setTodos((prev) => prev.map((t) => (idSet.has(t.id) ? { ...t, archived: true } : t)));
    if (!persist) return;
    try {
      const results = await Promise.all(
        ids.map((id) =>
          fetch(`/api/todos/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ archived: true }),
          })
        )
      );
      if (results.some((res) => !res.ok)) throw new Error();
    } catch {
      toast.error("Failed to clear completed tasks");
    }
  }

  async function restoreTodo(id: string) {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: false, archived: false } : t))
    );
    if (!persist) return;
    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: false, archived: false }),
      });
      if (!res.ok) throw new Error();
    } catch {
      toast.error("Failed to restore task");
    }
  }

  const combinedCompleted = getCombinedGroup(todos, true);
  const combinedActive = getCombinedGroup(todos, false);
  const archivedTodos = [...todos]
    .filter((t) => t.archived)
    .sort((a, b) => a.combinedPosition - b.combinedPosition);

  function renderRow(item: TodoItemDto, showCategoryBadge: boolean, mode: "category" | "combined") {
    const group =
      mode === "combined"
        ? getCombinedGroup(todos, item.completed)
        : getGroup(todos, item.category, item.completed);
    const idx = group.findIndex((t) => t.id === item.id);
    return (
      <TodoRow
        key={item.id}
        item={item}
        index={idx}
        isFirst={idx === 0}
        isLast={idx === group.length - 1}
        showCategoryBadge={showCategoryBadge}
        onToggle={() => toggleComplete(item.id, !item.completed)}
        onDelete={() => deleteTodo(item.id)}
        onMoveUp={() =>
          mode === "combined" ? reorderCombined(item.id, -1) : reorderWithinCategory(item.id, -1)
        }
        onMoveDown={() =>
          mode === "combined" ? reorderCombined(item.id, 1) : reorderWithinCategory(item.id, 1)
        }
        onSwitchCategory={() => switchCategory(item.id)}
        onRename={(title) => renameTodo(item.id, title)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-black tracking-tight uppercase sm:text-3xl">To-Do List</h1>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setIsFullScreen(!isFullScreen)}
        >
          {isFullScreen ? <Minimize2 /> : <Maximize2 />}
          {isFullScreen ? "Exit full screen" : "Full screen"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-1">
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
        <Button
          type="button"
          size="sm"
          variant={view === "shopping" ? "secondary" : "ghost"}
          onClick={() => setView("shopping")}
        >
          Shopping List
        </Button>
        <Button
          type="button"
          size="sm"
          variant={view === "completed" ? "secondary" : "ghost"}
          onClick={() => setView("completed")}
        >
          Completed
        </Button>
      </div>

      <div className={cn("grid grid-cols-1 gap-4 landscape:grid-cols-2 lg:grid-cols-2", view !== "split" && "hidden")}>
          {TODO_CATEGORIES.map((category) => {
            const completed = getGroup(todos, category, true);
            const active = getGroup(todos, category, false);
            const Icon = CATEGORY_ICON[category];

            return (
              <div key={category} className="flex flex-col overflow-hidden rounded-lg border">
                <div
                  style={{ backgroundColor: TODO_CATEGORY_META[category].color }}
                  className="flex items-center justify-between gap-2 px-4 py-2.5 text-white"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="size-5" />
                    <span className="text-base font-bold tracking-wide uppercase">
                      {TODO_CATEGORY_META[category].label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {completed.length > 0 && (
                      <button
                        type="button"
                        onClick={() => clearCompleted(completed.map((t) => t.id))}
                        className="text-sm text-white/70 underline-offset-2 hover:text-white hover:underline"
                      >
                        Clear completed
                      </button>
                    )}
                    <span className="text-sm text-white/70">{active.length} left</span>
                  </div>
                </div>

                <div className="flex min-h-16 flex-1 flex-col">
                  {completed.length === 0 && active.length === 0 && (
                    <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                      No tasks yet
                    </p>
                  )}
                  {active.map((item) => renderRow(item, false, "category"))}
                  {completed.length > 0 && <SectionLabel>Completed</SectionLabel>}
                  {completed.map((item) => renderRow(item, false, "category"))}
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

      <div
        className={cn(
          "flex flex-col overflow-hidden rounded-lg border",
          view !== "combined" && "hidden"
        )}
      >
          <div className="flex items-center justify-between gap-2 bg-foreground px-4 py-2.5 text-background">
            <span className="text-base font-bold tracking-wide uppercase">All tasks</span>
            <div className="flex items-center gap-2">
              {combinedCompleted.length > 0 && (
                <button
                  type="button"
                  onClick={() => clearCompleted(combinedCompleted.map((t) => t.id))}
                  className="text-sm text-background/70 underline-offset-2 hover:text-background hover:underline"
                >
                  Clear completed
                </button>
              )}
              <span className="text-sm text-background/70">{combinedActive.length} left</span>
            </div>
          </div>

          <div className="flex min-h-16 flex-1 flex-col">
            {combinedActive.length === 0 && combinedCompleted.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">No tasks yet</p>
            )}
            {combinedActive.map((item) => renderRow(item, true, "combined"))}
            {combinedCompleted.length > 0 && <SectionLabel>Completed</SectionLabel>}
            {combinedCompleted.map((item) => renderRow(item, true, "combined"))}
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
                    style={isSelected ? { backgroundColor: `${color}26`, color } : undefined}
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

      <div className={cn(view !== "shopping" && "hidden")}>
        <ShoppingList initialItems={initialShoppingItems} persist={persist} />
      </div>

      <div
        className={cn(
          "flex flex-col overflow-hidden rounded-lg border",
          view !== "completed" && "hidden"
        )}
      >
        <div className="flex items-center justify-between gap-2 bg-foreground px-4 py-2.5 text-background">
          <span className="text-base font-bold tracking-wide uppercase">Completed</span>
          <span className="text-sm text-background/70">{archivedTodos.length} cleared</span>
        </div>
        <div className="flex min-h-16 flex-1 flex-col">
          {archivedTodos.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Nothing cleared yet — use &quot;Clear completed&quot; on a list to send finished
              tasks here.
            </p>
          )}
          {archivedTodos.map((item) => (
            <CompletedRow
              key={item.id}
              item={item}
              onRestore={() => restoreTodo(item.id)}
              onDelete={() => deleteTodo(item.id)}
              onRename={(title) => renameTodo(item.id, title)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
