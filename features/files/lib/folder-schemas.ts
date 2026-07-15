import { z } from "zod";

export const createFolderSchema = z.object({
  name: z.string().min(1).max(255),
  category: z.enum(["VIDEO", "PHOTO", "AUDIO"]),
  parentId: z.string().nullable().optional(),
});

export const moveFileSchema = z.object({
  folderId: z.string().nullable(),
});
