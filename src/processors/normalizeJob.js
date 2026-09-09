/**
 * ================================================
 * HireIntel - Job Normalization
 * ================================================
 *
 * Converts source-specific job objects into a common
 * structure.
 *
 * Experience is extracted primarily from the source
 * experience field. If that is not available, the JD
 * description is used.
 *
 * Experience-related search keywords are NOT used to
 * determine the actual experience of the job.
 * The Job Description is the source of truth.
 * ================================================
 */

/**
 * ================================================
 * CLEAN TEXT
 * ================================================
 */

function cleanText(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  return String(value)
    .replace(/\s+/g, " ")
    .trim() || null;
}


/**
 * ================================================
 * CLEAN URL
 * ================================================
 */

function cleanUrl(value) {

  if (!value) {
    return null;
  }

  try {

    return new URL(value).toString();

  } catch {

    return String(value).trim();

  }
}


/**
 * ================================================
 * PARSE NUMBER
 * ================================================
 */

function parseNumber(value) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (typeof value === "number") {

    return Number.isFinite(value)
      ? value
      : null;

  }

  const cleaned =
    String(value)
      .replace(/,/g, "")
      .replace(/[^\d.]/g, "");

  if (!cleaned) {
    return null;
  }

  const number =
    Number(cleaned);

  return Number.isFinite(number)
    ? number
    : null;
}


/**
 * ================================================
 * NORMALIZE EXPERIENCE TEXT
 * ================================================
 *
 * Converts different dash characters and common
 * wording into a consistent format.
 */

function normalizeExperienceText(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .toLowerCase()
    .replace(/[–—−]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}


/**
 * ================================================
 * PARSE EXPERIENCE
 * ================================================
 *
 * Supported examples:
 *
 * 2-5 years
 * 2 – 5 years
 * 2 to 5 years
 * 4+ years
 * 5 years
 * 2 years of experience
 * minimum 2 years
 * at least 3 years
 * fresher
 * freshers
 * no experience required
 *
 * Returns:
 *
 * {
 *   min: number | null,
 *   max: number | null
 * }
 *
 * IMPORTANT:
 *
 * We do NOT automatically assign a maximum to:
 *
 * 3+ years
 *
 * because there is no reliable upper limit.
 */

function parseExperience(value) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {

    return {
      min: null,
      max: null
    };

  }

  const text =
    normalizeExperienceText(value);

  if (!text) {

    return {
      min: null,
      max: null
    };

  }


  /**
   * ================================================
   * FRESHER / NO EXPERIENCE
   * ================================================
   */

  if (
    /\b(fresher|freshers|fresh graduate|fresh graduates)\b/
      .test(text)
  ) {

    return {
      min: 0,
      max: 0
    };

  }

  if (
    /\b(no experience required|no prior experience required|experience not required|without experience)\b/
      .test(text)
  ) {

    return {
      min: 0,
      max: 0
    };

  }


  /**
   * ================================================
   * RANGE
   * ================================================
   *
   * Examples:
   *
   * 2-5 years
   * 2 to 5 years
   * 2 - 5 yrs
   */

  const range =
    text.match(
      /(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*(?:years?|yrs?)?/
    );

  if (range) {

    return {
      min: Number(range[1]),
      max: Number(range[2])
    };

  }


  /**
   * ================================================
   * PLUS EXPERIENCE
   * ================================================
   *
   * Examples:
   *
   * 3+ years
   * 5+ yrs
   * 2 years or more
   * minimum 2 years
   * at least 3 years
   */

  const plus =
    text.match(
      /(?:minimum|at least)?\s*(\d+(?:\.\d+)?)\s*\+/
    );

  if (plus) {

    return {
      min: Number(plus[1]),
      max: null
    };

  }

  const minimum =
    text.match(
      /(?:minimum|at least)\s*(\d+(?:\.\d+)?)\s*(?:years?|yrs?)/
    );

  if (minimum) {

    return {
      min: Number(minimum[1]),
      max: null
    };

  }

  const yearsOrMore =
    text.match(
      /(\d+(?:\.\d+)?)\s*(?:years?|yrs?)\s*(?:or more|and above|or above)/
    );

  if (yearsOrMore) {

    return {
      min: Number(yearsOrMore[1]),
      max: null
    };

  }


  /**
   * ================================================
   * SINGLE EXPERIENCE VALUE
   * ================================================
   *
   * Examples:
   *
   * 5 years
   * 2 yrs
   * 3 years of experience
   */

  const single =
    text.match(
      /(\d+(?:\.\d+)?)\s*(?:years?|yrs?)/
    );

  if (single) {

    return {
      min: Number(single[1]),
      max: Number(single[1])
    };

  }


  /**
   * ================================================
   * FALLBACK
   * ================================================
   */

  return {
    min: null,
    max: null
  };
}


/**
 * ================================================
 * EXTRACT EXPERIENCE FROM JD
 * ================================================
 *
 * This is used when the scraper does not provide
 * a separate experience field.
 *
 * We deliberately look for phrases containing
 * "experience" so that unrelated numbers such as
 * salary, years founded, dates, etc. are not
 * incorrectly interpreted as experience.
 */

function parseExperienceFromDescription(description) {

  if (!description) {

    return {
      min: null,
      max: null
    };

  }

  const text =
    normalizeExperienceText(description);

  if (!text) {

    return {
      min: null,
      max: null
    };

  }


  /**
   * ================================================
   * NO EXPERIENCE / FRESHER
   * ================================================
   */

  if (
    /\b(no experience required|no prior experience required|experience not required|without experience)\b/
      .test(text)
  ) {

    return {
      min: 0,
      max: 0
    };

  }

  if (
    /\b(freshers?|fresh graduate|fresh graduates)\b/
      .test(text)
  ) {

    return {
      min: 0,
      max: 0
    };

  }


  /**
   * ================================================
   * EXPERIENCE RANGE
   * ================================================
   *
   * Examples:
   *
   * 2-5 years of experience
   * 2 to 5 years experience
   * 3-6 yrs experience
   */

  const range =
    text.match(
      /(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*(?:years?|yrs?)\s*(?:of\s*)?(?:relevant\s*)?experience/
    );

  if (range) {

    return {
      min: Number(range[1]),
      max: Number(range[2])
    };

  }


  /**
   * ================================================
   * PLUS EXPERIENCE
   * ================================================
   *
   * Examples:
   *
   * 3+ years of experience
   * 5+ yrs experience
   */

  const plus =
    text.match(
      /(\d+(?:\.\d+)?)\s*\+\s*(?:years?|yrs?)\s*(?:of\s*)?(?:relevant\s*)?experience/
    );

  if (plus) {

    return {
      min: Number(plus[1]),
      max: null
    };

  }


  /**
   * ================================================
   * MINIMUM / AT LEAST
   * ================================================
   */

  const minimum =
    text.match(
      /(?:minimum|at least)\s*(\d+(?:\.\d+)?)\s*(?:years?|yrs?)\s*(?:of\s*)?(?:relevant\s*)?experience/
    );

  if (minimum) {

    return {
      min: Number(minimum[1]),
      max: null
    };

  }


  /**
   * ================================================
   * SINGLE EXPERIENCE VALUE
   * ================================================
   *
   * Example:
   *
   * 3 years of experience
   */

  const single =
    text.match(
      /(\d+(?:\.\d+)?)\s*(?:years?|yrs?)\s*(?:of\s*)?(?:relevant\s*)?experience/
    );

  if (single) {

    return {
      min: Number(single[1]),
      max: Number(single[1])
    };

  }


  /**
   * ================================================
   * EXPERIENCE RANGE WHERE "EXPERIENCE" COMES FIRST
   * ================================================
   *
   * Example:
   *
   * Experience: 2-5 years
   */

  const experienceFirstRange =
    text.match(
      /\bexperience\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*(?:years?|yrs?)?/
    );

  if (experienceFirstRange) {

    return {
      min: Number(experienceFirstRange[1]),
      max: Number(experienceFirstRange[2])
    };

  }


  /**
   * ================================================
   * EXPERIENCE WHERE VALUE FOLLOWS "REQUIRED"
   * ================================================
   *
   * Example:
   *
   * Experience required: 2 years
   */

  const requiredExperience =
    text.match(
      /\bexperience\s+required\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)?\s*(?:years?|yrs?)?/
    );

  if (requiredExperience) {

    return {
      min: Number(requiredExperience[1]),
      max:
        requiredExperience[2] !== undefined
          ? Number(requiredExperience[2])
          : Number(requiredExperience[1])
    };

  }


  return {
    min: null,
    max: null
  };
}


/**
 * ================================================
 * PARSE SALARY
 * ================================================
 */

function parseSalary(value) {

  if (!value) {

    return {
      min: null,
      max: null,
      currency: "INR"
    };

  }

  if (typeof value === "object") {

    return {

      min:
        parseNumber(value.min),

      max:
        parseNumber(value.max),

      currency:
        value.currency || "INR"

    };

  }

  const text =
    String(value)
      .replace(/,/g, "")
      .toLowerCase();

  const numbers =
    text.match(/\d+(?:\.\d+)?/g);

  if (
    !numbers ||
    numbers.length === 0
  ) {

    return {
      min: null,
      max: null,
      currency: "INR"
    };

  }

  let multiplier = 1;

  if (
    text.includes("lakh") ||
    text.includes("lac")
  ) {

    multiplier = 100000;

  } else if (
    text.includes("million")
  ) {

    multiplier = 1000000;

  } else if (
    /\bk\b/.test(text)
  ) {

    multiplier = 1000;

  }

  const parsed =
    numbers.map(Number);

  return {

    min:
      parsed[0] * multiplier,

    max:
      parsed.length > 1
        ? parsed[1] * multiplier
        : parsed[0] * multiplier,

    currency:
      text.includes("$")
        ? "USD"
        : "INR"

  };
}


/**
 * ================================================
 * NORMALIZE SKILLS
 * ================================================
 */

function normalizeSkills(skills) {

  if (!skills) {
    return [];
  }

  if (typeof skills === "string") {

    skills =
      skills.split(/[,|;]/);

  }

  if (!Array.isArray(skills)) {
    return [];
  }

  return [
    ...new Set(
      skills
        .map(skill =>
          cleanText(skill)
        )
        .filter(Boolean)
    )
  ];
}


/**
 * ================================================
 * GENERATE UNIQUE KEY
 * ================================================
 */

function generateUniqueKey(job) {

  const company =
    cleanText(job.company) || "";

  const title =
    cleanText(job.title) || "";

  const location =
    cleanText(job.location) || "";

  return [

    company,

    title,

    location

  ]
    .join("|")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}


/**
 * ================================================
 * NORMALIZE JOB
 * ================================================
 */

function normalizeJob(rawJob) {

  if (
    !rawJob ||
    typeof rawJob !== "object"
  ) {

    throw new Error(
      "Invalid job object"
    );

  }


  /**
   * ================================================
   * DESCRIPTION
   * ================================================
   */

  const description =
    cleanText(
      rawJob.description ||
      rawJob.job_description ||
      rawJob.jobDescription
    );


  /**
   * ================================================
   * EXPERIENCE
   * ================================================
   *
   * Priority:
   *
   * 1. Explicit source experience field
   * 2. Experience min/max already supplied
   * 3. Extract from JD description
   */

  const explicitExperience =
    rawJob.experience ||
    rawJob.experience_range ||
    rawJob.experienceRange;

  let experience =
    parseExperience(
      explicitExperience
    );


  /**
   * If the source did not provide a usable
   * experience value, inspect the JD.
   */

  if (
    experience.min === null &&
    experience.max === null
  ) {

    experience =
      parseExperienceFromDescription(
        description
      );

  }


  /**
   * ================================================
   * SALARY
   * ================================================
   */

  const salary =
    parseSalary(
      rawJob.salary
    );


  /**
   * ================================================
   * NORMALIZED JOB
   * ================================================
   */

  const normalized = {

    title:
      cleanText(
        rawJob.title ||
        rawJob.job_title ||
        rawJob.jobTitle
      ),

    company:
      cleanText(
        rawJob.company ||
        rawJob.company_name ||
        rawJob.companyName
      ),

    location:
      cleanText(
        rawJob.location ||
        rawJob.job_location
      ),

    source:
      cleanText(
        rawJob.source
      ),

    job_url:
      cleanUrl(
        rawJob.job_url ||
        rawJob.url ||
        rawJob.jobUrl
      ),

    source_job_id:
      cleanText(
        rawJob.source_job_id ||
        rawJob.sourceJobId ||
        rawJob.id
      ),

    posted_date:
      rawJob.posted_date ||
      rawJob.postedDate ||
      null,

    description,

    experience_min:
      rawJob.experience_min ??
      experience.min,

    experience_max:
      rawJob.experience_max ??
      experience.max,

    salary_min:
      rawJob.salary_min ??
      salary.min,

    salary_max:
      rawJob.salary_max ??
      salary.max,

    salary_currency:
      rawJob.salary_currency ||
      salary.currency ||
      "INR",

    employment_type:
      cleanText(
        rawJob.employment_type ||
        rawJob.employmentType
      ),

    work_mode:
      cleanText(
        rawJob.work_mode ||
        rawJob.workMode
      ),

    key_skills:
      normalizeSkills(
        rawJob.key_skills ||
        rawJob.skills
      ),

    extracted_skills:
      normalizeSkills(
        rawJob.extracted_skills
      ),

    domain:
      cleanText(
        rawJob.domain
      ),

    recruiter_name:
      cleanText(
        rawJob.recruiter_name ||
        rawJob.recruiterName
      ),

    recruiter_email:
      cleanText(
        rawJob.recruiter_email ||
        rawJob.recruiterEmail
      ),

    recruiter_phone:
      cleanText(
        rawJob.recruiter_phone ||
        rawJob.recruiterPhone
      ),

    recruiter_linkedin_url:
      cleanUrl(
        rawJob.recruiter_linkedin_url ||
        rawJob.recruiterLinkedinUrl
      ),

    company_enriched:
      Boolean(
        rawJob.company_enriched
      ),

    hiring_partner_enriched:
      Boolean(
        rawJob.hiring_partner_enriched
      ),

    processed:
      Boolean(
        rawJob.processed
      )

  };


  /**
   * ================================================
   * UNIQUE KEY
   * ================================================
   */

  normalized.unique_key =
    rawJob.unique_key ||
    generateUniqueKey(
      normalized
    );


  return normalized;
}


/**
 * ================================================
 * EXPORTS
 * ================================================
 */

module.exports = {

  cleanText,

  cleanUrl,

  parseNumber,

  parseExperience,

  parseExperienceFromDescription,

  parseSalary,

  normalizeSkills,

  generateUniqueKey,

  normalizeJob

};
