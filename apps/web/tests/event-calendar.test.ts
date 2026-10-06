import { describe, expect, it } from "vitest";
import { buildCalendarMonth } from "../features/events/calendar";
import {
  eventOrganizerLabel,
  isRegistrationOpen,
} from "../features/events/format";
import type { EventItem } from "../features/events/types";

const event: EventItem = {
  eventId: "1",
  title: "Regional Assembly",
  description: null,
  eventType: "Assembly",
  venue: null,
  startDateTime: "2026-10-15T09:00:00+08:00",
  endDateTime: "2026-10-15T12:00:00+08:00",
  registrationDeadline: "2026-10-14T23:59:00+08:00",
  registrationLink: null,
  coverImageUrl: null,
  status: "Upcoming",
  organizer: null,
  createdBy: {
    userId: "1",
    firstName: "Regional",
    lastName: "Admin",
  },
};

describe("event calendar helpers", () => {
  it("places an event on the matching calendar date", () => {
    const days = buildCalendarMonth(new Date(2026, 9, 1), [event]);
    const eventDay = days.find(
      (day) =>
        day.date.getFullYear() === 2026 &&
        day.date.getMonth() === 9 &&
        day.date.getDate() === 15,
    );

    expect(eventDay?.events[0]?.eventId).toBe("1");
  });

  it("labels regional events without a chapter organizer", () => {
    expect(eventOrganizerLabel(null)).toBe("ICpEP Region 3");
  });

  it("closes registration after the deadline", () => {
    expect(
      isRegistrationOpen(
        event.registrationDeadline,
        event.status,
        new Date("2026-10-15T00:00:00+08:00"),
      ),
    ).toBe(false);
  });

  it("does not allow registration for cancelled events", () => {
    expect(isRegistrationOpen(null, "Cancelled")).toBe(false);
  });
});
