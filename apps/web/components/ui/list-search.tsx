import { Input } from "./form-controls";

export function ListSearch({
  label,
  query,
  onQueryChange,
  total,
  placeholder = "Search records",
}: {
  label: string;
  query: string;
  onQueryChange(query: string): void;
  total: number;
  placeholder?: string;
}) {
  return (
    <div className="my-4 max-w-xl">
      <label className="block text-sm font-medium text-slate-800">
        {label}
        <Input
          type="search"
          value={query}
          placeholder={placeholder}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </label>
      <p className="mt-2 text-xs text-slate-500" role="status">
        {total} {total === 1 ? "result" : "results"}
      </p>
    </div>
  );
}
