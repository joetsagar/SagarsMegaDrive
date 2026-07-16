"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CATEGORY_META, EVENT_CATEGORIES, type EventCategory } from "@/features/calendar/lib/categories";

export type EventDetail = {
  id: string;
  title: string;
  category: EventCategory;
  location: string | null;
  description: string | null;
  allDay: boolean;
  startAt: Date;
  endAt: Date | null;
};

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toTimeInputValue(date: Date): string {
  return date.toISOString().slice(11, 16);
}

export function EventFormDialog({
  open,
  onOpenChange,
  defaultDate,
  event,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: string;
  event?: EventDetail;
}) {
  const router = useRouter();
  const isEditing = Boolean(event);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<EventCategory>("PERSONAL");
  const [startDate, setStartDate] = useState(defaultDate ?? toDateInputValue(new Date()));
  const [endDate, setEndDate] = useState(defaultDate ?? toDateInputValue(new Date()));
  const [allDay, setAllDay] = useState(true);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (event) {
      setTitle(event.title);
      setCategory(event.category);
      setStartDate(toDateInputValue(event.startAt));
      setEndDate(toDateInputValue(event.endAt ?? event.startAt));
      setAllDay(event.allDay);
      setStartTime(toTimeInputValue(event.startAt));
      setEndTime(toTimeInputValue(event.endAt ?? event.startAt));
      setLocation(event.location ?? "");
      setDescription(event.description ?? "");
    } else {
      setTitle("");
      setCategory("PERSONAL");
      setStartDate(defaultDate ?? toDateInputValue(new Date()));
      setEndDate(defaultDate ?? toDateInputValue(new Date()));
      setAllDay(true);
      setStartTime("09:00");
      setEndTime("10:00");
      setLocation("");
      setDescription("");
    }
  }, [open, defaultDate, event]);

  function handleStartDateChange(value: string) {
    setStartDate(value);
    if (endDate < value) setEndDate(value);
  }

  async function handleSave() {
    if (!title.trim() || !startDate || !endDate) return;
    setIsSaving(true);
    try {
      const startAt = allDay
        ? `${startDate}T00:00:00.000Z`
        : `${startDate}T${startTime}:00.000Z`;
      const endAt = allDay ? `${endDate}T00:00:00.000Z` : `${endDate}T${endTime}:00.000Z`;

      const payload = {
        title: title.trim(),
        category,
        location: location.trim() || null,
        description: description.trim() || null,
        allDay,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
      };

      const res = await fetch(
        isEditing ? `/api/calendar-events/${event!.id}` : "/api/calendar-events",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? `Failed to ${isEditing ? "update" : "create"} event`);
      }
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : `Failed to ${isEditing ? "update" : "create"} event`
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit event" : "New event"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="event-title">Title</Label>
            <Input
              id="event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a title"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Category</Label>
            <div className="flex gap-2">
              {EVENT_CATEGORIES.map((cat) => {
                const meta = CATEGORY_META[cat];
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    style={
                      isSelected
                        ? { backgroundColor: `${meta.color}26`, borderColor: meta.color, color: meta.color }
                        : undefined
                    }
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm transition-colors",
                      !isSelected && "border-border text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: meta.color }}
                    />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Duration</Label>
            <div className="flex gap-1">
              <Button
                type="button"
                size="sm"
                variant={allDay ? "secondary" : "ghost"}
                onClick={() => setAllDay(true)}
              >
                All day
              </Button>
              <Button
                type="button"
                size="sm"
                variant={!allDay ? "secondary" : "ghost"}
                onClick={() => setAllDay(false)}
              >
                Timed
              </Button>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="event-start-date">Start date</Label>
              <Input
                id="event-start-date"
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
              />
            </div>
            {!allDay && (
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor="event-start-time">Start time</Label>
                <Input
                  id="event-start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="event-end-date">End date</Label>
              <Input
                id="event-end-date"
                type="date"
                min={startDate}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            {!allDay && (
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor="event-end-time">End time</Label>
                <Input
                  id="event-end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="event-location">Location</Label>
            <Input
              id="event-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Add a location"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="event-description">Description</Label>
            <Textarea
              id="event-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description"
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button onClick={handleSave} disabled={isSaving || !title.trim()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
