"use client";

import { useState } from "react";
import { ChefHat, ChevronDown, ChevronRight, Pencil, Plus, ShoppingCart, Trash2 } from "lucide-react";
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

function InlineEdit({
  value,
  onSave,
  textClassName,
  inputClassName,
  iconClassName,
}: {
  value: string;
  onSave: (next: string) => void;
  textClassName: string;
  inputClassName: string;
  iconClassName: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function commit() {
    const trimmed = draft.trim();
    setEditing(false);
    if (trimmed && trimmed !== value) {
      onSave(trimmed);
    } else {
      setDraft(value);
    }
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className={inputClassName}
      />
    );
  }

  return (
    <span className="flex min-w-0 flex-1 items-center gap-1.5">
      <span className={textClassName}>{value}</span>
      <button
        type="button"
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
        className={iconClassName}
      >
        <Pencil className="size-3.5" />
        <span className="sr-only">Edit</span>
      </button>
    </span>
  );
}

function MealCard({
  meal,
  onRenameMeal,
  onDeleteMeal,
  onAddIngredient,
  onRenameIngredient,
  onDeleteIngredient,
  onAddToShoppingList,
}: {
  meal: MealDto;
  onRenameMeal: (title: string) => void;
  onDeleteMeal: () => void;
  onAddIngredient: (title: string) => void;
  onRenameIngredient: (ingredientId: string, title: string) => void;
  onDeleteIngredient: (ingredientId: string) => void;
  onAddToShoppingList: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border">
      <div className="flex items-center justify-between gap-2 bg-foreground px-2 py-2.5 text-background">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="flex size-7 shrink-0 items-center justify-center text-background/70 hover:text-background"
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronDown className="size-4" />}
            <span className="sr-only">{collapsed ? "Expand" : "Collapse"} meal</span>
          </button>
          <ChefHat className="size-4 shrink-0" />
          <InlineEdit
            value={meal.title}
            onSave={onRenameMeal}
            textClassName="text-sm font-bold tracking-wide uppercase truncate"
            inputClassName="h-7 min-w-0 flex-1 rounded border-0 bg-white/20 px-2 text-sm font-bold tracking-wide text-white uppercase focus:outline-none focus:ring-1 focus:ring-white/50"
            iconClassName="shrink-0 text-background/60 hover:text-background"
          />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-background hover:bg-background/10 hover:text-background"
            onClick={onAddToShoppingList}
          >
            <ShoppingCart />
            <span className="hidden sm:inline">Add to shopping list</span>
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

      {!collapsed && (
        <>
          <div className="flex flex-col">
            {meal.ingredients.length === 0 && (
              <p className="px-4 py-4 text-center text-sm text-muted-foreground">
                No ingredients yet
              </p>
            )}
            {meal.ingredients.map((ingredient) => (
              <div
                key={ingredient.id}
                className="flex items-center gap-2 border-b px-4 py-2 last:border-b-0"
              >
                <InlineEdit
                  value={ingredient.title}
                  onSave={(title) => onRenameIngredient(ingredient.id, title)}
                  textClassName="text-sm"
                  inputClassName="h-8 min-w-0 flex-1 rounded border px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  iconClassName="shrink-0 text-muted-foreground/60 hover:text-foreground"
                />
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
        </>
      )}
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

  async function renameMeal(id: string, title: string) {
    setMeals((prev) => prev.map((m) => (m.id === id ? { ...m, title } : m)));
    if (!persist) return;
    try {
      const res = await fetch(`/api/meals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error();
    } catch {
      toast.error("Failed to rename meal");
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

  async function renameIngredient(mealId: string, ingredientId: string, title: string) {
    setMeals((prev) =>
      prev.map((m) =>
        m.id === mealId
          ? {
              ...m,
              ingredients: m.ingredients.map((i) => (i.id === ingredientId ? { ...i, title } : i)),
            }
          : m
      )
    );
    if (!persist) return;
    try {
      const res = await fetch(`/api/meals/ingredients/${ingredientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error();
    } catch {
      toast.error("Failed to rename ingredient");
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
            onRenameMeal={(title) => renameMeal(meal.id, title)}
            onDeleteMeal={() => deleteMeal(meal.id)}
            onAddIngredient={(title) => addIngredient(meal.id, title)}
            onRenameIngredient={(ingredientId, title) =>
              renameIngredient(meal.id, ingredientId, title)
            }
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
