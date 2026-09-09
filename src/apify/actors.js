const ACTORS = {
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

  indeed: {
    name: "Indeed",
    actorId:
      process.env.APIFY_INDEED_ACTOR_ID ||
      "valig/indeed-jobs-scraper",
    enabled: true,
    supportsFullDetails: true,
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

  foundit: {
    name: "Foundit",
    actorId:
      process.env.APIFY_FOUNDIT_ACTOR_ID ||
      "memo23/foundit-jobs-scraper",
    enabled: true,
    supportsFullDetails: true,
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

  hirist: {
    name: "Hirist",
    actorId:
      process.env.APIFY_HIRIST_ACTOR_ID ||
      "data_daemon/hirist-jobs-scraper",
    enabled: true,
    supportsFullDetails: true,
    supportsRecruiterData: true,
    keywordCategories: [
      "data_analytics",
      "ai_ml_genai",
      "software",
      "cloud",
      "devops",
      "cybersecurity"
    ]
  },

  iimjobs: {
    name: "IIMJobs",
    actorId:
      process.env.APIFY_IIMJOBS_ACTOR_ID || "",
    enabled: false,
    supportsFullDetails: true,
    keywordCategories: [
      "data_analytics",
      "ai_ml_genai",
      "software",
      "cloud",
      "devops",
      "cybersecurity",
      "networking_it"
    ]
  },

  instahyre: {
    name: "Instahyre",
    actorId:
      process.env.APIFY_INSTAHYRE_ACTOR_ID || "",
    enabled: false,
    supportsFullDetails: true,
    keywordCategories: [
      "data_analytics",
      "ai_ml_genai",
      "software",
      "cloud",
      "devops",
      "cybersecurity"
    ]
  },

  cutshort: {
    name: "CutShort",
    actorId:
      process.env.APIFY_CUTSHORT_ACTOR_ID ||
      "parsebird/cutshort-jobs-scraper",
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
      "networking_it"
    ]
  },

  hirect: {
    name: "Hirect",
    actorId:
      process.env.APIFY_HIRECT_ACTOR_ID || "",
    enabled: false,
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

  freshersworld: {
    name: "Freshersworld",
    actorId:
      process.env.APIFY_FRESHERSWORLD_ACTOR_ID || "",
    enabled: false,
    supportsFullDetails: true,
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

  internshala: {
    name: "Internshala",
    actorId:
      process.env.APIFY_INTERNSHALA_ACTOR_ID || "",
    enabled: false,
    supportsFullDetails: true,
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

  glassdoor: {
    name: "Glassdoor",
    actorId:
      process.env.APIFY_GLASSDOOR_ACTOR_ID || "",
    enabled: false,
    supportsFullDetails: true,
    keywordCategories: [
      "data_analytics",
      "ai_ml_genai",
      "software",
      "cloud",
      "devops",
      "cybersecurity",
      "networking_it"
    ]
  },

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
  },

  upwork: {
    name: "Upwork",
    actorId:
      process.env.APIFY_UPWORK_ACTOR_ID || "",
    enabled: false,
    supportsFullDetails: true,
    keywordCategories: [
      "data_analytics",
      "ai_ml_genai",
      "software",
      "cloud",
      "devops",
      "cybersecurity",
      "networking_it"
    ]
  }
};

function getActor(sourceKey) {
  return ACTORS[sourceKey] || null;
}

function getEnabledActors() {
  return Object.entries(ACTORS)
    .filter(([, config]) => config.enabled && config.actorId)
    .map(([key, config]) => ({
      key,
      ...config
    }));
}

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
