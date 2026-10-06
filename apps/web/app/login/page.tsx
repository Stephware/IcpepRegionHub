import { LoginForm } from "@/features/auth/login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-65px)] w-full max-w-md flex-col justify-center px-6 py-12">
      <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
        ICpEP Region 3 Hub
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-slate-950">Sign in</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Use an approved regional or chapter-officer account.
      </p>
      <LoginForm />
    </main>
  );
}
