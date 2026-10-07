import { LandingHero } from "@/components/landing/landing-hero";
import { AnnouncementList } from "@/features/announcements/announcement-list";

export default function AnnouncementsPage() {
  return (
    <main>
      <LandingHero
        compact
        description="Official Region 3 updates, advisories, reminders, and important information for ICpEP.se chapters and members."
        eyebrow="Region 3 Updates"
        title="Regional Announcements"
        visualCaption="Stay informed"
        visualLabel="Official updates in one place."
      />
      <section className="mx-auto max-w-6xl px-6 py-12">
        <AnnouncementList />
      </section>
    </main>
  );
}
