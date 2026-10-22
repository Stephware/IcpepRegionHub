import { describe, expect, it } from "vitest";
import {
  registrationErrors,
  registrationServerErrors,
} from "../features/auth/registration-validation";

const valid = {
  firstName: " Ana ",
  lastName: "Santos",
  email: "ana@example.com",
  password: "secure-password",
  chapterId: "institution-1",
  role: "ChapterOfficer",
  facultyDesignation: "",
};

describe("registration validation", () => {
  it("accepts chapter officers and faculty with an institution and designation", () => {
    expect(registrationErrors(valid)).toEqual({});
    expect(
      registrationErrors({
        ...valid,
        role: "FacultyRepresentative",
        facultyDesignation: "Professor",
      }),
    ).toEqual({});
  });

  it("shows missing and invalid input beside the relevant fields", () => {
    expect(
      registrationErrors({
        ...valid,
        firstName: " ",
        email: "invalid",
        password: "short",
        chapterId: "",
      }),
    ).toEqual({
      firstName: "Enter your first name.",
      email: "Enter a valid email address.",
      password: "Use at least 8 characters.",
      chapterId: "Select an active affiliated institution.",
    });
  });

  it("rejects privileged roles and missing or unknown faculty designations", () => {
    expect(
      registrationErrors({ ...valid, role: "RegionalAdmin" }).role,
    ).toBeTruthy();
    expect(
      registrationErrors({ ...valid, role: "FacultyRepresentative" })
        .facultyDesignation,
    ).toBeTruthy();
    expect(
      registrationErrors({
        ...valid,
        role: "FacultyRepresentative",
        facultyDesignation: "Dean",
      }).facultyDesignation,
    ).toBeTruthy();
  });

  it("places backend validation and conflict messages beside their fields", () => {
    expect(
      registrationServerErrors(
        "email must be an email, password must be longer than or equal to 8 characters",
      ),
    ).toEqual({
      email: "email must be an email",
      password: "password must be longer than or equal to 8 characters",
    });
    expect(
      registrationServerErrors("An account with this email already exists.")
        .email,
    ).toBeTruthy();
    expect(
      registrationServerErrors("chapterId must refer to an active institution.")
        .chapterId,
    ).toBeTruthy();
  });
});
