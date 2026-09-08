import { ImageResponse } from "next/og";

export const contentType = "image/svg+xml";
export const size = { width: 32, height: 32 };
export const alt = "SpeedPulse";

export default function Icon() {
  return new ImageResponse(
    (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        width={32}
        height={32}
      >
        <circle cx="16" cy="16" r="15" fill="#0f172a" stroke="#22d3ee" strokeWidth="1.5" />
        <path
          d="M6 22 A12 12 0 0 1 26 22"
          fill="none"
          stroke="#334155"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M6 22 A12 12 0 0 1 20 6.5"
          fill="none"
          stroke="#22d3ee"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="16" cy="22" r="2" fill="#22d3ee" />
        <line x1="16" y1="22" x2="20" y2="8" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    { ...size }
  );
}
