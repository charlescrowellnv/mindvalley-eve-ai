"use client";

import { cn } from "@/lib/utils";

interface AudioWaveVisualizerProps {
  isPlaying?: boolean;
  isGenerating?: boolean;
  height?: number;
  className?: string;
}

export function AudioWaveVisualizer({
  isPlaying = false,
  isGenerating = false,
  height = 48,
  className,
}: AudioWaveVisualizerProps) {
  return (
    <div
      className={cn("flex items-center justify-center w-full", className)}
      style={{ height: `${height}px` }}
    >
      <div
        className={cn(
          "w-full rounded-full transition-all duration-300",
          isPlaying || isGenerating
            ? "animate-audio-wave bg-linear-to-r from-primary/20 via-primary to-primary/20"
            : "bg-primary/30"
        )}
        style={{ height: "4px" }}
      />
    </div>
  );
}
