export type StreamState =
  | "idle"
  | "connecting"
  | "buffering"
  | "streaming"
  | "playing"
  | "paused"
  | "error";

export interface StreamOptions {
  messageId: string;
  text: string;
  onStateChange: (state: StreamState) => void;
  onProgress: (bytesReceived: number) => void;
  minBufferSize?: number; // Default: 50KB (~0.5s of audio)
}

export class StreamingAudioPlayer {
  private audioElement: HTMLAudioElement;
  private chunks: Uint8Array[] = [];
  private bytesReceived = 0;
  private state: StreamState = "idle";
  private abortController?: AbortController;
  private currentBlobUrl?: string;

  constructor(audioElement: HTMLAudioElement) {
    this.audioElement = audioElement;
  }

  async stream(url: string, options: StreamOptions): Promise<void> {
    // Reset state for new stream
    this.chunks = [];
    this.bytesReceived = 0;

    // Clean up old blob URL if it exists
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = undefined;
    }

    this.state = "connecting";
    options.onStateChange("connecting");

    this.abortController = new AbortController();

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: options.text }),
        signal: this.abortController.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Stream failed: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const minBuffer = options.minBufferSize || 50000; // 50KB
      let playbackStarted = false;

      this.state = "buffering";
      options.onStateChange("buffering");

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          // All chunks received, now start playback
          await this.startPlayback();
          this.state = "playing";
          options.onStateChange("playing");
          break;
        }

        // Accumulate chunk
        this.chunks.push(value);
        this.bytesReceived += value.length;
        options.onProgress(this.bytesReceived);

        // Optional: Start playback early if we have enough buffered
        // Note: This will cause dropouts unless we implement MediaSource API
        // if (!playbackStarted && this.bytesReceived >= minBuffer) {
        //   await this.startPlayback();
        //   playbackStarted = true;
        //   this.state = "streaming";
        //   options.onStateChange("streaming");
        // }
      }
    } catch (error) {
      this.state = "error";
      options.onStateChange("error");
      throw error;
    }
  }

  private async startPlayback(): Promise<void> {
    const blob = new Blob(this.chunks, { type: "audio/mpeg" });
    this.currentBlobUrl = URL.createObjectURL(blob);

    this.audioElement.src = this.currentBlobUrl;
    await this.audioElement.play();
  }

  stop(): void {
    this.abortController?.abort();
    this.audioElement.pause();
    this.audioElement.src = "";

    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = undefined;
    }

    this.chunks = [];
    this.bytesReceived = 0;
    this.state = "idle";
  }

  pause(): void {
    this.audioElement.pause();
    this.state = "paused";
  }

  resume(): void {
    this.audioElement.play();
    this.state = this.chunks.length > 0 ? "streaming" : "playing";
  }

  getState(): StreamState {
    return this.state;
  }
}
