/**
 * HireIntel - Job Source Configuration
 *
 * This file defines:
 * - Which job sources are enabled
 * - Which keyword categories each source should use
 * - The scraper module associated with each source
 * - Basic source-specific settings
 *
 * Actual keywords are maintained separately in:
 * src/config/keywords.js
 */

const SOURCES = {

  // =========================
  // Naukri
  // =========================
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

  // =========================
  // Indeed
  // =========================
  indeed: {
    name: "Indeed",
    scraper: "indeed",
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

  // =========================
  // Foundit
  // =========================
  foundit: {
    name: "Foundit",
    scraper: "foundit",
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

  // =========================
  // Hirist
  // =========================
  hirist: {
    name: "Hirist",
    scraper: "hirist",
    enabled: true,

    keywordCategories: [
      "data_analytics",
      "ai_ml_genai",
      "software",
      "cloud",
      "devops",
      "cybersecurity"
    ],

    country: "India"
  },

  // =========================
  // IIMJobs
  // =========================
  iimjobs: {
    name: "IIMJobs",
    scraper: "iimjobs",
    enabled: true,

    keywordCategories: [
      "data_analytics",
      "ai_ml_genai",
      "software",
      "cloud",
      "devops",
      "cybersecurity",
      "networking_it"
    ],

    country: "India"
  },

  // =========================
  // Instahyre
  // =========================
  instahyre: {
    name: "Instahyre",
    scraper: "instahyre",
    enabled: true,

    keywordCategories: [
      "data_analytics",
      "ai_ml_genai",
      "software",
      "cloud",
      "devops",
      "cybersecurity"
    ],

    country: "India"
  },

  // =========================
  // Cutshort
  // =========================
  cutshort: {
    name: "Cutshort",
    scraper: "cutshort",
    enabled: true,

    keywordCategories: [
      "data_analytics",
      "ai_ml_genai",
      "software",
      "cloud",
      "devops",
      "cybersecurity",
      "networking_it"
    ],

    country: "India"
  },

  // =========================
  // Hirect
  // =========================
  hirect: {
    name: "Hirect",
    scraper: "hirect",
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

  // =========================
  // Freshersworld
  // =========================
  freshersworld: {
    name: "Freshersworld",
    scraper: "freshersworld",
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

  // =========================
  // Internshala
  // =========================
  internshala: {
    name: "Internshala",
    scraper: "internshala",
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

  // =========================
  // Glassdoor
  // =========================
  glassdoor: {
    name: "Glassdoor",
    scraper: "glassdoor",
    enabled: true,

    keywordCategories: [
      "data_analytics",
      "ai_ml_genai",
      "software",
      "cloud",
      "devops",
      "cybersecurity",
      "networking_it"
    ],

    country: "India"
  },

  // =========================
  // LinkedIn
  // =========================
  //
  // Keep disabled for now.
  // We can enable it later if we have an approved/API-based
  // data source or another compliant integration.
  //
  linkedin: {
    name: "LinkedIn",
    scraper: "linkedin",
    enabled: false,

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

  // =========================
  // Upwork
  // =========================
  upwork: {
    name: "Upwork",
    scraper: "upwork",
    enabled: true,

    keywordCategories: [
      "data_analytics",
      "ai_ml_genai",
      "software",
      "cloud",
      "devops",
      "cybersecurity",
      "networking_it"
    ],

    country: "India"
  }
};


/**
 * Return only enabled sources.
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
 * Get configuration for a specific source.
 */
function getSource(sourceKey) {
  return SOURCES[sourceKey] || null;
}


module.exports = {
  SOURCES,
  getEnabledSources,
  getSource
};
