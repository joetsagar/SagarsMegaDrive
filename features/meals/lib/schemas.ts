import { z } from "zod";

export const createMealSchema = z.object({
  title: z.string().min(1).max(255),
});

export const updateMealSchema = z.object({
  title: z.string().min(1).max(255),
});

export const createIngredientSchema = z.object({
  title: z.string().min(1).max(255),
});

export const updateIngredientSchema = z.object({
  title: z.string().min(1).max(255),
});
