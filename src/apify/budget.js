const supabase = require("../config/supabase");
const { getActorMonthlyLimit } = require("./actors");

function getCurrentMonth() {
  const now = new Date();

  return `${now.getUTCFullYear()}-${String(
    now.getUTCMonth() + 1
  ).padStart(2, "0")}`;
}

/**
 * Each source has its own budget row.
 *
 * The existing Supabase functions and the apify_usage table
 * are keyed by the "month" value, so a per-source key such as
 *
 *   2026-10:naukri
 *   2026-10:linkedin
 *
 * gives every source a separate monthly budget without
 * changing the database.
 */
function getBudgetKey(source, month = getCurrentMonth()) {
  if (!source) {
    throw new Error("Apify source is required for budget tracking");
  }

  return `${month}:${source}`;
}


/**
 * Reserve budget before starting an Apify run.
 *
 * This is persisted in Supabase and is atomic,
 * so separate GitHub Actions runs cannot independently
 * reset the budget.
 */
async function reserveBudget(source, amountUsd) {
  const amount = Number(amountUsd || 0);

  if (amount < 0) {
    throw new Error("Apify budget amount cannot be negative");
  }

  const month = getCurrentMonth();
  const monthlyLimitUsd = getActorMonthlyLimit(source);

  const { data, error } = await supabase.rpc(
    "reserve_apify_budget",
    {
      p_month: getBudgetKey(source, month),
      p_amount: amount,
      p_monthly_limit: monthlyLimitUsd
    }
  );

  if (error) {
    throw new Error(
      `Unable to reserve Apify budget (${source}): ${error.message}`
    );
  }

  if (!data?.allowed) {
    throw new Error(
      `Monthly Apify budget limit reached for ${source}. ` +
      `Spent: $${Number(data?.spent_usd || 0).toFixed(4)}, ` +
      `Remaining: $${Number(data?.remaining_usd || 0).toFixed(4)}, ` +
      `Limit: $${monthlyLimitUsd.toFixed(2)}`
    );
  }

  return {
    source,
    month,
    reservedUsd: amount,
    spentUsd: Number(data.spent_usd || 0),
    remainingUsd: Number(data.remaining_usd || 0),
    monthlyLimitUsd
  };
}


/**
 * Record a successful Apify run.
 *
 * The money was already reserved before the run.
 * This function only records run/job counts.
 */
async function recordRun(source, { jobs = 0 } = {}) {
  const month = getCurrentMonth();

  const { data, error } = await supabase.rpc(
    "record_apify_run",
    {
      p_month: getBudgetKey(source, month),
      p_jobs: Number(jobs || 0)
    }
  );

  if (error) {
    throw new Error(
      `Unable to record Apify run (${source}): ${error.message}`
    );
  }

  return {
    source,
    month,
    spentUsd: Number(data?.spent_usd || 0),
    runs: Number(data?.runs || 0),
    jobs: Number(data?.jobs || 0)
  };
}


/**
 * Refund a budget reservation if an Apify run fails.
 */
async function refundBudget(source, amountUsd) {
  const amount = Number(amountUsd || 0);

  if (amount <= 0) {
    return;
  }

  const month = getCurrentMonth();

  const { data, error } = await supabase.rpc(
    "refund_apify_budget",
    {
      p_month: getBudgetKey(source, month),
      p_amount: amount
    }
  );

  if (error) {
    throw new Error(
      `Unable to refund Apify budget (${source}): ${error.message}`
    );
  }

  return {
    source,
    month,
    spentUsd: Number(data?.spent_usd || 0)
  };
}


/**
 * Get current persistent budget status for one source.
 */
async function getBudgetStatus(source) {
  const month = getCurrentMonth();
  const monthlyLimitUsd = getActorMonthlyLimit(source);

  const { data, error } = await supabase
    .from("apify_usage")
    .select("*")
    .eq("month", getBudgetKey(source, month))
    .maybeSingle();

  if (error) {
    throw new Error(
      `Unable to read Apify budget (${source}): ${error.message}`
    );
  }

  const spent = Number(data?.spent_usd || 0);

  return {
    source,
    month,
    monthlyLimitUsd,
    spentUsd: Number(spent.toFixed(4)),
    remainingUsd: Number(
      Math.max(0, monthlyLimitUsd - spent).toFixed(4)
    ),
    runs: Number(data?.runs || 0),
    jobs: Number(data?.jobs || 0)
  };
}


module.exports = {
  getCurrentMonth,
  getBudgetKey,
  reserveBudget,
  recordRun,
  refundBudget,
  getBudgetStatus
};
