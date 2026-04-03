"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { GeoStampSettings } from "@/hooks/useSettings";
import { compositeImage } from "@/lib/compositeImage";
import Toast from "./Toast";

interface MainScreenProps {
  settings: GeoStampSettings | null;
  onOpenSettings: () => void;
}

interface GeoPos {
  latitude: number;
  longitude: number;
}

export default function MainScreen({
  settings,
  onOpenSettings,
}: MainScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [note, setNote] = useState(settings?.defaultNote || "");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [position, setPosition] = useState<GeoPos | null>(null);
  const [gpsStatus, setGpsStatus] = useState("Requesting GPS…");
  const [cameraReady, setCameraReady] = useState(false);

  // Start camera stream
  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setCameraReady(true);
        }
      } catch {
        // Camera unavailable — will use file input fallback
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Track GPS position — try watchPosition first, fall back to polling getCurrentPosition
  useEffect(() => {
    let active = true;
    let watchId: number | null = null;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;

    if (!navigator.geolocation) {
      setGpsStatus("GPS not supported");
      return;
    }

    // Try watchPosition
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (!active) return;
        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setGpsStatus("");
      },
      (err) => {
        if (!active) return;
        if (err.code === err.PERMISSION_DENIED) {
          setGpsStatus("GPS denied — go to Settings > Safari > Location and set to Allow");
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setGpsStatus("GPS signal unavailable");
        } else if (err.code === err.TIMEOUT) {
          setGpsStatus("GPS timed out — retrying…");
        }
        // Also poll with getCurrentPosition as fallback
        startPolling();
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );

    function startPolling() {
      if (!active || pollTimer) return;
      const poll = () => {
        if (!active) return;
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (!active) return;
            setPosition({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            });
            setGpsStatus("");
          },
          () => {
            // Keep retrying
            if (active) pollTimer = setTimeout(poll, 5000);
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 120000 }
        );
      };
      poll();
    }

    return () => {
      active = false;
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, []);

  const handleShutter = useCallback(() => {
    if (cameraReady && videoRef.current) {
      captureFromVideo();
    } else {
      fileInputRef.current?.click();
    }
  }, [cameraReady]);

  const captureFromVideo = useCallback(async () => {
    const video = videoRef.current;
    if (!video || processing) return;

    setProcessing(true);

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setToast({ message: "Error saving photo. Please try again.", type: "error" });
      setProcessing(false);
      return;
    }
    ctx.drawImage(video, 0, 0);

    const now = new Date();
    const lat = position?.latitude ?? null;
    const lon = position?.longitude ?? null;

    try {
      const sourceBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Canvas export failed"))),
          "image/jpeg",
          0.95
        );
      });
      const file = new File([sourceBlob], "capture.jpg", { type: "image/jpeg" });

      const blob = await compositeImage(file, {
        timestamp: now,
        latitude: lat,
        longitude: lon,
        userName: settings?.userName,
        companyName: settings?.companyName,
        note: note || undefined,
        fontSize: settings?.fontSize || "medium",
      });

      savePhoto(blob, now);
      showSuccessToast(lat, lon, now);
    } catch {
      setToast({ message: "Error saving photo. Please try again.", type: "error" });
    } finally {
      setProcessing(false);
    }
  }, [position, settings, note, processing]);

  const handleFileCapture = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setProcessing(true);

      const now = new Date();
      const lat = position?.latitude ?? null;
      const lon = position?.longitude ?? null;

      try {
        const blob = await compositeImage(file, {
          timestamp: now,
          latitude: lat,
          longitude: lon,
          userName: settings?.userName,
          companyName: settings?.companyName,
          note: note || undefined,
          fontSize: settings?.fontSize || "medium",
        });

        savePhoto(blob, now);
        showSuccessToast(lat, lon, now);
      } catch {
        setToast({ message: "Error saving photo. Please try again.", type: "error" });
      } finally {
        setProcessing(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [settings, note, position]
  );

  const savePhoto = (blob: Blob, now: Date) => {
    const dateStr = now.toISOString().replace(/[-:T]/g, "").slice(0, 15);
    const fileName = `geostamp_${dateStr}.jpg`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const showSuccessToast = (lat: number | null, lon: number | null, now: Date) => {
    const coordStr =
      lat !== null && lon !== null
        ? `${lat.toFixed(4)}, ${lon.toFixed(4)}`
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
  };

  const formattedTime = currentTime.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const formattedCoords = position
    ? `${position.latitude.toFixed(4)}, ${position.longitude.toFixed(4)}`
    : gpsStatus;

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

      {/* Info overlay — GPS + Timestamp */}
      <div className="px-4 pb-2">
        <div className="bg-black/60 rounded-lg px-3 py-2 text-sm space-y-0.5">
          <p className="text-white font-mono">{formattedTime}</p>
          <p className={`font-mono text-xs ${position ? "text-green-400" : "text-yellow-400"}`}>
            {formattedCoords}
          </p>
        </div>
      </div>

      {/* Note input */}
      <div className="px-4 pb-3">
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Enter note…"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
        />
      </div>

      {/* Camera viewfinder */}
      <div className="flex-1 mx-4 mb-3 relative rounded-xl overflow-hidden bg-zinc-900">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
        {!cameraReady && (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-500 text-sm">
            Camera loading…
          </div>
        )}
      </div>

      {/* Shutter button */}
      <div className="flex justify-center pb-8">
        <button
          onClick={handleShutter}
          disabled={processing}
          className="w-[72px] h-[72px] rounded-full border-4 border-white flex items-center justify-center disabled:opacity-50 active:scale-95 transition-transform"
          aria-label="Take photo"
        >
          <div className="w-[58px] h-[58px] rounded-full bg-white" />
        </button>
      </div>

      {/* Hidden file input (fallback when camera stream unavailable) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileCapture}
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
