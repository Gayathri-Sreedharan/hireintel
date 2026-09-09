const supabase = require("../config/supabase");

const MONTHLY_LIMIT_USD = Number(
  process.env.APIFY_MONTHLY_LIMIT_USD || 5
);

function getCurrentMonth() {
  const now = new Date();

  return `${now.getUTCFullYear()}-${String(
    now.getUTCMonth() + 1
  ).padStart(2, "0")}`;
}


/**
 * Reserve budget before starting an Apify run.
 *
 * This is persisted in Supabase and is atomic,
 * so separate GitHub Actions runs cannot independently
 * reset the budget.
 */
async function reserveBudget(amountUsd) {
  const amount = Number(amountUsd || 0);

  if (amount < 0) {
    throw new Error("Apify budget amount cannot be negative");
  }

  const month = getCurrentMonth();

  const { data, error } = await supabase.rpc(
    "reserve_apify_budget",
    {
      p_month: month,
      p_amount: amount,
      p_monthly_limit: MONTHLY_LIMIT_USD
    }
  );

  if (error) {
    throw new Error(
      `Unable to reserve Apify budget: ${error.message}`
    );
  }

  if (!data?.allowed) {
    throw new Error(
      `Monthly Apify budget limit reached. ` +
      `Spent: $${Number(data?.spent_usd || 0).toFixed(4)}, ` +
      `Remaining: $${Number(data?.remaining_usd || 0).toFixed(4)}, ` +
      `Limit: $${MONTHLY_LIMIT_USD.toFixed(2)}`
    );
  }

  return {
    month,
    reservedUsd: amount,
    spentUsd: Number(data.spent_usd || 0),
    remainingUsd: Number(data.remaining_usd || 0),
    monthlyLimitUsd: MONTHLY_LIMIT_USD
  };
}


/**
 * Record a successful Apify run.
 *
 * The money was already reserved before the run.
 * This function only records run/job counts.
 */
async function recordRun({ jobs = 0 } = {}) {
  const month = getCurrentMonth();

  const { data, error } = await supabase.rpc(
    "record_apify_run",
    {
      p_month: month,
      p_jobs: Number(jobs || 0)
    }
  );

  if (error) {
    throw new Error(
      `Unable to record Apify run: ${error.message}`
    );
  }

  return {
    month,
    spentUsd: Number(data?.spent_usd || 0),
    runs: Number(data?.runs || 0),
    jobs: Number(data?.jobs || 0)
  };
}


/**
 * Refund a budget reservation if an Apify run fails.
 */
async function refundBudget(amountUsd) {
  const amount = Number(amountUsd || 0);

  if (amount <= 0) {
    return;
  }

  const month = getCurrentMonth();

  const { data, error } = await supabase.rpc(
    "refund_apify_budget",
    {
      p_month: month,
      p_amount: amount
    }
  );

  if (error) {
    throw new Error(
      `Unable to refund Apify budget: ${error.message}`
    );
  }

  return {
    month,
    spentUsd: Number(data?.spent_usd || 0)
  };
}


/**
 * Get current persistent budget status.
 */
async function getBudgetStatus() {
  const month = getCurrentMonth();

  const { data, error } = await supabase
    .from("apify_usage")
    .select("*")
    .eq("month", month)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Unable to read Apify budget: ${error.message}`
    );
  }

  const spent = Number(data?.spent_usd || 0);

  return {
    month,
    monthlyLimitUsd: MONTHLY_LIMIT_USD,
    spentUsd: Number(spent.toFixed(4)),
    remainingUsd: Number(
      Math.max(0, MONTHLY_LIMIT_USD - spent).toFixed(4)
    ),
    runs: Number(data?.runs || 0),
    jobs: Number(data?.jobs || 0)
  };
}


module.exports = {
  MONTHLY_LIMIT_USD,
  getCurrentMonth,
  reserveBudget,
  recordRun,
  refundBudget,
  getBudgetStatus
};

