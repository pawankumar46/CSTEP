"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Coffee, Plus } from "lucide-react";
import { SessionItemModal, type SessionItemFormValues } from "@/components/dashboard/session-scheduler/SessionItemModal";
import { SessionTimeline } from "@/components/dashboard/session-scheduler/SessionTimeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createScheduleItem,
  deleteScheduleItem,
  getScheduleItems,
  updateScheduleItem,
} from "@/services/event.service";
import {
  clampStartToDay,
  findOverlapConflict,
  formatTimeRange,
  generateTimelineItemId,
  getEventScheduleDays,
  minutesToTimeInput,
  scheduleTypeToTimelineType,
  timeInputToMinutes,
  type EventScheduleDay,
  type ScheduleByEvent,
  type TimelineItem,
  type TimelineItemType,
} from "@/lib/session-scheduler";

interface SessionSchedulerProps {
  eventId: string;
  eventName?: string;
  eventDate?: string;
  eventEndDate?: string;
  scheduleDaysOverride?: EventScheduleDay[];
}

interface ModalState {
  open: boolean;
  mode: "add" | "edit";
  itemType: TimelineItemType;
  item: TimelineItem | null;
}

const CLOSED_MODAL: ModalState = {
  open: false,
  mode: "add",
  itemType: "session",
  item: null,
};

function overlapErrorMessage(conflict: TimelineItem): string {
  const kind = conflict.type === "break" ? "break" : "session";
  return `That time overlaps with an existing ${kind} (${formatTimeRange(conflict.start, conflict.duration)}).`;
}

export function SessionScheduler({
  eventId,
  eventName,
  eventDate,
  eventEndDate,
  scheduleDaysOverride,
}: SessionSchedulerProps) {
  const scheduleDays = useMemo(
    () =>
      scheduleDaysOverride && scheduleDaysOverride.length > 0
        ? scheduleDaysOverride
        : getEventScheduleDays(eventDate, eventEndDate),
    [eventDate, eventEndDate, scheduleDaysOverride],
  );

  const [selectedDate, setSelectedDate] = useState(scheduleDays[0]?.value ?? "");
  const [scheduleByEvent, setScheduleByEvent] = useState<ScheduleByEvent>({});
  const [modal, setModal] = useState<ModalState>(CLOSED_MODAL);
  const [error, setError] = useState<string | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  useEffect(() => {
    const firstDay = scheduleDays[0]?.value ?? "";
    setSelectedDate(firstDay);
    setError(null);
  }, [eventId, scheduleDays]);

  const selectedDay = scheduleDays.find((day) => day.value === selectedDate);

  const toMinutesFromApiTime = useCallback((value: string): number => {
    const [h, m] = value.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return 0;
    return h * 60 + m;
  }, []);

  const syncDayItemsFromApi = useCallback(
    async (dayId: number, dayValue: string) => {
      const scheduleItems = await getScheduleItems(dayId);
      const syncedItems: TimelineItem[] = scheduleItems.map((item) => {
        const startMinutes = toMinutesFromApiTime(item.startTime);
        const endMinutes = toMinutesFromApiTime(item.endTime);
        const duration = Math.max(5, endMinutes - startMinutes);
        const normalizedType =
          item.itemType === "SESSION" ||
          item.itemType === "BREAKFAST_BREAK" ||
          item.itemType === "TEA_BREAK" ||
          item.itemType === "LUNCH_BREAK" ||
          item.itemType === "DINNER_BREAK" ||
          item.itemType === "NETWORKING_BREAK" ||
          item.itemType === "CUSTOM_BREAK"
            ? item.itemType
            : "SESSION";
        return {
          id: item.id || generateTimelineItemId(),
          type: scheduleTypeToTimelineType(normalizedType),
          sessionType: normalizedType,
          label: item.title || "Untitled",
          start: startMinutes,
          duration,
        };
      });

      setScheduleByEvent((prev) => {
        const eventSchedule = prev[eventId] ?? {};
        return {
          ...prev,
          [eventId]: {
            ...eventSchedule,
            [dayValue]: syncedItems,
          },
        };
      });
    },
    [eventId, toMinutesFromApiTime],
  );

  const itemsForDate = useMemo(() => {
    return scheduleByEvent[eventId]?.[selectedDate] ?? [];
  }, [scheduleByEvent, eventId, selectedDate]);

  useEffect(() => {
    let cancelled = false;

    const loadScheduleItems = async () => {
      const dayIdRaw = selectedDay?.dayId;
      if (!dayIdRaw) return;
      const dayId = Number(dayIdRaw);
      if (Number.isNaN(dayId)) return;

      try {
        setError(null);
        await syncDayItemsFromApi(dayId, selectedDate);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load schedule items for selected day",
        );
      }
    };

    void loadScheduleItems();
    return () => {
      cancelled = true;
    };
  }, [selectedDate, selectedDay?.dayId, syncDayItemsFromApi]);

  const sessionCountByDay = useMemo(() => {
    const eventSchedule = scheduleByEvent[eventId] ?? {};
    return Object.fromEntries(
      scheduleDays.map((day) => [day.value, (eventSchedule[day.value] ?? []).length]),
    );
  }, [scheduleByEvent, eventId, scheduleDays]);

  const sortedItems = useMemo(
    () => [...itemsForDate].sort((a, b) => a.start - b.start),
    [itemsForDate],
  );

  const updateItemsForDate = useCallback(
    (updater: (items: TimelineItem[]) => TimelineItem[]) => {
      setScheduleByEvent((prev) => {
        const eventSchedule = prev[eventId] ?? {};
        const dayItems = eventSchedule[selectedDate] ?? [];
        return {
          ...prev,
          [eventId]: {
            ...eventSchedule,
            [selectedDate]: updater(dayItems),
          },
        };
      });
    },
    [eventId, selectedDate],
  );

  const closeModal = () => setModal(CLOSED_MODAL);

  const openAdd = (itemType: TimelineItemType) => {
    setError(null);
    setModal({ open: true, mode: "add", itemType, item: null });
  };

  const openEdit = (item: TimelineItem) => {
    setError(null);
    setModal({ open: true, mode: "edit", itemType: item.type, item });
  };

  const upsertItem = (candidate: TimelineItem) => {
    const conflict = findOverlapConflict(itemsForDate, candidate);
    if (conflict) {
      setError(overlapErrorMessage(conflict));
      return false;
    }

    setError(null);
    updateItemsForDate((items) => {
      const exists = items.some((item) => item.id === candidate.id);
      if (exists) {
        return items.map((item) => (item.id === candidate.id ? candidate : item));
      }
      return [...items, candidate];
    });
    return true;
  };

  const toApiTime = (minutes: number): string => `${minutesToTimeInput(minutes)}:00`;

  const handleSave = async (values: SessionItemFormValues) => {
    const start = clampStartToDay(timeInputToMinutes(values.startTime), values.duration);
    const sessionType = values.sessionType;
    const title = values.label.trim();
    const dayIdRaw = selectedDay?.dayId;
    const dayId = Number(dayIdRaw);

    if (!dayIdRaw || Number.isNaN(dayId)) {
      setError("Unable to resolve selected day id. Please re-select the day and try again.");
      return;
    }

    if (modal.mode === "add") {
      try {
        await createScheduleItem({
          day: dayId,
          itemType: sessionType,
          title,
          description: "",
          startTime: toApiTime(start),
          endTime: toApiTime(start + values.duration),
        });

        await syncDayItemsFromApi(dayId, selectedDate);
        closeModal();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to add session to schedule items",
        );
      }
      return;
    }

    if (modal.mode === "edit") {
      const scheduleItemId = modal.item?.id;
      if (!scheduleItemId) {
        setError("Missing schedule item id for edit.");
        return;
      }

      try {
        await updateScheduleItem(scheduleItemId, {
          itemType: sessionType,
          title,
          description: "",
          startTime: toApiTime(start),
          endTime: toApiTime(start + values.duration),
        });
        await syncDayItemsFromApi(dayId, selectedDate);
        closeModal();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update schedule item",
        );
      }
      return;
    }

    const candidate: TimelineItem = {
      id: modal.item?.id ?? generateTimelineItemId(),
      type: scheduleTypeToTimelineType(sessionType),
      sessionType,
      label: title,
      start,
      duration: values.duration,
    };

    if (upsertItem(candidate)) closeModal();
  };

  const handleDelete = async (id: string) => {
    const dayIdRaw = selectedDay?.dayId;
    if (!dayIdRaw) {
      setError("Unable to resolve selected day id. Please re-select the day and try again.");
      return;
    }

    const dayId = Number(dayIdRaw);
    if (Number.isNaN(dayId)) {
      setError("Invalid day id for selected date.");
      return;
    }

    try {
      setError(null);
      setDeletingItemId(id);
      await deleteScheduleItem(id);
      await syncDayItemsFromApi(dayId, selectedDate);
      closeModal();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete schedule item",
      );
    } finally {
      setDeletingItemId(null);
    }
  };

  if (scheduleDays.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          This event has no valid schedule dates to plan sessions.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base">Step 2 — Day schedule</CardTitle>
            <CardDescription>
              {eventName
                ? `Plan up to ${scheduleDays.length} day${scheduleDays.length === 1 ? "" : "s"} for ${eventName}.`
                : "Select a day and plan sessions on the timeline."}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => openAdd("session")}>
              <Plus className="h-4 w-4" />
              Add session
            </Button>
            <Button size="sm" variant="outline" onClick={() => openAdd("break")}>
              <Coffee className="h-4 w-4" />
              Add break
            </Button>
          </div>
        </div>

        <Tabs
          value={selectedDate}
          onValueChange={(value) => {
            setSelectedDate(value);
            setError(null);
          }}
        >
          <TabsList className="h-auto flex-wrap justify-start gap-1">
            {scheduleDays.map((day) => {
              const count = sessionCountByDay[day.value] ?? 0;
              return (
                <TabsTrigger key={day.value} value={day.value} className="gap-2">
                  {day.label}
                  {count > 0 && (
                    <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-[10px]">
                      {count}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="space-y-4">
        {selectedDay && (
          <p className="text-sm text-muted-foreground">
            Scheduling for <span className="font-medium text-foreground">{selectedDay.label}</span>
          </p>
        )}

        {error && (
          <div
            className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {error}
          </div>
        )}

        {sortedItems.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No sessions scheduled for {selectedDay?.shortLabel ?? "this day"}.
          </p>
        )}

        <SessionTimeline
          selectedDate={selectedDate}
          items={sortedItems}
          onEdit={openEdit}
          onDelete={handleDelete}
          deletingItemId={deletingItemId}
        />
      </CardContent>

      <SessionItemModal
        open={modal.open}
        mode={modal.mode}
        itemType={modal.itemType}
        initialItem={modal.item}
        onClose={closeModal}
        onSave={handleSave}
        onDelete={
          modal.mode === "edit" && modal.item
            ? () => handleDelete(modal.item!.id)
            : undefined
        }
        isDeleting={deletingItemId === modal.item?.id}
      />
    </Card>
  );
}
