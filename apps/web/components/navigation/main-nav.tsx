"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { BrandMark } from "@/components/brand/brand-mark";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-context";
import { cn } from "@/lib/utils/cn";

const publicItems = [
  { href: "/", label: "Home" },
  { href: "/announcements", label: "Announcements" },
  { href: "/events", label: "Events" },
  { href: "/chapters", label: "Chapters" },
];

export function MainNav() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    setOpen(false);
    await logout();
    router.replace("/");
  }

  function navLinkClass(href: string) {
    const active =
      href === "/"
        ? pathname === href
        : pathname === href || pathname.startsWith(`${href}/`);

    return cn(
      "relative whitespace-nowrap rounded-md px-2 py-2 text-sm font-medium transition",
      active
        ? "text-blue-700 after:absolute after:inset-x-2 after:-bottom-3 after:h-0.5 after:rounded-full after:bg-blue-600"
        : "text-slate-700 hover:text-blue-700",
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6">
      <div className="flex min-h-12 items-center justify-between gap-4">
        <Link href="/" onClick={() => setOpen(false)}>
          <BrandMark />
        </Link>

        <Button
          aria-expanded={open}
          aria-label="Toggle navigation"
          className="md:hidden"
          onClick={() => setOpen((current) => !current)}
          size="sm"
          variant="secondary"
        >
          {open ? "Close" : "Menu"}
        </Button>

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-3 md:flex"
        >
          <NavItems
            loading={loading}
            navLinkClass={navLinkClass}
            onNavigate={() => setOpen(false)}
            onSignOut={handleLogout}
            user={user}
          />
        </nav>
      </div>

      {open ? (
        <nav
          aria-label="Mobile navigation"
          className="mt-3 grid gap-1 border-t border-slate-200 pt-3 md:hidden"
        >
          <NavItems
            loading={loading}
            navLinkClass={(href) =>
              cn(
                "rounded-lg px-3 py-2.5 text-sm font-medium",
                pathname === href || (href !== "/" && pathname.startsWith(`${href}/`))
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-700 hover:bg-slate-50",
              )
            }
            onNavigate={() => setOpen(false)}
            onSignOut={handleLogout}
            user={user}
          />
        </nav>
      ) : null}
    </div>
  );
}

function NavItems({
  user,
  loading,
  navLinkClass,
  onNavigate,
  onSignOut,
}: {
  user: ReturnType<typeof useAuth>["user"];
  loading: boolean;
  navLinkClass(href: string): string;
  onNavigate(): void;
  onSignOut(): Promise<void>;
}) {
  return (
    <>
      {publicItems.map((item) => (
        <Link
          className={navLinkClass(item.href)}
          href={item.href}
          key={item.href}
          onClick={onNavigate}
        >
          {item.label}
        </Link>
      ))}

      {user ? (
        <>
          <Link
            className={navLinkClass("/collaborations")}
            href="/collaborations"
            onClick={onNavigate}
          >
            Collaborations
          </Link>

          {user.role === "ChapterOfficer" ? (
            <Link
              className={navLinkClass("/assistance")}
              href="/assistance"
              onClick={onNavigate}
            >
              Assistance
            </Link>
          ) : null}

          <Link
            className={navLinkClass("/dashboard")}
            href="/dashboard"
            onClick={onNavigate}
          >
            Dashboard
          </Link>

          {user.role === "RegionalAdmin" ||
          user.role === "RegionalOfficer" ? (
            <Link
              className={navLinkClass("/regional/assistance")}
              href="/regional/assistance"
              onClick={onNavigate}
            >
              Regional
            </Link>
          ) : null}

          {user.role === "RegionalAdmin" ? (
            <Link
              className={navLinkClass("/admin")}
              href="/admin"
              onClick={onNavigate}
            >
              Admin
            </Link>
          ) : null}

          <button
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            onClick={() => void onSignOut()}
            type="button"
          >
            Sign out
          </button>
        </>
      ) : !loading ? (
        <>
          <Link
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            href="/login"
            onClick={onNavigate}
          >
            Sign In
          </Link>
        </>
      ) : null}
    </>
  );
}
