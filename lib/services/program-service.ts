import fs from "fs/promises";
import path from "path";
import type {
  MindvalleyProgram,
  ProgramRecommendation,
  ProgramsData,
} from "@/lib/types/program";

const CACHE_PATH = path.join(process.cwd(), "public", "data", "programs.json");

/**
 * Load programs from cached JSON file
 */
export async function loadPrograms(): Promise<ProgramsData> {
  try {
    const data = await fs.readFile(CACHE_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to load programs cache:", error);
    // Return empty data structure if cache doesn't exist
    return {
      programs: [],
      lastUpdated: new Date().toISOString(),
      totalCount: 0,
      categoryCounts: {},
    };
  }
}

/**
 * Calculate relevance score for a program based on user goal
 */
function calculateRelevanceScore(
  program: MindvalleyProgram,
  goalKeywords: string[]
): { score: number; matches: string[] } {
  let score = 0;
  const matches: string[] = [];

  const titleLower = program.title.toLowerCase();
  const descriptionLower = program.description.toLowerCase();
  const authorLower = program.author.toLowerCase();

  // Check each keyword
  goalKeywords.forEach((keyword) => {
    // Title match (highest weight)
    if (titleLower.includes(keyword)) {
      score += 10;
      matches.push(`title: "${keyword}"`);
    }

    // Description match (medium weight)
    if (descriptionLower.includes(keyword)) {
      score += 5;
      if (!matches.some(m => m.includes(`"${keyword}"`))) {
        matches.push(`description: "${keyword}"`);
      }
    }

    // Category match (lower weight)
    const categoryMatch = program.categories.some((cat) =>
      cat.toLowerCase().includes(keyword)
    );
    if (categoryMatch) {
      score += 3;
      matches.push(`category: "${keyword}"`);
    }

    // Author match
    if (authorLower.includes(keyword)) {
      score += 2;
      matches.push(`author: "${keyword}"`);
    }
  });

  // Boost by quality indicators
  if (program.averageRating >= 4.5) {
    score += 2;
  } else if (program.averageRating >= 4.0) {
    score += 1;
  }

  // Boost by popularity
  if (program.enrollmentCount > 100000) {
    score += 3;
  } else if (program.enrollmentCount > 50000) {
    score += 2;
  } else if (program.enrollmentCount > 10000) {
    score += 1;
  }

  // Penalize coming soon programs slightly
  if (program.isComingSoon) {
    score -= 2;
  }

  return { score, matches };
}

/**
 * Extract keywords from user goal text
 */
function extractKeywords(goalText: string): string[] {
  // Convert to lowercase and split into words
  const words = goalText
    .toLowerCase()
    .replace(/[^\w\s]/g, " ") // Remove punctuation
    .split(/\s+/)
    .filter((word) => word.length > 2); // Filter out very short words

  // Common stop words to ignore
  const stopWords = new Set([
    "the",
    "and",
    "for",
    "with",
    "want",
    "need",
    "help",
    "find",
    "show",
    "get",
    "make",
    "become",
    "improve",
    "learn",
    "about",
    "how",
    "what",
    "can",
    "will",
    "would",
    "could",
    "should",
  ]);

  // Filter out stop words and return unique keywords
  return Array.from(new Set(words.filter((word) => !stopWords.has(word))));
}

/**
 * Generate a human-readable match reason
 */
function generateMatchReason(
  program: MindvalleyProgram,
  matches: string[],
  goalText: string
): string {
  if (matches.length === 0) {
    return `Highly rated program in ${program.primaryCategory}`;
  }

  // Extract the most significant match
  const titleMatches = matches.filter((m) => m.startsWith("title:"));
  const descMatches = matches.filter((m) => m.startsWith("description:"));

  if (titleMatches.length > 0) {
    const keywords = titleMatches.map(m => m.split('"')[1]).join(", ");
    return `Direct match for: ${keywords}`;
  }

  if (descMatches.length > 0) {
    return `Addresses ${goalText.toLowerCase()}`;
  }

  return `Relevant to your ${program.primaryCategory} goals`;
}

/**
 * Match programs to user goal using keyword-based scoring
 */
export async function matchProgramsToGoal(
  userGoal: string,
  programs: MindvalleyProgram[],
  maxResults: number = 5
): Promise<ProgramRecommendation[]> {
  const keywords = extractKeywords(userGoal);

  if (keywords.length === 0) {
    // If no keywords extracted, return top-rated programs
    return programs
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, maxResults)
      .map((program) => ({
        program,
        relevanceScore: program.averageRating * 10,
        matchReason: `Highly rated program in ${program.primaryCategory}`,
      }));
  }

  // Score all programs
  const scored = programs
    .map((program) => {
      const { score, matches } = calculateRelevanceScore(program, keywords);
      return {
        program,
        relevanceScore: score,
        matches,
      };
    })
    .filter((item) => item.relevanceScore > 0) // Only include programs with some match
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, maxResults);

  // Convert to recommendations with match reasons
  return scored.map((item) => ({
    program: item.program,
    relevanceScore: item.relevanceScore,
    matchReason: generateMatchReason(item.program, item.matches, userGoal),
  }));
}
