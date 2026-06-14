import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Clerkship — Pediatric Case Builder",
  description: "Chip-based pediatric history taking that drafts a verified clerkship report.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Clerkship" },
};

export const viewport: Viewport = {
  themeColor: "#0d7d7d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="no-print sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-bold">
              <span className="inline-grid h-7 w-7 place-items-center rounded-lg bg-[var(--accent)] text-white">℞</span>
              Clerkship
            </Link>
            <span className="text-xs text-[var(--muted)]">Pediatrics</span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5">{children}</main>
        <footer className="no-print mx-auto w-full max-w-3xl px-4 py-6 text-center text-xs text-[var(--muted)]">
          Educational tool. Verify all AI output. Avoid identifiers in screenshots.
        </footer>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
