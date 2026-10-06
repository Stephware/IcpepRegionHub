import { describe, expect, it } from "vitest";
import {
  accountState,
  filterAdminAccounts,
} from "../features/admin/accounts/helpers";
import type { AdminAccount } from "../features/admin/accounts/types";

const base: AdminAccount = {
  userId: "1",
  chapterId: "1",
  firstName: "Juan",
  lastName: "Dela Cruz",
  email: "juan@example.com",
  role: "ChapterOfficer",
  isApproved: false,
  isActive: true,
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: null,
  chapter: {
    chapterId: "1",
    schoolName: "Sample University",
    chapterName: "Sample Chapter",
    acronym: "SC",
  },
};

describe("admin account helpers", () => {
  it("identifies pending accounts", () => {
    expect(accountState(base)).toBe("Pending");
  });

  it("identifies rejected accounts", () => {
    expect(
      accountState({
        ...base,
        isActive: false,
      }),
    ).toBe("Rejected");
  });

  it("filters active accounts", () => {
    const active = {
      ...base,
      userId: "2",
      isApproved: true,
      isActive: true,
    };

    expect(filterAdminAccounts([base, active], "Active")).toEqual([active]);
  });
});
