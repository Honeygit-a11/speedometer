import React from "react";
import type { Metadata } from "next";
import { SpeedTestContainer } from "@/components/speed-test/SpeedTestContainer";
import { LandingContent } from "@/components/LandingContent";
import { HomeEditorialContent } from "@/components/HomeEditorialContent";

export const metadata: Metadata = {
  title: "SpeedPulse — Accurate Internet Speed Test, Latency & Jitter",
  description:
    "Test your internet download speed, upload speed, latency, jitter, and bufferbloat directly from your browser against global edge nodes. 100% ad-free and zero data retention.",
  alternates: {
    canonical: "https://speedpulse.app",
  },
};

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": "https://speedpulse.app/#webapp",
        "name": "SpeedPulse Internet Speed Test",
        "url": "https://speedpulse.app",
        "applicationCategory": "UtilitiesApplication",
        "operatingSystem": "All",
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD",
        },
        "description":
          "High-precision, privacy-first internet speed test platform measuring download, upload, ping, jitter, and bufferbloat against Cloudflare edge servers.",
      },
      {
        "@type": "FAQPage",
        "@id": "https://speedpulse.app/#faq",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What is the difference between Mbps and MB/s?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Internet Service Providers advertise speeds in Megabits per second (Mbps), while file downloads are measured in Megabytes per second (MB/s). Because 1 Byte equals 8 Bits, divide your Mbps speed by 8 to determine download rate in MB/s.",
            },
          },
          {
            "@type": "Question",
            "name": "Why is my speed test result lower than my ISP's advertised plan?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Advertised speeds represent theoretical maximums. Real-world speeds vary due to Wi-Fi signal attenuation, local network congestion, router CPU limits, and ISP transit peering traffic.",
            },
          },
          {
            "@type": "Question",
            "name": "How does SpeedPulse protect user privacy?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "SpeedPulse operates under an architectural Zero-Retention policy: no accounts, no tracking cookies, and upload test packets are immediately discarded from memory with zero database logging.",
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-10 sm:py-14">
        <div className="w-full flex flex-col items-center space-y-12">
          {/* Hero & Intro */}
          <LandingContent />

          {/* Master Reactive Speed Test Container */}
          <SpeedTestContainer />

          {/* In-Depth Educational & Diagnostic Content */}
          <HomeEditorialContent />
        </div>
      </div>
    </>
  );
}
