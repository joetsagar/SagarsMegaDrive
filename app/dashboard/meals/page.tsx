import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { MealsBoard } from "@/features/meals/components/meals-board";

export default async function MealsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  const meals = await db.meal.findMany({
    where: { userId: session!.user.id },
    include: { ingredients: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <MealsBoard
      initialMeals={meals.map((m) => ({
        id: m.id,
        title: m.title,
        ingredients: m.ingredients.map((i) => ({ id: i.id, title: i.title })),
      }))}
    />
  );
}
