"use client";

import { useState } from "react";
import { ChefHat, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type MealIngredientDto = {
  id: string;
  title: string;
};

export type MealDto = {
  id: string;
  title: string;
  ingredients: MealIngredientDto[];
};

function MealCard({
  meal,
  onDeleteMeal,
  onAddIngredient,
  onDeleteIngredient,
  onAddToShoppingList,
}: {
  meal: MealDto;
  onDeleteMeal: () => void;
  onAddIngredient: (title: string) => void;
  onDeleteIngredient: (ingredientId: string) => void;
  onAddToShoppingList: () => void;
}) {
  const [draft, setDraft] = useState("");

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border">
      <div className="flex items-center justify-between gap-2 bg-foreground px-4 py-2.5 text-background">
        <div className="flex items-center gap-2">
          <ChefHat className="size-4" />
          <span className="text-sm font-bold tracking-wide uppercase">{meal.title}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-background hover:bg-background/10 hover:text-background"
            onClick={onAddToShoppingList}
          >
            <ShoppingCart />
            Add to shopping list
          </Button>
          <button
            type="button"
            onClick={onDeleteMeal}
            className="flex size-8 shrink-0 items-center justify-center text-background/70 hover:text-background"
          >
            <Trash2 className="size-4" />
            <span className="sr-only">Delete meal</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col">
        {meal.ingredients.length === 0 && (
          <p className="px-4 py-4 text-center text-sm text-muted-foreground">
            No ingredients yet
          </p>
        )}
        {meal.ingredients.map((ingredient) => (
          <div
            key={ingredient.id}
            className="group flex items-center gap-2 border-b px-4 py-2 last:border-b-0"
          >
            <span className="flex-1 text-sm">{ingredient.title}</span>
            <button
              type="button"
              onClick={() => onDeleteIngredient(ingredient.id)}
              className="flex size-8 shrink-0 items-center justify-center text-muted-foreground/60 hover:text-destructive"
            >
              <Trash2 className="size-4" />
              <span className="sr-only">Remove ingredient</span>
            </button>
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const title = draft.trim();
          if (!title) return;
          setDraft("");
          onAddIngredient(title);
        }}
        className="flex items-center gap-2 border-t bg-muted/30 p-2"
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add an ingredient"
          className="h-9"
        />
        <Button type="submit" size="icon-sm">
          <Plus />
          <span className="sr-only">Add ingredient</span>
        </Button>
      </form>
    </div>
  );
}

export function MealsBoard({
  initialMeals,
  persist = true,
}: {
  initialMeals: MealDto[];
  persist?: boolean;
}) {
  const [meals, setMeals] = useState(initialMeals);
  const [draftTitle, setDraftTitle] = useState("");

  async function addMeal(e: React.FormEvent) {
    e.preventDefault();
    const title = draftTitle.trim();
    if (!title) return;
    setDraftTitle("");

    if (!persist) {
      setMeals((prev) => [...prev, { id: crypto.randomUUID(), title, ingredients: [] }]);
      return;
    }

    try {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error();
      const created: MealDto = await res.json();
      setMeals((prev) => [...prev, created]);
    } catch {
      toast.error("Failed to add meal");
    }
  }

  async function deleteMeal(id: string) {
    setMeals((prev) => prev.filter((m) => m.id !== id));
    if (!persist) return;
    try {
      const res = await fetch(`/api/meals/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      toast.error("Failed to delete meal");
    }
  }

  async function addIngredient(mealId: string, title: string) {
    if (!persist) {
      setMeals((prev) =>
        prev.map((m) =>
          m.id === mealId
            ? { ...m, ingredients: [...m.ingredients, { id: crypto.randomUUID(), title }] }
            : m
        )
      );
      return;
    }

    try {
      const res = await fetch(`/api/meals/${mealId}/ingredients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error();
      const created: MealIngredientDto = await res.json();
      setMeals((prev) =>
        prev.map((m) => (m.id === mealId ? { ...m, ingredients: [...m.ingredients, created] } : m))
      );
    } catch {
      toast.error("Failed to add ingredient");
    }
  }

  async function deleteIngredient(mealId: string, ingredientId: string) {
    setMeals((prev) =>
      prev.map((m) =>
        m.id === mealId
          ? { ...m, ingredients: m.ingredients.filter((i) => i.id !== ingredientId) }
          : m
      )
    );
    if (!persist) return;
    try {
      const res = await fetch(`/api/meals/ingredients/${ingredientId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      toast.error("Failed to remove ingredient");
    }
  }

  async function addToShoppingList(meal: MealDto) {
    if (meal.ingredients.length === 0) {
      toast.error("This meal has no ingredients yet");
      return;
    }
    if (!persist) {
      toast.success(`Added ${meal.ingredients.length} ingredients to the shopping list`);
      return;
    }
    try {
      const res = await fetch(`/api/meals/${meal.id}/add-to-shopping-list`, { method: "POST" });
      if (!res.ok) throw new Error();
      toast.success(`Added ${meal.ingredients.length} ingredients to the shopping list`);
    } catch {
      toast.error("Failed to add ingredients to the shopping list");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-black tracking-tight uppercase sm:text-3xl">Meals</h1>

      <div className="grid grid-cols-1 gap-4 landscape:grid-cols-2 lg:grid-cols-2">
        {meals.map((meal) => (
          <MealCard
            key={meal.id}
            meal={meal}
            onDeleteMeal={() => deleteMeal(meal.id)}
            onAddIngredient={(title) => addIngredient(meal.id, title)}
            onDeleteIngredient={(ingredientId) => deleteIngredient(meal.id, ingredientId)}
            onAddToShoppingList={() => addToShoppingList(meal)}
          />
        ))}
      </div>

      <form onSubmit={addMeal} className="flex items-center gap-2 rounded-lg border bg-muted/30 p-2">
        <Input
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          placeholder="Add a meal"
          className="h-9"
        />
        <Button type="submit" size="sm">
          <Plus />
          Add meal
        </Button>
      </form>
    </div>
  );
}
