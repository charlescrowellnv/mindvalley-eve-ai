import * as cheerio from "cheerio";
import type { MindvalleyProgram, ProgramsData } from "@/lib/types/program";

const CATEGORIES = ["mind", "body", "soul", "career", "relationships", "entrepreneurship"] as const;
const BASE_URL = "https://www.mindvalley.com/programs";
const TIMEOUT = 10000; // 10 seconds

interface ScrapedProgram {
  id: string;
  slug: string;
  title: string;
  instructor?: {
    name: string;
    image?: string;
  };
  description?: string;
  coverImage?: string;
  categories?: string[];
  enrollmentCount?: number;
  averageRating?: number;
  duration?: number;
  lessonCount?: number;
  language?: string;
  status?: string;
}

async function fetchWithTimeout(url: string, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

function extractNextData(html: string): any {
  const $ = cheerio.load(html);
  const nextDataScript = $('script#__NEXT_DATA__').html();

  if (!nextDataScript) {
    return null;
  }

  try {
    return JSON.parse(nextDataScript);
  } catch (error) {
    console.error('Failed to parse __NEXT_DATA__:', error);
    return null;
  }
}

function normalizeProgram(
  program: ScrapedProgram,
  category: typeof CATEGORIES[number]
): MindvalleyProgram {
  return {
    id: program.id,
    slug: program.slug,
    title: program.title || "Untitled Program",
    author: program.instructor?.name || "Mindvalley",
    description: program.description || "",
    backgroundImage: program.coverImage || "",
    authorPortrait: program.instructor?.image || "",
    categories: program.categories || [category],
    primaryCategory: category,
    enrollmentCount: program.enrollmentCount || 0,
    averageRating: program.averageRating || 0,
    duration: program.duration,
    lessonCount: program.lessonCount,
    language: program.language || "en",
    url: `${BASE_URL}/${program.slug}`,
    isComingSoon: program.status === "coming_soon",
    isBeta: program.status === "beta",
  };
}

async function scrapeCategoryPage(
  category: typeof CATEGORIES[number]
): Promise<MindvalleyProgram[]> {
  const url = `${BASE_URL}/${category}`;
  console.log(`Scraping ${category} programs from ${url}...`);

  try {
    const response = await fetchWithTimeout(url, TIMEOUT);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const nextData = extractNextData(html);

    if (!nextData) {
      console.warn(`No __NEXT_DATA__ found for ${category}`);
      return [];
    }

    // Navigate the Next.js data structure to find programs
    // This structure may vary - adjust based on actual HTML structure
    const pageProps = nextData.props?.pageProps;
    let programs: ScrapedProgram[] = [];

    // Try multiple possible locations in the data structure
    if (pageProps?.programs) {
      programs = pageProps.programs;
    } else if (pageProps?.initialData?.programs) {
      programs = pageProps.initialData.programs;
    } else if (pageProps?.data?.programs) {
      programs = pageProps.data.programs;
    } else {
      console.warn(`Could not find programs array in __NEXT_DATA__ for ${category}`);
      return [];
    }

    const normalized = programs
      .filter((p: ScrapedProgram) => p.id && p.slug && p.title)
      .map((p: ScrapedProgram) => normalizeProgram(p, category));

    console.log(`✓ Scraped ${normalized.length} programs from ${category}`);
    return normalized;

  } catch (error) {
    console.error(`✗ Failed to scrape ${category}:`, error);
    return [];
  }
}

export async function scrapePrograms(): Promise<ProgramsData> {
  console.log('Starting program scraping...');
  const startTime = Date.now();

  const results = await Promise.all(
    CATEGORIES.map(category => scrapeCategoryPage(category))
  );

  const allPrograms = results.flat();

  // Deduplicate by ID (some programs may appear in multiple categories)
  const uniquePrograms = Array.from(
    new Map(allPrograms.map(p => [p.id, p])).values()
  );

  // Count by category
  const categoryCounts: Record<string, number> = {};
  CATEGORIES.forEach(cat => {
    categoryCounts[cat] = uniquePrograms.filter(p => p.primaryCategory === cat).length;
  });

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n✓ Scraping complete in ${duration}s`);
  console.log(`Total programs: ${uniquePrograms.length} (${allPrograms.length} before deduplication)`);
  console.log('By category:', categoryCounts);

  return {
    programs: uniquePrograms,
    lastUpdated: new Date().toISOString(),
    totalCount: uniquePrograms.length,
    categoryCounts,
  };
}
