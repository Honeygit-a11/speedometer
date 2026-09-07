import React from "react";
import { SpeedTestContainer } from "@/components/speed-test/SpeedTestContainer";
import { LandingContent } from "@/components/LandingContent";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-10 sm:py-14">
      <div className="w-full flex flex-col items-center space-y-10">
        <LandingContent />
        {/* Master Reactive Speed Test Container */}
        <SpeedTestContainer />
      </div>
    </div>
  );
}
