# Breaking News Scraper

This module scrapes breaking news from Al Mayadeen website in both Arabic and English languages, and stores them in the database for display in the Phoenix Press application.

## Features

- Scrapes breaking news from Al Mayadeen Arabic (`https://www.almayadeen.net/`)
- Scrapes breaking news from Al Mayadeen English (`https://english.almayadeen.net/`)
- Runs every 15 minutes via a cron job
- Stores news in the database with locale identification
- Cleans up old news (24+ hours) to keep the database lean

## Setup

1. Install dependencies:
   ```bash
   npm install axios cheerio node-cron
   ```

2. Create the database schema:
   ```bash
   npx prisma migrate dev
   ```

3. Run the scraper:
   ```bash
   npm run start:cron
   ```

## Usage in Development

In development mode, you can run the scraper using:

```bash
npm run start:cron
```

This will:
1. Build the TypeScript files for the scraper
2. Start the cron job that runs every 15 minutes

## Production Deployment

For production, you have two options:

### Option 1: Run as part of your Next.js application

Include the cron job setup in your main application code, and it will run alongside your Next.js server.

### Option 2: Run as a separate process

Set up a separate process or container to run the scraper. This is the recommended approach for larger applications.

1. Add a script to your deployment process to run:
   ```bash
   npm run start:cron
   ```

2. Or, set up a standalone cron job on your server:
   ```
   */15 * * * * cd /path/to/app && npm run scrape
   ```

## Important Notes

- The scraper uses the `node-cron` package to schedule jobs.
- It stores data in the `BreakingNews` table in your PostgreSQL database.
- Make sure you have proper error handling in place to prevent the scraper from crashing your application.
- Respect the website's terms of service and don't overload their servers with too many requests.
- Consider implementing a cache to reduce database calls in your frontend. 