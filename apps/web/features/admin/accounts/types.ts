import type { UserRole } from "@/features/auth/types";

export type AdminAccountChapter = {
  chapterId: string;
  schoolName: string;
  chapterName: string;
  acronym: string | null;
};

export type AdminAccount = {
  userId: string;
  chapterId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isApproved: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  chapter: AdminAccountChapter | null;
};
