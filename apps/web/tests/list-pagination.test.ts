import { describe, expect, it } from "vitest";
import { filterAndPaginate } from "../lib/list-pagination";

const records = Array.from({ length: 14 }, (_, index) => ({
  id: index + 1,
  title:
    index === 13 ? "Faculty Research Seminar" : `Chapter event ${index + 1}`,
  institution:
    index === 13 ? "Angeles University Foundation" : "Bulacan State University",
}));
const text = (record: (typeof records)[number]) =>
  `${record.title} ${record.institution}`;

describe("list search and pagination", () => {
  it("searches the entire collection before taking a page", () => {
    const result = filterAndPaginate(
      records,
      "  FACULTY research  ",
      1,
      text,
      6,
    );
    expect(result.items.map((item) => item.id)).toEqual([14]);
    expect(result.total).toBe(1);
    expect(result.pageCount).toBe(1);
  });

  it("searches the supplied institutional fields", () => {
    expect(filterAndPaginate(records, "angeles", 1, text).items[0].id).toBe(14);
  });

  it("preserves source order and covers each record once across pages", () => {
    const pages = [1, 2, 3].flatMap((page) =>
      filterAndPaginate(records, "", page, text, 6).items.map(
        (item) => item.id,
      ),
    );
    expect(pages).toEqual(records.map((item) => item.id));
    expect(filterAndPaginate(records, "", 3, text, 6).items).toHaveLength(2);
    expect(records).toHaveLength(14);
  });

  it("clamps the current page after filtering or deleting records", () => {
    const result = filterAndPaginate(records.slice(0, 7), "", 3, text, 6);
    expect(result.page).toBe(2);
    expect(result.items.map((item) => item.id)).toEqual([7]);
    expect(filterAndPaginate(records, "seminar", 3, text, 6).page).toBe(1);
  });

  it("provides all matching records for calendar views", () => {
    const result = filterAndPaginate(records, "chapter", 2, text, 6);
    expect(result.filteredItems).toHaveLength(13);
    expect(result.items).toHaveLength(6);
    expect(result.total).toBe(13);
  });

  it("returns a valid empty page for no matches and empty collections", () => {
    for (const result of [
      filterAndPaginate(records, "no matching entry", 3, text),
      filterAndPaginate([], "", 1, text),
    ]) {
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.page).toBe(1);
      expect(result.pageCount).toBe(1);
    }
  });

  it.each([0, -2, Number.NaN, Number.POSITIVE_INFINITY])(
    "handles an invalid page: %s",
    (page) => {
      expect(filterAndPaginate(records, "", page, text).page).toBe(1);
    },
  );

  it.each([0, -1, 1.5])("rejects an invalid page size: %s", (pageSize) => {
    expect(() => filterAndPaginate(records, "", 1, text, pageSize)).toThrow(
      RangeError,
    );
  });
});
