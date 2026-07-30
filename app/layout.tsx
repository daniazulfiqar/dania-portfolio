import type { Metadata } from "next";
import { Caveat, Poppins } from "next/font/google";
import "./globals.css";
import { CursorTrail } from "@/components/cursor-trail";
import { SiteHeader } from "@/components/site-header";

// poppins carries everything on the site — body copy, headings, the lot.
// caveat is the only exception: the handwritten bits.
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://daniasiddiqui.vercel.app"),
  title: "hi, i'm dania - senior product manager + builder",
  description:
    "my work sits at the intersection of problem solving, using agents to execute almost everything, and building products that actually sell.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-body bg-paper text-ink">
        <SiteHeader />
        {children}
        <CursorTrail />
      </body>
    </html>
  );
}
