import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const MODEL_ID = "claude-sonnet-4-5";

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: anthropic(MODEL_ID),
    messages: await convertToModelMessages(messages),
    system:
      "You are a helpful assistant that can answer questions and help with tasks",
  });

  console.log(result);

  return result.toUIMessageStreamResponse({
    sendSources: false,
    sendReasoning: false,
  });
}
