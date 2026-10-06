import type { Metadata } from "next";
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
      <body>{children}</body>
    </html>
  );
}
