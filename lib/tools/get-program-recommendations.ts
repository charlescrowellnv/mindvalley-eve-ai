import { tool } from "ai";
import { z } from "zod";
import {
  loadPrograms,
  matchProgramsToGoal,
} from "@/lib/services/program-service";
import type { ProgramRecommendationsResult } from "@/lib/types/program";

export const getProgramRecommendationsTool = tool({
  description: `Find and recommend Mindvalley programs based on user goals, interests, or challenges.

    Use this tool when:
    - Users express goals (e.g., "improve public speaking", "reduce stress", "better sleep")
    - Users ask for program recommendations
    - Users want to explore specific topics or categories
    - Users need help finding content for personal growth

    Examples of when to use:
    - "I want to meditate better" → Find meditation programs
    - "Help me with my career" → Find career development programs
    - "I'm feeling anxious" → Find mind/body programs for stress/anxiety
    - "Show me relationship programs" → Filter by relationships category
    - "I want to be a better leader" → Find leadership/career programs
    
    Important: This tool returns UI Cards with detailed information about the programs, including the title, description, author, and category, as well as a CTA Button. Be aware not to duplicate information in your response. Be aware not to include a lengthy response after, as not to push the UI cards too far in the chat and obscure the CTA.`,

  inputSchema: z.object({
    userGoal: z
      .string()
      .describe(
        "The user's primary goal or challenge (e.g., 'improve public speaking', 'reduce stress', 'better sleep')"
      ),
    categories: z
      .array(
        z.enum([
          "mind",
          "body",
          "soul",
          "career",
          "relationships",
          "entrepreneurship",
        ])
      )
      .optional()
      .describe("Optional filter by specific categories"),
    maxResults: z
      .number()
      .min(1)
      .max(10)
      .default(5)
      .describe("Maximum number of programs to return (1-10)"),
    includeComingSoon: z
      .boolean()
      .default(false)
      .describe("Whether to include programs marked as coming soon"),
  }),

  execute: async ({ userGoal, categories, maxResults, includeComingSoon }) => {
    try {
      // Load all programs from cache
      const programsData = await loadPrograms();

      // Check if we have any programs
      if (programsData.programs.length === 0) {
        throw new Error(
          "No programs available in cache. Please run 'npm run scrape-programs' first."
        );
      }

      // Filter by categories if specified
      let filtered = programsData.programs;
      if (categories && categories.length > 0) {
        filtered = filtered.filter((p) =>
          categories.includes(p.primaryCategory)
        );
      }

      // Filter out coming soon programs unless explicitly requested
      if (!includeComingSoon) {
        filtered = filtered.filter((p) => !p.isComingSoon);
      }

      // Match programs to user goal
      const matches = await matchProgramsToGoal(userGoal, filtered, maxResults);

      const result: ProgramRecommendationsResult = {
        recommendations: matches,
        query: userGoal,
        totalMatches: matches.length,
        categories: categories || ["all"],
      };

      return result;
    } catch (error) {
      console.error("Tool execution error:", error);
      throw new Error(
        `Failed to fetch program recommendations: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },
});
