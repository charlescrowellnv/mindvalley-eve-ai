import { tool } from "ai";
import { z } from "zod";
import type { ConversationSuggestionsResult } from "@/lib/types/suggestion";

export const getConversationSuggestionsTool = tool({
  description: `Generate contextual suggestion buttons (quick replies) to help users continue the conversation naturally.

    CRITICAL RULES:
    - Only call this tool at the END of your complete response (after all text)
    - DO NOT use if you've already called get_program_recommendations or other interactive UI tools in the same turn
    - Generate 2-4 suggestions that feel like natural next steps in the conversation
    - Skip this tool if the conversation appears to be ending or wrapping up

    Use this tool when:
    - You've finished answering a user's question and want to guide the next interaction
    - The user might benefit from exploring related topics or taking specific actions
    - You want to reduce friction by letting users tap instead of type

    Examples of good suggestions:
    - After explaining meditation benefits → ["Show me meditation programs", "How do I start meditating?", "Programs for stress relief"]
    - After greeting a new user → ["Improve my health", "Help with career", "Explore relationships"]
    - After answering about leadership → ["Show leadership programs", "Team building tips", "Develop confidence"]
    - After discussing a challenge → ["Find relevant programs", "Tell me more", "What are my options?"]

    Suggestion types:
    - "question": User asks for more information (e.g., "How does this work?", "Tell me more")
    - "action": User takes an action (e.g., "Show programs", "Find courses", "Get recommendations")
    - "topic": User explores a new topic (e.g., "Meditation", "Leadership", "Relationships")

    Important: Keep suggestions concise (3-7 words), specific, and conversational.`,

  inputSchema: z.object({
    prompt: z
      .string()
      .describe(
        "Question or prompt to display above the suggestions. Make it contextual and specific to the conversation (e.g., 'Which of these is your biggest priority right now?', 'What would you like to explore?', 'Where should we focus next?'). Use 'Explore these next:' only when changing subjects or when there's no obvious contextual follow-up."
      ),
    suggestions: z
      .array(
        z.object({
          text: z
            .string()
            .describe(
              "The exact message that will be sent to you when the user clicks this suggestion"
            ),
          label: z
            .string()
            .optional()
            .describe(
              "Optional display text for the button. If omitted, 'text' will be used for display"
            ),
          type: z
            .enum(["question", "action", "topic"])
            .describe(
              "The type of suggestion for icon and styling: 'question' for inquiries, 'action' for direct actions, 'topic' for exploration"
            ),
        })
      )
      .min(2)
      .max(4)
      .describe("2-4 contextual suggestions for the user to continue the conversation"),
    context: z
      .string()
      .optional()
      .describe("Optional context about why these suggestions were chosen (for debugging)"),
  }),

  execute: async ({ suggestions, prompt, context }) => {
    // Generate IDs for each suggestion
    const suggestionsWithIds = suggestions.map((suggestion, index) => ({
      id: `suggestion-${Date.now()}-${index}`,
      text: suggestion.text,
      label: suggestion.label || suggestion.text, // Use text as label if not provided
      type: suggestion.type,
    }));

    const result: ConversationSuggestionsResult = {
      suggestions: suggestionsWithIds,
      timestamp: new Date().toISOString(),
      prompt,
      context,
    };

    return result;
  },
});
