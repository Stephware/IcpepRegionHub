import { LandingHero } from "@/components/landing/landing-hero";
import { ProtectedRoute } from "@/features/auth/protected-route";
import { CollaborationBoard } from "@/features/collaborations/collaboration-board";

export default function CollaborationsPage() {
  return (
    <ProtectedRoute>
      <main>
        <LandingHero
          compact
          description="Find partner chapters, share resources, and coordinate joint initiatives with fellow ICpEP.se organizations across Region 3."
          eyebrow="Work Across Chapters"
          title="Collaboration Board"
          visualCaption="Connect · Partner · Build"
          visualLabel="Turn shared ideas into regional initiatives."
        />
        <section className="mx-auto max-w-7xl px-6 py-12">
          <CollaborationBoard />
        </section>
      </main>
    </ProtectedRoute>
  );
}
