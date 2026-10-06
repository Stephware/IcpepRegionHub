import Link from "next/link";

const navItems = [
  { href: "/announcements", label: "Announcements" },
  { href: "/events", label: "Events" },
  { href: "/chapters", label: "Chapters" },
  { href: "/assistance", label: "Assistance" },
  { href: "/collaborations", label: "Collaborations" },
];

export function MainNav() {
  return (
    <nav aria-label="Primary navigation" className="flex flex-wrap gap-3">
      {navItems.map((item) => (
        <Link
          className="text-sm font-medium text-slate-700 hover:text-slate-950"
          href={item.href}
          key={item.href}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
