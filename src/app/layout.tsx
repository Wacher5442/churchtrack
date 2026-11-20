import type { Metadata, Viewport } from "next";
import "./globals.css";
import PwaRegister from "@/components/PwaRegister";

export const metadata: Metadata = {
  title: "ChurchTrack",
  description: "Suivi des rapports hebdomadaires d'églises",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ChurchTrack",
  },
};

export const viewport: Viewport = {
  themeColor: "#168866",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="h-full">
      <body className="min-h-full bg-background text-foreground antialiased">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
