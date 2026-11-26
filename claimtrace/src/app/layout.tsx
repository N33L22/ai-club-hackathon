import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ClaimTrace: every claim, traced to its source",
    template: "%s · ClaimTrace",
  },
  description:
    "A reference manager and AI research assistant that checks every citation: does it exist, do the details match, and does the source actually say what the claim says.",
  applicationName: "ClaimTrace",
  authors: [{ name: "Team 6: Neel, Mohit, Anand" }],
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${geist.variable} ${geistMono.variable} ${newsreader.variable} h-full`}>
      <body className="min-h-full bg-white font-sans text-ink-950">
        <TooltipProvider delayDuration={250}>{children}</TooltipProvider>
        {/* above the Previous / Next bar at the bottom of the workflow pages */}
        <Toaster position="bottom-right" richColors={false} closeButton offset={{ bottom: 76, right: 24 }} mobileOffset={{ bottom: 72 }} />
      </body>
    </html>
  );
}
