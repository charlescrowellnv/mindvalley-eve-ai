"use client";

import { useEffect, useRef, type HTMLAttributes } from "react";

import { cn } from "@/lib/utils";
import { useOscilloscopeData } from "@/hooks/useOscilloscopeData";

export type OscilloscopeProps = HTMLAttributes<HTMLDivElement> & {
  // State management
  active?: boolean;
  processing?: boolean;
  state?: "idle" | "processing" | "active";

  // Audio source
  audioSource?: "microphone" | "audio-element" | "audio-node" | "media-stream" | "external-data";
  deviceId?: string;
  mediaStream?: MediaStream;
  audioElement?: HTMLAudioElement;
  audioNode?: AudioNode;
  getFrequencyData?: () => Uint8Array | undefined;

  // Visual customization
  lineColor?: string;
  lineWidth?: number;
  height?: string | number;

  // Analysis configuration
  fftSize?: number;
  smoothingTimeConstant?: number;
  sensitivity?: number;
  curveDetail?: number;

  // Callbacks
  onError?: (error: Error) => void;
  onStreamReady?: (stream: MediaStream) => void;
};

export const Oscilloscope = ({
  active = false,
  processing = false,
  state,
  audioSource = "microphone",
  deviceId,
  mediaStream,
  audioElement,
  audioNode,
  getFrequencyData,
  lineColor,
  lineWidth = 2,
  height = 32,
  fftSize = 2048,
  smoothingTimeConstant = 0.8,
  sensitivity = 1,
  curveDetail = 128,
  onError,
  onStreamReady,
  className,
  ...props
}: OscilloscopeProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const processingPhaseRef = useRef(0);
  const transitionProgressRef = useRef(0);
  const getFrequencyDataRef = useRef(getFrequencyData);

  const heightStyle = typeof height === "number" ? `${height}px` : height;

  // Update ref when getFrequencyData changes
  useEffect(() => {
    getFrequencyDataRef.current = getFrequencyData;
  }, [getFrequencyData]);

  // Determine effective state
  const effectiveState = state || (processing ? "processing" : active ? "active" : "idle");

  // Get audio data using hook (only when active)
  const { dataArray, analyser, isReady } = useOscilloscopeData({
    enabled: effectiveState === "active",
    fftSize,
    smoothingTimeConstant,
    audioSource,
    deviceId,
    mediaStream,
    audioElement,
    audioNode,
    getFrequencyData,
    onError,
    onStreamReady,
  });

  // Handle canvas resizing with DPI awareness
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeObserver = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Main animation loop
  useEffect(() => {
    // Note: dataArray is intentionally not in dependencies to avoid
    // React serialization issues with Uint8Array causing size change errors
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId: number;

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      const centerY = rect.height / 2;

      // Clear canvas
      ctx.clearRect(0, 0, rect.width, rect.height);

      // Get line color
      const computedLineColor =
        lineColor ||
        (() => {
          const style = getComputedStyle(canvas);
          return style.color || "#000";
        })();

      ctx.strokeStyle = computedLineColor;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (effectiveState === "idle") {
        // Draw flat line at center
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(rect.width, centerY);
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (effectiveState === "processing") {
        // Draw animated sine wave
        processingPhaseRef.current += 0.05;
        transitionProgressRef.current = Math.min(1, transitionProgressRef.current + 0.02);

        ctx.globalAlpha = 0.4 + transitionProgressRef.current * 0.4;
        ctx.beginPath();

        const points: { x: number; y: number }[] = [];
        const amplitude = rect.height * 0.15;
        const frequency = 0.02;

        for (let i = 0; i < curveDetail; i++) {
          const x = (i / (curveDetail - 1)) * rect.width;

          // Multiple sine waves for more interesting pattern
          const wave1 = Math.sin(x * frequency + processingPhaseRef.current * 1.5) * 0.5;
          const wave2 = Math.sin(x * frequency * 0.5 - processingPhaseRef.current) * 0.3;
          const wave3 = Math.cos(x * frequency * 0.3 + processingPhaseRef.current * 0.7) * 0.2;

          const combinedWave = wave1 + wave2 + wave3;
          const y = centerY + combinedWave * amplitude;

          points.push({ x, y });
        }

        // Draw smooth curve through points
        drawSmoothCurve(ctx, points);
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (effectiveState === "active") {
        // Draw real frequency data as smooth curve with logarithmic frequency scale
        // For external data sources, get fresh data on each frame
        let currentDataArray = dataArray;

        if (audioSource === "external-data" && getFrequencyDataRef.current) {
          const freshData = getFrequencyDataRef.current();
          if (freshData) {
            currentDataArray = freshData as Uint8Array<ArrayBuffer>;
          }
        }

        if (currentDataArray && isReady) {
          // Get frequency data from analyser if available
          if (analyser) {
            analyser.getByteFrequencyData(currentDataArray);
          }

          // Get audio context sample rate to calculate frequencies
          // For external data sources without analyser, use standard 48kHz
          const sampleRate = analyser?.context?.sampleRate || 48000;
          const nyquistFreq = sampleRate / 2;

          // Logarithmic frequency range: 20 Hz to 20 kHz (human hearing range)
          const minFreq = 20;
          const maxFreq = Math.min(20000, nyquistFreq);

          // Create logarithmically-spaced frequency points
          const points: { x: number; y: number }[] = [];

          for (let i = 0; i < curveDetail; i++) {
            // Logarithmic position on x-axis
            const t = i / (curveDetail - 1);
            const x = t * rect.width;

            // Calculate frequency for this position (logarithmic scale)
            const frequency = minFreq * Math.pow(maxFreq / minFreq, t);

            // Find corresponding FFT bin for this frequency
            // Frequency = (binIndex * sampleRate) / fftSize
            const binIndex = Math.floor((frequency * fftSize) / sampleRate);

            // Average nearby bins for smoother curve (use 3-bin window)
            const binWindow = 2;
            let sum = 0;
            let count = 0;

            for (let j = Math.max(0, binIndex - binWindow);
                 j <= Math.min(currentDataArray.length - 1, binIndex + binWindow);
                 j++) {
              sum += currentDataArray[j];
              count++;
            }

            const average = count > 0 ? sum / count : 0;

            // Apply sensitivity and normalize to [0, 1]
            const normalized = Math.min(1, (average / 255) * sensitivity);
            // Use 90% of the space from center to edge to prevent clipping
            const amplitude = normalized * centerY * 0.9;

            // Create oscillating wave pattern around center
            // Use position to create variation across the width
            // sin(t * π) goes: 0 → 1 → 0, anchoring edges at center, peak in middle
            const positionFactor = Math.sin(t * Math.PI);
            // Subtract amplitude to make peaks go UP (lower Y values in canvas)
            const y = centerY - amplitude * positionFactor;

            points.push({ x, y });
          }

          ctx.globalAlpha = 0.9;
          ctx.beginPath();
          drawSmoothCurve(ctx, points);
          ctx.stroke();
          ctx.globalAlpha = 1;
        } else {
          // Fallback to idle state if not ready
          ctx.globalAlpha = 0.3;
          ctx.beginPath();
          ctx.moveTo(0, centerY);
          ctx.lineTo(rect.width, centerY);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }

      rafId = requestAnimationFrame(animate);
    };

    // Reset transition progress when state changes
    if (effectiveState === "processing") {
      transitionProgressRef.current = 0;
    }

    rafId = requestAnimationFrame(animate);

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    effectiveState,
    analyser,
    isReady,
    lineColor,
    lineWidth,
    sensitivity,
    curveDetail,
    fftSize,
  ]);

  return (
    <div
      className={cn("relative h-full w-full", className)}
      ref={containerRef}
      style={{ height: heightStyle }}
      aria-label={
        effectiveState === "active"
          ? "Live frequency oscilloscope"
          : effectiveState === "processing"
          ? "Processing audio"
          : "Audio oscilloscope idle"
      }
      role="img"
      {...props}
    >
      <canvas
        className="block h-full w-full"
        ref={canvasRef}
        aria-hidden="true"
      />
    </div>
  );
};

/**
 * Draws a smooth curve through points using quadratic Bezier curves
 */
function drawSmoothCurve(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[]
) {
  if (points.length === 0) return;
  if (points.length === 1) {
    ctx.moveTo(points[0].x, points[0].y);
    return;
  }

  ctx.moveTo(points[0].x, points[0].y);

  // Use quadratic curves between points for smoothness
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];

    // Control point is the midpoint
    const xMid = (current.x + next.x) / 2;
    const yMid = (current.y + next.y) / 2;

    ctx.quadraticCurveTo(current.x, current.y, xMid, yMid);
  }

  // Draw to the last point
  const lastPoint = points[points.length - 1];
  ctx.lineTo(lastPoint.x, lastPoint.y);
}
