export type AnnouncementAuthor = {
  userId: string;
  firstName: string;
  lastName: string;
};

export type Announcement = {
  announcementId: string;
  title: string;
  content: string;
  category: string;
  coverImageUrl: string | null;
  externalLink: string | null;
  isPinned: boolean;
  publishedAt: string | null;
  expiresAt: string | null;
  createdBy: AnnouncementAuthor;
};

export type MemberAnnouncement = Announcement & {
  visibility: "Public" | "MembersOnly";
};

export type AdminAnnouncement = MemberAnnouncement & {
  isPublished: boolean;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string | null;
};

export type AnnouncementInput = {
  title: string;
  content: string;
  category: string;
  visibility: "Public" | "MembersOnly";
  coverImageUrl?: string;
  externalLink?: string;
  expiresAt?: string | null;
};
