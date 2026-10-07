import Link from "next/link";
import { HubIcon, type HubIconName } from "./hub-icon";

type HeroAction = {
  href: string;
  label: string;
  icon?: HubIconName;
  variant?: "primary" | "secondary";
};

export function LandingHero({
  eyebrow,
  title,
  description,
  actions = [],
  visualLabel,
  visualCaption,
  compact = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: HeroAction[];
  visualLabel?: string;
  visualCaption?: string;
  compact?: boolean;
}) {
  return (
    <section
      className={`relative overflow-hidden bg-[#073fbd] text-white ${
        compact ? "py-12 sm:py-16" : "py-14 sm:py-20 lg:py-24"
      }`}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-12 h-72 w-72 rounded-full border border-cyan-300/20" />
        <div className="absolute -left-20 top-24 h-56 w-56 rounded-full border border-blue-200/15" />
        <div className="absolute right-[8%] top-[-10%] h-96 w-96 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-white/20" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#05266f]/35 to-transparent" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-blue-100 sm:text-sm">
            {eyebrow}
          </p>
          <h1
            className={`mt-4 max-w-3xl font-extrabold tracking-[-0.04em] text-white ${
              compact
                ? "text-4xl sm:text-5xl"
                : "text-5xl leading-[0.95] sm:text-6xl lg:text-7xl"
            }`}
          >
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-blue-50 sm:text-lg">
            {description}
          </p>

          {actions.length ? (
            <div className="mt-7 flex flex-wrap gap-3">
              {actions.map((action) => {
                const secondary = action.variant === "secondary";
                return (
                  <Link
                    className={`inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold shadow-sm transition ${
                      secondary
                        ? "border border-white/50 bg-white text-blue-950 hover:bg-blue-50"
                        : "bg-[#0b5cff] text-white hover:bg-[#0048dc]"
                    }`}
                    href={action.href}
                    key={action.href}
                  >
                    {action.icon ? <HubIcon name={action.icon} /> : null}
                    {action.label}
                    <HubIcon className="h-4 w-4" name="arrow" />
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="hidden lg:flex lg:justify-end">
          <div className="relative flex h-72 w-72 items-center justify-center rounded-full border border-white/20 bg-white/5 shadow-[0_0_80px_rgba(34,211,238,0.18)]">
            <div className="absolute inset-5 rounded-full border border-cyan-200/25" />
            <div className="absolute inset-10 rounded-full border border-white/15" />
            <div className="relative grid h-44 w-44 place-items-center rounded-full border border-white/40 bg-[radial-gradient(circle_at_35%_25%,#7dd3fc_0%,#2563eb_42%,#082f81_100%)] shadow-2xl">
              <div className="text-center">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-blue-100">
                  ICpEP.se
                </p>
                <p className="mt-1 text-5xl font-black tracking-tight text-white">
                  R3
                </p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-100">
                  Student Edition
                </p>
              </div>
            </div>
            {visualCaption ? (
              <p className="absolute -bottom-3 rounded-full border border-white/20 bg-[#062d86]/85 px-4 py-2 text-xs font-medium text-blue-50 backdrop-blur">
                {visualCaption}
              </p>
            ) : null}
            {visualLabel ? (
              <p className="absolute -right-2 top-8 max-w-32 text-sm font-semibold leading-6 text-blue-100">
                {visualLabel}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
