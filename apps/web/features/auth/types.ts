export type UserRole =
  | "RegionalAdmin"
  | "RegionalOfficer"
  | "ChapterOfficer"
  | "FacultyRepresentative";

export const facultyDesignations = [
  "Professor",
  "Faculty Adviser",
  "Program Coordinator",
  "Other",
] as const;
export type FacultyDesignation = (typeof facultyDesignations)[number];
export type PublicRegistrationRole = "ChapterOfficer" | "FacultyRepresentative";

export type AuthUser = {
  userId: string;
  chapterId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  facultyDesignation?: FacultyDesignation | null;
  isApproved?: boolean;
  isActive?: boolean;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  role: PublicRegistrationRole;
  facultyDesignation?: FacultyDesignation;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  chapterId: string;
};
