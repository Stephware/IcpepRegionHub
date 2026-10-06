export type CollaborationStatus = "Open" | "Closed" | "Expired";
export type CollaborationResponseStatus =
  | "Pending"
  | "Accepted"
  | "Declined";

export type CollaborationChapter = {
  chapterId: string;
  schoolName: string;
  chapterName: string;
  acronym: string | null;
};

export type CollaborationCreator = {
  userId: string;
  firstName: string;
  lastName: string;
};

export type CollaborationPost = {
  collaborationPostId: string;
  collaborationType: string;
  title: string;
  description: string;
  eventName: string | null;
  eventDate: string | null;
  location: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactNumber: string | null;
  status: CollaborationStatus;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  chapter: CollaborationChapter;
  createdBy: CollaborationCreator;
};

export type CollaborationResponse = {
  collaborationResponseId: string;
  collaborationPostId: string;
  message: string | null;
  status: CollaborationResponseStatus;
  createdAt: string;
  updatedAt: string | null;
  chapter: CollaborationChapter;
  user: CollaborationCreator & {
    email: string;
  };
};

export type CollaborationPostInput = {
  collaborationType: string;
  title: string;
  description: string;
  eventName?: string;
  eventDate?: string | null;
  location?: string;
  contactName?: string;
  contactEmail?: string;
  contactNumber?: string;
  expiresAt?: string | null;
};
