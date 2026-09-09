/**
 * ================================================
 * HireIntel - Normalized Job Search Keywords
 * ================================================
 *
 * Keywords represent job roles / job types.
 *
 * Experience-related terms such as:
 * Fresher, Intern, Junior, Associate, Trainee,
 * Entry Level and Graduate are NOT separate
 * search keywords.
 *
 * Experience will be extracted from the actual JD.
 * ================================================
 */

const KEYWORDS = {

  // =========================
  // DATA & ANALYTICS
  // =========================

  data_analytics: [
    "Data Analyst",
    "Data Scientist",
    "Business Analyst",
    "Associate Analyst",
    "BI Analyst",
    "Tableau Data Analyst",
    "Python Data Analyst",
    "SQL Data Analyst",
    "Power BI Analyst",
    "Product Analyst",
    "BI Developer",
    "Business Intelligence",
    "Analytics Engineer",
    "Analytics Associate",
    "Data Engineer"
  ],

  // =========================
  // AI / ML / GENAI
  // =========================

  ai_ml_genai: [
    "Machine Learning Engineer",
    "AI Engineer",
    "AI/ML Engineer",
    "AI Backend Engineer",
    "GenAI Engineer",
    "LLM Engineer",
    "ML Engineer",
    "Artificial Intelligence Engineer",
    "Generative AI Engineer",
    "AI Research",
    "Data Scientist",
    "Machine Learning",
    "Artificial Intelligence",
    "Generative AI"
  ],

  // =========================
  // SOFTWARE DEVELOPMENT
  // =========================

  software: [
    "Software Engineer",
    "Software Developer",
    "Python Developer",
    "Java Developer",
    "Java Software Engineer",
    "Full Stack Developer",
    "Backend Developer",
    "Frontend Developer",
    "Application Developer",
    "Associate Software Engineer",
    "Software Development Engineer",
    "SDE"
  ],

  // =========================
  // CLOUD
  // =========================

  cloud: [
    "AWS Engineer",
    "AWS Cloud Engineer",
    "AWS Cloud Architect",
    "Azure Engineer",
    "Azure Cloud Engineer",
    "Azure Cloud Architect",
    "GCP Engineer",
    "GCP Cloud Engineer",
    "Cloud Engineer",
    "Cloud Architect",
    "Cloud Solutions Architect",
    "Cloud Infrastructure Engineer",
    "Cloud Support Engineer"
  ],

  // =========================
  // DEVOPS / INFRASTRUCTURE
  // =========================

  devops: [
    "DevOps Engineer",
    "Site Reliability Engineer",
    "SRE Engineer",
    "Infrastructure Engineer",
    "Platform Engineer",
    "Kubernetes Engineer",
    "Docker Engineer",
    "CI/CD Engineer"
  ],

  // =========================
  // CYBERSECURITY
  // =========================

  cybersecurity: [
    "SOC Analyst",
    "SOC Engineer",
    "Cybersecurity Analyst",
    "Cybersecurity Engineer",
    "Cybersecurity",
    "Information Security Analyst",
    "Information Security Specialist",
    "Information Security Engineer",
    "Security Analyst",
    "Security Engineer",
    "Network Security Engineer",
    "Cloud Security Engineer",
    "Application Security Engineer",
    "Security Operations Analyst",
    "Incident Response Analyst",
    "Vulnerability Analyst",
    "GRC Analyst",
    "IAM Analyst"
  ],

  // =========================
  // NETWORKING / IT
  // =========================

  networking_it: [
    "NOC Engineer",
    "Network Engineer",
    "Network Support Engineer",
    "IT Support Engineer",
    "Technical Support Engineer",
    "System Administrator",
    "Systems Engineer"
  ],

  // =========================
  // ENTRY LEVEL / GENERAL IT
  // =========================

  entry_level: [
    "Graduate Engineer",
    "IT Engineer",
    "Technology Engineer",
    "Associate Engineer"
  ]

};

/**
 * ================================================
 * CREATE UNIQUE KEYWORD LIST
 * ================================================
 *
 * A role may exist in more than one category.
 * Set removes exact duplicate searches.
 */

const ALL_KEYWORDS = [
  ...new Set(
    Object.values(KEYWORDS)
      .flat()
      .map(keyword => String(keyword).trim())
      .filter(Boolean)
  )
];

/**
 * ================================================
 * EXPORTS
 * ================================================
 */

module.exports = {
  ...KEYWORDS,
  ALL_KEYWORDS
};
