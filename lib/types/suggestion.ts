export type SuggestionType = "question" | "action" | "topic";

export interface ConversationSuggestion {
  id: string;
  text: string;          // What gets sent to AI when clicked
  label: string;         // What displays on the button
  type: SuggestionType;  // For icon selection and styling
}

export interface ConversationSuggestionsResult {
  suggestions: ConversationSuggestion[];
  timestamp: string;
  prompt: string;        // Question/prompt to display above suggestions
  context?: string;      // Optional for debugging
}
