import type { Metadata } from "next";
import { MainNav } from "@/components/navigation/main-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { AuthProvider } from "@/features/auth/auth-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "ICpEP Region 3 Hub",
  description: "Centralized platform for ICpEP Region 3 chapters.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-[0_1px_0_rgba(15,23,42,0.03)] backdrop-blur">
            <MainNav />
          </header>
          {children}
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
