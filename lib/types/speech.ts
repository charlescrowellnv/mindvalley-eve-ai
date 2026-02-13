import type { Experimental_SpeechResult as SpeechResult } from "ai";

export interface GeneratedSpeechResult {
  audio: SpeechResult["audio"];
  text: string;
  timestamp: string;
}

export interface VoiceModeSettings {
  enabled: boolean;
  autoPlay: boolean;
  voice: string;
}
