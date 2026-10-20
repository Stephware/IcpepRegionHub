"use client";

/* eslint-disable @next/next/no-img-element */
import React, { useState } from "react";
import { officerInitials } from "./display";

export function OfficerPhoto({
  fullName,
  photoUrl,
}: {
  fullName: string;
  photoUrl: string | null;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);

  if (photoUrl && photoUrl !== failedSource) {
    return (
      <img
        alt={fullName}
        className="h-16 w-16 rounded-full border border-slate-200 object-cover"
        loading="lazy"
        onError={() => setFailedSource(photoUrl)}
        referrerPolicy="no-referrer"
        src={photoUrl}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-lg font-semibold text-blue-700"
    >
      {officerInitials(fullName)}
    </div>
  );
}
