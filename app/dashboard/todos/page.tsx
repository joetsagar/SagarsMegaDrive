import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { TodoBoard } from "@/features/todos/components/todo-board";

export default async function TodosPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  const todos = await db.todoItem.findMany({
    where: { userId: session!.user.id },
    orderBy: [{ category: "asc" }, { position: "asc" }],
  });

  return (
    <TodoBoard
      initialTodos={todos.map((t) => ({
        id: t.id,
        title: t.title,
        category: t.category,
        completed: t.completed,
        position: t.position,
      }))}
    />
  );
}
