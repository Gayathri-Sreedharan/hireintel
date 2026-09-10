/**
 * ============================================================
 * HireIntel - Job Source Configuration
 * ============================================================
 *
 * This file is the central configuration for job sources.
 *
 * Current production sources:
 *   1. Naukri
 *   2. LinkedIn
 *
 * Additional sources can be added here later and then
 * deliberately registered in the central pipeline.
 *
 * Actual job-search keywords are maintained separately in:
 *   src/config/keywords.js
 *
 * Experience ranges are NOT part of the search keywords.
 * Experience is extracted later from the job data/JD.
 * ============================================================
 */

const SOURCES = {
  // ==========================================================
  // Naukri
  // ==========================================================

  naukri: {
    name: "Naukri",
    scraper: "naukri",
    enabled: true,

    keywordCategories: [
      "data_analytics",
      "ai_ml_genai",
      "software",
      "cloud",
      "devops",
      "cybersecurity",
      "networking_it",
      "entry_level"
    ],

    country: "India"
  },

  // ==========================================================
  // LinkedIn
  // ==========================================================

  linkedin: {
    name: "LinkedIn",
    scraper: "linkedin",
    enabled: true,

    keywordCategories: [
      "data_analytics",
      "ai_ml_genai",
      "software",
      "cloud",
      "devops",
      "cybersecurity",
      "networking_it",
      "entry_level"
    ],

    country: "India"
  }
};

/**
 * ============================================================
 * Get enabled sources
 * ============================================================
 *
 * Returns source configurations that are explicitly enabled.
 */
function getEnabledSources() {
  return Object.entries(SOURCES)
    .filter(([, config]) => config.enabled)
    .map(([key, config]) => ({
      key,
      ...config
    }));
}

/**
 * ============================================================
 * Get a specific source
 * ============================================================
 */
function getSource(sourceKey) {
  return SOURCES[sourceKey] || null;
}

module.exports = {
  SOURCES,
  getEnabledSources,
  getSource
};
