import { z } from "zod";
import { EVENT_CATEGORIES } from "@/features/calendar/lib/categories";

export const createEventSchema = z.object({
  title: z.string().min(1).max(255),
  category: z.enum(EVENT_CATEGORIES),
  location: z.string().max(255).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  allDay: z.boolean(),
  startAt: z.iso.datetime(),
  endAt: z.iso.datetime().nullable().optional(),
});

export const updateEventSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  category: z.enum(EVENT_CATEGORIES).optional(),
  location: z.string().max(255).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  allDay: z.boolean().optional(),
  startAt: z.iso.datetime().optional(),
  endAt: z.iso.datetime().nullable().optional(),
});
