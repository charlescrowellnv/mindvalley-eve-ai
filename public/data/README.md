# Program Data

This directory contains static program data for the Mindvalley Eve AI prototype.

## programs.json

Contains 15 sample Mindvalley programs across all categories:
- **Mind**: 7 programs
- **Body**: 3 programs
- **Soul**: 3 programs
- **Career**: 1 program
- **Relationships**: 1 program
- **Entrepreneurship**: 1 program

This is **static data** for the prototype. The programs are representative examples used to demonstrate the AI recommendation features.

## Data Structure

Each program includes:
- Basic info (id, slug, title, author)
- Metadata (enrollment count, rating, duration)
- Categorization (primary category + tags)
- URLs and images
- Status flags (coming soon, beta)

## Updating Data

To update the program data, manually edit `programs.json`. The file structure follows the `ProgramsData` interface defined in `/lib/types/program.ts`.

**Note**: This prototype does not include automated scraping. All program data is manually curated.
