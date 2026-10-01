import type { Metadata } from "next";
import { Suspense } from "react";
import { Manrope } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { StoreProvider } from "@/features/store/store-provider";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Mobile Store — Smartphones & Accessories", template: "%s | Mobile Store" },
  description: "Shop the latest smartphones and accessories at competitive prices.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={manrope.variable}>
      <body className="antialiased">
        <StoreProvider>
          <Suspense fallback={<div className="h-16 border-b border-line" />}>
            <Navbar />
          </Suspense>
          {children}
          <Footer />
        </StoreProvider>
        <Analytics />
      </body>
    </html>
  );
}
