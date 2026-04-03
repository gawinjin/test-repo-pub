"use client";

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6 text-center">
      <h1 className="text-3xl font-bold mb-4">GeoStamp Camera</h1>
      <p className="text-zinc-400 mb-8 max-w-sm">
        This app stamps your photos with location, time, and notes. Camera and
        location permissions will be requested when needed.
      </p>

      <button
        onClick={onComplete}
        className="bg-white text-black font-semibold px-8 py-3 rounded-full text-lg"
      >
        Get Started
      </button>
    </div>
  );
}
