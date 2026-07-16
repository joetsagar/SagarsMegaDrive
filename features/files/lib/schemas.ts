import { z } from "zod";

export const MAX_UPLOAD_SIZE_BYTES = 200 * 1024 * 1024;

export const createUploadSchema = z.object({
  name: z.string().min(1).max(255),
  size: z
    .number()
    .int()
    .positive()
    .max(MAX_UPLOAD_SIZE_BYTES, "File exceeds the 200MB upload limit"),
  contentType: z.string().min(1).max(255).default("application/octet-stream"),
  originalCreatedAt: z.iso.datetime().optional(),
});
