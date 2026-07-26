import { z } from "zod";
import { TODO_CATEGORIES } from "@/features/todos/lib/categories";

export const createTodoSchema = z.object({
  title: z.string().min(1).max(255),
  category: z.enum(TODO_CATEGORIES),
});

export const updateTodoSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  completed: z.boolean().optional(),
});

export const reorderTodosSchema = z.object({
  HOME: z.array(z.string()),
  WORK: z.array(z.string()),
});

export const reorderCombinedSchema = z.object({
  orderedIds: z.array(z.string()),
});
