/**
 * Free check: confirms that each source uses its own Apify account
 * and that per-source budget rows work. It does NOT run any Actor
 * and costs nothing.
 *
 * Run:  node test/apifyAccountsCheck.js
 */

require("dotenv").config();

const {
  getEnabledActors,
  getActorToken,
  getActorMonthlyLimit
} = require("../src/apify/actors");

const { getAccountInfo } = require("../src/apify/client");

const {
  reserveBudget,
  getBudgetStatus
} = require("../src/apify/budget");

async function main() {
  const usernames = new Map();
  let failed = false;

  for (const actor of getEnabledActors()) {
    console.log(`\n=== ${actor.name} (${actor.key}) ===`);

    try {
      const token = getActorToken(actor.key);
      const account = await getAccountInfo(token);

      console.log(`Apify account : ${account.username}`);
      console.log(`Monthly limit : $${getActorMonthlyLimit(actor.key).toFixed(2)}`);

      usernames.set(actor.key, account.username);

      // Reserving $0 creates/reads this source's own budget row.
      await reserveBudget(actor.key, 0);

      const status = await getBudgetStatus(actor.key);

      console.log(`Spent so far  : $${status.spentUsd.toFixed(4)}`);
      console.log(`Remaining     : $${status.remainingUsd.toFixed(4)}`);
      console.log(`Runs / jobs   : ${status.runs} / ${status.jobs}`);
    } catch (error) {
      failed = true;
      console.error(`FAILED: ${error.message}`);
    }
  }

  const distinct = new Set(usernames.values());

  if (usernames.size > 1 && distinct.size < usernames.size) {
    failed = true;

    console.error(
      "\nWARNING: Two sources are using the SAME Apify account. " +
      "Check APIFY_TOKEN_NAUKRI and APIFY_TOKEN_LINKEDIN."
    );
  }

  console.log(
    failed
      ? "\nResult: PROBLEMS FOUND"
      : "\nResult: OK - each source has its own account and budget."
  );

  process.exit(failed ? 1 : 0);
}

main();
