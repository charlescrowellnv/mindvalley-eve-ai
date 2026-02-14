import { NextRequest, NextResponse } from 'next/server';
import type { ConversationSuggestionsResult } from '@/lib/types/suggestion';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, suggestions, context } = body;

    if (!prompt || !suggestions || !Array.isArray(suggestions)) {
      return NextResponse.json(
        { error: 'prompt and suggestions array are required' },
        { status: 400 }
      );
    }

    // Generate IDs for each suggestion
    const suggestionsWithIds = suggestions.map((suggestion: {
      text: string;
      label?: string;
      type: 'question' | 'action' | 'topic';
    }, index: number) => ({
      id: `suggestion-${Date.now()}-${index}`,
      text: suggestion.text,
      label: suggestion.label || suggestion.text,
      type: suggestion.type,
    }));

    const result: ConversationSuggestionsResult = {
      suggestions: suggestionsWithIds,
      timestamp: new Date().toISOString(),
      prompt,
      context,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in get-conversation-suggestions API:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate conversation suggestions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
