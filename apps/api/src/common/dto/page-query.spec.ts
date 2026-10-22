import { describe, expect, it } from "@jest/globals";
import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";
import { PageQueryDto, pageMetadata } from "./page-query.dto.js";
import { ListAccountsQueryDto } from "../../users/dto/list-accounts-query.dto.js";
import { PagedRegionalRequestsQueryDto } from "../../assistance-requests/dto/paged-regional-requests-query.dto.js";

describe("Database-backed pagination", () => {
  it("clamps page numbers when records are deleted", () => {
    expect(pageMetadata(14, 5, 6)).toEqual({
      total: 14, page: 3, pageSize: 6, pageCount: 3, skip: 12,
    });
    expect(pageMetadata(0, 10, 6).page).toBe(1);
  });

  it("converts and validates page query parameters", () => {
    const valid = plainToInstance(PageQueryDto, { page: "2", pageSize: "10", search: "chapter" });
    expect(validateSync(valid)).toHaveLength(0);
    expect(valid.page).toBe(2);
    for (const invalid of [
      { page: "0" }, { page: "NaN" }, { page: "-1" },
      { pageSize: "51" }, { pageSize: "1.2" }, { search: "x".repeat(151) },
    ]) {
      expect(validateSync(plainToInstance(PageQueryDto, invalid)).length).toBeGreaterThan(0);
    }
  });

  it("rejects invalid account state and regional filters", () => {
    expect(validateSync(plainToInstance(ListAccountsQueryDto, { filter: "Unknown" })).length).toBeGreaterThan(0);
    expect(validateSync(plainToInstance(PagedRegionalRequestsQueryDto, { priority: "Maximum" })).length).toBeGreaterThan(0);
    expect(validateSync(plainToInstance(PagedRegionalRequestsQueryDto, { page: "2", status: "Submitted" }))).toHaveLength(0);
  });
});
