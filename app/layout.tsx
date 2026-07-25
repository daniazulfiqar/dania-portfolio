import type { Metadata } from "next";
import { Fraunces, Inter, Caveat } from "next/font/google";
import "./globals.css";
import { CursorTrail } from "@/components/cursor-trail";
import { SiteHeader } from "@/components/site-header";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: "dania siddiqui — product person, problem addict",
  description:
    "i get obsessed with problems — the thinking, the process, the chase. this is where i keep the good ones.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-body bg-paper text-ink">
        <SiteHeader />
        {children}
        <CursorTrail />
      </body>
    </html>
  );
}
