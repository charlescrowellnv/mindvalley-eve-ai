import { ProgramCard } from "./program-card";
import type { ProgramRecommendationsResult } from "@/lib/types/program";
import { Sparkles, Search } from "lucide-react";

interface ProgramRecommendationsProps {
  result: ProgramRecommendationsResult;
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-4">
      <div className="rounded-full bg-muted p-4">
        <Search className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold text-lg">No Programs Found</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          I couldn&apos;t find programs matching &quot;{query}&quot;. Try
          broadening your search or exploring different categories like mind,
          body, soul, career, relationships, or entrepreneurship.
        </p>
      </div>
    </div>
  );
}

export function ProgramRecommendations({
  result,
}: ProgramRecommendationsProps) {
  if (result.recommendations.length === 0) {
    return <EmptyState query={result.query} />;
  }

  return (
    <div className="space-y-5 py-2">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-xl">
            Recommended Programs for You
          </h3>
        </div>
        {/* <p className="text-sm text-muted-foreground">
          Based on:{" "}
          <span className="font-medium text-foreground">
            &quot;{result.query}&quot;
          </span>
          {result.categories.length > 0 && result.categories[0] !== "all" && (
            <span className="ml-2">
              • Categories:{" "}
              <span className="font-medium text-foreground">
                {result.categories.join(", ")}
              </span>
            </span>
          )}
        </p> */}
      </div>

      {/* Program Cards Grid */}
      <div className="grid gap-5 lg:grid-cols-2 px-1">
        {result.recommendations.map((rec) => (
          <ProgramCard key={rec.program.id} recommendation={rec} />
        ))}
      </div>
    </div>
  );
}
