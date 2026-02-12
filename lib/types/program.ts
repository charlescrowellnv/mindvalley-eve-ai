export interface MindvalleyProgram {
  id: string;
  slug: string;
  title: string;
  author: string;
  description: string;
  backgroundImage: string;
  authorPortrait: string;
  categories: string[];
  primaryCategory: "mind" | "body" | "soul" | "career" | "relationships" | "entrepreneurship";
  enrollmentCount: number;
  averageRating: number;
  duration?: number;
  lessonCount?: number;
  language: string;
  url: string;
  isComingSoon: boolean;
  isBeta: boolean;
}

export interface ProgramRecommendation {
  program: MindvalleyProgram;
  relevanceScore: number;
  matchReason: string;
}

export interface ProgramRecommendationsResult {
  recommendations: ProgramRecommendation[];
  query: string;
  totalMatches: number;
  categories: string[];
}

export interface ProgramsData {
  programs: MindvalleyProgram[];
  lastUpdated: string;
  totalCount: number;
  categoryCounts: Record<string, number>;
}
