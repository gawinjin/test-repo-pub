"use client";

import { useState } from "react";

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [loading, setLoading] = useState(false);

  const handleGetStarted = async () => {
    setLoading(true);
    // Request both camera and location — but proceed regardless of result
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
    } catch {
      // Camera permission denied or unavailable — proceed anyway
    }
    try {
      await new Promise<void>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(),
          () => resolve(), // resolve even on error
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
        );
      });
    } catch {
      // Geolocation unavailable — proceed anyway
    }
    setLoading(false);
    onComplete();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6 text-center">
      <h1 className="text-3xl font-bold mb-4">GeoStamp Camera</h1>
      <p className="text-zinc-400 mb-8 max-w-sm">
        This app stamps your photos with location, time, and notes. Requires
        camera and location access.
      </p>

      <button
        onClick={handleGetStarted}
        disabled={loading}
        className="bg-white text-black font-semibold px-8 py-3 rounded-full text-lg disabled:opacity-50"
      >
        {loading ? "Requesting access…" : "Get Started"}
      </button>
    </div>
  );
}
