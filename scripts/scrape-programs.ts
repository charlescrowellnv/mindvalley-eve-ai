import { scrapePrograms } from "../lib/services/program-scraper";
import fs from "fs/promises";
import path from "path";

async function main() {
  console.log("=".repeat(60));
  console.log("Mindvalley Program Scraper");
  console.log("=".repeat(60));
  console.log();

  try {
    // Run the scraper
    const data = await scrapePrograms();

    // Ensure output directory exists
    const dataDir = path.join(process.cwd(), "public", "data");
    await fs.mkdir(dataDir, { recursive: true });

    // Write to cache file
    const outputPath = path.join(dataDir, "programs.json");
    await fs.writeFile(
      outputPath,
      JSON.stringify(data, null, 2),
      "utf-8"
    );

    console.log();
    console.log("=".repeat(60));
    console.log("✓ SUCCESS");
    console.log("=".repeat(60));
    console.log(`Programs scraped: ${data.totalCount}`);
    console.log(`Output file: ${outputPath}`);
    console.log(`Last updated: ${data.lastUpdated}`);
    console.log();

    process.exit(0);
  } catch (error) {
    console.error();
    console.error("=".repeat(60));
    console.error("✗ SCRAPING FAILED");
    console.error("=".repeat(60));
    console.error(error);
    console.error();
    process.exit(1);
  }
}

main();
