export function PageHeader({
  eyebrow = "ICpEP Region 3 Hub",
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <header>
      <p className="text-sm font-medium uppercase tracking-wide text-blue-700">
        {eyebrow}
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
        {title}
      </h1>
      {description ? (
        <p className="mt-3 max-w-3xl text-slate-600">{description}</p>
      ) : null}
    </header>
  );
}
