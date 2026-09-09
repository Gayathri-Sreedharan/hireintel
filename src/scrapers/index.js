const { getEnabledSources } = require("../config/sources");
const KEYWORDS = require("../config/keywords");

/**
 * Load a scraper module dynamically.
 *
 * Each scraper file should eventually export:
 *
 * async function scrape({ keyword, category, source })
 *
 * Example:
 * {
 *   scrape: async ({ keyword, category, source }) => {
 *     ...
 *   }
 * }
 */
function loadScraper(scraperName) {
  try {
    return require(`./${scraperName}`);
  } catch (error) {
    return null;
  }
}

/**
 * Get keywords configured for a source.
 */
function getKeywordsForSource(sourceConfig) {
  const keywords = [];

  for (const category of sourceConfig.keywordCategories || []) {
    const categoryKeywords = KEYWORDS[category];

    if (!Array.isArray(categoryKeywords)) {
      console.warn(
        `[SCRAPER] Keyword category not found: ${category}`
      );
      continue;
    }

    keywords.push(
      ...categoryKeywords.map(keyword => ({
        keyword,
        category
      }))
    );
  }

  return keywords;
}

/**
 * Scrape a single source.
 */
async function scrapeSource(sourceConfig, options = {}) {
  const {
    maxKeywords = null,
    stopOnError = false
  } = options;

  console.log("\n========================================");
  console.log(`SOURCE: ${sourceConfig.name}`);
  console.log("========================================");

  const scraper = loadScraper(sourceConfig.scraper);

  if (!scraper) {
    console.log(
      `[SCRAPER] ${sourceConfig.name}: scraper module not implemented yet.`
    );

    return {
      source: sourceConfig.key,
      sourceName: sourceConfig.name,
      status: "not_implemented",
      jobs: [],
      totalJobs: 0,
      errors: []
    };
  }

  if (typeof scraper.scrape !== "function") {
    console.log(
      `[SCRAPER] ${sourceConfig.name}: scrape() function not found.`
    );

    return {
      source: sourceConfig.key,
      sourceName: sourceConfig.name,
      status: "invalid_scraper",
      jobs: [],
      totalJobs: 0,
      errors: []
    };
  }

  let keywordEntries = getKeywordsForSource(sourceConfig);

  if (maxKeywords && maxKeywords > 0) {
    keywordEntries = keywordEntries.slice(0, maxKeywords);
  }

  console.log(
    `[SCRAPER] ${sourceConfig.name}: ${keywordEntries.length} keywords configured`
  );

  const jobs = [];
  const errors = [];

  for (let i = 0; i < keywordEntries.length; i++) {
    const { keyword, category } = keywordEntries[i];

    console.log(
      `[SCRAPER] ${sourceConfig.name} | ${i + 1}/${keywordEntries.length} | ${keyword}`
    );

    try {
      const result = await scraper.scrape({
        keyword,
        category,
        source: sourceConfig.key,
        sourceName: sourceConfig.name,
        country: sourceConfig.country
      });

      let scrapedJobs = [];

      if (Array.isArray(result)) {
        scrapedJobs = result;
      } else if (result && Array.isArray(result.jobs)) {
        scrapedJobs = result.jobs;
      }

      console.log(
        `[SCRAPER] ${sourceConfig.name} | ${keyword} | ${scrapedJobs.length} jobs`
      );

      jobs.push(
        ...scrapedJobs.map(job => ({
          ...job,
          source: job.source || sourceConfig.key,
          search_keyword: job.search_keyword || keyword,
          search_category: job.search_category || category
        }))
      );

      // Small delay between searches to avoid hammering a source.
      if (i < keywordEntries.length - 1) {
        await delay(options.keywordDelayMs || 500);
      }

    } catch (error) {
      const errorMessage =
        error?.message || String(error);

      console.error(
        `[SCRAPER ERROR] ${sourceConfig.name} | ${keyword}`,
        errorMessage
      );

      errors.push({
        keyword,
        category,
        error: errorMessage
      });

      if (stopOnError) {
        throw error;
      }
    }
  }

  console.log(
    `[SCRAPER] ${sourceConfig.name}: completed with ${jobs.length} raw jobs`
  );

  return {
    source: sourceConfig.key,
    sourceName: sourceConfig.name,
    status: "completed",
    jobs,
    totalJobs: jobs.length,
    errors
  };
}

/**
 * Scrape all enabled sources.
 */
async function scrapeAllSources(options = {}) {
  const sources = getEnabledSources();

  console.log("\n========================================");
  console.log("HIREINTEL JOB SCRAPER");
  console.log("========================================");

  console.log(
    `[SCRAPER] Enabled sources: ${sources.length}`
  );

  const results = [];
  const allJobs = [];

  for (const sourceConfig of sources) {
    try {
      const result = await scrapeSource(
        sourceConfig,
        options
      );

      results.push(result);
      allJobs.push(...result.jobs);

    } catch (error) {
      console.error(
        `[SCRAPER ERROR] Source failed: ${sourceConfig.name}`,
        error.message
      );

      results.push({
        source: sourceConfig.key,
        sourceName: sourceConfig.name,
        status: "failed",
        jobs: [],
        totalJobs: 0,
        errors: [
          {
            error: error.message
          }
        ]
      });
    }
  }

  console.log("\n========================================");
  console.log("SCRAPING SUMMARY");
  console.log("========================================");

  for (const result of results) {
    console.log(
      `${result.sourceName}: ${result.status} | ${result.totalJobs} jobs`
    );
  }

  console.log("----------------------------------------");
  console.log(`TOTAL RAW JOBS: ${allJobs.length}`);
  console.log("========================================\n");

  return {
    results,
    jobs: allJobs,
    totalJobs: allJobs.length
  };
}

/**
 * Utility delay.
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  loadScraper,
  getKeywordsForSource,
  scrapeSource,
  scrapeAllSources
};

