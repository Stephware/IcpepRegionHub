import { describe, expect, it } from "vitest";
import { collaborationResponseStatusClass } from "../features/collaborations/format";

describe("collaboration response formatting", () => {
  it("uses a pending style for pending responses", () => {
    expect(collaborationResponseStatusClass("Pending")).toContain(
      "text-amber-700",
    );
  });

  it("uses an accepted style for accepted responses", () => {
    expect(collaborationResponseStatusClass("Accepted")).toContain(
      "text-emerald-700",
    );
  });

  it("uses a declined style for declined responses", () => {
    expect(collaborationResponseStatusClass("Declined")).toContain(
      "text-red-700",
    );
  });
});
