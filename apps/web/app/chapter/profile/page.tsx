import { ProtectedRoute } from "@/features/auth/protected-route";
import { ChapterContactForm } from "@/features/chapters/chapter-contact-form";

export default function ChapterProfilePage() {
  return (
    <ProtectedRoute allowedRoles={["ChapterOfficer"]}>
      <main className="mx-auto max-w-2xl px-6 py-10 sm:py-12">
        <h1 className="text-3xl font-semibold text-slate-950">
          Chapter contacts
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          Update your chapter&apos;s public contact details and social link.
        </p>
        <ChapterContactForm />
      </main>
    </ProtectedRoute>
  );
}
