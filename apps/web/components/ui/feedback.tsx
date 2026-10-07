import { Card } from "./card";

export function Alert({
  tone,
  children,
}: {
  tone: "error" | "success" | "info";
  children: React.ReactNode;
}) {
  const toneClass =
    tone === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : tone === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
        : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <div className={"rounded-lg border px-4 py-3 text-sm " + toneClass}>
      {children}
    </div>
  );
}

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <Card className="p-8 text-center">
      <div
        aria-hidden="true"
        className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-700"
      />
      <p className="mt-3 text-sm text-slate-600">{label}</p>
    </Card>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <p className="font-medium text-slate-900">{title}</p>
      {description ? (
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
          {description}
        </p>
      ) : null}
    </div>
  );
}
