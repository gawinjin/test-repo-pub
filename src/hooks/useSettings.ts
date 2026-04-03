"use client";

import { useState, useEffect, useCallback } from "react";

export interface GeoStampSettings {
  userName: string;
  companyName: string;
  defaultNote: string;
  fontSize: "small" | "medium" | "large";
}

const STORAGE_KEY = "geostamp-settings";

const defaultSettings: GeoStampSettings = {
  userName: "",
  companyName: "",
  defaultNote: "",
  fontSize: "medium",
};

export function useSettings() {
  const [settings, setSettings] = useState<GeoStampSettings | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      }
    } catch {
      // localStorage unavailable or corrupt — ignore
    }
    setIsLoaded(true);
  }, []);

  const save = useCallback((data: GeoStampSettings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // localStorage unavailable — ignore
    }
    setSettings(data);
  }, []);

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage unavailable — ignore
    }
    setSettings(null);
  }, []);

  return { settings, isLoaded, save, clear, defaultSettings };
}
