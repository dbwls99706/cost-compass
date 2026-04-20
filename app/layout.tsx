import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { LineChart } from "lucide-react";

import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cost Compass",
  description: "본부·프로젝트 원가 분석 대시보드",
};

const NAV = [
  { href: "/", label: "대시보드", disabled: false },
  { href: "/projects", label: "프로젝트", disabled: false },
  { href: "#", label: "본부", disabled: true },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-muted/30">
        <header className="border-b bg-background">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-md bg-indigo-600 text-white">
                <LineChart className="size-4" />
              </span>
              <span className="text-base font-semibold tracking-tight">
                Cost Compass
              </span>
            </Link>
            <nav className="flex items-center gap-1">
              {NAV.map((item) =>
                item.disabled ? (
                  <span
                    key={item.label}
                    className="px-3 py-1.5 text-sm text-muted-foreground/60 cursor-not-allowed"
                    aria-disabled
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="px-3 py-1.5 text-sm text-foreground/80 hover:text-foreground hover:bg-muted rounded-md transition-colors"
                  >
                    {item.label}
                  </Link>
                ),
              )}
            </nav>
          </div>
        </header>
        <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
          {children}
        </main>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
