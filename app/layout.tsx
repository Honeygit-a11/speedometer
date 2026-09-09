import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "SpeedPulse — Accurate Internet Speed Test",
  description: "Test your internet download speed, upload speed, latency, and jitter directly from your browser with edge performance.",
  keywords: ["speed test", "internet speed", "bandwidth test", "ping test", "jitter", "fast speed test"],
  authors: [{ name: "SpeedPulse" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8518009178365659"
          crossOrigin="anonymous"
        />
      </head>
      <body className="flex flex-col min-h-screen antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        <Header />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
