"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Copy, Plus, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { buildMonthGrid, toDateKey, toUtcMidnight } from "@/features/calendar/lib/dates";
import { CATEGORY_META, EVENT_CATEGORIES, type EventCategory } from "@/features/calendar/lib/categories";
import { EventFormDialog, type EventDetail } from "@/features/calendar/components/event-form-dialog";
import { EventDetailLightbox } from "@/features/calendar/components/event-detail-lightbox";
import { formatDate } from "@/features/files/lib/format";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

const BAR_HEIGHT = 18;
const BAR_GAP = 2;
const HEADER_HEIGHT = 26;

type WeekBar = { event: EventDetail; startCol: number; span: number; lane: number };

function isMultiDay(event: EventDetail): boolean {
  return Boolean(event.endAt) && toDateKey(event.endAt!) !== toDateKey(event.startAt);
}

function computeWeekBars(week: Date[], multiDayEvents: EventDetail[]): { bars: WeekBar[]; laneCount: number } {
  const weekStartKey = toDateKey(week[0]);
  const weekEndKey = toDateKey(week[6]);

  const overlapping = multiDayEvents.filter((event) => {
    const evStartKey = toDateKey(event.startAt);
    const evEndKey = toDateKey(event.endAt ?? event.startAt);
    return evEndKey >= weekStartKey && evStartKey <= weekEndKey;
  });

  const sorted = [...overlapping].sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

  const lanes: number[] = [];
  const bars: WeekBar[] = [];

  for (const event of sorted) {
    const evStart = toUtcMidnight(event.startAt);
    const evEnd = toUtcMidnight(event.endAt ?? event.startAt);
    const clippedStart = evStart.getTime() < week[0].getTime() ? week[0] : evStart;
    const clippedEnd = evEnd.getTime() > week[6].getTime() ? week[6] : evEnd;

    const startCol = week.findIndex((d) => toDateKey(d) === toDateKey(clippedStart));
    const endCol = week.findIndex((d) => toDateKey(d) === toDateKey(clippedEnd));
    const span = endCol - startCol + 1;

    let lane = lanes.findIndex((laneEndCol) => laneEndCol < startCol);
    if (lane === -1) {
      lane = lanes.length;
      lanes.push(endCol);
    } else {
      lanes[lane] = endCol;
    }

    bars.push({ event, startCol, span, lane });
  }

  return { bars, laneCount: lanes.length };
}

export function CalendarView({
  events,
  readOnly = false,
  privacyMode = false,
}: {
  events: EventDetail[];
  readOnly?: boolean;
  privacyMode?: boolean;
}) {
  const router = useRouter();
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formDefaultDate, setFormDefaultDate] = useState<string | undefined>(undefined);
  const [formEvent, setFormEvent] = useState<EventDetail | undefined>(undefined);
  const [selectedEvent, setSelectedEvent] = useState<EventDetail | null>(null);
  const [activeCategories, setActiveCategories] = useState<Set<EventCategory>>(
    new Set(EVENT_CATEGORIES)
  );
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareExpiresAt, setShareExpiresAt] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isPrivateShare, setIsPrivateShare] = useState(false);
  const [copied, setCopied] = useState(false);

  const todayKey = toDateKey(today);
  const grid = useMemo(
    () => buildMonthGrid(viewDate.getFullYear(), viewDate.getMonth()),
    [viewDate]
  );
  const weeks = useMemo(() => {
    const result: Date[][] = [];
    for (let i = 0; i < grid.length; i += 7) result.push(grid.slice(i, i + 7));
    return result;
  }, [grid]);

  const visibleEvents = useMemo(
    () => events.filter((event) => activeCategories.has(event.category)),
    [events, activeCategories]
  );

  const multiDayEvents = useMemo(() => visibleEvents.filter(isMultiDay), [visibleEvents]);

  const singleDayEventsByDay = useMemo(() => {
    const map = new Map<string, EventDetail[]>();
    for (const event of visibleEvents) {
      if (isMultiDay(event)) continue;
      const key = toDateKey(event.startAt);
      const existing = map.get(key);
      if (existing) existing.push(event);
      else map.set(key, [event]);
    }
    return map;
  }, [visibleEvents]);

  function changeMonth(delta: number) {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  function toggleCategory(category: EventCategory) {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  function openCreateForm(dateKey: string) {
    if (readOnly) return;
    setFormEvent(undefined);
    setFormDefaultDate(dateKey);
    setIsFormOpen(true);
  }

  function openEditForm(event: EventDetail) {
    if (readOnly) return;
    setSelectedEvent(null);
    setFormEvent(event);
    setFormDefaultDate(undefined);
    setIsFormOpen(true);
  }

  async function moveEventToDay(eventId: string, dayKey: string) {
    if (readOnly) return;
    const event = events.find((e) => e.id === eventId);
    if (!event) return;

    const [year, month, day] = dayKey.split("-").map(Number);
    const newStart = new Date(event.startAt);
    newStart.setUTCFullYear(year, month - 1, day);

    let newEnd: Date | null = null;
    if (event.endAt) {
      const durationMs = event.endAt.getTime() - event.startAt.getTime();
      newEnd = new Date(newStart.getTime() + durationMs);
    }

    try {
      const res = await fetch(`/api/calendar-events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startAt: newStart.toISOString(),
          endAt: newEnd ? newEnd.toISOString() : null,
        }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? "Failed to move event");
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to move event");
    }
  }

  async function generateShareLink(privateFlag: boolean) {
    setShareUrl(null);
    setShareExpiresAt(null);
    setIsSharing(true);
    try {
      const res = await fetch("/api/calendar/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPrivate: privateFlag }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? "Failed to create share link");
      }
      const { token, expiresAt } = await res.json();
      setShareUrl(`${window.location.origin}/share/${token}`);
      setShareExpiresAt(expiresAt);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create share link");
    } finally {
      setIsSharing(false);
    }
  }

  function openShare() {
    setIsShareOpen(true);
    setIsPrivateShare(false);
    generateShareLink(false);
  }

  function setSharePrivacy(value: boolean) {
    if (value === isPrivateShare) return;
    setIsPrivateShare(value);
    generateShareLink(value);
  }

  async function copyShareUrl() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">{monthFormatter.format(viewDate)}</h2>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <Button variant="outline" size="icon-sm" onClick={() => changeMonth(-1)}>
              <ChevronLeft />
              <span className="sr-only">Previous month</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1))}
            >
              Today
            </Button>
            <Button variant="outline" size="icon-sm" onClick={() => changeMonth(1)}>
              <ChevronRight />
              <span className="sr-only">Next month</span>
            </Button>
          </div>
          {!readOnly && (
            <>
              <Button variant="outline" size="sm" onClick={openShare}>
                <Share2 />
                Share
              </Button>
              <Button size="sm" onClick={() => openCreateForm(toDateKey(today))}>
                <Plus />
                Add Event
              </Button>
            </>
          )}
        </div>
      </div>

      {!privacyMode && (
      <div className="flex flex-wrap gap-2">
        {EVENT_CATEGORIES.map((category) => {
          const meta = CATEGORY_META[category];
          const isActive = activeCategories.has(category);
          return (
            <button
              key={category}
              onClick={() => toggleCategory(category)}
              style={
                isActive
                  ? { backgroundColor: `${meta.color}26`, borderColor: meta.color, color: meta.color }
                  : undefined
              }
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                !isActive && "border-border text-muted-foreground/50"
              )}
            >
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: isActive ? meta.color : undefined }}
              />
              {meta.label}
            </button>
          );
        })}
      </div>
      )}

      <div className="overflow-hidden rounded-lg border">
        <div className="grid grid-cols-7 gap-px bg-border">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="bg-muted px-2 py-1.5 text-center text-xs font-medium text-muted-foreground"
            >
              {label}
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-px bg-border">
          {weeks.map((week, weekIdx) => {
            const { bars, laneCount } = computeWeekBars(week, multiDayEvents);
            const chipsMarginTop = laneCount * (BAR_HEIGHT + BAR_GAP);

            return (
              <div key={weekIdx} className="relative grid grid-cols-7 gap-px">
                {week.map((day) => {
                  const key = toDateKey(day);
                  const isCurrentMonth = day.getUTCMonth() === viewDate.getMonth();
                  const isToday = key === todayKey;
                  const isPast = key < todayKey;
                  const dayEvents = singleDayEventsByDay.get(key) ?? [];
                  const shownEvents = dayEvents.slice(0, 2);
                  const overflowCount = dayEvents.length - shownEvents.length;

                  return (
                    <div
                      key={key}
                      onClick={() => openCreateForm(key)}
                      onDragOver={(e) => {
                        if (readOnly) return;
                        e.preventDefault();
                        setDragOverKey(key);
                      }}
                      onDragLeave={() => setDragOverKey(null)}
                      onDrop={(e) => {
                        if (readOnly) return;
                        e.preventDefault();
                        setDragOverKey(null);
                        const eventId = e.dataTransfer.getData("text/plain");
                        if (eventId) moveEventToDay(eventId, key);
                      }}
                      className={cn(
                        "group relative flex min-h-24 flex-col bg-card transition-colors",
                        !readOnly && "cursor-pointer hover:bg-muted/50",
                        !isCurrentMonth && "text-muted-foreground/40",
                        dragOverKey === key && "bg-primary/10"
                      )}
                    >
                      {isPast && (
                        <svg
                          className="pointer-events-none absolute inset-0 size-full text-destructive opacity-20"
                          viewBox="0 0 100 100"
                          preserveAspectRatio="none"
                        >
                          <line x1="6" y1="6" x2="94" y2="94" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                          <line x1="94" y1="6" x2="6" y2="94" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                      )}
                      <div
                        style={{ height: HEADER_HEIGHT }}
                        className="flex items-center justify-between px-1.5 pt-1.5"
                      >
                        <span
                          className={cn(
                            "flex size-5 items-center justify-center rounded-full text-xs",
                            isToday && "bg-primary font-medium text-primary-foreground"
                          )}
                        >
                          {day.getUTCDate()}
                        </span>
                        {!readOnly && (
                          <Plus className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                        )}
                      </div>
                      <div
                        style={{ marginTop: chipsMarginTop }}
                        className="flex flex-col gap-0.5 px-1.5 pb-1.5"
                      >
                        {shownEvents.map((event) => {
                          const meta = CATEGORY_META[event.category];
                          return (
                            <div
                              key={event.id}
                              draggable={!readOnly}
                              onDragStart={(e) => e.dataTransfer.setData("text/plain", event.id)}
                              onClick={(e) => e.stopPropagation()}
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                if (!privacyMode) setSelectedEvent(event);
                              }}
                              title={privacyMode ? "Busy" : event.title}
                              style={
                                privacyMode
                                  ? undefined
                                  : { backgroundColor: `${meta.color}26`, color: meta.color }
                              }
                              className={cn(
                                "truncate rounded px-1.5 py-0.5 text-xs",
                                privacyMode && "bg-muted-foreground/20 text-muted-foreground",
                                !readOnly && "cursor-grab active:cursor-grabbing"
                              )}
                            >
                              {privacyMode ? "Busy" : event.title}
                            </div>
                          );
                        })}
                        {overflowCount > 0 && (
                          <span className="px-1.5 text-xs text-muted-foreground">
                            +{overflowCount} more
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div
                  className="pointer-events-none absolute inset-x-0"
                  style={{ top: HEADER_HEIGHT }}
                >
                  {bars.map(({ event, startCol, span, lane }) => {
                    const meta = CATEGORY_META[event.category];
                    return (
                      <div
                        key={event.id}
                        draggable={!readOnly}
                        onDragStart={(e) => e.dataTransfer.setData("text/plain", event.id)}
                        onDoubleClick={() => {
                          if (!privacyMode) setSelectedEvent(event);
                        }}
                        title={privacyMode ? "Busy" : event.title}
                        style={{
                          left: `calc(${startCol} / 7 * 100%)`,
                          width: `calc(${span} / 7 * 100% - 4px)`,
                          top: lane * (BAR_HEIGHT + BAR_GAP),
                          height: BAR_HEIGHT,
                          marginLeft: 2,
                          ...(privacyMode
                            ? {}
                            : { backgroundColor: `${meta.color}26`, color: meta.color }),
                        }}
                        className={cn(
                          "pointer-events-auto absolute truncate rounded px-1.5 text-center text-xs leading-[18px]",
                          privacyMode && "bg-muted-foreground/20 text-muted-foreground",
                          !readOnly && "cursor-grab active:cursor-grabbing"
                        )}
                      >
                        {privacyMode ? "Busy" : event.title}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {!readOnly && (
        <>
          <EventFormDialog
            open={isFormOpen}
            onOpenChange={setIsFormOpen}
            defaultDate={formDefaultDate}
            event={formEvent}
          />

          <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share your calendar</DialogTitle>
                <DialogDescription>
                  Anyone with this link can view and browse your calendar — no
                  sign-in or access to the rest of your drive, and events can&apos;t
                  be added, edited, or moved. Views are logged in Activity. The
                  link expires 72 hours after it&apos;s created.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-1.5">
                <Label>Visibility</Label>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={!isPrivateShare ? "secondary" : "ghost"}
                    onClick={() => setSharePrivacy(false)}
                  >
                    Full details
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={isPrivateShare ? "secondary" : "ghost"}
                    onClick={() => setSharePrivacy(true)}
                  >
                    Private (Busy only)
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isPrivateShare
                    ? "Events show only as “Busy” blocks — no titles, times, locations, or descriptions."
                    : "Events show with their full title, time, location, and description."}
                </p>
              </div>
              <div className="flex gap-2">
                <Input value={shareUrl ?? "Generating link..."} readOnly />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyShareUrl}
                  disabled={!shareUrl || isSharing}
                >
                  {copied ? <Check /> : <Copy />}
                  <span className="sr-only">Copy link</span>
                </Button>
              </div>
              {shareExpiresAt && (
                <p className="text-xs text-muted-foreground">
                  Expires {formatDate(new Date(shareExpiresAt))}
                </p>
              )}
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>Close</DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      <EventDetailLightbox
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onEdit={openEditForm}
        readOnly={readOnly}
      />
    </div>
  );
}
