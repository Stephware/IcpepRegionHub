"use client";

import { LandingHero } from "@/components/landing/landing-hero";
import { useAuth } from "@/features/auth/auth-context";
import { EventDirectory } from "@/features/events/event-directory";

export default function EventsPage() {
  const { user } = useAuth();

  return (
    <main>
      <LandingHero
        compact
        actions={user ? [{ href: "/events/new", label: "Create event" }] : []}
        description="Discover assemblies, seminars, competitions, chapter activities, and other opportunities happening across ICpEP.se Region 3."
        eyebrow="Region 3 Calendar"
        title="Regional Events"
        visualCaption="Learn · Meet · Participate"
        visualLabel="Build stronger connections across chapters."
      />
      <section className="mx-auto max-w-7xl px-6 py-12">
        <EventDirectory />
      </section>
    </main>
  );
}
