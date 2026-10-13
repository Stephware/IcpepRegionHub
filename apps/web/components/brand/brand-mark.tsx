import { BrandLogo } from "@/components/brand/brand-logo";
import { cn } from "@/lib/utils/cn";

export function BrandMark({
  compact = false,
  inverse = false,
  className,
}: {
  compact?: boolean;
  inverse?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <BrandLogo
        fallbackClassName={cn(
          "h-12 w-12 border shadow-sm",
          inverse ? "border-white/25" : "border-blue-200",
        )}
        priority
      />

      {!compact ? (
        <div className="hidden leading-[1.08] sm:block">
          <p
            className={cn(
              "text-[11px] font-extrabold uppercase tracking-tight lg:text-xs",
              inverse ? "text-white" : "text-[#07164c]",
            )}
          >
            Institute of Computer Engineers
            <span className="block">of the Philippines</span>
          </p>
          <p
            className={cn(
              "mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] lg:text-[11px]",
              inverse ? "text-blue-100" : "text-blue-700",
            )}
          >
            Student Edition · Region 3
          </p>
        </div>
      ) : null}
    </div>
  );
}
