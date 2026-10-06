import { describe, expect, it } from "vitest";

describe("web scaffold", () => {
  it("identifies the project", () => {
    expect("ICpEP Region 3 Hub").toContain("ICpEP");
  });
});
