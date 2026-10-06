import { describe, expect, it } from "vitest";
import {
  countAssistanceStatuses,
  nextAssistanceStatuses,
} from "../features/assistance/workflow";

describe("assistance workflow", () => {
  it("offers valid next states for a newly submitted request", () => {
    expect(nextAssistanceStatuses("Submitted")).toEqual([
      "Under Review",
      "In Progress",
      "Resolved",
    ]);
  });

  it("only allows a resolved request to reopen or close", () => {
    expect(nextAssistanceStatuses("Resolved")).toEqual([
      "In Progress",
      "Closed",
    ]);
  });

  it("does not allow a closed request to move again", () => {
    expect(nextAssistanceStatuses("Closed")).toEqual([]);
  });

  it("summarizes assistance dashboard statuses", () => {
    expect(
      countAssistanceStatuses([
        "Submitted",
        "Under Review",
        "In Progress",
        "Resolved",
        "Closed",
      ]),
    ).toEqual({
      open: 3,
      submitted: 1,
      inProgress: 2,
      resolved: 2,
    });
  });
});
