"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/accounts", label: "Accounts" },
  { href: "/admin/chapters", label: "Chapters" },
  { href: "/admin/announcements", label: "Announcements" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/assistance", label: "Assistance" },
  { href: "/admin/collaborations", label: "Collaborations" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm lg:sticky lg:top-6 lg:self-start">
      <p className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-slate-500">
        Admin Portal
      </p>
      <nav
        aria-label="Admin navigation"
        className="mt-1 flex gap-1 overflow-x-auto pb-1 lg:grid lg:overflow-visible lg:pb-0"
      >
        {items.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              className={`whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-blue-50 text-blue-800"
                  : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"
              }`}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
