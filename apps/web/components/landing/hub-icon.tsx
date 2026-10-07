import { cn } from "@/lib/utils/cn";

export type HubIconName =
  | "announcement"
  | "calendar"
  | "chapters"
  | "collaboration"
  | "assistance"
  | "arrow"
  | "location"
  | "clock";

export function HubIcon({
  name,
  className,
}: {
  name: HubIconName;
  className?: string;
}) {
  const common = {
    className: cn("h-5 w-5", className),
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.9,
    viewBox: "0 0 24 24",
    "aria-hidden": true,
  };

  if (name === "announcement") {
    return (
      <svg {...common}>
        <path d="M4 13h3l8 4V5L7 9H4v4Z" />
        <path d="M7 13l1.5 5h3" />
        <path d="M18 8.5c1 .8 1.5 2 1.5 3.5S19 14.7 18 15.5" />
      </svg>
    );
  }

  if (name === "calendar") {
    return (
      <svg {...common}>
        <rect height="16" rx="2" width="18" x="3" y="5" />
        <path d="M7 3v4M17 3v4M3 10h18" />
        <path d="M8 14h2M14 14h2M8 18h2" />
      </svg>
    );
  }

  if (name === "chapters") {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="3" />
        <circle cx="5" cy="11" r="2" />
        <circle cx="19" cy="11" r="2" />
        <path d="M7 20v-1.5a5 5 0 0 1 10 0V20M2 20v-1a4 4 0 0 1 4-4h1M22 20v-1a4 4 0 0 0-4-4h-1" />
      </svg>
    );
  }

  if (name === "collaboration") {
    return (
      <svg {...common}>
        <path d="m8.5 12 2.2 2.2a2 2 0 0 0 2.8 0l4.8-4.8a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0L12 7.7" />
        <path d="m15.5 12-2.2 2.2a2 2 0 0 1-2.8 0L5.7 9.4a2 2 0 0 1 0-2.8l1.2-1.2a2 2 0 0 1 2.8 0L12 7.7" />
        <path d="m7 14-2 2 3 3 2-2M17 14l2 2-3 3-2-2" />
      </svg>
    );
  }

  if (name === "assistance") {
    return (
      <svg {...common}>
        <path d="M12 3a7 7 0 0 0-7 7v2a3 3 0 0 0 3 3h1v-5H5" />
        <path d="M12 3a7 7 0 0 1 7 7v2a3 3 0 0 1-3 3h-1v-5h4" />
        <path d="M15 18h-3a2 2 0 0 1-2-2" />
      </svg>
    );
  }

  if (name === "location") {
    return (
      <svg {...common}>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    );
  }

  if (name === "clock") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M5 12h14M14 7l5 5-5 5" />
    </svg>
  );
}
