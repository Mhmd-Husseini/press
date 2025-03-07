# Breaking News Scraper

This project includes automated scraping of breaking news from Al Mayadeen's website in both English and Arabic languages.

## GitHub Actions Scheduler

Instead of running a separate cron process on the server, this project uses GitHub Actions as a free external scheduler. This approach has several benefits:

- No additional server resources required
- Free to use (within GitHub Actions usage limits)
- Easy to monitor through GitHub's interface
- Simple to maintain and modify

## How It Works

1. A GitHub Actions workflow runs every 15 minutes
2. The workflow sends HTTP requests to API endpoints in your application
3. These API endpoints trigger the scraper functions for each language
4. The scraped news is stored in your database
5. Your application can then display the breaking news in the UI

## Setup Instructions

1. **Deploy your application** to Vercel or your preferred hosting platform
2. **Update the URLs** in the GitHub workflow file:
   - Open `.github/workflows/breaking-news-scraper.yml`
   - Replace `https://your-vercel-project.vercel.app` with your actual domain
3. **Push to GitHub** - the workflow will be automatically registered
4. **Test manually** by going to your repository's Actions tab and using the "Run workflow" button

## API Endpoints

The scraper can be triggered through the following API endpoints:

- `GET /api/scraper/breaking-news?locale=en` - Scrape English news
- `GET /api/scraper/breaking-news?locale=ar` - Scrape Arabic news

Both endpoints require no authentication (be cautious about rate limiting) and return JSON responses.

## Monitoring

You can monitor the runs of the scraper:

1. Go to your GitHub repository
2. Click the "Actions" tab
3. Select the "Breaking News Scraper" workflow
4. Check the logs of the workflow runs

Failures will be visible in the Actions tab and can be configured to notify you via email.

## Customizing the Schedule

To change how frequently the scraper runs:

1. Edit `.github/workflows/breaking-news-scraper.yml`
2. Modify the cron expression in the `schedule` section
3. Save and commit the changes

For example, to run hourly: `cron: '0 * * * *'` 