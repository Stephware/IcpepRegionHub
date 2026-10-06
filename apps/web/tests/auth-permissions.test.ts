import { describe, expect, it } from "vitest";
import { canAccessRole } from "../features/auth/permissions";

describe("authentication permissions", () => {
  it("allows routes without a role restriction", () => {
    expect(canAccessRole("ChapterOfficer")).toBe(true);
  });

  it("allows a RegionalAdmin into RegionalAdmin routes", () => {
    expect(canAccessRole("RegionalAdmin", ["RegionalAdmin"])).toBe(true);
  });

  it("blocks a ChapterOfficer from RegionalAdmin routes", () => {
    expect(canAccessRole("ChapterOfficer", ["RegionalAdmin"])).toBe(false);
  });
});
