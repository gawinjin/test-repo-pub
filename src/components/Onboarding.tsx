"use client";

import { useState } from "react";

interface OnboardingProps {
  onComplete: () => void;
  requestPermission: () => Promise<void>;
}

export default function Onboarding({
  onComplete,
  requestPermission,
}: OnboardingProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGetStarted = async () => {
    setLoading(true);
    setError(null);
    try {
      await requestPermission();
      onComplete();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Location access is required to stamp your photos. Please enable it in your browser settings."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6 text-center">
      <h1 className="text-3xl font-bold mb-4">GeoStamp Camera</h1>
      <p className="text-zinc-400 mb-8 max-w-sm">
        This app stamps your photos with location, time, and notes. Requires
        camera and location access.
      </p>

      {error && (
        <p className="text-red-400 text-sm mb-4 max-w-sm">{error}</p>
      )}

      <button
        onClick={handleGetStarted}
        disabled={loading}
        className="bg-white text-black font-semibold px-8 py-3 rounded-full text-lg disabled:opacity-50"
      >
        {loading ? "Requesting access…" : error ? "Try Again" : "Get Started"}
      </button>
    </div>
  );
}
