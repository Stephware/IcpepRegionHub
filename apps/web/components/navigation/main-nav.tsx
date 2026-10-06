"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-context";

const publicItems = [
  { href: "/announcements", label: "Announcements" },
  { href: "/events", label: "Events" },
  { href: "/chapters", label: "Chapters" },
];

export function MainNav() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace("/");
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
      <Link className="font-semibold text-slate-950" href="/">
        ICpEP Region 3 Hub
      </Link>

      <nav aria-label="Primary navigation" className="flex flex-wrap items-center gap-4">
        {publicItems.map((item) => (
          <Link
            className="text-sm font-medium text-slate-700 hover:text-slate-950"
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        ))}

        {user ? (
          <>
            <Link
              className="text-sm font-medium text-slate-700 hover:text-slate-950"
              href="/dashboard"
            >
              Dashboard
            </Link>
            {user.role === "ChapterOfficer" ? (
              <Link
                className="text-sm font-medium text-slate-700 hover:text-slate-950"
                href="/assistance"
              >
                Assistance
              </Link>
            ) : null}
            <Link
              className="text-sm font-medium text-slate-700 hover:text-slate-950"
              href="/collaborations"
            >
              Collaborations
            </Link>
            {user.role === "RegionalAdmin" ||
            user.role === "RegionalOfficer" ? (
              <Link
                className="text-sm font-medium text-slate-700 hover:text-slate-950"
                href="/regional/assistance"
              >
                Regional Assistance
              </Link>
            ) : null}
            {user.role === "RegionalAdmin" ? (
              <Link
                className="text-sm font-medium text-slate-700 hover:text-slate-950"
                href="/admin"
              >
                Admin
              </Link>
            ) : null}
            <span className="hidden text-sm text-slate-500 md:inline">
              {user.firstName} {user.lastName}
            </span>
            <button
              className="text-sm font-medium text-teal-700 hover:text-teal-900"
              onClick={() => void handleLogout()}
              type="button"
            >
              Sign out
            </button>
          </>
        ) : !loading ? (
          <>
            <Link className="text-sm font-medium text-teal-700" href="/login">
              Sign in
            </Link>
            <Link
              className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white"
              href="/register"
            >
              Register
            </Link>
          </>
        ) : null}
      </nav>
    </div>
  );
}
