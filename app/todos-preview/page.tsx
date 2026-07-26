import { TodoBoard, type TodoItemDto } from "@/features/todos/components/todo-board";

const SAMPLE_TODOS: TodoItemDto[] = [
  { id: "h1", title: "Water the plants", category: "HOME", completed: false, position: 0 },
  { id: "h2", title: "Do the laundry", category: "HOME", completed: false, position: 1 },
  { id: "h3", title: "Plan dinner for the week", category: "HOME", completed: true, position: 2 },
  { id: "h4", title: "Tidy the living room", category: "HOME", completed: false, position: 3 },
  { id: "w1", title: "Reply to client emails", category: "WORK", completed: false, position: 0 },
  { id: "w2", title: "Prep slides for Monday's meeting", category: "WORK", completed: false, position: 1 },
  { id: "w3", title: "Review pull requests", category: "WORK", completed: true, position: 2 },
];

export default function TodosPreviewPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-1 flex-col gap-4 p-4">
      <p className="rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
        Preview only — no login required, nothing here is saved. This is the same To-Do List
        component that lives in the dashboard.
      </p>
      <TodoBoard initialTodos={SAMPLE_TODOS} persist={false} />
    </div>
  );
}
