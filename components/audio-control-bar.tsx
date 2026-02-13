"use client";

import { Button } from "@/components/ui/button";
import { useAudioPlayer } from "@/components/ui/audio-player";
import { AudioWaveVisualizer } from "@/components/audio-wave-visualizer";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioControlBarProps {
  voiceModeEnabled: boolean;
  onVoiceModeToggle: (enabled: boolean) => void;
  isGenerating?: boolean;
  className?: string;
}

export function AudioControlBar({
  voiceModeEnabled,
  onVoiceModeToggle,
  isGenerating = false,
  className,
}: AudioControlBarProps) {
  const {
    isPlaying,
    play,
    pause,
    seek,
    duration,
    activeItem,
    ref,
    streamingState,
    streamingProgress,
  } = useAudioPlayer();

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const handleSkipBack = () => {
    if (ref.current) {
      const currentTime = ref.current.currentTime;
      seek(Math.max(0, currentTime - 10));
    }
  };

  const handleSkipForward = () => {
    if (ref.current && duration) {
      const currentTime = ref.current.currentTime;
      seek(Math.min(duration, currentTime + 10));
    }
  };

  // Show connecting/buffering state
  if (
    streamingState === "connecting" ||
    streamingState === "buffering" ||
    streamingState === "streaming"
  ) {
    return (
      <div className={cn("flex flex-col gap-3 pt-4 px-4 border-t", className)}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" disabled>
              -10s
            </Button>
            <Button variant="outline" size="icon-sm" disabled>
              <Play />
            </Button>
            <Button variant="ghost" size="sm" disabled>
              +10s
            </Button>
          </div>

          <div className="flex-1 flex items-center justify-center gap-2">
            <Loader2 className="animate-spin size-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {streamingState === "connecting"
                ? "Connecting..."
                : `Loading...
                `}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onVoiceModeToggle(false)}
          >
            <Volume2 />
            Voice On
          </Button>
        </div>
      </div>
    );
  }

  if (!voiceModeEnabled) {
    return (
      <div
        className={cn(
          "flex items-center justify-end gap-4 px-4 pt-4 border-t",
          className
        )}
      >
        <Button
          variant="outline"
          size="sm"
          className="text-muted-foreground"
          onClick={() => onVoiceModeToggle(true)}
        >
          <VolumeX />
          Voice Off
        </Button>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className={cn("flex flex-col gap-3 pt-4 px-4 border-t", className)}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon-sm" disabled>
              -10s
            </Button>

            <Button variant="outline" size="icon-sm" disabled>
              {isPlaying ? <Pause /> : <Play />}
            </Button>

            <Button variant="ghost" size="icon-sm" disabled>
              +10s
            </Button>
          </div>
          <div className="flex-1 flex items-center justify-center gap-2">
            <Loader2 className="animate-spin size-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Generating audio...
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-muted-foreground"
            onClick={() => onVoiceModeToggle(false)}
          >
            <Volume2 />
            Voice On
          </Button>
        </div>
      </div>
    );
  }

  if (!activeItem) {
    return (
      <div
        className={cn(
          "flex items-center justify-end gap-4 px-4 pt-4 border-t",
          className
        )}
      >
        <Button
          variant="outline"
          size="sm"
          className="text-muted-foreground"
          onClick={() => onVoiceModeToggle(false)}
        >
          <Volume2 />
          Voice On
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3 pt-4 px-4 border-t", className)}>
      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={handleSkipBack}
            disabled={!activeItem}
          >
            -10s
          </Button>

          <Button
            variant="outline"
            size="icon-sm"
            onClick={handlePlayPause}
            disabled={!activeItem}
          >
            {isPlaying ? <Pause /> : <Play />}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={handleSkipForward}
            disabled={!activeItem}
          >
            +10s
          </Button>
        </div>
        {/* Wave Visualizer */}
        <div className="flex-1 ">
          <AudioWaveVisualizer isPlaying={isPlaying} height={24} />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onVoiceModeToggle(false)}
        >
          <Volume2 />
          Voice On
        </Button>
      </div>
    </div>
  );
}
