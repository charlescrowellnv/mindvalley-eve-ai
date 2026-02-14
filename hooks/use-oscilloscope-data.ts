import { useEffect, useRef, useState } from "react";

export interface OscilloscopeDataOptions {
  enabled?: boolean;
  fftSize?: number;
  smoothingTimeConstant?: number;
  audioSource?: "microphone" | "audio-element" | "audio-node" | "media-stream" | "external-data";
  deviceId?: string;
  mediaStream?: MediaStream;
  audioElement?: HTMLAudioElement;
  audioNode?: AudioNode;
  getFrequencyData?: () => Uint8Array | undefined;
  onError?: (error: Error) => void;
  onStreamReady?: (stream: MediaStream) => void;
}

export interface OscilloscopeDataResult {
  dataArray: Uint8Array<ArrayBuffer> | null;
  analyser: AnalyserNode | null;
  isReady: boolean;
}

/**
 * Hook for analyzing audio data for oscilloscope visualization
 * Supports multiple audio sources: microphone, audio element, or media stream
 */
export function useOscilloscopeData({
  enabled = true,
  fftSize = 2048,
  smoothingTimeConstant = 0.8,
  audioSource = "microphone",
  deviceId,
  mediaStream: externalMediaStream,
  audioElement,
  audioNode,
  getFrequencyData,
  onError,
  onStreamReady,
}: OscilloscopeDataOptions): OscilloscopeDataResult {
  const [isReady, setIsReady] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<
    MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null
  >(null);
  const streamRef = useRef<MediaStream | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  useEffect(() => {
    if (!enabled) {
      setIsReady(false);
      return;
    }

    // Handle external data source (no audio context needed)
    if (audioSource === "external-data") {
      setIsReady(true);
      return;
    }

    let mounted = true;

    const setupAudio = async () => {
      try {
        // Create AudioContext with webkit fallback
        const AudioContextConstructor =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        const audioContext = new AudioContextConstructor();
        audioContextRef.current = audioContext;

        // Create and configure analyser
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = fftSize;
        analyser.smoothingTimeConstant = smoothingTimeConstant;
        analyserRef.current = analyser;

        // Create data array for frequency data
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

        // Connect audio source based on type
        if (audioSource === "microphone") {
          // Get microphone stream
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: deviceId
              ? {
                  deviceId: { exact: deviceId },
                  echoCancellation: true,
                  noiseSuppression: true,
                  autoGainControl: true,
                }
              : {
                  echoCancellation: true,
                  noiseSuppression: true,
                  autoGainControl: true,
                },
          });

          if (!mounted) {
            stream.getTracks().forEach((track) => track.stop());
            return;
          }

          streamRef.current = stream;
          const source = audioContext.createMediaStreamSource(stream);
          source.connect(analyser);
          sourceNodeRef.current = source;
          onStreamReady?.(stream);
        } else if (audioSource === "media-stream" && externalMediaStream) {
          // Use external media stream
          const source = audioContext.createMediaStreamSource(externalMediaStream);
          source.connect(analyser);
          sourceNodeRef.current = source;
        } else if (audioSource === "audio-element" && audioElement) {
          // Use audio element
          const source = audioContext.createMediaElementSource(audioElement);
          source.connect(analyser);
          // Also connect to destination so audio plays
          source.connect(audioContext.destination);
          sourceNodeRef.current = source;
        } else if (audioSource === "audio-node" && audioNode) {
          // Use audio node directly
          audioNode.connect(analyser);
        }

        if (mounted) {
          setIsReady(true);
        }
      } catch (error) {
        if (mounted) {
          onError?.(error as Error);
        }
      }
    };

    setupAudio();

    return () => {
      mounted = false;
      setIsReady(false);

      // Cleanup audio resources
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
        sourceNodeRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      analyserRef.current = null;
      dataArrayRef.current = null;
    };
  }, [
    enabled,
    fftSize,
    smoothingTimeConstant,
    audioSource,
    deviceId,
    externalMediaStream,
    audioElement,
    audioNode,
    onError,
    onStreamReady,
  ]);

  // For external data source, get data from the provided function
  const externalData = audioSource === "external-data" && getFrequencyData
    ? getFrequencyData()
    : null;

  return {
    dataArray: (externalData || dataArrayRef.current) as Uint8Array<ArrayBuffer> | null,
    analyser: analyserRef.current,
    isReady: audioSource === "external-data" ? enabled : isReady,
  };
}
