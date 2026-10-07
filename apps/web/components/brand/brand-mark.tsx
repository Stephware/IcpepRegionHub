import { cn } from "@/lib/utils/cn";

export function BrandMark({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full border border-blue-200 bg-[radial-gradient(circle_at_35%_30%,#7dd3fc_0%,#2563eb_45%,#082f81_100%)] shadow-sm">
        <div className="absolute inset-[5px] rounded-full border border-white/50" />
        <span className="relative text-[10px] font-extrabold tracking-tight text-white">
          R3
        </span>
      </div>

      {!compact ? (
        <div className="hidden leading-tight sm:block">
          <p className="text-[11px] font-extrabold uppercase tracking-tight text-slate-950 lg:text-xs">
            Institute of Computer Engineers
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-blue-700 lg:text-[11px]">
            Student Edition · Region 3
          </p>
        </div>
      ) : null}
    </div>
  );
}
