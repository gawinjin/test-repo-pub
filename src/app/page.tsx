"use client";

import { useState, useCallback } from "react";
import { useSettings } from "@/hooks/useSettings";
import Onboarding from "@/components/Onboarding";
import MainScreen from "@/components/MainScreen";
import Settings from "@/components/Settings";

type AppView = "onboarding" | "main" | "settings";

export default function Home() {
  const { settings, isLoaded, save, clear, defaultSettings } = useSettings();
  const [view, setView] = useState<AppView | null>(null);

  // Determine initial view once settings are loaded
  if (isLoaded && view === null) {
    setView(settings ? "main" : "onboarding");
  }

  const handleOnboardingComplete = useCallback(() => {
    save(defaultSettings);
    setView("main");
  }, [save, defaultSettings]);

  if (!isLoaded || view === null) {
    return <div className="min-h-dvh" />;
  }

  if (view === "onboarding") {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  if (view === "settings") {
    return (
      <Settings
        settings={settings}
        onSave={save}
        onClear={clear}
        onClose={() => setView("main")}
      />
    );
  }

  return (
    <MainScreen
      settings={settings}
      onOpenSettings={() => setView("settings")}
    />
  );
}
