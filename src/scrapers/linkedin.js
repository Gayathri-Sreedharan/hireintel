const { executeActor } = require("../apify/runActor");
const { processSkills } = require("../processors/extractSkills");
const {
  normalizeJob,
  generateUniqueKey
} = require("../processors/normalizeJob");
const { deduplicateJobs } = require("../processors/deduplicate");
const { saveJobs } = require("../database/saveJobs");
const {
  getMaxPostedAgeDays,
  toLinkedInDatePosted,
  parsePostedDate,
  checkFreshness
} = require("../processors/freshness");

const SOURCE = "linkedin";

function validateRawLinkedInJob(item) {
  if (!item || typeof item !== "object") {
    return {
      valid: false,
      reason: "Invalid job object"
    };
  }

  const title =
    item.title ||
    item.job_title ||
    item.jobTitle;

  const company =
    item.company ||
    item.company_name ||
    item.companyName;

  const jobUrl =
    item.url ||
    item.job_url ||
    item.jobUrl ||
    item.applyUrl;

  const jobId =
    item.jobId ||
    item.job_id ||
    item.id;

  if (!title) {
    return {
      valid: false,
      reason: "Missing job title"
    };
  }

  if (!company) {
    return {
      valid: false,
      reason: "Missing company"
    };
  }

  if (!jobUrl && !jobId) {
    return {
      valid: false,
      reason: "Missing LinkedIn job URL and job ID"
    };
  }

  return {
    valid: true
  };
}

/**
 * Posted date from the LinkedIn actor.
 * postedAt is an ISO date ("2026-10-05"); postedTimeAgo
 * ("3 days ago") is used only when postedAt is missing.
 */
function getLinkedInPostedDate(item) {
  const direct =
    item.postedAt ||
    item.posted_date ||
    item.postedDate ||
    null;

  if (direct) {
    return direct;
  }

  const relative =
    item.postedTimeAgo ||
    item.posted_time_ago ||
    null;

  if (relative) {
    const date = parsePostedDate(relative);
    return date ? date.toISOString() : null;
  }

  return null;
}

function mapLinkedInJob(item) {
  const jobUrl =
    item.url ||
    item.job_url ||
    item.jobUrl ||
    null;

  const sourceJobId =
    item.jobId ||
    item.job_id ||
    item.id ||
    null;

  const description =
    item.descriptionText ||
    item.descriptionMarkdown ||
    item.description ||
    item.job_description ||
    null;

  const recruiterName =
    item.jobPosterName ||
    item.job_poster_name ||
    item.recruiterName ||
    item.recruiter_name ||
    null;

  const recruiterEmail =
    item.jobPosterEmail ||
    item.job_poster_email ||
    item.recruiterEmail ||
    item.recruiter_email ||
    null;

  const recruiterPhone =
    item.jobPosterPhone ||
    item.job_poster_phone ||
    item.recruiterPhone ||
    item.recruiter_phone ||
    null;

  const recruiterLinkedInUrl =
    item.jobPosterProfileUrl ||
    item.job_poster_profile_url ||
    item.recruiterLinkedinUrl ||
    item.recruiter_linkedin_url ||
    null;

  const job = {
    title:
      item.title ||
      item.job_title ||
      item.jobTitle ||
      null,

    company:
      item.company ||
      item.company_name ||
      item.companyName ||
      null,

    location:
      item.location ||
      item.job_location ||
      null,

    source: SOURCE,

    job_url: jobUrl,

    source_job_id: sourceJobId,

    posted_date:
      getLinkedInPostedDate(item),

    description: description,

    experience:
      item.experience ||
      item.experienceLevel ||
      item.seniorityLevel ||
      null,

    salary:
      item.salary ||
      null,

    salary_min:
      item.salaryMin ??
      null,

    salary_max:
      item.salaryMax ??
      null,

    salary_currency:
      item.salaryCurrency ||
      null,

    employment_type:
      item.employmentType ||
      item.employment_type ||
      null,

    work_mode:
      item.workplaceType ||
      item.workplace_type ||
      item.workMode ||
      item.work_mode ||
      null,

    key_skills:
      Array.isArray(item.skills)
        ? item.skills
        : item.skills || [],

    recruiter_name:
      recruiterName,

    recruiter_email:
      recruiterEmail,

    recruiter_phone:
      recruiterPhone,

    recruiter_linkedin_url:
      recruiterLinkedInUrl,

    company_enriched:
      Boolean(
        item.companyDescription ||
        item.companyWebsite ||
        item.companyEmployeesCount ||
        item.companyHeadquarters
      ),

    hiring_partner_enriched:
      false,

    processed:
      false
  };

  job.unique_key = generateUniqueKey(job);

  return job;
}

async function scrape({
  keyword,
  maxJobs = 10,
  includeJobDescription = true,
  timeoutSecs = 300,
  maxTotalChargeUsd = 0.50,
  saveToDatabase = true
} = {}) {
  if (!keyword) {
    throw new Error(
      "LinkedIn scraper requires a keyword"
    );
  }

  if (
    !Number.isInteger(maxJobs) ||
    maxJobs <= 0
  ) {
    throw new Error(
      "maxJobs must be a positive integer"
    );
  }

  console.log("");
  console.log("================================");
  console.log("HireIntel - LinkedIn Scraper");
  console.log("================================");
  console.log("Keyword: " + keyword);
  console.log("Location: India");

  // Only jobs posted within the last N days
  // (HIREINTEL_MAX_POSTED_AGE_DAYS, default 7).
  const maxAgeDays = getMaxPostedAgeDays();
  const datePosted = toLinkedInDatePosted(maxAgeDays);

  console.log(
    "Posted within: " + maxAgeDays +
    " days (LinkedIn filter: " + datePosted + ")"
  );
  console.log("Max jobs: " + maxJobs);
  console.log(
    "Full JD: " +
    includeJobDescription
  );
  console.log(
    "Save to database: " +
    saveToDatabase
  );

  const input = {
    keywords: keyword,
    location: "India",
    maxItems: maxJobs,
    scrapeDetails: includeJobDescription,
    scrapeCompany: false,
    datePosted: datePosted,
    sortBy: "recent"
  };

  const result = await executeActor({
    source: SOURCE,
    input: input,
    estimatedCostUsd: 0.02,
    timeoutSecs: timeoutSecs,
    maxTotalChargeUsd: maxTotalChargeUsd
  });

  const rawJobs =
    Array.isArray(result.items)
      ? result.items
      : [];

  console.log(
    "Raw jobs returned: " +
    rawJobs.length
  );

  const jobs = [];
  const skippedJobs = [];
  const staleJobs = [];
  const processingFailures = [];

  for (const item of rawJobs) {
    const validation =
      validateRawLinkedInJob(item);

    if (!validation.valid) {
      skippedJobs.push({
        reason: validation.reason,
        job: item
      });

      console.log(
        "Skipping invalid job: " +
        validation.reason
      );

      continue;
    }

    // Drop jobs older than the posting window,
    // even if the actor returned them.
    const freshness = checkFreshness(
      getLinkedInPostedDate(item),
      { maxAgeDays }
    );

    if (!freshness.keep) {
      staleJobs.push({
        company: item.company || item.companyName || null,
        title: item.title || item.jobTitle || null,
        postedAt: item.postedAt || item.postedTimeAgo || null,
        reason: freshness.reason
      });

      continue;
    }

    try {
      const mapped =
        mapLinkedInJob(item);

      const processed =
        processSkills(mapped);

      const normalized =
        normalizeJob(processed);

      normalized.source = SOURCE;

      normalized.recruiter_name =
        mapped.recruiter_name || null;

      normalized.recruiter_email =
        mapped.recruiter_email || null;

      normalized.recruiter_phone =
        mapped.recruiter_phone || null;

      normalized.recruiter_linkedin_url =
        mapped.recruiter_linkedin_url || null;

      normalized.unique_key =
        generateUniqueKey(normalized);

      jobs.push(normalized);
    } catch (error) {
      processingFailures.push({
        job: item,
        reason: error.message
      });

      console.error(
        "Processing failure: " +
        error.message
      );
    }
  }

  const uniqueJobs =
    deduplicateJobs(jobs);

  console.log(
    "Skipped invalid jobs: " +
    skippedJobs.length
  );

  console.log(
    "Skipped older than " + maxAgeDays + " days: " +
    staleJobs.length
  );

  console.log(
    "Processing failures: " +
    processingFailures.length
  );

  console.log(
    "Processed valid jobs: " +
    uniqueJobs.length
  );

  let saveResult = null;

  if (saveToDatabase) {
    console.log("");
    console.log(
      "Saving jobs to Supabase..."
    );

    saveResult =
      await saveJobs(uniqueJobs);

    console.log("");
    console.log("Supabase Save Result");
    console.log("----------------------");
    console.log(
      "Created: " +
      saveResult.summary.created
    );
    console.log(
      "Duplicates: " +
      saveResult.summary.duplicates
    );
    console.log(
      "Failed: " +
      saveResult.summary.failed
    );
  }

  console.log("");
  console.log(
    "LinkedIn completed successfully."
  );

  return {
    source: SOURCE,
    actorId: result.actorId || null,
    runId: result.runId || null,
    status: result.status || null,
    rawCount: rawJobs.length,
    count: uniqueJobs.length,
    jobs: uniqueJobs,
    skippedJobs: skippedJobs,
    staleJobs: staleJobs,
    processingFailures: processingFailures,
    saveResult: saveResult
  };
}

module.exports = {
  scrape,
  validateRawLinkedInJob,
  mapLinkedInJob,
  getLinkedInPostedDate
};
