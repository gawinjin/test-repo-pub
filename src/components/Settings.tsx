"use client";

import { useState } from "react";
import { GeoStampSettings } from "@/hooks/useSettings";

interface SettingsProps {
  settings: GeoStampSettings | null;
  onSave: (data: GeoStampSettings) => void;
  onClear: () => void;
  onClose: () => void;
}

export default function Settings({
  settings,
  onSave,
  onClear,
  onClose,
}: SettingsProps) {
  const [userName, setUserName] = useState(settings?.userName || "");
  const [companyName, setCompanyName] = useState(settings?.companyName || "");
  const [defaultNote, setDefaultNote] = useState(settings?.defaultNote || "");
  const [fontSize, setFontSize] = useState<"small" | "medium" | "large">(
    settings?.fontSize || "medium"
  );

  const handleSave = () => {
    onSave({ userName, companyName, defaultNote, fontSize });
    onClose();
  };

  const handleClear = () => {
    if (confirm("Clear all settings? This cannot be undone.")) {
      setUserName("");
      setCompanyName("");
      setDefaultNote("");
      setFontSize("medium");
      onClear();
    }
  };

  const inputClass =
    "w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500";

  return (
    <div className="flex flex-col h-dvh">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-white transition-colors"
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
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-xl font-bold">Settings</h2>
        <div className="w-6" />
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-4 space-y-5 pb-6">
        <div>
          <label className="block text-sm text-zinc-400 mb-1">User Name</label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="John Smith"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm text-zinc-400 mb-1">
            Company Name
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="ABC Construction"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm text-zinc-400 mb-1">
            Default Note Template
          </label>
          <input
            type="text"
            value={defaultNote}
            onChange={(e) => setDefaultNote(e.target.value)}
            placeholder="Foundation inspection - Building A"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm text-zinc-400 mb-2">
            Overlay Font Size
          </label>
          <div className="flex gap-2">
            {(["small", "medium", "large"] as const).map((size) => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                  fontSize === size
                    ? "bg-white text-black"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-8 space-y-3">
        <button
          onClick={handleSave}
          className="w-full bg-white text-black font-semibold py-3 rounded-full text-lg"
        >
          Save Settings
        </button>
        <button
          onClick={handleClear}
          className="w-full bg-zinc-800 text-red-400 font-medium py-3 rounded-full text-sm"
        >
          Clear Settings
        </button>
      </div>
    </div>
  );
}
