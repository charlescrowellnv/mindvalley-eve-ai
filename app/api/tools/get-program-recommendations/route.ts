import { NextRequest, NextResponse } from 'next/server';
import { loadPrograms, matchProgramsToGoal } from '@/lib/services/program-service';
import type { ProgramRecommendationsResult } from '@/lib/types/program';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userGoal, categories, maxResults = 5, includeComingSoon = false } = body;

    if (!userGoal) {
      return NextResponse.json(
        { error: 'userGoal is required' },
        { status: 400 }
      );
    }

    // Load all programs from cache
    const programsData = await loadPrograms();

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

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in get-program-recommendations API:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch program recommendations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
