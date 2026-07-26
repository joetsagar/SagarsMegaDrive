import { z } from "zod";

export const createUploadSchema = z.object({
  name: z.string().min(1).max(255),
  size: z.number().int().positive(),
  contentType: z.string().min(1).max(255).default("application/octet-stream"),
  originalCreatedAt: z.iso.datetime().optional(),
});
