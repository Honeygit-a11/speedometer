import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://speedpulse.app"),
  title: {
    default: "SpeedPulse — Accurate Internet Speed Test, Latency & Jitter",
    template: "%s | SpeedPulse",
  },
  description:
    "Free, independent, high-precision internet speed test. Measure download, upload, ping latency, RFC 3550 jitter, and bufferbloat directly from your browser with zero data retention.",
  keywords: [
    "speed test",
    "internet speed test",
    "bandwidth test",
    "ping test",
    "jitter test",
    "bufferbloat test",
    "wifi speed test",
    "download speed",
    "upload speed",
    "fast speed test",
  ],
  authors: [{ name: "SpeedPulse Diagnostics" }],
  creator: "SpeedPulse",
  publisher: "SpeedPulse",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://speedpulse.app",
    title: "SpeedPulse — Accurate Internet Speed Test, Latency & Jitter",
    description:
      "Measure your real download, upload, ping, and bufferbloat directly from your browser to Cloudflare edge nodes.",
    siteName: "SpeedPulse",
  },
  twitter: {
    card: "summary_large_image",
    title: "SpeedPulse — Accurate Internet Speed Test",
    description:
      "Measure your real download, upload, ping, and bufferbloat directly from your browser to Cloudflare edge nodes.",
  },
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
