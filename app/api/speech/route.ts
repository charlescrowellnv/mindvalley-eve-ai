import { experimental_generateSpeech as generateSpeech } from "ai";
import { elevenlabs } from "@ai-sdk/elevenlabs";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { text, voice = "cYctNG9CmLHHErrIh5s7" } = await req.json();

    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Text is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await generateSpeech({
      model: elevenlabs.speech("eleven_v3"),
      text: text,
      voice: voice,
      providerOptions: {
        elevenlabs: {
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
          },
        },
      },
    });

    return new Response(
      JSON.stringify({
        audio: {
          base64: result.audio.base64,
          mediaType: result.audio.mediaType,
          format: result.audio.format,
        },
        text: text,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Speech generation error:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Failed to generate speech",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
