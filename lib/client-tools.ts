// Client-side tool implementations for ElevenLabs agent

import { ToolContext } from './types';

export function createClientTools(context: ToolContext) {
  return {
    // Tool 1: Program Recommendations
    get_program_recommendations: async (parameters: {
      userGoal: string;
      categories?: string[];
      maxResults?: number;
      includeComingSoon?: boolean;
    }) => {
      const execId = context.onToolStart('get_program_recommendations', parameters);

      try {
        // Call the API endpoint
        const response = await fetch('/api/tools/get-program-recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parameters),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch recommendations');
        }

        const result = await response.json();
        context.onToolComplete(execId, result);

        // Return user-friendly text response
        const programs = result.recommendations;
        if (programs.length === 0) {
          return `I couldn't find programs matching "${parameters.userGoal}". Let me help you explore other options.`;
        }

        return `I found ${programs.length} program${programs.length > 1 ? 's' : ''} that could help with ${parameters.userGoal}.`;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to fetch recommendations';
        context.onToolError(execId, errorMsg);
        return `Sorry, I encountered an error searching for programs: ${errorMsg}`;
      }
    },

    // Tool 2: Conversation Suggestions
    get_conversation_suggestions: async (parameters: {
      prompt: string;
      suggestions: Array<{
        text: string;
        label?: string;
        type: 'question' | 'action' | 'topic';
      }>;
      context?: string;
    }) => {
      const execId = context.onToolStart('get_conversation_suggestions', parameters);

      try {
        // Call the API endpoint
        const response = await fetch('/api/tools/get-conversation-suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parameters),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate suggestions');
        }

        const result = await response.json();
        context.onToolComplete(execId, result);

        // Return empty string - UI will handle rendering
        return '';
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to generate suggestions';
        context.onToolError(execId, errorMsg);
        return '';
      }
    },
  };
}
