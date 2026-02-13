"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { EvaAiIcon } from "@/components/icons/eva-ai-icon";

const DEFAULT_SIZE = 2048;

interface EvaAiPlanetProps {
  /** Size in pixels; defaults to 1024. */
  size?: number;
  className?: string;
}

export function EvaAiPlanet({
  size = DEFAULT_SIZE,
  className,
}: EvaAiPlanetProps) {
  return (
    <motion.div
      className={cn("pointer-events-none flex shrink-0", className)}
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
      animate={{ rotate: 360 }}
      transition={{
        duration: 480,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      <EvaAiIcon className="h-full w-full" gradient strokeWidth={0.25} />
    </motion.div>
  );
}
