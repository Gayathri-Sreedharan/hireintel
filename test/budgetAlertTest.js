/**
 * Sends ONE sample "budget limit reached" alert email to GMAIL_TO / GMAIL_CC /
 * GMAIL_BCC so you can see what the real alert looks like.
 * It runs no Apify Actor and costs nothing.
 *
 * Run:  node test/budgetAlertTest.js
 */

require("dotenv").config();

const {
  notifyBudgetLimitReached
} = require("../src/apify/budgetAlert");

async function main() {
  await notifyBudgetLimitReached({
    source: "naukri",
    monthlyLimitUsd: 5,
    spentUsd: 4.95,
    remainingUsd: 0.05
  });

  console.log("Done. Check the inbox of the alert recipients.");
}

main();
