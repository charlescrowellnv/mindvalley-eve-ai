import { ExternalLink, Star, Users, Clock, BookOpen, Link } from "lucide-react";
import type { ProgramRecommendation } from "@/lib/types/program";
import { Badge } from "./ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./ui/card";
import { Button } from "./ui/button";

interface ProgramCardProps {
  recommendation: ProgramRecommendation;
}

export function ProgramCard({ recommendation }: ProgramCardProps) {
  const { program, matchReason } = recommendation;

  // Format enrollment count (e.g., 125000 → "125K")
  const formatEnrollments = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
    return count.toString();
  };

  // Format duration (minutes to hours)
  const formatDuration = (minutes?: number): string => {
    if (!minutes) return "";
    const hours = Math.floor(minutes / 60);
    return hours > 0 ? `${hours}h` : `${minutes}m`;
  };

  return (
    <Card className="transition-all shadow-lg">
      {/* Background Image with Gradient Overlay */}
      <div className="relative h-48 w-full overflow-hidden -mt-6">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Category Badge */}
        {/* <div className="absolute top-3 right-3">
          <Badge variant="secondary">{program.primaryCategory}</Badge>
        </div> */}

        {/* Status Badges */}
        {program.isComingSoon && (
          <div className="absolute top-3 left-3">
            <Badge variant="outline">Coming Soon</Badge>
          </div>
        )}
        {program.isBeta && (
          <div className="absolute top-3 left-3">
            <Badge variant="outline">Beta</Badge>
          </div>
        )}
      </div>

      {/* Card Header */}
      <CardHeader>
        <CardTitle className="text-lg leading-tight line-clamp-2">
          {program.title}
        </CardTitle>
        <CardDescription>by {program.author}</CardDescription>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-2">
          {/* Rating */}
          {program.averageRating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">
                {program.averageRating.toFixed(1)}
              </span>
            </div>
          )}

          {/* Enrollments */}
          {program.enrollmentCount > 0 && (
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              <span>{formatEnrollments(program.enrollmentCount)} enrolled</span>
            </div>
          )}

          {/* Duration */}
          {program.duration && (
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatDuration(program.duration)}</span>
            </div>
          )}

          {/* Lesson Count */}
          {program.lessonCount && (
            <div className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              <span>{program.lessonCount} lessons</span>
            </div>
          )}
        </div>
        {/* Additional Category Tags */}
        {program.categories.length > 1 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {program.categories.slice(0, 3).map((category) => (
              <span
                key={category}
                className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                {category}
              </span>
            ))}
            {program.categories.length > 3 && (
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                +{program.categories.length - 3}
              </span>
            )}
          </div>
        )}
      </CardHeader>

      {/* Card Content */}
      <CardContent className="space-y-3">
        {/* Match Reason - Why Recommended */}
        {/* <div className="rounded-md bg-primary/10 px-3 py-2">
          <p className="text-sm font-medium text-primary">✨ {matchReason}</p>
        </div> */}

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-3 text-balance">
          {program.description ||
            "Discover transformative content designed to help you grow."}
        </p>
      </CardContent>

      {/* Card Footer - CTA Button */}
      <CardFooter className="border-t">
        <Button asChild size="lg" className="w-full sm:w-auto">
          <a href={program.url} target="_blank" rel="noopener noreferrer">
            Learn More
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
