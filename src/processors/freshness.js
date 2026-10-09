/**
 * ============================================================
 * HireIntel - Posting-date freshness filter
 * ============================================================
 *
 * Keeps only jobs posted within the last N days
 * (default 7, set with HIREINTEL_MAX_POSTED_AGE_DAYS).
 *
 * Applied in two places:
 *   1. At the source: each Apify actor is asked for recent
 *      jobs only (Naukri: postedWithinDays, LinkedIn: datePosted),
 *      so old jobs are not fetched or paid for.
 *   2. In code: every returned job is checked again here, so an
 *      actor that ignores or rounds its filter can't let
 *      historical jobs through.
 *
 * Jobs with no usable posting date are dropped by default.
 * Set HIREINTEL_KEEP_UNDATED_JOBS=true to keep them.
 * ============================================================
 */

const DAY_MS = 24 * 60 * 60 * 1000;

function getMaxPostedAgeDays() {
  const raw = process.env.HIREINTEL_MAX_POSTED_AGE_DAYS;

  if (raw === undefined || raw === null || String(raw).trim() === "") {
    return 7;
  }

  const days = Number(raw);

  if (!Number.isFinite(days) || days <= 0) {
    throw new Error(
      `HIREINTEL_MAX_POSTED_AGE_DAYS must be a positive number. Received: ${raw}`
    );
  }

  return days;
}

function keepUndatedJobs() {
  return process.env.HIREINTEL_KEEP_UNDATED_JOBS === "true";
}

/**
 * Naukri's postedWithinDays accepts only "1", "3", "7", "15", "30".
 * Pick the smallest allowed window that covers the requested days.
 * The code-side check below still trims to the exact limit.
 */
function toNaukriPostedWithinDays(days) {
  const allowed = [1, 3, 7, 15, 30];
  const match = allowed.find(value => value >= days);
  return String(match || 30);
}

/**
 * LinkedIn actor datePosted: "1" (24 hours), "7" (week), "30" (month).
 * Can be overridden with HIREINTEL_LINKEDIN_DATE_POSTED if the actor
 * changes its accepted values.
 */
function toLinkedInDatePosted(days) {
  const override = process.env.HIREINTEL_LINKEDIN_DATE_POSTED;

  if (override && override.trim()) {
    return override.trim();
  }

  if (days <= 1) return "1";
  if (days <= 7) return "7";
  return "30";
}

/**
 * Parse relative text such as "3 days ago", "Just now",
 * "2 weeks ago", "30+ Days Ago", "Today", "Yesterday".
 * Returns a Date or null.
 */
function parseRelativeText(text, now) {
  const value = String(text).trim().toLowerCase();

  if (!value) {
    return null;
  }

  if (
    value.includes("just now") ||
    value.includes("today") ||
    value.includes("few hours") ||
    value.includes("moments ago")
  ) {
    return new Date(now.getTime());
  }

  if (value.includes("yesterday")) {
    return new Date(now.getTime() - DAY_MS);
  }

  const match = value.match(
    /(\d+)\s*\+?\s*(minute|min|hour|hr|day|week|wk|month|mon|year|yr)s?/
  );

  if (!match) {
    return null;
  }

  const amount = Number(match[1]);
  const unit = match[2];

  const unitDays = {
    minute: 1 / 1440,
    min: 1 / 1440,
    hour: 1 / 24,
    hr: 1 / 24,
    day: 1,
    week: 7,
    wk: 7,
    month: 30,
    mon: 30,
    year: 365,
    yr: 365
  }[unit];

  return new Date(now.getTime() - amount * unitDays * DAY_MS);
}

/**
 * Turn any posted-date value into a Date.
 * Accepts Date objects, ISO strings ("2026-10-05",
 * "2026-10-05T04:35:39Z"), epoch numbers, and relative text.
 */
function parsePostedDate(value, now = new Date()) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number") {
    // Seconds or milliseconds since epoch.
    const ms = value < 1e12 ? value * 1000 : value;
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const text = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    const date = new Date(text);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return parseRelativeText(text, now);
}

/**
 * Age of a job in whole days (0 = posted today), or null.
 */
function getPostedAgeDays(postedDate, now = new Date()) {
  const date = parsePostedDate(postedDate, now);

  if (!date) {
    return null;
  }

  return Math.floor((now.getTime() - date.getTime()) / DAY_MS);
}

/**
 * Decide whether a job is fresh enough.
 *
 * Returns { keep, ageDays, reason }.
 * The window is inclusive: with 7 days, a job posted
 * exactly 7 days ago is kept and 8 days ago is dropped.
 */
function checkFreshness(postedDate, {
  maxAgeDays = getMaxPostedAgeDays(),
  now = new Date(),
  keepUndated = keepUndatedJobs()
} = {}) {
  const ageDays = getPostedAgeDays(postedDate, now);

  if (ageDays === null) {
    return {
      keep: keepUndated,
      ageDays: null,
      reason: keepUndated ? null : "Missing or unreadable posted date"
    };
  }

  if (ageDays > maxAgeDays) {
    return {
      keep: false,
      ageDays,
      reason: `Posted ${ageDays} days ago (older than ${maxAgeDays} days)`
    };
  }

  return {
    keep: true,
    ageDays,
    reason: null
  };
}

module.exports = {
  getMaxPostedAgeDays,
  keepUndatedJobs,
  toNaukriPostedWithinDays,
  toLinkedInDatePosted,
  parsePostedDate,
  getPostedAgeDays,
  checkFreshness
};
