import { Button } from "./button";

export function Pagination({
  page,
  pageCount,
  onPageChange,
  label = "Pagination",
}: {
  page: number;
  pageCount: number;
  onPageChange(page: number): void;
  label?: string;
}) {
  if (pageCount <= 1) {
    return null;
  }

  return (
    <nav
      aria-label={label}
      className="mt-6 flex flex-wrap items-center justify-between gap-3"
    >
      <Button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        variant="secondary"
      >
        Previous
      </Button>
      <p className="text-sm text-slate-600">
        Page <span className="font-medium text-slate-900">{page}</span> of{" "}
        {pageCount}
      </p>
      <Button
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
        variant="secondary"
      >
        Next
      </Button>
    </nav>
  );
}
