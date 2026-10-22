import { ProtectedRoute } from "@/features/auth/protected-route";
import { AccountProfile } from "@/features/auth/account-profile";

export default function AccountPage() {
  return (
    <ProtectedRoute>
      <main className="mx-auto max-w-2xl px-6 py-10 sm:py-12">
        <h1 className="text-3xl font-semibold text-slate-950">Your account</h1>
        <p className="mt-3 text-sm text-slate-600">
          Keep your basic contact information up to date.
        </p>
        <AccountProfile />
      </main>
    </ProtectedRoute>
  );
}
