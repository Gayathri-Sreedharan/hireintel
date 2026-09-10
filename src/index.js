/**
 * ================================================
 * HireIntel - Production Job Sourcing Runner
 * ================================================
 *
 * Production flow:
 *
 * ALL NORMALIZED KEYWORDS
 *          ↓
 * Naukri + LinkedIn
 *          ↓
 * Validation
 *          ↓
 * Normalization
 *          ↓
 * Experience extraction
 *          ↓
 * Skill / domain extraction
 *          ↓
 * Deduplication
 *          ↓
 * Supabase
 *          ↓
 * Identify NEW jobs
 *          ↓
 * Create daily CSV
 *          ↓
 * Gmail report + CSV attachment
 *
 * Safety controls:
 *
 * HIREINTEL_MAX_KEYWORDS
 * HIREINTEL_CUSTOM_KEYWORD
 * HIREINTEL_DRY_RUN
 *
 * ================================================
 */

require("dotenv").config({
  override: true
});

const {
  ALL_KEYWORDS
} = require("./config/keywords");

const {
  runPipeline
} = require("./pipeline/jobPipeline");

const {
  sendReport,
  getEmailConfig,
  validateEmailConfig
} = require("./email/sendReport");

const {
  createJobCsvFile,
  getIndiaDateString
} = require("./email/createJobCsv");

/**
 * ================================================
 * CONFIGURATION
 * ================================================
 */

const SOURCES = [
  "naukri",
  "linkedin"
];

const MAX_JOBS_PER_KEYWORD =
  Number(
    process.env.HIREINTEL_MAX_JOBS_PER_KEYWORD || 2
  );

const MAX_KEYWORDS =
  Number(
    process.env.HIREINTEL_MAX_KEYWORDS || 0
  );

const CUSTOM_KEYWORD =
  String(
    process.env.HIREINTEL_CUSTOM_KEYWORD || ""
  ).trim();

const DRY_RUN =
  process.env.HIREINTEL_DRY_RUN === "true";

const INCLUDE_JOB_DESCRIPTION =
  process.env.HIREINTEL_INCLUDE_DESCRIPTION !== "false";

const SAVE_TO_DATABASE =
  process.env.HIREINTEL_SAVE_TO_DATABASE !== "false";

const TIMEOUT_SECS =
  Number(
    process.env.HIREINTEL_TIMEOUT_SECS || 300
  );

const MAX_TOTAL_CHARGE_USD =
  Number(
    process.env.HIREINTEL_MAX_TOTAL_CHARGE_USD || 0.50
  );

const SEND_EMAIL_REPORT =
  process.env.HIREINTEL_SEND_EMAIL_REPORT !== "false";

/**
 * ================================================
 * GET ALL UNIQUE KEYWORDS
 * ================================================
 */

function getUniqueKeywords() {
  if (!Array.isArray(ALL_KEYWORDS)) {
    throw new Error(
      "ALL_KEYWORDS is not available."
    );
  }

  return [
    ...new Set(
      ALL_KEYWORDS
        .map(keyword =>
          String(keyword).trim()
        )
        .filter(Boolean)
    )
  ];
}

/**
 * ================================================
 * GET ACTIVE KEYWORDS
 *
 * CUSTOM_KEYWORD takes priority over the
 * configured keyword list.
 *
 * MAX_KEYWORDS = 0 means use ALL keywords.
 * ================================================
 */

function getActiveKeywords() {
  const keywords =
    getUniqueKeywords();

  if (CUSTOM_KEYWORD) {
    return [
      CUSTOM_KEYWORD
    ];
  }

  if (
    !Number.isFinite(MAX_KEYWORDS) ||
    MAX_KEYWORDS < 0
  ) {
    throw new Error(
      "HIREINTEL_MAX_KEYWORDS must be 0 or a positive number."
    );
  }

  if (MAX_KEYWORDS === 0) {
    return keywords;
  }

  return keywords.slice(
    0,
    MAX_KEYWORDS
  );
}

/**
 * ================================================
 * VALIDATE CONFIGURATION
 * ================================================
 */

function validateConfiguration() {
  if (
    !Number.isFinite(
      MAX_JOBS_PER_KEYWORD
    ) ||
    MAX_JOBS_PER_KEYWORD < 1
  ) {
    throw new Error(
      "HIREINTEL_MAX_JOBS_PER_KEYWORD must be a number greater than 0."
    );
  }

  if (
    !Number.isFinite(
      MAX_KEYWORDS
    ) ||
    MAX_KEYWORDS < 0
  ) {
    throw new Error(
      "HIREINTEL_MAX_KEYWORDS must be 0 or greater."
    );
  }

  if (
    !Number.isFinite(
      TIMEOUT_SECS
    ) ||
    TIMEOUT_SECS < 1
  ) {
    throw new Error(
      "HIREINTEL_TIMEOUT_SECS must be a number greater than 0."
    );
  }

  if (
    !Number.isFinite(
      MAX_TOTAL_CHARGE_USD
    ) ||
    MAX_TOTAL_CHARGE_USD <= 0
  ) {
    throw new Error(
      "HIREINTEL_MAX_TOTAL_CHARGE_USD must be greater than 0."
    );
  }
}

/**
 * ================================================
 * CREATE EMPTY REPORT
 * ================================================
 */

function createReport(
  allKeywords,
  activeKeywords
) {
  return {
    status:
      "NOT_STARTED",

    dryRun:
      DRY_RUN,

    startedAt:
      new Date(),

    finishedAt:
      null,

    durationMs:
      null,

    reportDate:
      getIndiaDateString(),

    totalConfiguredKeywords:
      allKeywords.length,

    totalKeywords:
      activeKeywords.length,

    keywordLimit:
      CUSTOM_KEYWORD
        ? "CUSTOM"
        : MAX_KEYWORDS,

    completedKeywords:
      0,

    failedKeywords:
      0,

    totalRawJobs:
      0,

    totalProcessedJobs:
      0,

    totalSkippedInvalid:
      0,

    totalProcessingFailures:
      0,

    totalCreated:
      0,

    totalDuplicates:
      0,

    totalFailedSaves:
      0,

    newJobs:
      [],

    csvAttachment:
      null,

    keywordResults:
      [],

    sourceResults:
      [],

    errors:
      [],

    email:
      {
        attempted: false,
        sent: false,
        error: null
      }
  };
}

/**
 * ================================================
 * ADD SOURCE RESULT
 * ================================================
 */

function addSourceResult(
  report,
  keyword,
  sourceResult
) {
  const saveSummary =
    sourceResult
      .saveResult
      ?.summary || {};

  report.sourceResults.push({
    keyword,

    source:
      sourceResult.source,

    status:
      sourceResult.status,

    rawCount:
      Number(
        sourceResult.rawCount || 0
      ),

    processedCount:
      Number(
        sourceResult.count || 0
      ),

    skippedInvalid:
      Number(
        sourceResult
          .skippedJobs
          ?.length || 0
      ),

    processingFailures:
      Number(
        sourceResult
          .processingFailures
          ?.length || 0
      ),

    created:
      Number(
        saveSummary.created || 0
      ),

    duplicates:
      Number(
        saveSummary.duplicates || 0
      ),

    failed:
      Number(
        saveSummary.failed || 0
      )
  });
}

/**
 * ================================================
 * ADD NEW JOBS
 *
 * These are jobs that were actually inserted into
 * Supabase during this run.
 * ================================================
 */

function addNewJobs(
  report,
  keyword,
  sourceResult
) {
  const createdJobs =
    sourceResult
      .saveResult
      ?.created || [];

  for (
    const job
    of createdJobs
  ) {
    report.newJobs.push({
      keyword,

      source:
        sourceResult.source,

      id:
        job.id || null,

      title:
        job.title || "",

      company:
        job.company || "",

      location:
        job.location || "",

      job_url:
        job.job_url || "",

      posted_date:
        job.posted_date || null,

      scraped_at:
        job.scraped_at || null,

      experience_min:
        job.experience_min ?? null,

      experience_max:
        job.experience_max ?? null,

      salary_min:
        job.salary_min ?? null,

      salary_max:
        job.salary_max ?? null,

      salary_currency:
        job.salary_currency || null,

      employment_type:
        job.employment_type || null,

      work_mode:
        job.work_mode || null,

      key_skills:
        job.key_skills || null,

      extracted_skills:
        job.extracted_skills || null,

      domain:
        job.domain || null,

      recruiter_name:
        job.recruiter_name || null,

      recruiter_email:
        job.recruiter_email || null,

      recruiter_phone:
        job.recruiter_phone || null,

      recruiter_linkedin_url:
        job.recruiter_linkedin_url || null,

      unique_key:
        job.unique_key || null
    });
  }
}

/**
 * ================================================
 * PROCESS ONE KEYWORD
 * ================================================
 */

async function processKeyword(
  keyword,
  report,
  keywordNumber,
  totalKeywords
) {
  console.log("\n");

  console.log(
    "================================================"
  );

  console.log(
    `KEYWORD ${keywordNumber}/${totalKeywords}`
  );

  console.log(
    keyword
  );

  console.log(
    "================================================"
  );

  try {
    const result =
      await runPipeline({
        sources:
          SOURCES,

        keyword,

        maxJobs:
          MAX_JOBS_PER_KEYWORD,

        includeJobDescription:
          INCLUDE_JOB_DESCRIPTION,

        saveToDatabase:
          SAVE_TO_DATABASE,

        timeoutSecs:
          TIMEOUT_SECS,

        maxTotalChargeUsd:
          MAX_TOTAL_CHARGE_USD
      });

    const keywordSummary = {
      keyword,

      status:
        result.summary.failedSources > 0
          ? "PARTIAL"
          : "SUCCESS",

      rawJobs:
        Number(
          result.summary.rawJobs || 0
        ),

      processedJobs:
        Number(
          result.summary.processedJobs || 0
        ),

      skippedInvalid:
        Number(
          result.summary.skippedInvalid || 0
        ),

      processingFailures:
        Number(
          result.summary.processingFailures || 0
        ),

      created:
        Number(
          result.summary.created || 0
        ),

      duplicates:
        Number(
          result.summary.duplicates || 0
        ),

      failed:
        Number(
          result.summary.failed || 0
        ),

      totalSources:
        Number(
          result.summary.totalSources || 0
        ),

      successfulSources:
        Number(
          result.summary.successfulSources || 0
        ),

      failedSources:
        Number(
          result.summary.failedSources || 0
        )
    };

    report.keywordResults.push(
      keywordSummary
    );

    report.totalRawJobs +=
      keywordSummary.rawJobs;

    report.totalProcessedJobs +=
      keywordSummary.processedJobs;

    report.totalSkippedInvalid +=
      keywordSummary.skippedInvalid;

    report.totalProcessingFailures +=
      keywordSummary.processingFailures;

    report.totalCreated +=
      keywordSummary.created;

    report.totalDuplicates +=
      keywordSummary.duplicates;

    report.totalFailedSaves +=
      keywordSummary.failed;

    for (
      const sourceResult
      of result.results || []
    ) {
      addSourceResult(
        report,
        keyword,
        sourceResult
      );

      addNewJobs(
        report,
        keyword,
        sourceResult
      );
    }

    if (
      keywordSummary.failedSources > 0
    ) {
      report.failedKeywords++;

      report.errors.push({
        keyword,

        type:
          "source_failure",

        message:
          `${keywordSummary.failedSources} source(s) failed.`
      });
    } else {
      report.completedKeywords++;
    }

    console.log(
      "\nKeyword result:"
    );

    console.log(
      JSON.stringify(
        keywordSummary,
        null,
        2
      )
    );

    return keywordSummary;
  } catch (error) {
    report.failedKeywords++;

    report.errors.push({
      keyword,

      type:
        "keyword_failure",

      message:
        error.message
    });

    console.error(
      `\nKeyword failed: ${keyword}`
    );

    console.error(
      error.message
    );

    return {
      keyword,

      status:
        "FAILED",

      rawJobs:
        0,

      processedJobs:
        0,

      skippedInvalid:
        0,

      processingFailures:
        0,

      created:
        0,

      duplicates:
        0,

      failed:
        0,

      totalSources:
        SOURCES.length,

      successfulSources:
        0,

      failedSources:
        SOURCES.length
    };
  }
}

/**
 * ================================================
 * FINALIZE REPORT
 * ================================================
 */

function finalizeReport(
  report
) {
  report.finishedAt =
    new Date();

  report.durationMs =
    report.finishedAt.getTime() -
    report.startedAt.getTime();

  report.reportDate =
    getIndiaDateString(
      report.finishedAt
    );

  if (report.dryRun) {
    report.status =
      "DRY RUN";

    return report;
  }

  if (
    report.failedKeywords === 0 &&
    report.completedKeywords ===
      report.totalKeywords
  ) {
    report.status =
      "SUCCESS";
  } else if (
    report.completedKeywords > 0
  ) {
    report.status =
      "PARTIAL SUCCESS";
  } else {
    report.status =
      "FAILED";
  }

  return report;
}

/**
 * ================================================
 * CREATE DAILY CSV
 * ================================================
 */

function createDailyCsv(
  report
) {
  if (report.dryRun) {
    console.log(
      "\nDry run: CSV creation skipped."
    );

    return report;
  }

  if (!SAVE_TO_DATABASE) {
    console.log(
      "\nDatabase saving is disabled: CSV creation skipped."
    );

    return report;
  }

  if (
    !Array.isArray(report.newJobs) ||
    report.newJobs.length === 0
  ) {
    console.log(
      "\nNo new jobs found. CSV creation skipped."
    );

    report.csvAttachment =
      null;

    return report;
  }

  try {
    const csvResult =
      createJobCsvFile(
        report.newJobs,
        "./reports",
        report.reportDate
      );

    report.csvAttachment = {
      filename:
        csvResult.filename,

      filePath:
        csvResult.filePath,

      jobCount:
        csvResult.jobCount,

      sizeBytes:
        csvResult.sizeBytes
    };

    console.log(
      "\nDaily CSV created successfully."
    );

    console.log(
      `CSV file: ${csvResult.filename}`
    );

    console.log(
      `New jobs in CSV: ${csvResult.jobCount}`
    );

    console.log(
      `CSV size: ${csvResult.sizeBytes} bytes`
    );
  } catch (error) {
    report.csvAttachment =
      null;

    report.errors.push({
      type:
        "csv_creation_failure",

      message:
        error.message
    });

    console.error(
      "\nCSV creation failed."
    );

    console.error(
      error.message
    );
  }

  return report;
}

/**
 * ================================================
 * SEND EMAIL REPORT
 * ================================================
 */

async function sendEmailReport(
  report
) {
  if (DRY_RUN) {
    console.log(
      "\nDry run: email sending skipped."
    );

    return report;
  }

  if (!SEND_EMAIL_REPORT) {
    console.log(
      "\nEmail reporting is disabled."
    );

    return report;
  }

  report.email.attempted =
    true;

  const emailConfig =
    getEmailConfig();

  try {
    const validation =
      validateEmailConfig(
        emailConfig
      );

    if (!validation.valid) {
      throw new Error(
        `Gmail email configuration missing: ${validation.missing.join(", ")}`
      );
    }

    console.log(
      "\nSending HireIntel daily email report..."
    );

    if (report.csvAttachment) {
      console.log(
        `Attaching CSV: ${report.csvAttachment.filename}`
      );
    } else {
      console.log(
        "No CSV attachment because no new jobs were found."
      );
    }

    const result =
      await sendReport({
        ...report,

        summary: {
          totalKeywords:
            report.totalConfiguredKeywords,

          keywordsProcessed:
            report.completedKeywords,

          sourcesProcessed:
            report.sourceResults.length,

          successfulSources:
            report.sourceResults.filter(
              item =>
                item.status === "success" ||
                item.status === "SUCCESS"
            ).length,

          failedSources:
            report.sourceResults.filter(
              item =>
                item.status === "failed" ||
                item.status === "FAILED"
            ).length,

          rawJobs:
            report.totalRawJobs,

          processedJobs:
            report.totalProcessedJobs,

          skippedInvalid:
            report.totalSkippedInvalid,

          processingFailures:
            report.totalProcessingFailures,

          newJobs:
            report.totalCreated,

          duplicates:
            report.totalDuplicates,

          failed:
            report.totalFailedSaves
        },

        subject:
          `HireIntel Daily Job Report - ${report.reportDate} - ${report.totalCreated} New Jobs`,

        csvAttachment:
          report.csvAttachment
            ? {
                filename:
                  report.csvAttachment.filename,

                content:
                  require("fs").readFileSync(
                    report.csvAttachment.filePath
                  )
              }
            : null
      });

    report.email.sent =
      true;

    report.email.messageId =
      result.messageId || null;

    console.log(
      "Email report sent successfully."
    );

    console.log(
      `Message ID: ${result.messageId || "N/A"}`
    );
  } catch (error) {
    report.email.sent =
      false;

    report.email.error =
      error.message;

    console.error(
      "\nEmail report failed."
    );

    console.error(
      error.message
    );
  }

  return report;
}

/**
 * ================================================
 * PRINT FINAL REPORT
 * ================================================
 */

function printFinalReport(
  report
) {
  console.log("\n");

  console.log(
    "================================================"
  );

  console.log(
    "HIREINTEL FINAL REPORT"
  );

  console.log(
    "================================================"
  );

  console.log(
    `Status: ${report.status}`
  );

  console.log(
    `Report date: ${report.reportDate}`
  );

  console.log(
    `Configured keywords: ${report.totalConfiguredKeywords}`
  );

  console.log(
    `Keywords processed: ${report.completedKeywords}/${report.totalKeywords}`
  );

  console.log(
    `Failed keywords: ${report.failedKeywords}`
  );

  console.log(
    `Raw jobs: ${report.totalRawJobs}`
  );

  console.log(
    `Processed jobs: ${report.totalProcessedJobs}`
  );

  console.log(
    `Invalid jobs: ${report.totalSkippedInvalid}`
  );

  console.log(
    `Processing failures: ${report.totalProcessingFailures}`
  );

  console.log(
    `New jobs saved: ${report.totalCreated}`
  );

  console.log(
    `Duplicates: ${report.totalDuplicates}`
  );

  console.log(
    `Failed saves: ${report.totalFailedSaves}`
  );

  console.log(
    `New jobs in CSV: ${report.newJobs.length}`
  );

  console.log(
    `CSV attachment: ${
      report.csvAttachment?.filename || "None"
    }`
  );

  console.log(
    `Email attempted: ${report.email.attempted}`
  );

  console.log(
    `Email sent: ${report.email.sent}`
  );

  if (report.email.error) {
    console.log(
      `Email error: ${report.email.error}`
    );
  }

  console.log(
    `Duration: ${
      report.durationMs !== null
        ? `${(
            report.durationMs / 1000
          ).toFixed(1)} seconds`
        : "N/A"
    }`
  );

  console.log(
    "================================================"
  );
}

/**
 * ================================================
 * MAIN
 * ================================================
 */

async function main() {
  try {
    validateConfiguration();

    const allKeywords =
      getUniqueKeywords();

    const activeKeywords =
      getActiveKeywords();

    const report =
      createReport(
        allKeywords,
        activeKeywords
      );

    console.log("\n");

    console.log(
      "================================================"
    );

    console.log(
      "HIREINTEL JOB SOURCING"
    );

    console.log(
      "================================================"
    );

    console.log(
      `Configured keywords: ${allKeywords.length}`
    );

    console.log(
      `Selected keywords: ${activeKeywords.length}`
    );

    console.log(
      `Keyword limit: ${
        CUSTOM_KEYWORD
          ? "CUSTOM"
          : MAX_KEYWORDS === 0
            ? "ALL"
            : MAX_KEYWORDS
      }`
    );

    if (CUSTOM_KEYWORD) {
      console.log(
        `Custom keyword: ${CUSTOM_KEYWORD}`
      );
    }

    console.log(
      `Jobs per keyword/source: ${MAX_JOBS_PER_KEYWORD}`
    );

    console.log(
      `Sources: ${SOURCES.join(", ")}`
    );

    console.log(
      `Save to database: ${SAVE_TO_DATABASE}`
    );

    console.log(
      `Email reporting enabled: ${SEND_EMAIL_REPORT}`
    );

    console.log(
      `Dry run: ${DRY_RUN}`
    );

    console.log(
      `Report date: ${report.reportDate}`
    );

    console.log(
      "================================================"
    );

    if (DRY_RUN) {
      console.log(
        "\nDRY RUN ENABLED"
      );

      console.log(
        "No Apify calls, database writes, CSV creation, or emails will be performed."
      );

      report.status =
        "DRY RUN";

      report.finishedAt =
        new Date();

      report.durationMs =
        report.finishedAt.getTime() -
        report.startedAt.getTime();

      printFinalReport(
        report
      );

      return report;
    }

    for (
      let index = 0;
      index < activeKeywords.length;
      index++
    ) {
      await processKeyword(
        activeKeywords[index],
        report,
        index + 1,
        activeKeywords.length
      );
    }

    finalizeReport(
      report
    );

    createDailyCsv(
      report
    );

    await sendEmailReport(
      report
    );

    printFinalReport(
      report
    );

    return report;
  } catch (error) {
    console.error("\n");

    console.error(
      "================================================"
    );

    console.error(
      "HIREINTEL RUN FAILED"
    );

    console.error(
      "================================================"
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
 * RUN
 * ================================================
 */

if (require.main === module) {
  main();
}

/**
 * ================================================
 * EXPORTS
 * ================================================
 */

module.exports = {
  main,
  getUniqueKeywords,
  getActiveKeywords,
  validateConfiguration,
  createReport,
  addSourceResult,
  addNewJobs,
  processKeyword,
  finalizeReport,
  createDailyCsv,
  sendEmailReport
};
