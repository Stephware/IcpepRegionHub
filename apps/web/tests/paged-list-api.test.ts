import { afterEach, describe, expect, it, vi } from "vitest";
import { listAdminAccountsPaged } from "../features/admin/accounts/api";
import { listRegionalAssistanceRequestsPaged, getRegionalAssistanceSummary } from "../features/assistance/api";

afterEach(() => vi.restoreAllMocks());

describe("Server-side search and pagination requests", () => {
  it("sends account search, filter and page to the server", async () => {
    const urls: URL[] = [];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      urls.push(new URL(String(input)));
      return new Response(JSON.stringify({ items: [], total: 0, page: 1, pageCount: 1, pageSize: 10 }), { status: 200 });
    });
    await listAdminAccountsPaged({ filter: "Pending", search: " AUF ", page: 3, pageSize: 10 });
    expect(urls[0].pathname).toBe("/api/admin/accounts/paged");
    expect(Object.fromEntries(urls[0].searchParams)).toEqual({ filter: "Pending", search: "AUF", page: "3", pageSize: "10" });
  });

  it("sends combined filters and full-dataset search to the regional endpoint", async () => {
    const urls: URL[] = [];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      urls.push(new URL(String(input)));
      return new Response(JSON.stringify({ items: [], total: 0, page: 1, pageCount: 1, pageSize: 6 }), { status: 200 });
    });
    await listRegionalAssistanceRequestsPaged({ status: "Submitted", priority: "High", chapterId: "2", search: "regional", page: 4, pageSize: 6 });
    expect(urls[0].pathname).toBe("/api/regional/assistance-requests/paged");
    expect(Object.fromEntries(urls[0].searchParams)).toEqual({
      status: "Submitted", priority: "High", chapterId: "2", search: "regional", page: "4", pageSize: "6",
    });
    await getRegionalAssistanceSummary();
    expect(urls[1].pathname).toBe("/api/regional/assistance-requests/summary");
  });
});
