import { LandingHero } from "@/components/landing/landing-hero";
import { ChapterDirectory } from "@/features/chapters/chapter-directory";

export default function ChaptersPage() {
  return (
    <main>
      <LandingHero
        compact
        description="Explore active ICpEP.se chapters across Region 3 and find their official contact information, officers, and school profiles."
        eyebrow="Connected Chapters"
        title="Chapter Directory"
        visualCaption="One Region, many chapters"
        visualLabel="Find your fellow Computer Engineering communities."
      />
      <section className="mx-auto max-w-6xl px-6 py-12">
        <ChapterDirectory />
      </section>
    </main>
  );
}
