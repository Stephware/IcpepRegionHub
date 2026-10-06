import { ChapterDirectory } from "@/features/chapters/chapter-directory";

export default function ChaptersPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
        ICpEP Region 3 Hub
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-slate-950">
        Chapter Directory
      </h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        Browse active ICpEP.se chapters across Region 3 and view their current
        officers and official contact information.
      </p>
      <ChapterDirectory />
    </main>
  );
}
