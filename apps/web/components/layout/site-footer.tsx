import Link from "next/link";
import { BrandMark } from "@/components/brand/brand-mark";

export function SiteFooter() {
  return (
    <footer className="border-t border-blue-950/30 bg-[#06296f] text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <BrandMark />
          <p className="mt-4 max-w-xl text-sm leading-6 text-blue-100">
            A unified platform for ICpEP Student Edition – Region 3 chapters,
            built to inform, connect, and collaborate.
          </p>
        </div>

        <div className="grid gap-2 text-sm text-blue-100 sm:grid-cols-3 sm:gap-6">
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
