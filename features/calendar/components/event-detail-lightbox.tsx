"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, MapPin, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CATEGORY_META } from "@/features/calendar/lib/categories";
import { toDateKey } from "@/features/calendar/lib/dates";
import type { EventDetail } from "@/features/calendar/components/event-form-dialog";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
});

export function EventDetailLightbox({
  event,
  onClose,
  onEdit,
  readOnly = false,
}: {
  event: EventDetail | null;
  onClose: () => void;
  onEdit?: (event: EventDetail) => void;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!event) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [event, onClose]);

  if (!event) return null;

  const meta = CATEGORY_META[event.category];
  const isMultiDay = event.endAt && toDateKey(event.endAt) !== toDateKey(event.startAt);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/calendar-events/${event!.id}`, { method: "DELETE" });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? "Failed to delete event");
      }
      onClose();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete event");
      setIsDeleting(false);
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-xl"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl border bg-card p-6 shadow-2xl"
      >
        <span
          className="inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
          style={{ backgroundColor: `${meta.color}26`, color: meta.color }}
        >
          <span className="size-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
          {meta.label}
        </span>

        <h2 className="mt-3 text-xl font-medium">{event.title}</h2>

        <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="size-4 shrink-0" />
            <span>
              {dateFormatter.format(event.startAt)}
              {isMultiDay && ` – ${dateFormatter.format(event.endAt!)}`}
              {!event.allDay &&
                ` · ${timeFormatter.format(event.startAt)}${
                  event.endAt ? ` – ${timeFormatter.format(event.endAt)}` : ""
                }`}
            </span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0" />
              <span>{event.location}</span>
            </div>
          )}
        </div>

        {event.description && (
          <p className="mt-4 text-sm whitespace-pre-wrap text-foreground">{event.description}</p>
        )}

        {!readOnly && (
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => onEdit?.(event)}>
              <Pencil />
              Edit
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              <Trash2 />
              Delete
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
