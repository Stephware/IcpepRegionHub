import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiFetch } from "../lib/api/client";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("apiFetch", () => {
  it("sends requests with cookies and JSON headers", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await apiFetch<{ ok: boolean }>("/test", {
      method: "POST",
      body: JSON.stringify({ value: 1 }),
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/api/test",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      }),
    );
  });

  it("joins validation messages returned by the API", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          message: ["Email is invalid", "Password is too short"],
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    await expect(apiFetch("/test")).rejects.toEqual(
      new ApiError("Email is invalid, Password is too short", 400),
    );
  });

  it("handles successful 204 responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 204 }),
    );

    await expect(apiFetch("/test")).resolves.toBeUndefined();
  });
});
