"use client";

import { useState } from "react";
import { filterAndPaginate } from "./list-pagination";

export function useSearchPagination<T>(
  items: T[],
  searchText: (item: T) => string,
  pageSize = 6,
) {
  const [query, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const result = filterAndPaginate(items, query, page, searchText, pageSize);

  function setQuery(value: string) {
    setSearch(value);
    setPage(1);
  }

  return { ...result, query, setQuery, setPage };
}
