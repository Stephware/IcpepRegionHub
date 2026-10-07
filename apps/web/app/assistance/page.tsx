import { LandingHero } from "@/components/landing/landing-hero";
import { ProtectedRoute } from "@/features/auth/protected-route";
import { AssistanceDashboard } from "@/features/assistance/assistance-dashboard";

export default function AssistancePage() {
  return (
    <ProtectedRoute allowedRoles={["ChapterOfficer"]}>
      <main>
        <LandingHero
          compact
          description="Submit chapter concerns to the regional team, monitor progress, and keep every support request organized from submission to resolution."
          eyebrow="Chapter Support"
          title="Request Assistance"
          visualCaption="Regional support"
          visualLabel="A clear path from concern to resolution."
        />

        <section className="border-b border-blue-100 bg-blue-50/60">
          <div className="mx-auto max-w-7xl px-6 py-8">
            <div className="grid gap-3 sm:grid-cols-4">
              {["Submit", "Under Review", "In Progress", "Resolved"].map(
                (step, index) => (
                  <div
                    className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm"
                    key={step}
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                      Step {index + 1}
                    </p>
                    <p className="mt-2 font-semibold text-slate-950">{step}</p>
                  </div>
                ),
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-12">
          <AssistanceDashboard />
        </section>
      </main>
    </ProtectedRoute>
  );
}
