/**
 * ================================================
 * HireIntel - Central Job Pipeline
 * ================================================
 */

const { scrape: scrapeNaukri } = require("../scrapers/naukri");
const { scrape: scrapeLinkedIn } = require("../scrapers/linkedin");

/**
 * ================================================
 * JOB SOURCES
 * ================================================
 */

const JOB_SOURCES = {
  naukri: {
    name: "Naukri",
    enabled: true,
    scraper: scrapeNaukri
  },

  linkedin: {
    name: "LinkedIn",
    enabled: true,
    scraper: scrapeLinkedIn
  }
};

/**
 * ================================================
 * GET AVAILABLE SOURCES
 * ================================================
 */

function getSources() {
  return Object.entries(JOB_SOURCES).map(
    ([id, config]) => ({
      id,
      name: config.name,
      enabled: config.enabled
    })
  );
}

/**
 * ================================================
 * GET ENABLED SOURCES
 * ================================================
 */

function getEnabledSources() {
  return Object.entries(JOB_SOURCES)
    .filter(([, config]) => config.enabled)
    .map(([id]) => id);
}

/**
 * ================================================
 * RUN PIPELINE
 * ================================================
 */

async function runPipeline({
  sources = getEnabledSources(),

  keyword = "data scientist",

  maxJobs = 5,

  includeJobDescription = true,

  saveToDatabase = true,

  timeoutSecs = 300,

  maxTotalChargeUsd = 0.50
} = {}) {

  console.log("\nHIREINTEL JOB PIPELINE");
  console.log("================================");

  console.log(
    `Keyword: ${keyword}`
  );

  console.log(
    `Max jobs: ${maxJobs}`
  );

  console.log(
    `Sources: ${sources.join(", ")}`
  );

  console.log(
    `Save to database: ${saveToDatabase}`
  );

  console.log(
    "================================"
  );

  const results = [];

  /**
   * ================================================
   * VALIDATE SOURCES
   * ================================================
   */

  for (const sourceId of sources) {

    const sourceConfig =
      JOB_SOURCES[sourceId];

    if (!sourceConfig) {

      console.warn(
        `\nUnknown source skipped: ${sourceId}`
      );

      results.push({
        source: sourceId,
        status: "skipped",
        error: `Unknown source: ${sourceId}`
      });

      continue;
    }

    if (!sourceConfig.enabled) {

      console.warn(
        `\nDisabled source skipped: ${sourceId}`
      );

      results.push({
        source: sourceId,
        status: "skipped",
        error: `Source is disabled: ${sourceId}`
      });

      continue;
    }

    /**
     * ================================================
     * RUN SOURCE
     * ================================================
     */

    console.log(
      `\n--------------------------------`
    );

    console.log(
      `STARTING SOURCE: ${sourceConfig.name}`
    );

    console.log(
      `--------------------------------`
    );

    try {

      const result =
        await sourceConfig.scraper({

          keyword,

          maxJobs,

          includeJobDescription,

          saveToDatabase,

          timeoutSecs,

          maxTotalChargeUsd
        });

      results.push({
        ...result,

        source:
          result.source ||
          sourceId,

        status:
          result.status ||
          "SUCCEEDED"
      });

      console.log(
        `\n${sourceConfig.name} completed successfully.`
      );

    } catch (error) {

      console.error(
        `\n${sourceConfig.name} failed.`
      );

      console.error(
        error.message
      );

      /**
       * Important:
       * A failure in one source should NOT stop
       * the remaining sources.
       */

      results.push({

        source: sourceId,

        status: "failed",

        error: error.message,

        rawCount: 0,

        count: 0,

        jobs: [],

        skippedJobs: [],

        processingFailures: [],

        saveResult: {
          created: [],
          duplicates: [],
          failed: [],
          summary: {
            total: 0,
            created: 0,
            duplicates: 0,
            failed: 0
          }
        }
      });
    }
  }

  /**
   * ================================================
   * AGGREGATE RESULTS
   * ================================================
   */

  const successfulResults =
    results.filter(
      result =>
        result.status !== "failed" &&
        result.status !== "skipped"
    );

  const failedResults =
    results.filter(
      result =>
        result.status === "failed"
    );

  const processedJobs =
    results.reduce(
      (total, result) =>
        total +
        Number(result.count || 0),
      0
    );

  const rawJobs =
    results.reduce(
      (total, result) =>
        total +
        Number(result.rawCount || 0),
      0
    );

  const skippedInvalid =
    results.reduce(
      (total, result) =>
        total +
        Number(
          result.skippedJobs?.length || 0
        ),
      0
    );

  const processingFailures =
    results.reduce(
      (total, result) =>
        total +
        Number(
          result.processingFailures?.length || 0
        ),
      0
    );

  const created =
    results.reduce(
      (total, result) =>
        total +
        Number(
          result.saveResult?.summary?.created || 0
        ),
      0
    );

  const duplicates =
    results.reduce(
      (total, result) =>
        total +
        Number(
          result.saveResult?.summary?.duplicates || 0
        ),
      0
    );

  const failed =
    results.reduce(
      (total, result) =>
        total +
        Number(
          result.saveResult?.summary?.failed || 0
        ),
      0
    );

  /**
   * ================================================
   * FINAL SUMMARY
   * ================================================
   */

  const summary = {

    totalSources:
      sources.length,

    successfulSources:
      successfulResults.length,

    failedSources:
      failedResults.length,

    rawJobs,

    processedJobs,

    skippedInvalid,

    processingFailures,

    created,

    duplicates,

    failed
  };

  console.log(
    "\n================================"
  );

  console.log(
    "PIPELINE COMPLETED"
  );

  console.log(
    "================================"
  );

  console.log(
    JSON.stringify(
      summary,
      null,
      2
    )
  );

  return {

    summary,

    results
  };
}

/**
 * ================================================
 * EXPORTS
 * ================================================
 */

module.exports = {
  JOB_SOURCES,
  getSources,
  getEnabledSources,
  runPipeline
};