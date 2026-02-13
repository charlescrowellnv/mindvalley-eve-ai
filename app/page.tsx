"use client";

import { Header } from "@/components/header";
import { LandingPage } from "@/components/landing-page";
import { AudioPlayerProvider } from "@/components/ui/audio-player";
import { useState, useEffect } from "react";

export default function Page() {
  const [voiceModeEnabled, setVoiceModeEnabled] = useState<boolean>(false);

  // Initialize voice mode from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("eve-voice-mode-enabled");
      setVoiceModeEnabled(stored === "true");
    }
  }, []);

  // Persist voice mode to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("eve-voice-mode-enabled", voiceModeEnabled.toString());
    }
  }, [voiceModeEnabled]);

  return (
    <AudioPlayerProvider>
      <div className="min-h-screen flex flex-col">
        <Header
          voiceModeEnabled={voiceModeEnabled}
          onVoiceModeToggle={setVoiceModeEnabled}
        />
        <LandingPage
          voiceModeEnabled={voiceModeEnabled}
          onVoiceModeToggle={setVoiceModeEnabled}
        />
      </div>
    </AudioPlayerProvider>
  );
}
