import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
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
      className={`relative isolate overflow-hidden text-white ${
        compact ? "py-12 sm:py-16" : "pb-28 pt-14 sm:pb-32 sm:pt-20 lg:pb-36 lg:pt-24"
      }`}
      style={{
        background:
          "linear-gradient(115deg,#032b82 0%,#064fc8 43%,#0879ef 72%,#0ba9f4 100%)",
      }}
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_center,rgba(255,255,255,.75)_1px,transparent_1px)] [background-size:18px_18px] [mask-image:linear-gradient(to_left,black,transparent_72%)]" />
        <div className="absolute -left-[12%] top-[62%] h-56 w-[78%] -rotate-12 bg-[linear-gradient(90deg,transparent,rgba(72,214,255,.46),transparent)] blur-2xl" />
        <div className="absolute left-[18%] top-[6%] h-64 w-[46%] rotate-[18deg] bg-[linear-gradient(90deg,transparent,rgba(45,138,255,.34),transparent)] blur-3xl" />
        <div className="absolute right-[2%] top-[-18%] h-[32rem] w-[32rem] rounded-full bg-cyan-300/15 blur-3xl" />
        <div className="absolute right-[22%] top-[18%] h-[26rem] w-1 rotate-[34deg] bg-gradient-to-b from-transparent via-cyan-200/50 to-transparent blur-[1px]" />
        <div className="absolute right-[30%] top-[12%] h-[24rem] w-px rotate-[34deg] bg-gradient-to-b from-transparent via-white/35 to-transparent" />
      </div>

      <div
        className={`relative mx-auto grid max-w-7xl items-center gap-10 px-6 ${
          compact ? "lg:grid-cols-[1.3fr_0.7fr]" : "lg:grid-cols-[1.12fr_0.88fr]"
        }`}
      >
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-blue-100 sm:text-sm">
            {eyebrow}
          </p>
          <h1
            className={`mt-4 max-w-3xl font-black tracking-[-0.055em] text-white ${
              compact
                ? "text-4xl leading-[1.02] sm:text-5xl"
                : "text-5xl leading-[0.94] sm:text-6xl lg:text-[4.75rem]"
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
                    className={`inline-flex min-h-12 items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold shadow-[0_12px_30px_rgba(2,30,100,.28)] transition hover:-translate-y-0.5 ${
                      secondary
                        ? "border border-white/70 bg-white text-black hover:bg-blue-50 hover:text-black"
                        : "border border-blue-300/30 bg-[#1167ff] text-white hover:bg-[#0758e5]"
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
          <div
            className={`relative flex items-center justify-center ${
              compact ? "h-56 w-full max-w-sm" : "h-80 w-full max-w-md"
            }`}
          >
            <div
              className={`absolute rounded-full border border-white/20 bg-white/8 shadow-[0_0_100px_rgba(34,211,238,.34)] backdrop-blur-sm ${
                compact ? "h-48 w-48" : "h-72 w-72"
              }`}
            />
            <div
              className={`relative rounded-full border border-white/40 bg-white/10 p-3 shadow-2xl ${
                compact ? "h-40 w-40" : "h-64 w-64"
              }`}
            >
              <BrandLogo
                className="drop-shadow-[0_18px_35px_rgba(0,18,80,.35)]"
                fallbackClassName="h-full w-full"
                priority
              />
            </div>

            {!compact && visualLabel ? (
              <p className="absolute right-0 top-10 max-w-40 -rotate-3 whitespace-pre-line text-right text-xl font-semibold italic leading-8 text-white/95">
                {visualLabel}
              </p>
            ) : null}

            {visualCaption ? (
              <p className="absolute bottom-2 rounded-full border border-white/20 bg-[#062d86]/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-blue-50 backdrop-blur">
                {visualCaption}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {!compact ? (
        <svg
          aria-hidden="true"
          className="absolute -bottom-px left-0 h-16 w-full text-[#f8fbff] sm:h-20"
          preserveAspectRatio="none"
          viewBox="0 0 1440 120"
        >
          <path
            d="M0,72 C220,126 420,98 620,86 C850,71 1050,100 1240,88 C1325,83 1390,69 1440,58 L1440,120 L0,120 Z"
            fill="currentColor"
          />
        </svg>
      ) : null}
    </section>
  );
}
