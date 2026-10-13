import Link from "next/link";
import { BrandMark } from "@/components/brand/brand-mark";

export function SiteFooter() {
  return (
    <footer className="border-t border-blue-950/30 bg-[#06296f] text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-9 lg:grid-cols-[1.15fr_1fr] lg:items-center">
        <div>
          <BrandMark inverse />
          <p className="mt-4 max-w-xl text-sm leading-6 text-blue-100">
            A unified platform for ICpEP Student Edition – Region 3 chapters,
            built to inform, connect, and collaborate.
          </p>
        </div>

        <div className="grid gap-3 text-sm text-blue-100 sm:grid-cols-3 sm:gap-6 lg:border-l lg:border-white/20 lg:pl-8">
          <span>Facebook · ICpEP.se Region 3</span>
          <Link
            className="hover:text-white"
            href="mailto:regioniii.icpepse@gmail.com"
          >
            regioniii.icpepse@gmail.com
          </Link>
          <span>Instagram · icpepse.r3</span>
        </div>
      </div>
    </footer>
  );
}
