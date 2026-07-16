export const EVENT_CATEGORIES = ["WORK", "TRAVEL", "PERSONAL", "BANK_HOLIDAY"] as const;
export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export const CATEGORY_META: Record<EventCategory, { label: string; color: string }> = {
  WORK: { label: "Work", color: "#3987e5" },
  TRAVEL: { label: "Travel", color: "#1baf7a" },
  PERSONAL: { label: "Personal", color: "#d55181" },
  BANK_HOLIDAY: { label: "Bank Holidays", color: "#c98500" },
};
