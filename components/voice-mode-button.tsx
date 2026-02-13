"use client";

import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";

interface VoiceModeButtonProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function VoiceModeButton({ enabled, onToggle }: VoiceModeButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => onToggle(!enabled)}
      aria-label={enabled ? "Disable voice mode" : "Enable voice mode"}
      title={enabled ? "Voice mode enabled" : "Voice mode disabled"}
    >
      {enabled ? (
        <Volume2 className="h-4 w-4" />
      ) : (
        <VolumeX className="h-4 w-4" />
      )}
    </Button>
  );
}
