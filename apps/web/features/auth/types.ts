export type UserRole =
  | "RegionalAdmin"
  | "RegionalOfficer"
  | "ChapterOfficer";

export type AuthUser = {
  userId: string;
  chapterId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isApproved?: boolean;
  isActive?: boolean;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  chapterId: string;
};
