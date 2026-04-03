"use client";

import { useRef, useState, useCallback } from "react";
import { GeoStampSettings } from "@/hooks/useSettings";
import { useGeolocation } from "@/hooks/useGeolocation";
import { compositeImage } from "@/lib/compositeImage";
import Toast from "./Toast";

interface MainScreenProps {
  settings: GeoStampSettings | null;
  onOpenSettings: () => void;
}

export default function MainScreen({
  settings,
  onOpenSettings,
}: MainScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState(settings?.defaultNote || "");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [processing, setProcessing] = useState(false);
  const { getPosition } = useGeolocation();

  const handleShutter = () => {
    fileInputRef.current?.click();
  };

  const handleCapture = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setProcessing(true);

      let latitude: number | null = null;
      let longitude: number | null = null;

      try {
        const pos = await getPosition();
        latitude = pos.latitude;
        longitude = pos.longitude;
      } catch {
        // GPS unavailable — will stamp as "Location unavailable"
      }

      const now = new Date();

      try {
        const blob = await compositeImage(file, {
          timestamp: now,
          latitude,
          longitude,
          userName: settings?.userName,
          companyName: settings?.companyName,
          note: note || undefined,
          fontSize: settings?.fontSize || "medium",
        });

        // Trigger download
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const dateStr = now
          .toISOString()
          .replace(/[-:T]/g, "")
          .slice(0, 15);
        a.download = `geostamp_${dateStr}.jpg`;
        a.click();
        URL.revokeObjectURL(url);

        // Build toast message
        const coordStr =
          latitude !== null && longitude !== null
            ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            : "Location unavailable";
        const timeStr = now.toLocaleString(undefined, {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        setToast({
          message: `Photo saved — ${coordStr} — ${timeStr}`,
          type: "success",
        });
      } catch {
        setToast({
          message: "Error saving photo. Please try again.",
          type: "error",
        });
      } finally {
        setProcessing(false);
        // Reset file input so the same file can be re-selected
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [getPosition, settings, note]
  );

  return (
    <div className="flex flex-col h-dvh">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="text-xl font-bold">GeoStamp</h1>
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
          aria-label="Settings"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>

      {/* Note input */}
      <div className="px-4 pb-4">
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Enter note…"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Shutter button */}
      <div className="flex justify-center pb-10">
        <button
          onClick={handleShutter}
          disabled={processing}
          className="w-[72px] h-[72px] rounded-full border-4 border-white flex items-center justify-center disabled:opacity-50"
          aria-label="Take photo"
        >
          <div className="w-[58px] h-[58px] rounded-full bg-white" />
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCapture}
      />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
