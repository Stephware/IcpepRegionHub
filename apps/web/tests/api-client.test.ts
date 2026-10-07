import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiFetch, clearApiCache } from "../lib/api/client";

afterEach(() => {
  clearApiCache();
  vi.unstubAllGlobals();
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

  it("reuses a recent browser GET response", async () => {
    vi.stubGlobal("window", {});
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ value: 1 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(apiFetch<{ value: number }>("/cached")).resolves.toEqual({
      value: 1,
    });
    await expect(apiFetch<{ value: number }>("/cached")).resolves.toEqual({
      value: 1,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("deduplicates concurrent browser GET requests", async () => {
    vi.stubGlobal("window", {});
    let resolveFetch!: (response: Response) => void;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );

    const first = apiFetch<{ value: number }>("/dedupe");
    const second = apiFetch<{ value: number }>("/dedupe");

    resolveFetch(
      new Response(JSON.stringify({ value: 2 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(first).resolves.toEqual({ value: 2 });
    await expect(second).resolves.toEqual({ value: 2 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("invalidates cached GET data after a successful mutation", async () => {
    vi.stubGlobal("window", {});
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ value: 1 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ value: 2 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    await apiFetch("/resource");
    await apiFetch("/resource", { method: "PATCH", body: "{}" });
    await expect(apiFetch<{ value: number }>("/resource")).resolves.toEqual({
      value: 2,
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
