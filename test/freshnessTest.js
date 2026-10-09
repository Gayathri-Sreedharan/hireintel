/**
 * Offline test for the 7-day posting filter.
 * No Apify, Supabase or email calls.
 *
 * Run: node test/freshnessTest.js
 */
const assert = require("assert");

// The scraper modules load the Supabase client on require.
// Placeholder values let this test run without real credentials;
// nothing in this test talks to Supabase.
process.env.SUPABASE_URL = process.env.SUPABASE_URL || "http://localhost:54321";
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "test-key";

const {
  parsePostedDate,
  getPostedAgeDays,
  checkFreshness,
  toNaukriPostedWithinDays,
  toLinkedInDatePosted
} = require("../src/processors/freshness");

const { getPostedDate } = require("../src/scrapers/naukri");
const { getLinkedInPostedDate } = require("../src/scrapers/linkedin");

const now = new Date("2026-10-09T06:00:00Z");
const opts = { maxAgeDays: 7, now, keepUndated: false };

let passed = 0;
function check(name, fn) {
  fn();
  passed++;
  console.log("ok  " + name);
}

check("ISO date 2 days old is kept", () => {
  assert.strictEqual(checkFreshness("2026-10-07", opts).keep, true);
});

check("exactly 7 days old is kept", () => {
  assert.strictEqual(checkFreshness("2026-10-02T06:00:00Z", opts).keep, true);
});

check("8 days old is dropped", () => {
  const r = checkFreshness("2026-10-01T05:00:00Z", opts);
  assert.strictEqual(r.keep, false);
  assert.match(r.reason, /older than 7 days/);
});

check("historical job (2025) is dropped", () => {
  assert.strictEqual(checkFreshness("2025-12-01", opts).keep, false);
});

check("relative text: 3 days ago kept, 2 weeks ago dropped, 30+ days dropped", () => {
  assert.strictEqual(checkFreshness("3 days ago", opts).keep, true);
  assert.strictEqual(checkFreshness("2 weeks ago", opts).keep, false);
  assert.strictEqual(checkFreshness("30+ Days Ago", opts).keep, false);
  assert.strictEqual(checkFreshness("Just now", opts).keep, true);
  assert.strictEqual(checkFreshness("1 month ago", opts).keep, false);
});

check("missing date dropped by default, kept when allowed", () => {
  assert.strictEqual(checkFreshness(null, opts).keep, false);
  assert.strictEqual(checkFreshness(null, { ...opts, keepUndated: true }).keep, true);
});

check("Naukri posted_days_ago -> date -> filter", () => {
  assert.strictEqual(checkFreshness(getPostedDate({ posted_days_ago: 1 }), { ...opts, now: new Date() }).keep, true);
  assert.strictEqual(checkFreshness(getPostedDate({ posted_days_ago: 7 }), { ...opts, now: new Date() }).keep, true);
  assert.strictEqual(checkFreshness(getPostedDate({ posted_days_ago: 14 }), { ...opts, now: new Date() }).keep, false);
});

check("LinkedIn postedAt preferred, postedTimeAgo fallback", () => {
  assert.strictEqual(getLinkedInPostedDate({ postedAt: "2026-10-05", postedTimeAgo: "4 days ago" }), "2026-10-05");
  const fallback = getLinkedInPostedDate({ postedTimeAgo: "2 days ago" });
  assert.ok(fallback && getPostedAgeDays(fallback) === 2);
  assert.strictEqual(getLinkedInPostedDate({}), null);
});

check("source filter values", () => {
  assert.strictEqual(toNaukriPostedWithinDays(7), "7");
  assert.strictEqual(toNaukriPostedWithinDays(5), "7");
  assert.strictEqual(toNaukriPostedWithinDays(10), "15");
  assert.strictEqual(toLinkedInDatePosted(7), "7");
  assert.strictEqual(toLinkedInDatePosted(1), "1");
  assert.strictEqual(toLinkedInDatePosted(14), "30");
});

check("parsePostedDate handles epoch seconds", () => {
  assert.ok(parsePostedDate(1791500000) instanceof Date);
});

console.log(`\nAll ${passed} freshness checks passed.`);
