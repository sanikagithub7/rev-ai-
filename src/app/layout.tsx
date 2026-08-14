import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "REV AI — AI Sales Autopilot",
  description: "Your AI-Powered Sales & Automation Team. Capture, score, qualify, and convert leads automatically.",
  keywords: ["AI Sales", "Autopilot", "Sales Automation", "Lead Intelligence", "Multi-Tenant SaaS"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen swiss-grid-bg text-black selection:bg-[#12B76A] selection:text-white">
        {children}
      </body>
    </html>
  );
}
