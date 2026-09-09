const KEYWORDS = require("../config/keywords");


/**
 * Skill dictionary used for extraction.
 *
 * Search keywords and JD skills are intentionally
 * kept separate.
 *
 * Search keywords:
 *   Used to find jobs.
 *
 * Skill dictionary:
 *   Used to identify skills inside a JD.
 */

const SKILL_DICTIONARY = {

  // Data
  python: ["python"],

  sql: ["sql"],

  pandas: ["pandas"],

  numpy: ["numpy"],

  tableau: ["tableau"],

  power_bi: [
    "power bi",
    "powerbi"
  ],

  excel: [
    "excel",
    "microsoft excel"
  ],

  statistics: [
    "statistics",
    "statistical analysis",
    "statistical methods",
    "statistical modeling",
    "statistical modelling",
    "advanced statistical"
  ],

  data_analysis: [
    "data analysis",
    "data analytics"
  ],

  data_visualization: [
    "data visualization",
    "data visualisation"
  ],

  data_science: [
    "data science",
    "data scientist"
  ],


  // AI / ML

  machine_learning: [
    "machine learning",
    "machine-learning"
  ],

  deep_learning: [
    "deep learning",
    "deep-learning"
  ],

  artificial_intelligence: [
    "artificial intelligence",
    "ai"
  ],

  generative_ai: [
    "generative ai",
    "genai",
    "gen ai"
  ],

  llm: [
    "large language model",
    "large language models",
    "llm",
    "llms"
  ],

  nlp: [
    "natural language processing",
    "nlp"
  ],

  rag: [
    "rag",
    "retrieval augmented generation",
    "retrieval-augmented generation"
  ],

  embeddings: [
    "embeddings",
    "embedding"
  ],

  vector_database: [
    "vector database",
    "vector databases",
    "vector db",
    "vector dbs"
  ],

  prompt_engineering: [
    "prompt engineering",
    "prompt design"
  ],

  agentic_ai: [
    "agentic ai",
    "agentic workflows",
    "ai agents"
  ],

  multi_agent: [
    "multi-agent",
    "multi agent",
    "multi-agent orchestration",
    "multi agent orchestration"
  ],

  tool_calling: [
    "tool calling",
    "function calling"
  ],

  fine_tuning: [
    "fine-tuning",
    "fine tuning",
    "llm fine-tuning",
    "llm fine tuning"
  ],

  tensorflow: [
    "tensorflow"
  ],

  pytorch: [
    "pytorch"
  ],

  scikit_learn: [
    "scikit-learn",
    "scikit learn",
    "sklearn"
  ],

  mlops: [
    "mlops",
    "ml ops",
    "machine learning operations"
  ],


  // Programming

  java: [
    "java"
  ],

  javascript: [
    "javascript"
  ],

  typescript: [
    "typescript"
  ],

  nodejs: [
    "node.js",
    "nodejs",
    "node js"
  ],

  react: [
    "react",
    "react.js",
    "reactjs"
  ],

  angular: [
    "angular",
    "angular.js",
    "angularjs"
  ],

  spring_boot: [
    "spring boot",
    "springboot"
  ],


  // Cloud

  aws: [
    "aws",
    "amazon web services"
  ],

  azure: [
    "azure",
    "microsoft azure"
  ],

  gcp: [
    "gcp",
    "google cloud",
    "google cloud platform"
  ],


  // DevOps

  docker: [
    "docker"
  ],

  kubernetes: [
    "kubernetes",
    "k8s"
  ],

  devops: [
    "devops",
    "dev ops"
  ],

  jenkins: [
    "jenkins"
  ],

  cicd: [
    "ci/cd",
    "ci cd",
    "continuous integration",
    "continuous deployment",
    "continuous delivery"
  ],

  terraform: [
    "terraform"
  ],


  // Cybersecurity

  cybersecurity: [
    "cybersecurity",
    "cyber security",
    "information security",
    "infosec"
  ],

  soc: [
    "soc analyst",
    "security operations center",
    "security operations"
  ],

  iam: [
    "iam",
    "identity and access management"
  ],

  network_security: [
    "network security"
  ],

  vulnerability_management: [
    "vulnerability management",
    "vulnerability assessment"
  ],

  incident_response: [
    "incident response"
  ],


  // Networking / IT

  networking: [
    "networking",
    "computer networks",
    "computer networking",
    "network administration"
  ],

  linux: [
    "linux"
  ],

  windows_server: [
    "windows server"
  ],

  system_administration: [
    "system administration",
    "system administrator",
    "system admin"
  ],


  // Data Engineering

  data_engineering: [
    "data engineering",
    "data engineer"
  ],

  data_pipelines: [
    "data pipeline",
    "data pipelines"
  ],


  // Other AI / Data skills

  snowflake: [
    "snowflake"
  ],

  graph_analytics: [
    "graph analytics",
    "graph analysis"
  ],

  optimization: [
    "optimization",
    "optimisation",
    "optimization techniques"
  ],

  time_series: [
    "time series",
    "time-series",
    "time series analysis"
  ],

  predictive_analytics: [
    "predictive analytics",
    "predictive modeling",
    "predictive modelling"
  ],

  model_evaluation: [
    "model evaluation",
    "model validation",
    "statistical validation"
  ],

  responsible_ai: [
    "responsible ai"
  ],

  model_governance: [
    "model governance"
  ],

  supply_chain: [
    "supply chain",
    "supply-chain"
  ]
};


/**
 * Create searchable text from a job.
 */
function createSearchText(job) {

  return [
    job?.title,

    job?.company,

    job?.description,

    job?.location,

    ...(Array.isArray(job?.key_skills)
      ? job.key_skills
      : [])
  ]

    .filter(Boolean)

    .join(" ")

    .toLowerCase();
}


/**
 * Safely check whether a phrase exists.
 */
function containsPhrase(text, phrase) {

  if (!text || !phrase) {
    return false;
  }

  const escaped =
    phrase
      .toLowerCase()
      .replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );


  const regex =
    new RegExp(
      `(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`,
      "i"
    );


  return regex.test(text);
}


/**
 * Extract normalized skills from a job.
 */
function extractSkills(job) {

  const text =
    createSearchText(job);


  const skills = [];


  for (
    const [skill, patterns]
    of Object.entries(SKILL_DICTIONARY)
  ) {

    const found =
      patterns.some(
        pattern =>
          containsPhrase(
            text,
            pattern
          )
      );


    if (found) {
      skills.push(skill);
    }
  }


  return skills;
}


/**
 * Detect domain using the existing
 * HireIntel search keyword categories.
 */
function detectDomainFromKeywords(job) {

  const text =
    createSearchText(job);


  const categoryScores = {};


  for (
    const [category, keywords]
    of Object.entries(KEYWORDS)
  ) {

    if (
      category === "ALL_KEYWORDS"
    ) {
      continue;
    }


    let score = 0;


    for (const keyword of keywords) {

      if (
        containsPhrase(
          text,
          keyword.toLowerCase()
        )
      ) {
        score++;
      }
    }


    categoryScores[category] =
      score;
  }


  const sorted =
    Object.entries(categoryScores)
      .sort(
        (a, b) =>
          b[1] - a[1]
      );


  if (
    !sorted.length ||
    sorted[0][1] === 0
  ) {
    return null;
  }


  return sorted[0][0];
}


/**
 * Detect domain from extracted skills.
 *
 * This acts as a fallback when the JD
 * does not match the search keywords.
 */
function detectDomainFromSkills(
  extractedSkills,
  job
) {

  const skills =
    new Set(
      extractedSkills
    );


  const title =
    String(
      job?.title || ""
    ).toLowerCase();


  /**
   * Cybersecurity
   */
  if (
    skills.has("cybersecurity") ||
    skills.has("soc") ||
    skills.has("iam") ||
    skills.has("network_security") ||
    skills.has("vulnerability_management") ||
    skills.has("incident_response")
  ) {
    return "cybersecurity";
  }


  /**
   * AI / ML / GenAI
   *
   * Put this before general data analytics
   * because a Data Scientist JD with strong
   * AI/ML/GenAI requirements should be classified
   * primarily as AI/ML/GenAI.
   */
  const aiSkills = [

    "machine_learning",
    "deep_learning",
    "artificial_intelligence",
    "generative_ai",
    "llm",
    "nlp",
    "rag",
    "embeddings",
    "vector_database",
    "prompt_engineering",
    "agentic_ai",
    "multi_agent",
    "tool_calling",
    "fine_tuning",
    "tensorflow",
    "pytorch",
    "scikit_learn",
    "mlops"
  ];


  const aiSkillCount =
    aiSkills.filter(
      skill =>
        skills.has(skill)
    ).length;


  if (
    aiSkillCount >= 2
  ) {
    return "ai_ml_genai";
  }


  /**
   * Data Analytics.
   */
  const dataSkills = [

    "data_science",
    "data_analysis",
    "data_visualization",
    "statistics",
    "pandas",
    "numpy",
    "tableau",
    "power_bi",
    "excel"
  ];


  const dataSkillCount =
    dataSkills.filter(
      skill =>
        skills.has(skill)
    ).length;


  if (
    dataSkillCount >= 2
  ) {
    return "data_analytics";
  }


  /**
   * Cloud.
   */
  if (
    skills.has("aws") ||
    skills.has("azure") ||
    skills.has("gcp")
  ) {
    return "cloud";
  }


  /**
   * DevOps.
   */
  if (
    skills.has("devops") ||
    skills.has("docker") ||
    skills.has("kubernetes") ||
    skills.has("jenkins") ||
    skills.has("terraform") ||
    skills.has("cicd")
  ) {
    return "devops";
  }


  /**
   * Software.
   */
  if (
    skills.has("java") ||
    skills.has("javascript") ||
    skills.has("typescript") ||
    skills.has("nodejs") ||
    skills.has("react") ||
    skills.has("angular") ||
    skills.has("spring_boot")
  ) {
    return "software";
  }


  /**
   * Networking / IT.
   */
  if (
    skills.has("networking") ||
    skills.has("linux") ||
    skills.has("windows_server") ||
    skills.has("system_administration")
  ) {
    return "networking_it";
  }


  /**
   * Title-based fallback.
   */
  if (
    title.includes("data scientist") ||
    title.includes("data analyst") ||
    title.includes("data analytics") ||
    title.includes("business analyst")
  ) {
    return "data_analytics";
  }


  if (
    title.includes("machine learning") ||
    title.includes("ai engineer") ||
    title.includes("artificial intelligence") ||
    title.includes("genai")
  ) {
    return "ai_ml_genai";
  }


  if (
    title.includes("software engineer") ||
    title.includes("software developer") ||
    title.includes("developer")
  ) {
    return "software";
  }


  return null;
}


/**
 * Determine the HireIntel domain.
 *
 * Priority:
 *
 * 1. Existing keyword-based classification
 * 2. Skill-based classification
 */
function detectDomain(job) {

  /**
   * First use the existing
   * keyword classification.
   */
  const keywordDomain =
    detectDomainFromKeywords(job);


  if (keywordDomain) {
    return keywordDomain;
  }


  /**
   * If keyword matching doesn't
   * identify a domain, extract skills
   * and classify from skills.
   */
  const extractedSkills =
    extractSkills(job);


  return detectDomainFromSkills(
    extractedSkills,
    job
  );
}


/**
 * Process skills and domain together.
 */
function processSkills(job) {

  const extractedSkills =
    extractSkills(job);


  let domain =
    detectDomainFromKeywords(job);


  /**
   * Skill-based fallback.
   */
  if (!domain) {

    domain =
      detectDomainFromSkills(
        extractedSkills,
        job
      );
  }


  return {

    ...job,

    extracted_skills:
      extractedSkills,

    domain
  };
}


module.exports = {

  SKILL_DICTIONARY,

  createSearchText,

  containsPhrase,

  extractSkills,

  detectDomain,

  processSkills

};
