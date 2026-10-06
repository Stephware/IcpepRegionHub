import type { EventItem } from "./types";

export type CalendarDay = {
  date: Date;
  inCurrentMonth: boolean;
  events: EventItem[];
};

export function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function buildCalendarMonth(
  month: Date,
  events: EventItem[],
): CalendarDay[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);

    const eventsForDay = events.filter((event) => {
      const eventDate = new Date(event.startDateTime);

      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });

    return {
      date,
      inCurrentMonth: date.getMonth() === month.getMonth(),
      events: eventsForDay,
    };
  });
}
