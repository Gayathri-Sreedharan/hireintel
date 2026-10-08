const { sendAlert } = require("../email/sendReport");

/**
 * Email alerts when an Apify budget is used up.
 *
 * - Sent to GMAIL_TO / GMAIL_CC / GMAIL_BCC, like the daily report.
 * - At most one email per source and reason in each run, so 90 keywords
 *   hitting the same limit do not send 90 emails.
 * - Skipped when HIREINTEL_SEND_EMAIL_REPORT=false or HIREINTEL_DRY_RUN=true.
 * - An alert failure never stops the pipeline.
 */

const alreadySent = new Set();

function alertsEnabled() {
  return (
    process.env.HIREINTEL_SEND_EMAIL_REPORT !== "false" &&
    process.env.HIREINTEL_DRY_RUN !== "true"
  );
}

async function sendOnce(key, subject, text) {
  if (alreadySent.has(key)) {
    return;
  }

  alreadySent.add(key);

  if (!alertsEnabled()) {
    console.log(`Alert skipped (emails disabled): ${subject}`);
    return;
  }

  try {
    await sendAlert({ subject, text });

    console.log(`Alert email sent: ${subject}`);
  } catch (error) {
    console.error(
      `WARNING: Could not send alert email: ${error.message}`
    );
  }
}

/**
 * HireIntel's own monthly budget for a source is used up.
 */
async function notifyBudgetLimitReached(error) {
  const source = error.source || "unknown";

  const limit = Number(error.monthlyLimitUsd || 0);
  const spent = Number(error.spentUsd || 0);
  const remaining = Number(error.remainingUsd || 0);

  await sendOnce(
    `limit:${source}`,
    `HireIntel ALERT - Apify budget limit reached (${source})`,
    [
      `The monthly Apify budget for "${source}" has been used up.`,
      "",
      `Source: ${source}`,
      `Monthly limit: $${limit.toFixed(2)}`,
      `Spent: $${spent.toFixed(4)}`,
      `Remaining: $${remaining.toFixed(4)}`,
      "",
      `No more ${source} jobs will be fetched until the budget resets next month,`,
      "or until the limit is raised.",
      "",
      "To raise it, change APIFY_MONTHLY_LIMIT_<SOURCE>_USD in the GitHub",
      "secrets (and .env), and check the Apify account has enough credit.",
      "",
      "Generated automatically by HireIntel."
    ].join("\n")
  );
}

/**
 * Apify itself refused the run because the account is out of credit
 * or has hit its platform usage limit.
 */
async function notifyApifyAccountLimit(source, detail) {
  await sendOnce(
    `account:${source}`,
    `HireIntel ALERT - Apify account limit or credit problem (${source})`,
    [
      `Apify rejected a ${source} run, which usually means the Apify account`,
      "has run out of credit or reached its platform usage limit.",
      "",
      `Source: ${source}`,
      `Details: ${detail}`,
      "",
      "Check the Apify account: Console -> Billing / Usage.",
      "",
      "Generated automatically by HireIntel."
    ].join("\n")
  );
}

/**
 * True when an error looks like Apify refusing because of
 * credit or usage limits.
 */
function isApifyAccountLimitError(error) {
  const status = error?.response?.status;

  const body = JSON.stringify(
    error?.response?.data || ""
  ).toLowerCase();

  if (status === 402) {
    return true;
  }

  return (
    (status === 403 || status === 400) &&
    /(usage limit|credit|payment|billing|exceed)/.test(body)
  );
}

module.exports = {
  notifyBudgetLimitReached,
  notifyApifyAccountLimit,
  isApifyAccountLimitError
};
