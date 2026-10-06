import { RegisterForm } from "@/features/auth/register-form";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-65px)] w-full max-w-xl flex-col justify-center px-6 py-12">
      <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
        ICpEP Region 3 Hub
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-slate-950">
        Register chapter officer
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        New accounts remain pending until a Regional Admin approves them.
      </p>
      <RegisterForm />
    </main>
  );
}
