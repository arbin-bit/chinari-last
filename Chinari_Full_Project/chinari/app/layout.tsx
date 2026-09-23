import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chinari — Explore Bharatpur Your Way",
  description: "AI-powered tourism discovery, journey planning and local insight for Bharatpur, Chitwan.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
