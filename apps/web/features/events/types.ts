export type EventOrganizer = {
  chapterId: string;
  schoolName: string;
  chapterName: string;
  acronym: string | null;
};

export type EventAuthor = {
  userId: string;
  firstName: string;
  lastName: string;
};

export type EventItem = {
  eventId: string;
  title: string;
  description: string | null;
  eventType: string;
  venue: string | null;
  startDateTime: string;
  endDateTime: string | null;
  registrationDeadline: string | null;
  registrationLink: string | null;
  coverImageUrl: string | null;
  status: "Upcoming" | "Ongoing" | "Completed" | "Cancelled";
  organizer: EventOrganizer | null;
  createdBy: EventAuthor;
};

export type AdminEvent = EventItem & {
  organizerChapterId: string | null;
  storedStatus: string;
  isPublished: boolean;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string | null;
};

export type EventInput = {
  title: string;
  description?: string;
  eventType: string;
  organizerChapterId?: string | null;
  venue?: string;
  startDateTime: string;
  endDateTime?: string | null;
  registrationDeadline?: string | null;
  registrationLink?: string;
  coverImageUrl?: string;
};
