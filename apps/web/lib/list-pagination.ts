export function filterAndPaginate<T>(
  items: T[],
  query: string,
  page: number,
  searchText: (item: T) => string,
  pageSize = 6,
) {
  if (!Number.isInteger(pageSize) || pageSize < 1) {
    throw new RangeError("Page size must be a positive integer.");
  }
  const normalized = query.trim().toLowerCase();
  const filteredItems = normalized
    ? items.filter((item) =>
        searchText(item).toLowerCase().includes(normalized),
      )
    : items;
  const total = filteredItems.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const requestedPage = Number.isFinite(page) ? Math.trunc(page) : 1;
  const safePage = Math.max(1, Math.min(requestedPage, pageCount));

  return {
    items: filteredItems.slice((safePage - 1) * pageSize, safePage * pageSize),
    filteredItems,
    total,
    page: safePage,
    pageCount,
  };
}
