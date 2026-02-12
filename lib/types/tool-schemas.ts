import { z } from "zod";

export const getProgramRecommendationsSchema = z.object({
  userGoal: z.string().describe(
    "The user's primary goal or challenge (e.g., 'improve public speaking', 'reduce stress', 'better sleep')"
  ),
  categories: z.array(
    z.enum(["mind", "body", "soul", "career", "relationships", "entrepreneurship"])
  ).optional().describe("Optional filter by specific categories"),
  maxResults: z.number().min(1).max(10).default(5).describe("Maximum number of programs to return (1-10)"),
  includeComingSoon: z.boolean().default(false).describe("Whether to include programs marked as coming soon"),
});

export type GetProgramRecommendationsInput = z.infer<typeof getProgramRecommendationsSchema>;
