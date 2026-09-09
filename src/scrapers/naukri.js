const { runActorAndGetItems } = require("../apify/client");

const {
  processSkills
} = require("../processors/extractSkills");

const {
  generateUniqueKey,
  normalizeJob
} = require("../processors/normalizeJob");

const {
  saveJobs
} = require("../database/saveJobs");


/**
 * HireIntel - Naukri Scraper Adapter
 *
 * Complete Flow:
 *
 * Naukri Apify Actor
 *        ↓
 * Raw Naukri Jobs
 *        ↓
 * Invalid Record Validation
 *        ↓
 * HireIntel Normalization
 *        ↓
 * Skill Extraction
 *        ↓
 * Domain Detection
 *        ↓
 * Unique Key Generation
 *        ↓
 * Supabase Duplicate Check
 *        ↓
 * Save New Jobs
 */


const ACTOR_ID =
  process.env.APIFY_NAUKRI_ACTOR_ID ||
  "themineworks/naukri-jobs";


/**
 * Check whether a value is a valid
 * non-empty string.
 */

function hasValidText(value) {

  return (
    typeof value === "string" &&
    value.trim().length > 0
  );

}


/**
 * Convert Naukri posted_days_ago
 * into an ISO date.
 *
 * Example:
 *
 * 14
 * ↓
 * Current Date - 14 Days
 */

function getPostedDate(item) {

  if (
    item.posted_days_ago === null ||
    item.posted_days_ago === undefined
  ) {

    return null;

  }


  const daysAgo =
    Number(item.posted_days_ago);


  if (
    Number.isNaN(daysAgo)
  ) {

    return null;

  }


  const date =
    new Date();


  date.setDate(
    date.getDate() - daysAgo
  );


  return date.toISOString();

}


/**
 * Convert Naukri salary information
 * into HireIntel salary fields.
 */

function parseNaukriSalary(item) {

  const salaryText =
    item.salary_text;


  if (!salaryText) {

    return {

      salary_min: null,

      salary_max: null,

      salary_currency: "INR"

    };

  }


  const text =
    String(salaryText)
      .toLowerCase()
      .trim();


  /**
   * Salary not disclosed.
   */

  if (

    text.includes("not disclosed") ||

    text.includes("not mentioned") ||

    text.includes("not available")

  ) {

    return {

      salary_min: null,

      salary_max: null,

      salary_currency: "INR"

    };

  }


  /**
   * Salary range examples:
   *
   * 8-12 Lacs
   * 8 - 12 Lakhs
   * 8 to 12 Lacs
   */

  const rangeMatch =
    text.match(

      /(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*(?:lacs?|lakhs?)/i

    );


  if (rangeMatch) {

    return {

      salary_min:
        Number(rangeMatch[1]) * 100000,

      salary_max:
        Number(rangeMatch[2]) * 100000,

      salary_currency: "INR"

    };

  }


  /**
   * Single salary examples:
   *
   * 10 Lacs
   * 15 Lakhs
   */

  const singleMatch =
    text.match(

      /(\d+(?:\.\d+)?)\s*(?:lacs?|lakhs?)/i

    );


  if (singleMatch) {

    const salary =
      Number(singleMatch[1]) * 100000;


    return {

      salary_min:
        salary,

      salary_max:
        salary,

      salary_currency:
        "INR"

    };

  }


  return {

    salary_min: null,

    salary_max: null,

    salary_currency: "INR"

  };

}


/**
 * Detect work mode from
 * Naukri output and JD.
 */

function detectWorkMode(item) {

  const text = [

    item.work_mode,

    item.description,

    item.location

  ]

    .filter(Boolean)

    .join(" ")

    .toLowerCase();


  if (

    text.includes("work from home") ||

    text.includes("remote")

  ) {

    return "remote";

  }


  if (

    text.includes("hybrid") ||

    text.includes(
      "work from office and home"
    )

  ) {

    return "hybrid";

  }


  if (

    text.includes("work from office") ||

    text.includes("on-site") ||

    text.includes("onsite")

  ) {

    return "onsite";

  }


  return null;

}


/**
 * Validate a raw Naukri record
 * before processing.
 *
 * Title is mandatory.
 * Company is mandatory.
 *
 * A job should also have either:
 *
 * - Job URL
 * OR
 * - Source Job ID
 */

function validateRawNaukriJob(item) {

  if (
    !item ||
    typeof item !== "object"
  ) {

    return {

      valid: false,

      reason:
        "Invalid job record"

    };

  }


  if (
    !hasValidText(item.title)
  ) {

    return {

      valid: false,

      reason:
        "Missing job title"

    };

  }


  if (
    !hasValidText(item.company)
  ) {

    return {

      valid: false,

      reason:
        "Missing company name"

    };

  }


  const hasJobUrl =
    hasValidText(item.apply_url) ||
    hasValidText(item.source_url);


  const hasJobId =
    item.job_id !== null &&
    item.job_id !== undefined &&
    String(item.job_id).trim().length > 0;


  if (
    !hasJobUrl &&
    !hasJobId
  ) {

    return {

      valid: false,

      reason:
        "Missing job URL and source job ID"

    };

  }


  return {

    valid: true,

    reason: null

  };

}


/**
 * Convert one Naukri job into
 * HireIntel standard format.
 */

function mapNaukriJob(item) {

  const validation =
    validateRawNaukriJob(item);


  if (
    !validation.valid
  ) {

    return null;

  }


  const salary =
    parseNaukriSalary(item);


  /**
   * Create raw HireIntel job.
   */

  const rawJob = {

    title:
      item.title.trim(),


    company:
      item.company.trim(),


    location:

      hasValidText(item.location)

        ? item.location.trim()

        : null,


    source:
      "naukri",


    job_url:

      hasValidText(item.apply_url)

        ? item.apply_url.trim()

        : hasValidText(item.source_url)

          ? item.source_url.trim()

          : null,


    source_job_id:

      item.job_id !== undefined &&

      item.job_id !== null

        ? String(item.job_id).trim()

        : null,


    posted_date:
      getPostedDate(item),


    scraped_at:

      item.scraped_at ||

      new Date().toISOString(),


    description:

      hasValidText(item.description)

        ? item.description

        : null,


    experience_min:

      item.experience_min_years !== undefined &&

      item.experience_min_years !== null &&

      !Number.isNaN(
        Number(item.experience_min_years)
      )

        ? Number(
            item.experience_min_years
          )

        : null,


    experience_max:

      item.experience_max_years !== undefined &&

      item.experience_max_years !== null &&

      !Number.isNaN(
        Number(item.experience_max_years)
      )

        ? Number(
            item.experience_max_years
          )

        : null,


    salary_min:
      salary.salary_min,


    salary_max:
      salary.salary_max,


    salary_currency:
      salary.salary_currency,


    employment_type:

      item.job_type ||

      item.employment_type ||

      null,


    work_mode:
      detectWorkMode(item),


    key_skills:

      Array.isArray(item.skills)

        ? item.skills

            .filter(
              skill =>
                typeof skill === "string" &&
                skill.trim().length > 0
            )

            .map(
              skill =>
                skill.trim()
            )

        : [],


    extracted_skills:
      [],


    domain:
      null,


    recruiter_name:
      null,


    recruiter_email:
      null,


    recruiter_phone:
      null,


    recruiter_linkedin_url:
      null,


    company_enriched:
      false,


    hiring_partner_enriched:
      false,


    processed:
      false

  };


  /**
   * Normalize the job.
   */

  const normalizedJob =
    normalizeJob(rawJob);


  /**
   * Extract skills and domain.
   */

  const processedJob =
    processSkills(normalizedJob);


  /**
   * Final validation after
   * normalization.
   */

  if (
    !processedJob ||
    !hasValidText(processedJob.title)
  ) {

    return null;

  }


  /**
   * Generate unique key.
   */

  processedJob.unique_key =
    generateUniqueKey(processedJob);


  return processedJob;

}


/**
 * Scrape Naukri.
 *
 * Optionally saves processed jobs
 * directly to Supabase.
 */

async function scrape({

  keyword,

  maxJobs = 10,

  includeJobDescription = true,

  monitorMode = false,

  timeoutSecs = 300,

  maxTotalChargeUsd = 0.50,

  saveToDatabase = true

} = {}) {


  if (
    !hasValidText(keyword)
  ) {

    throw new Error(
      "Naukri scrape requires a keyword"
    );

  }


  console.log(
    "\n================================"
  );

  console.log(
    "HireIntel - Naukri Scraper"
  );

  console.log(
    "================================"
  );


  console.log(
    `Keyword: ${keyword}`
  );

  console.log(
    `Max jobs: ${maxJobs}`
  );

  console.log(
    `Full JD: ${includeJobDescription}`
  );

  console.log(
    `Save to database: ${saveToDatabase}`
  );


  /**
   * Run Apify actor.
   */

  const result =
    await runActorAndGetItems({

      actorId:
        ACTOR_ID,


      input: {

        searchKeywords:
          [keyword.trim()],

        maxJobs,

        includeJobDescription,

        monitorMode

      },


      timeoutSecs,


      /**
       * Safety ceiling.
       */

      maxTotalChargeUsd

    });


  const rawJobs =
    Array.isArray(result.items)

      ? result.items

      : [];


  console.log(
    `\nRaw jobs returned: ${rawJobs.length}`
  );


  const jobs = [];


  const skippedJobs = [];


  const processingFailures = [];


  /**
   * Process every returned job.
   */

  for (
    const item of rawJobs
  ) {

    /**
     * Validate raw record first.
     *
     * Invalid Apify records are
     * skipped before mapping and
     * never sent to Supabase.
     */

    const validation =
      validateRawNaukriJob(item);


    if (
      !validation.valid
    ) {

      skippedJobs.push({

        company:
          item?.company || null,

        title:
          item?.title || null,

        reason:
          validation.reason

      });


      console.log(
        `Skipping invalid job: ${validation.reason}`
      );


      continue;

    }


    try {

      const job =
        mapNaukriJob(item);


      /**
       * Final validation.
       */

      if (

        !job ||

        !hasValidText(job.title)

      ) {

        skippedJobs.push({

          company:
            item?.company || null,

          title:
            item?.title || null,

          reason:
            "Job mapping returned invalid result"

        });


        console.log(
          "Skipping invalid job: Job mapping returned invalid result"
        );


        continue;

      }


      jobs.push(job);

    }

    catch (error) {

      console.error(

        `Failed to process job: ${error.message}`

      );


      processingFailures.push({

        company:
          item?.company || null,

        title:
          item?.title || null,

        reason:
          error.message

      });

    }

  }


  console.log(
    `Skipped invalid jobs: ${skippedJobs.length}`
  );


  console.log(
    `Processing failures: ${processingFailures.length}`
  );


  console.log(
    `Processed valid jobs: ${jobs.length}`
  );


  /**
   * Save jobs to Supabase.
   */

  let saveResult = null;


  if (

    saveToDatabase &&

    jobs.length > 0

  ) {

    console.log(
      "\nSaving jobs to Supabase..."
    );


    try {

      saveResult =
        await saveJobs(jobs);


      console.log(
        "\nSupabase Save Result"
      );

      console.log(
        "----------------------"
      );


      console.log(
        `Created: ${saveResult.created.length}`
      );

      console.log(
        `Duplicates: ${saveResult.duplicates.length}`
      );

      console.log(
        `Failed: ${saveResult.failed.length}`
      );


      /**
       * Show detailed failure reasons.
       */

      if (
        saveResult.failed.length > 0
      ) {

        console.log(
          "\nFailed Jobs:"
        );


        for (
          const failedJob of saveResult.failed
        ) {

          console.log(
            `\n✗ ${
              failedJob.company ||
              "Unknown Company"
            } - ${
              failedJob.title ||
              "Unknown Title"
            }`
          );


          console.log(
            `  Reason: ${
              failedJob.reason ||
              "Unknown error"
            }`
          );

        }

      }


      /**
       * Show duplicate jobs.
       */

      if (
        saveResult.duplicates.length > 0
      ) {

        console.log(
          "\nDuplicate Jobs:"
        );


        for (
          const duplicateJob of saveResult.duplicates
        ) {

          console.log(
            `✓ ${
              duplicateJob.company ||
              "Unknown Company"
            } - ${
              duplicateJob.title ||
              "Unknown Title"
            }`
          );

        }

      }

    }

    catch (error) {

      console.error(
        "\nDatabase save failed:"
      );

      console.error(
        error.message
      );


      saveResult = {

        created: [],

        duplicates: [],

        failed: jobs.map(
          job => ({

            company:
              job.company,

            title:
              job.title,

            reason:
              error.message

          })
        ),

        summary: {

          total:
            jobs.length,

          created:
            0,

          duplicates:
            0,

          failed:
            jobs.length

        }

      };

    }

  }


  /**
   * Return complete pipeline result.
   */

  return {

    source:
      "naukri",


    actorId:
      ACTOR_ID,


    runId:

      result.run?.id ||
      null,


    status:

      result.run?.status ||
      null,


    rawCount:
      rawJobs.length,


    count:
      jobs.length,


    jobs,


    skippedJobs,


    processingFailures,


    saveResult

  };

}


/**
 * Direct test.
 *
 * Run:
 *
 * node src/scrapers/naukri.js
 */

async function main() {

  try {

    const result =
      await scrape({

        keyword:
          "data scientist",

        maxJobs:
          5,

        includeJobDescription:
          true,

        monitorMode:
          false,

        timeoutSecs:
          300,

        maxTotalChargeUsd:
          0.50,

        saveToDatabase:
          true

      });


    console.log(
      "\n================================"
    );

    console.log(
      "NAUKRI PIPELINE COMPLETE"
    );

    console.log(
      "================================"
    );


    console.log(
      `Run ID: ${result.runId}`
    );

    console.log(
      `Status: ${result.status}`
    );

    console.log(
      `Raw jobs: ${result.rawCount}`
    );

    console.log(
      `Skipped invalid jobs: ${result.skippedJobs.length}`
    );

    console.log(
      `Processing failures: ${result.processingFailures.length}`
    );

    console.log(
      `Processed valid jobs: ${result.count}`
    );


    /**
     * Show skipped job details.
     */

    if (
      result.skippedJobs.length > 0
    ) {

      console.log(
        "\nSKIPPED INVALID JOBS"
      );

      console.log(
        "--------------------"
      );


      for (
        const skippedJob of result.skippedJobs
      ) {

        console.log(
          `✗ ${
            skippedJob.company ||
            "Unknown Company"
          } - ${
            skippedJob.title ||
            "Unknown Title"
          }`
        );


        console.log(
          `  Reason: ${skippedJob.reason}`
        );

      }

    }


    /**
     * Database summary.
     */

    if (
      result.saveResult
    ) {

      console.log(
        "\nDATABASE SUMMARY"
      );

      console.log(
        "----------------"
      );


      console.log(
        `Created: ${result.saveResult.summary.created}`
      );

      console.log(
        `Duplicates: ${result.saveResult.summary.duplicates}`
      );

      console.log(
        `Failed: ${result.saveResult.summary.failed}`
      );

    }


    console.log(
      "\n================================"
    );

    console.log(
      "TEST COMPLETE"
    );

    console.log(
      "================================"
    );

  }

  catch (error) {

    console.error(
      "\n================================"
    );

    console.error(
      "NAUKRI PIPELINE FAILED"
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


if (
  require.main === module
) {

  main();

}


module.exports = {

  scrape,

  mapNaukriJob,

  parseNaukriSalary,

  detectWorkMode,

  validateRawNaukriJob,

  hasValidText

};