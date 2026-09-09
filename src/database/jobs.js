const supabase = require("../config/supabase");


/**
 * Find a job using its unique key.
 */
async function findJobByUniqueKey(uniqueKey) {
  if (!uniqueKey) return null;

  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("unique_key", uniqueKey)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Error finding job: ${error.message}`
    );
  }

  return data;
}


/**
 * Create a new job.
 */
async function createJob(jobData) {
  if (!jobData?.title) {
    throw new Error("Job title is required");
  }

  if (!jobData?.source) {
    throw new Error("Job source is required");
  }

  if (!jobData?.job_url) {
    throw new Error("Job URL is required");
  }

  if (!jobData?.unique_key) {
    throw new Error("Job unique_key is required");
  }

  const payload = {
    title: jobData.title,

    company: jobData.company || null,
    company_id: jobData.company_id || null,

    location: jobData.location || null,

    source: jobData.source,
    job_url: jobData.job_url,

    source_job_id: jobData.source_job_id || null,

    posted_date: jobData.posted_date || null,
    scraped_at: jobData.scraped_at || new Date().toISOString(),

    description: jobData.description || null,

    experience_min: jobData.experience_min ?? null,
    experience_max: jobData.experience_max ?? null,

    salary_min: jobData.salary_min ?? null,
    salary_max: jobData.salary_max ?? null,

    salary_currency: jobData.salary_currency || "INR",

    employment_type: jobData.employment_type || null,
    work_mode: jobData.work_mode || null,

    key_skills: jobData.key_skills || [],
    extracted_skills: jobData.extracted_skills || [],

    domain: jobData.domain || null,

    hiring_partner_id:
      jobData.hiring_partner_id || null,

    recruiter_name:
      jobData.recruiter_name || null,

    recruiter_email:
      jobData.recruiter_email || null,

    recruiter_phone:
      jobData.recruiter_phone || null,

    recruiter_linkedin_url:
      jobData.recruiter_linkedin_url || null,

    company_enriched:
      jobData.company_enriched || false,

    hiring_partner_enriched:
      jobData.hiring_partner_enriched || false,

    processed:
      jobData.processed || false,

    unique_key: jobData.unique_key
  };

  const { data, error } = await supabase
    .from("jobs")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(
      `Error creating job: ${error.message}`
    );
  }

  return data;
}


/**
 * Update an existing job.
 */
async function updateJob(jobId, updates) {
  if (!jobId) {
    throw new Error("Job ID is required");
  }

  const { data, error } = await supabase
    .from("jobs")
    .update(updates)
    .eq("id", jobId)
    .select()
    .single();

  if (error) {
    throw new Error(
      `Error updating job: ${error.message}`
    );
  }

  return data;
}


/**
 * Find a job or create it if it doesn't exist.
 */
async function findOrCreateJob(jobData) {
  if (!jobData?.unique_key) {
    throw new Error("Job unique_key is required");
  }

  const existing = await findJobByUniqueKey(
    jobData.unique_key
  );

  if (existing) {
    return {
      job: existing,
      created: false
    };
  }

  const job = await createJob(jobData);

  return {
    job,
    created: true
  };
}


/**
 * Get recently scraped jobs.
 */
async function getRecentJobs(limit = 100) {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .order("scraped_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(
      `Error getting recent jobs: ${error.message}`
    );
  }

  return data || [];
}


/**
 * Get jobs by source.
 */
async function getJobsBySource(source, limit = 100) {
  if (!source) return [];

  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("source", source)
    .order("scraped_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(
      `Error getting jobs by source: ${error.message}`
    );
  }

  return data || [];
}


/**
 * Get jobs that still need company enrichment.
 */
async function getJobsPendingCompanyEnrichment(limit = 100) {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("company_enriched", false)
    .order("scraped_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(
      `Error getting jobs pending company enrichment: ${error.message}`
    );
  }

  return data || [];
}


/**
 * Get jobs that still need hiring-partner enrichment.
 */
async function getJobsPendingHiringPartnerEnrichment(limit = 100) {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("hiring_partner_enriched", false)
    .order("scraped_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(
      `Error getting jobs pending hiring partner enrichment: ${error.message}`
    );
  }

  return data || [];
}


module.exports = {
  findJobByUniqueKey,
  createJob,
  updateJob,
  findOrCreateJob,
  getRecentJobs,
  getJobsBySource,
  getJobsPendingCompanyEnrichment,
  getJobsPendingHiringPartnerEnrichment
};
