/**
 * ============================================================
 * HireIntel - Apify Actor Configuration
 * ============================================================
 *
 * Current production Apify sources:
 *   1. Naukri
 *   2. LinkedIn
 *
 * Additional sources can be added later when they are
 * deliberately integrated and registered in the pipeline.
 *
 * The monthly Apify budget is enforced separately through:
 *   src/apify/budget.js
 *
 * The actual job-search keywords are maintained in:
 *   src/config/keywords.js
 * ============================================================
 */

const ACTORS = {
  // ==========================================================
  // Naukri
  // ==========================================================

  naukri: {
    name: "Naukri",

    actorId:
      process.env.APIFY_NAUKRI_ACTOR_ID ||
      "themineworks/naukri-jobs",

    enabled: true,

    // Each source runs on its own Apify account and has
    // its own monthly budget.
    tokenEnv: "APIFY_TOKEN_NAUKRI",
    limitEnv: "APIFY_MONTHLY_LIMIT_NAUKRI_USD",

    supportsFullDetails: true,
    supportsRecruiterData: true,

    keywordCategories: [
      "data_analytics",
      "ai_ml_genai",
      "software",
      "cloud",
      "devops",
      "cybersecurity",
      "networking_it",
      "entry_level"
    ]
  },

  // ==========================================================
  // LinkedIn
  // ==========================================================

  linkedin: {
    name: "LinkedIn",

    actorId:
      process.env.APIFY_LINKEDIN_ACTOR_ID ||
      "harshmaur/linkedin-jobs-scraper",

    enabled: true,

    tokenEnv: "APIFY_TOKEN_LINKEDIN",
    limitEnv: "APIFY_MONTHLY_LIMIT_LINKEDIN_USD",

    supportsFullDetails: true,
    supportsRecruiterData: true,

    keywordCategories: [
      "data_analytics",
      "ai_ml_genai",
      "software",
      "cloud",
      "devops",
      "cybersecurity",
      "networking_it",
      "entry_level"
    ]
  }
};

/**
 * ============================================================
 * Per-source Apify credentials and budget
 * ============================================================
 *
 * Token lookup order:
 *   1. The source's own variable (APIFY_TOKEN_NAUKRI /
 *      APIFY_TOKEN_LINKEDIN)
 *   2. Legacy APIFY_TOKEN (with a warning, so that both
 *      sources are not silently run on one account)
 *
 * Monthly limit lookup order:
 *   1. The source's own variable
 *      (APIFY_MONTHLY_LIMIT_NAUKRI_USD /
 *       APIFY_MONTHLY_LIMIT_LINKEDIN_USD)
 *   2. Legacy APIFY_MONTHLY_LIMIT_USD
 *   3. 5
 */
function getActorToken(sourceKey) {
  const actor = ACTORS[sourceKey];

  if (!actor) {
    throw new Error(`Unknown Apify source: ${sourceKey}`);
  }

  const ownToken = process.env[actor.tokenEnv];

  if (ownToken) {
    return ownToken;
  }

  if (process.env.APIFY_TOKEN) {
    console.warn(
      `WARNING: ${actor.tokenEnv} is not set. ` +
      `Falling back to legacy APIFY_TOKEN for "${sourceKey}". ` +
      `Set ${actor.tokenEnv} to use a separate account.`
    );

    return process.env.APIFY_TOKEN;
  }

  throw new Error(
    `Missing Apify token for "${sourceKey}". ` +
    `Set ${actor.tokenEnv}.`
  );
}

function getActorMonthlyLimit(sourceKey) {
  const actor = ACTORS[sourceKey];

  if (!actor) {
    throw new Error(`Unknown Apify source: ${sourceKey}`);
  }

  const raw =
    process.env[actor.limitEnv] ||
    process.env.APIFY_MONTHLY_LIMIT_USD ||
    5;

  const limit = Number(raw);

  if (!Number.isFinite(limit) || limit <= 0) {
    throw new Error(
      `Invalid monthly Apify limit for "${sourceKey}": ${raw}`
    );
  }

  return limit;
}

/**
 * ============================================================
 * Get a specific Actor configuration
 * ============================================================
 */
function getActor(sourceKey) {
  return ACTORS[sourceKey] || null;
}

/**
 * ============================================================
 * Get all enabled Actors
 * ============================================================
 */
function getEnabledActors() {
  return Object.entries(ACTORS)
    .filter(([, config]) => config.enabled && config.actorId)
    .map(([key, config]) => ({
      key,
      ...config
    }));
}

/**
 * ============================================================
 * Get all configured Actors
 * ============================================================
 */
function getAllActors() {
  return Object.entries(ACTORS).map(([key, config]) => ({
    key,
    ...config
  }));
}

module.exports = {
  ACTORS,
  getActor,
  getActorToken,
  getActorMonthlyLimit,
  getEnabledActors,
  getAllActors
};
