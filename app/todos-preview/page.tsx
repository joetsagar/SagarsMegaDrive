import { TodoBoard, type TodoItemDto } from "@/features/todos/components/todo-board";
import type { ShoppingItemDto } from "@/features/shopping/components/shopping-list";

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

const SAMPLE_TODOS: TodoItemDto[] = [
  { id: "h1", title: "Water the plants", category: "HOME", completed: false, archived: false, position: 0, combinedPosition: 1, createdAt: daysAgo(1) },
  { id: "h2", title: "Do the laundry", category: "HOME", completed: false, archived: false, position: 1, combinedPosition: 3, createdAt: daysAgo(4) },
  { id: "h3", title: "Plan dinner for the week", category: "HOME", completed: true, archived: false, position: 2, combinedPosition: 5, createdAt: daysAgo(2) },
  { id: "h4", title: "Tidy the living room", category: "HOME", completed: false, archived: false, position: 3, combinedPosition: 6, createdAt: daysAgo(0) },
  { id: "w1", title: "Reply to client emails", category: "WORK", completed: false, archived: false, position: 0, combinedPosition: 0, createdAt: daysAgo(0) },
  { id: "w2", title: "Prep slides for Monday's meeting", category: "WORK", completed: false, archived: false, position: 1, combinedPosition: 2, createdAt: daysAgo(6) },
  { id: "w3", title: "Review pull requests", category: "WORK", completed: true, archived: false, position: 2, combinedPosition: 4, createdAt: daysAgo(1) },
  { id: "w4", title: "Renew domain registration", category: "WORK", completed: true, archived: true, position: 3, combinedPosition: 7, createdAt: daysAgo(9) },
];

const SAMPLE_SHOPPING: ShoppingItemDto[] = [
  { id: "s1", title: "Milk", completed: false, position: 0 },
  { id: "s2", title: "Eggs", completed: false, position: 1 },
  { id: "s3", title: "Pasta", completed: true, position: 2 },
];

export default function TodosPreviewPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-1 flex-col gap-4 p-4">
      <p className="rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
        Preview only — no login required, nothing here is saved. This is the same To-Do List
        component that lives in the dashboard.
      </p>
      <TodoBoard initialTodos={SAMPLE_TODOS} initialShoppingItems={SAMPLE_SHOPPING} persist={false} />
    </div>
  );
}
