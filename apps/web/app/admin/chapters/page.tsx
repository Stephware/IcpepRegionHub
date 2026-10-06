import { ChapterAdminManager } from "@/features/chapters/chapter-admin-manager";

export default function AdminChaptersPage() {
  return (
    <main>
      <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
        Admin Portal
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-slate-950">
        Chapter Management
      </h1>
      <p className="mt-3 max-w-3xl text-slate-600">
        Maintain the Region 3 chapter directory and current officer records.
      </p>
      <ChapterAdminManager />
    </main>
  );
}
