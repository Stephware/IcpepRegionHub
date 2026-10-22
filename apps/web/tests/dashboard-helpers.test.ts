import { describe, expect, it } from "vitest";
import {
  assignedAssistanceCount,
  openAssistanceCount,
  recentAnnouncements,
  recentCollaborations,
  upcomingEventCount,
  upcomingEvents,
  urgentAssistanceCount,
  unassignedAssistanceCount,
} from "../features/dashboard/helpers";
import type { MemberAnnouncement } from "../features/announcements/types";
import type { AssistanceRequestSummary } from "../features/assistance/types";
import type { CollaborationPost } from "../features/collaborations/types";
import type { EventItem } from "../features/events/types";

const baseAnnouncement = {
  content: "Update",
  category: "General",
  coverImageUrl: null,
  externalLink: null,
  isPinned: false,
  expiresAt: null,
  visibility: "Public" as const,
  createdBy: {
    userId: "1",
    firstName: "Regional",
    lastName: "Admin",
  },
};

const baseEvent: EventItem = {
  scope: "Regional",
  editorialState: "Published",
  publishedAt: "2026-10-01T00:00:00Z",
  eventId: "1",
  title: "Event",
  description: null,
  eventType: "Assembly",
  venue: null,
  startDateTime: "2099-10-10T08:00:00+08:00",
  endDateTime: null,
  registrationDeadline: null,
  registrationLink: null,
  coverImageUrl: null,
  status: "Upcoming",
  organizer: null,
  createdBy: {
    userId: "1",
    firstName: "Regional",
    lastName: "Admin",
    facultyDesignation: null,
  },
};

const baseCollaboration: CollaborationPost = {
  collaborationPostId: "1",
  collaborationType: "Joint Event",
  title: "Partner needed",
  description: "Description",
  eventName: null,
  eventDate: null,
  location: null,
  contactName: null,
  contactEmail: null,
  contactNumber: null,
  status: "Open",
  expiresAt: null,
  createdAt: "2026-10-06T08:00:00+08:00",
  updatedAt: null,
  chapter: {
    chapterId: "1",
    schoolName: "Sample University",
    chapterName: "Sample Chapter",
    acronym: "SC",
  },
  createdBy: {
    userId: "10",
    firstName: "Juan",
    lastName: "Dela Cruz",
  },
};

const request = (
  status: AssistanceRequestSummary["status"],
  priority: AssistanceRequestSummary["priority"],
  assignedToUserId?: string,
): AssistanceRequestSummary => ({
  assistanceRequestId: "1",
  ticketCode: "R3-20261006-TEST0001",
  category: "General",
  subject: "Concern",
  priority,
  status,
  submittedAt: "2026-10-06T08:00:00+08:00",
  resolvedAt: null,
  updatedAt: null,
  chapter: {
    chapterId: "1",
    schoolName: "Sample University",
    chapterName: "Sample Chapter",
    acronym: "SC",
  },
  submittedBy: {
    userId: "10",
    firstName: "Juan",
    lastName: "Dela Cruz",
    email: "juan@example.com",
  },
  assignedTo: assignedToUserId
    ? {
        userId: assignedToUserId,
        firstName: "Regional",
        lastName: "Officer",
      }
    : null,
});

describe("dashboard helpers", () => {
  it("sorts recent announcements newest first", () => {
    const items: MemberAnnouncement[] = [
      {
        ...baseAnnouncement,
        announcementId: "1",
        title: "Older",
        publishedAt: "2026-10-01T00:00:00+08:00",
      },
      {
        ...baseAnnouncement,
        announcementId: "2",
        title: "Newer",
        publishedAt: "2026-10-05T00:00:00+08:00",
      },
    ];

    expect(recentAnnouncements(items)[0]?.title).toBe("Newer");
  });

  it("keeps only upcoming and ongoing events", () => {
    const completed: EventItem = {
      ...baseEvent,
      eventId: "2",
      status: "Completed",
    };

    expect(upcomingEvents([completed, baseEvent])).toHaveLength(1);
    expect(upcomingEventCount([completed, baseEvent])).toBe(1);
  });

  it("counts all upcoming and ongoing events while limiting the preview", () => {
    const events: EventItem[] = Array.from({ length: 7 }, (_, index) => ({
      ...baseEvent,
      eventId: String(index + 1),
      status: index === 6 ? "Ongoing" : "Upcoming",
    }));
    events.push({ ...baseEvent, eventId: "8", status: "Cancelled" });
    events.push({ ...baseEvent, eventId: "9", status: "Completed" });

    expect(upcomingEvents(events)).toHaveLength(3);
    expect(upcomingEventCount(events)).toBe(7);
    expect(events).toHaveLength(9);
  });

  it("counts only unassigned requests that still need regional action", () => {
    const requests = [
      request("Submitted", "Normal"),
      request("Under Review", "Urgent"),
      request("In Progress", "High"),
      request("Resolved", "Urgent"),
      request("Closed", "Urgent"),
      request("Submitted", "Urgent", "20"),
    ];

    expect(unassignedAssistanceCount(requests)).toBe(3);
    expect(openAssistanceCount(requests)).toBe(4);
    expect(urgentAssistanceCount(requests)).toBe(2);
    expect(assignedAssistanceCount(requests, "20")).toBe(1);
    expect(assignedAssistanceCount(requests, "21")).toBe(0);
  });

  it("keeps only open collaboration posts", () => {
    const closed: CollaborationPost = {
      ...baseCollaboration,
      collaborationPostId: "2",
      status: "Closed",
    };

    expect(recentCollaborations([closed, baseCollaboration])).toHaveLength(1);
  });

  it("summarizes open, assigned, and urgent assistance requests", () => {
    const requests = [
      request("Submitted", "Urgent", "20"),
      request("In Progress", "Normal", "20"),
      request("Closed", "Urgent", "20"),
    ];

    expect(openAssistanceCount(requests)).toBe(2);
    expect(assignedAssistanceCount(requests, "20")).toBe(2);
    expect(urgentAssistanceCount(requests)).toBe(1);
  });
});
