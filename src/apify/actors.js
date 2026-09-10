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
  getEnabledActors,
  getAllActors
};
