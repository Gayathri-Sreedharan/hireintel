const { getActor } = require("./actors");
const { runActorAndGetItems } = require("./client");

const {
  reserveBudget,
  recordRun,
  refundBudget
} = require("./budget");

/**
 * Execute an Apify Actor with persistent monthly budget protection.
 *
 * Flow:
 *
 * Check budget
 *     ↓
 * Reserve estimated cost
 *     ↓
 * Run Apify Actor
 *     ↓
 * Record successful run
 *
 * If the Actor fails:
 *
 * Reserved budget
 *     ↓
 * Refund reservation
 */
async function executeActor({
  source,
  input = {},
  estimatedCostUsd = 0.10,
  timeoutSecs = 120,
  maxTotalChargeUsd = null
}) {
  const actor = getActor(source);

  if (!actor) {
    throw new Error(
      `Unknown Apify source: ${source}`
    );
  }

  if (!actor.enabled) {
    throw new Error(
      `Apify source is disabled: ${source}`
    );
  }

  if (!actor.actorId) {
    throw new Error(
      `No Actor ID configured for: ${source}`
    );
  }

  const estimatedCost = Number(
    estimatedCostUsd || 0
  );

  if (estimatedCost < 0) {
    throw new Error(
      "estimatedCostUsd cannot be negative"
    );
  }

  /**
   * If no separate Apify charge ceiling is supplied,
   * use the estimated cost as the safety ceiling.
   */
  const chargeLimit =
    maxTotalChargeUsd !== null
      ? Number(maxTotalChargeUsd)
      : estimatedCost;

  console.log(
    "\nChecking persistent Apify budget..."
  );

  const reservation = await reserveBudget(
    estimatedCost
  );

  console.log(
    `Budget reserved: $${reservation.reservedUsd.toFixed(4)}`
  );

  console.log(
    `Monthly spent: $${reservation.spentUsd.toFixed(4)}`
  );

  console.log(
    `Monthly remaining: $${reservation.remainingUsd.toFixed(4)}`
  );

  try {
    console.log(
      `\nStarting Apify Actor: ${actor.actorId}`
    );

    console.log(
      `Estimated cost: $${estimatedCost.toFixed(4)}`
    );

    console.log(
      `Maximum Actor charge: $${chargeLimit.toFixed(4)}`
    );

    const result = await runActorAndGetItems({
      actorId: actor.actorId,
      input,
      timeoutSecs,
      maxTotalChargeUsd: chargeLimit
    });

    const items = result.items || [];

    const usage = await recordRun({
      jobs: items.length
    });

    console.log(
      `\nApify run recorded successfully.`
    );

    console.log(
      `Monthly spent: $${usage.spentUsd.toFixed(4)}`
    );

    console.log(
      `Monthly remaining: $${Math.max(
        0,
        Number(process.env.APIFY_MONTHLY_LIMIT_USD || 5) -
        usage.spentUsd
      ).toFixed(4)}`
    );

    return {
      source,
      actorId: actor.actorId,
      runId: result.run?.id || null,
      status: result.run?.status || null,
      items,
      count: items.length,
      budget: {
        month: usage.month,
        monthlyLimitUsd:
          Number(
            process.env.APIFY_MONTHLY_LIMIT_USD || 5
          ),
        spentUsd:
          Number(
            usage.spentUsd.toFixed(4)
          ),
        runs: usage.runs,
        jobs: usage.jobs
      }
    };

  } catch (error) {

    try {
      await refundBudget(
        estimatedCost
      );

      console.log(
        `Apify budget refunded: $${estimatedCost.toFixed(4)}`
      );

    } catch (refundError) {

      console.error(
        `WARNING: Could not refund Apify budget: ${
          refundError.message
        }`
      );
    }

    throw error;
  }
}

module.exports = {
  executeActor
};
