import type { ConversationSuggestionsResult } from "@/lib/types/suggestion";
import { Button } from "@/components/ui/button";
import { MessageSquare, Zap, Compass } from "lucide-react";

import { Text } from "./elements/text";

interface ConversationSuggestionsProps {
  result: ConversationSuggestionsResult;
  onSuggestionClick: (text: string) => void;
}

export function ConversationSuggestions({
  result,
  onSuggestionClick,
}: ConversationSuggestionsProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "question":
        return <MessageSquare className="h-4 w-4" />;
      case "action":
        return <Zap className="h-4 w-4" />;
      case "topic":
        return <Compass className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getHoverColor = (type: string) => {
    switch (type) {
      case "question":
        return "hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-950/30 dark:hover:border-blue-800";
      case "action":
        return "hover:bg-purple-50 hover:border-purple-200 dark:hover:bg-purple-950/30 dark:hover:border-purple-800";
      case "topic":
        return "hover:bg-green-50 hover:border-green-200 dark:hover:bg-green-950/30 dark:hover:border-green-800";
      default:
        return "hover:bg-muted/50";
    }
  };

  return (
    <div className="space-y-3 py-2">
      {/* Header */}
      <Text size="lg" className="font-bold">
        {result.prompt}
      </Text>

      {/* Suggestions Grid */}
      <div className="grid gap-2 sm:grid-cols-2">
        {result.suggestions.map((suggestion) => (
          <Button
            key={suggestion.id}
            variant="outline"
            className={`h-auto w-full justify-start gap-2 px-4 py-3 text-left whitespace-normal ${getHoverColor(
              suggestion.type
            )} transition-colors`}
            onClick={() => onSuggestionClick(suggestion.text)}
          >
            {/* {getIcon(suggestion.type)} */}
            <span className="text-sm">{suggestion.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
