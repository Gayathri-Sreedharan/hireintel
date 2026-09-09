const {
  findJobByUniqueKey,
  createJob
} = require("./jobs");

/**
 * Save processed jobs into Supabase.
 *
 * Existing jobs are skipped using unique_key.
 *
 * Returns:
 * {
 *   created: [],
 *   duplicates: [],
 *   failed: []
 * }
 */
async function saveJobs(jobs = []) {
  if (!Array.isArray(jobs)) {
    throw new Error("jobs must be an array");
  }

  const created = [];
  const duplicates = [];
  const failed = [];

  for (const job of jobs) {
    try {
      if (!job?.unique_key) {
        failed.push({
          job,
          reason: "Missing unique_key"
        });

        continue;
      }

      // Check whether the job already exists.
      const existing = await findJobByUniqueKey(
        job.unique_key
      );

      if (existing) {
        duplicates.push({
          unique_key: job.unique_key,
          title: job.title,
          company: job.company,
          existing_id: existing.id
        });

        continue;
      }

      // Insert new job.
      const savedJob = await createJob(job);

      created.push(savedJob);

    } catch (error) {
      failed.push({
        job,
        reason: error.message
      });
    }
  }

  return {
    created,
    duplicates,
    failed,
    summary: {
      total: jobs.length,
      created: created.length,
      duplicates: duplicates.length,
      failed: failed.length
    }
  };
}

module.exports = {
  saveJobs
};
