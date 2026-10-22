import { describe, expect, it } from "vitest";
import { canAccessRole } from "../features/auth/permissions";

describe("authentication permissions", () => {
  it("allows routes without a role restriction", () => {
    expect(canAccessRole("ChapterOfficer")).toBe(true);
  });

  it("allows faculty member pages while keeping official chapter and admin routes restricted", () => {
    expect(canAccessRole("FacultyRepresentative")).toBe(true);
    expect(canAccessRole("FacultyRepresentative", ["ChapterOfficer"])).toBe(
      false,
    );
    expect(
      canAccessRole("FacultyRepresentative", [
        "RegionalAdmin",
        "RegionalOfficer",
      ]),
    ).toBe(false);
    expect(
      canAccessRole("FacultyRepresentative", [
        "ChapterOfficer",
        "FacultyRepresentative",
        "RegionalOfficer",
      ]),
    ).toBe(true);
  });

  it("allows a RegionalAdmin into RegionalAdmin routes", () => {
    expect(canAccessRole("RegionalAdmin", ["RegionalAdmin"])).toBe(true);
  });

  it("blocks a ChapterOfficer from RegionalAdmin routes", () => {
    expect(canAccessRole("ChapterOfficer", ["RegionalAdmin"])).toBe(false);
  });
});
