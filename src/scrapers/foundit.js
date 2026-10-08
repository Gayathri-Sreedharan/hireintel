/**
 * ============================================================
 * HireIntel - Foundit (Monster India) scraper
 * ============================================================
 *
 * Actor: themineworks/foundit-jobs-scraper
 * Own Apify token:  APIFY_TOKEN_FOUNDIT
 * Own budget:       APIFY_MONTHLY_LIMIT_FOUNDIT_USD (default 5)
 *
 * Input and output fields below follow the Actor's published
 * documentation. Run `node test/apifyProbe.js foundit` to
 * confirm them against the live Actor before scaling up.
 * ============================================================
 */

const {
  createApifyScraper,
  firstValue,
  lakhsToInr,
  daysAgoToIso,
  stripHtml
} = require("./createApifyScraper");

const SOURCE = "foundit";

// Apify pay-per-event prices on the Free plan (USD).
const PRICING = {
  startFeeUsd: 0.001,
  perJobUsd: 0.0025
};

function buildInput({ keyword, maxJobs, includeJobDescription }) {
  const input = {
    searchKeywords: [keyword],
    maxJobs,
    includeJobDescription
  };

  // Blank location means all India. Optionally restrict it:
  //   HIREINTEL_FOUNDIT_LOCATION=Bangalore,Mumbai
  const location = String(
    process.env.HIREINTEL_FOUNDIT_LOCATION || ""
  ).trim();

  if (location) {
    input.location = location;
  }

  return input;
}

// The Actor ends every run with an informational row (_type: "info").
function isJobRecord(item) {
  return Boolean(
    item &&
    typeof item === "object" &&
    item._type !== "info" &&
    (item.job_id || item.title)
  );
}

function validateRaw(item) {
  if (!item.title) {
    return { valid: false, reason: "Missing job title" };
  }

  if (!item.company) {
    return { valid: false, reason: "Missing company" };
  }

  if (!item.apply_url && !item.job_id) {
    return { valid: false, reason: "Missing Foundit job URL and job ID" };
  }

  return { valid: true };
}

/**
 * Foundit returns date_posted as DD-MM-YYYY (for example 07-10-2026).
 * Convert it to YYYY-MM-DD so the database never reads it as
 * month-first. Anything else is returned as-is if it already looks
 * like an ISO date, otherwise null.
 */
function parsePostedDate(value) {
  if (!value) {
    return null;
  }

  const text = String(value).trim();
  const dmy = text.match(/^(\d{2})-(\d{2})-(\d{4})$/);

  if (dmy) {
    return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    return text;
  }

  return null;
}

function mapItem(item) {
  const description = stripHtml([
    item.description,
    item.responsibilities,
    item.qualifications
  ]
    .filter(Boolean)
    .join("\n\n"));

  const salaryDisclosed =
    item.salary_confidential === false ||
    item.salary_min_lakhs !== undefined;

  return {
    title: item.title || null,
    company: item.company || null,
    location: item.location || null,
    source: SOURCE,
    job_url: item.apply_url || null,
    source_job_id: item.job_id ? String(item.job_id) : null,

    posted_date: firstValue(
      parsePostedDate(item.date_posted),
      daysAgoToIso(item.posted_days_ago)
    ),

    description,

    // Foundit gives experience as numbers already.
    experience_min: firstValue(item.experience_min_years),
    experience_max: firstValue(item.experience_max_years),

    // Salary arrives in lakhs per annum; HireIntel stores INR.
    salary_min: salaryDisclosed ? lakhsToInr(item.salary_min_lakhs) : null,
    salary_max: salaryDisclosed ? lakhsToInr(item.salary_max_lakhs) : null,
    salary_currency: "INR",

    employment_type: item.employment_type || null,
    work_mode: null,

    key_skills: Array.isArray(item.skills) ? item.skills : [],

    recruiter_name: null,
    recruiter_email: null,
    recruiter_phone: null,
    recruiter_linkedin_url: null,

    company_enriched: false,
    hiring_partner_enriched: false,
    processed: false
  };
}

module.exports = createApifyScraper({
  source: SOURCE,
  label: "Foundit",
  pricing: PRICING,
  buildInput,
  isJobRecord,
  validateRaw,
  mapItem
});
