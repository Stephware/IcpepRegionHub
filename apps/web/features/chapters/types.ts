export type Chapter = {
  chapterId: string;
  schoolName: string;
  chapterName: string;
  acronym: string | null;
  officialEmail: string | null;
  contactNumber: string | null;
  address: string | null;
  logoUrl: string | null;
  facebookUrl: string | null;
};

export type AdminChapter = Chapter & {
  status: string;
  createdAt: string;
  updatedAt: string | null;
};

export type ChapterOfficer = {
  chapterOfficerId: string;
  fullName: string;
  position: string;
  email: string | null;
  contactNumber: string | null;
  academicYear: string;
};

export type AdminChapterOfficer = ChapterOfficer & {
  chapterId: string;
  userId: string | null;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string | null;
};

export type ChapterInput = {
  schoolName: string;
  chapterName: string;
  acronym?: string;
  officialEmail?: string;
  contactNumber?: string;
  address?: string;
  logoUrl?: string;
  facebookUrl?: string;
};

export type ChapterOfficerInput = {
  userId?: string;
  fullName: string;
  position: string;
  email?: string;
  contactNumber?: string;
  academicYear: string;
};
