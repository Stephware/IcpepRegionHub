import { facultyDesignations } from "./types";

type RegistrationFields = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  chapterId: string;
  role: string;
  facultyDesignation: string;
};

export function registrationErrors(form: RegistrationFields) {
  const errors: Partial<Record<keyof RegistrationFields, string>> = {};
  if (!form.firstName.trim()) errors.firstName = "Enter your first name.";
  if (!form.lastName.trim()) errors.lastName = "Enter your last name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
    errors.email = "Enter a valid email address.";
  if (form.password.length < 8) errors.password = "Use at least 8 characters.";
  if (!form.chapterId)
    errors.chapterId = "Select an active affiliated institution.";
  if (!["ChapterOfficer", "FacultyRepresentative"].includes(form.role))
    errors.role = "Select Chapter Officer or Faculty Representative.";
  if (
    form.role === "FacultyRepresentative" &&
    !facultyDesignations.some(
      (designation) => designation === form.facultyDesignation,
    )
  ) {
    errors.facultyDesignation = "Select your faculty designation.";
  }
  return errors;
}

export function registrationServerErrors(message: string) {
  const errors: Partial<Record<keyof RegistrationFields, string>> = {};
  const fields = [
    "firstName",
    "lastName",
    "email",
    "password",
    "chapterId",
    "role",
    "facultyDesignation",
  ] as const;
  for (const field of fields) {
    const matching = message
      .split(
        /, (?=firstName\b|lastName\b|email\b|password\b|chapterId\b|role\b|facultyDesignation\b)/,
      )
      .filter((part) => new RegExp(`\\b${field}\\b`, "i").test(part));
    if (matching.length) errors[field] = matching.join(". ");
  }
  return errors;
}
