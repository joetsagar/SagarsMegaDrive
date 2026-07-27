import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { TodoBoard } from "@/features/todos/components/todo-board";

export default async function TodosPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  const [todos, shoppingItems, templateItems] = await Promise.all([
    db.todoItem.findMany({
      where: { userId: session!.user.id },
      orderBy: [{ category: "asc" }, { position: "asc" }],
    }),
    db.shoppingItem.findMany({
      where: { userId: session!.user.id },
      orderBy: { position: "asc" },
    }),
    db.todoTemplateItem.findMany({
      where: { userId: session!.user.id },
      orderBy: { position: "asc" },
    }),
  ]);

  return (
    <TodoBoard
      initialTodos={todos.map((t) => ({
        id: t.id,
        title: t.title,
        category: t.category,
        completed: t.completed,
        archived: t.archived,
        position: t.position,
        combinedPosition: t.combinedPosition,
        createdAt: t.createdAt.toISOString(),
      }))}
      initialShoppingItems={shoppingItems.map((s) => ({
        id: s.id,
        title: s.title,
        quantity: s.quantity,
        completed: s.completed,
        position: s.position,
      }))}
      initialTemplateItems={templateItems.map((t) => ({
        id: t.id,
        title: t.title,
        position: t.position,
      }))}
    />
  );
}
