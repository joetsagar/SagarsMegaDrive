export const TODO_CATEGORIES = ["HOME", "WORK"] as const;
export type TodoCategory = (typeof TODO_CATEGORIES)[number];

export const TODO_CATEGORY_META: Record<TodoCategory, { label: string }> = {
  HOME: { label: "Home" },
  WORK: { label: "Work" },
};
