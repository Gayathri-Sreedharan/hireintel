/**
 * ================================================
 * HireIntel - Job Pipeline Test
 * ================================================
 */

require("dotenv").config({
  override: true
});

const {
  runPipeline,
  getSources
} = require("../src/pipeline/jobPipeline");

/**
 * ================================================
 * MAIN
 * ================================================
 */

async function main() {
  try {
    console.log("\nAVAILABLE JOB SOURCES");
    console.log("================================");

    const sources = getSources();

    for (const source of sources) {
      console.log(
        `${source.id} - ${source.name} - Enabled: ${source.enabled}`
      );
    }

    /**
     * Run pipeline with both enabled sources.
     */

    const result = await runPipeline({
      sources: [
        "naukri",
        "linkedin"
      ],

      keyword: "data scientist",

      maxJobs: 5,

      includeJobDescription: true,

      saveToDatabase: true
    });

    /**
     * ================================================
     * FINAL RESULT
     * ================================================
     */

    console.log("\nFINAL RESULT");
    console.log("================================");

    console.log(
      JSON.stringify(
        result.summary,
        null,
        2
      )
    );

    /**
     * ================================================
     * SOURCE RESULTS
     * ================================================
     */

    console.log("\nSOURCE RESULTS");
    console.log("================================");

    for (const sourceResult of result.results || []) {
      console.log(
        `\n${sourceResult.source.toUpperCase()}`
      );

      console.log(
        JSON.stringify(
          {
            status: sourceResult.status,
            rawCount: sourceResult.rawCount,
            count: sourceResult.count,
            skippedJobs:
              sourceResult.skippedJobs?.length || 0,
            processingFailures:
              sourceResult.processingFailures?.length || 0,
            saveSummary:
              sourceResult.saveResult?.summary || null
          },
          null,
          2
        )
      );
    }

  } catch (error) {

    console.error(
      "\nPIPELINE TEST FAILED"
    );

    console.error(
      "================================"
    );

    console.error(
      error.message
    );

    console.error(
      error.stack
    );

    process.exitCode = 1;
  }
}

/**
 * ================================================
 * RUN TEST
 * ================================================
 */

main();