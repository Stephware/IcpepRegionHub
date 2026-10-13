"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { cn } from "@/lib/utils/cn";

const LOGO_SRC = "/assets/branding/icpep-region3-logo.svg";

export function BrandLogo({
  className,
  fallbackClassName,
  priority = false,
}: {
  className?: string;
  fallbackClassName?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-full",
        fallbackClassName,
      )}
    >
      <span className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_35%_30%,#7dd3fc_0%,#2563eb_45%,#082f81_100%)] text-[11px] font-black tracking-tight text-white">
        R3
      </span>

      {!failed ? (
        <img
          alt="ICpEP Student Edition Region 3"
          className={cn(
            "relative z-10 h-full w-full object-contain",
            className,
          )}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          onError={() => setFailed(true)}
          src={LOGO_SRC}
        />
      ) : null}
    </span>
  );
}
