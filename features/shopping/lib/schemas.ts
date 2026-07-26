import { z } from "zod";

export const createShoppingItemSchema = z.object({
  title: z.string().min(1).max(255),
});

export const updateShoppingItemSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  completed: z.boolean().optional(),
  quantity: z.number().int().min(1).max(999).optional(),
});

export const reorderShoppingItemsSchema = z.object({
  orderedIds: z.array(z.string()),
});
