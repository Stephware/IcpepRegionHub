import { afterEach, describe, expect, it, vi } from "vitest";
import { changeAdminAccountRole } from "../features/admin/accounts/api";

afterEach(() => vi.restoreAllMocks());

describe("account role requests", () => {
  it("keeps faculty affiliation and designation in the role request", async () => {
    const requests: RequestInit[] = [];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
      requests.push(init!);
      return new Response(JSON.stringify({ message: "Updated", user: {} }), {
        status: 200,
      });
    });
    await changeAdminAccountRole(
      "account-1",
      "FacultyRepresentative",
      "institution-1",
      "Faculty Adviser",
    );
    expect(JSON.parse(requests[0].body as string)).toEqual({
      role: "FacultyRepresentative",
      chapterId: "institution-1",
      facultyDesignation: "Faculty Adviser",
    });
    await changeAdminAccountRole(
      "account-1",
      "RegionalOfficer",
      "institution-1",
      "Faculty Adviser",
    );
    expect(JSON.parse(requests[1].body as string)).toEqual({
      role: "RegionalOfficer",
    });
  });
});
