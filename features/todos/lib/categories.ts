export const TODO_CATEGORIES = ["HOME", "WORK"] as const;
export type TodoCategory = (typeof TODO_CATEGORIES)[number];

export const TODO_CATEGORY_META: Record<TodoCategory, { label: string; color: string }> = {
  HOME: { label: "Home", color: "#c2703d" },
  WORK: { label: "Work", color: "#3987e5" },
};
