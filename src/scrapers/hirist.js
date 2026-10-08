/**
 * ============================================================
 * HireIntel - Hirist (India tech jobs) scraper
 * ============================================================
 *
 * Actor: themineworks/hirist-jobs-scraper
 * Own Apify token:  APIFY_TOKEN_HIRIST
 * Own budget:       APIFY_MONTHLY_LIMIT_HIRIST_USD (default 5)
 *
 * Hirist lists technology roles only. Input and output fields
 * follow the Actor's published documentation. Run
 * `node test/apifyProbe.js hirist` to confirm them against the
 * live Actor before scaling up.
 * ============================================================
 */

const {
  createApifyScraper,
  lakhsToInr,
  stripHtml
} = require("./createApifyScraper");

const SOURCE = "hirist";

// Apify pay-per-event prices on the Free plan (USD).
const PRICING = {
  startFeeUsd: 0.005,
  perJobUsd: 0.005
};

function buildInput({ keyword, maxJobs, includeJobDescription }) {
  const input = {
    keyword,
    maxJobs,
    includeJobDescription
  };

  // Without locations Hirist also returns Gulf / overseas jobs.
  // To keep results in India, set for example:
  //   HIREINTEL_HIRIST_LOCATIONS=Bangalore,Hyderabad,Pune,Chennai,Mumbai,Delhi NCR
  const locations = String(
    process.env.HIREINTEL_HIRIST_LOCATIONS || ""
  )
    .split(",")
    .map(location => location.trim())
    .filter(Boolean);

  if (locations.length > 0) {
    input.locations = locations;
  }

  return input;
}

// Rows without job_id are run notes (no_results, error, info).
function isJobRecord(item) {
  return Boolean(item && typeof item === "object" && item.job_id);
}

function validateRaw(item) {
  if (!item.title) {
    return { valid: false, reason: "Missing job title" };
  }

  if (!item.company) {
    return { valid: false, reason: "Missing company" };
  }

  if (!item.url && !item.job_id) {
    return { valid: false, reason: "Missing Hirist job URL and job ID" };
  }

  return { valid: true };
}

function mapItem(item) {
  const locations = Array.isArray(item.locations)
    ? item.locations
    : item.locations
      ? [item.locations]
      : [];

  return {
    title: item.title ? String(item.title).trim() : null,

    // Hirist can return names with a trailing space. When the employer
    // is hidden it returns "hirist.tech", which is not a real company.
    company:
      item.company &&
      String(item.company).trim().toLowerCase() !== "hirist.tech"
        ? String(item.company).trim()
        : "Not disclosed",

    location: locations.length > 0 ? locations.join(", ") : null,
    source: SOURCE,
    job_url: item.url || null,
    source_job_id: item.job_id ? String(item.job_id) : null,
    posted_date: item.posted_at || null,

    // Description arrives as HTML (cut at 4,000 characters).
    description: stripHtml(item.description),

    experience_min: item.experience_min_years ?? null,
    experience_max: item.experience_max_years ?? null,

    // Salary arrives in lakhs per annum; HireIntel stores INR.
    salary_min: lakhsToInr(item.salary_min_lpa),
    salary_max: lakhsToInr(item.salary_max_lpa),
    salary_currency: "INR",

    employment_type: null,
    work_mode: item.remote === true ? "Remote" : null,

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
  label: "Hirist",
  pricing: PRICING,
  buildInput,
  isJobRecord,
  validateRaw,
  mapItem
});
