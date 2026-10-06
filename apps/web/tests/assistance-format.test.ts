import { describe, expect, it } from "vitest";
import {
  assistancePriorityClass,
  assistanceStatusClass,
  formatAssistanceDate,
} from "../features/assistance/format";

describe("assistance formatting", () => {
  it("uses an urgent style for urgent requests", () => {
    expect(assistancePriorityClass("Urgent")).toContain("text-red-700");
  });

  it("uses a resolved style for completed requests", () => {
    expect(assistanceStatusClass("Resolved")).toContain("text-emerald-700");
  });

  it("formats valid assistance dates", () => {
    expect(
      formatAssistanceDate("2026-10-06T08:00:00+08:00"),
    ).not.toBe("2026-10-06T08:00:00+08:00");
  });
});
