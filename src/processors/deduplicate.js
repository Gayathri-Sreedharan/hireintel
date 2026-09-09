const {
  generateUniqueKey
} = require("./normalizeJob");


/**
 * Create a unique key for a job.
 */
function getJobUniqueKey(job) {
  if (job.unique_key) {
    return job.unique_key;
  }

  return generateUniqueKey(job);
}


/**
 * Remove duplicate jobs from an array.
 */
function deduplicateJobs(jobs) {
  if (!Array.isArray(jobs)) {
    return [];
  }

  const seen = new Set();
  const uniqueJobs = [];

  for (const job of jobs) {
    if (!job) continue;

    const key = getJobUniqueKey(job);

    if (!key) continue;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);

    uniqueJobs.push({
      ...job,
      unique_key: key
    });
  }

  return uniqueJobs;
}


/**
 * Check whether a job already exists in a Set of keys.
 */
function isDuplicate(job, existingKeys) {
  if (!job || !existingKeys) {
    return false;
  }

  const key = getJobUniqueKey(job);

  return existingKeys.has(key);
}


/**
 * Filter jobs against existing database keys.
 */
function filterNewJobs(jobs, existingKeys) {
  if (!Array.isArray(jobs)) {
    return [];
  }

  if (!existingKeys) {
    return jobs;
  }

  return jobs.filter(
    job => !isDuplicate(job, existingKeys)
  );
}


module.exports = {
  getJobUniqueKey,
  deduplicateJobs,
  isDuplicate,
  filterNewJobs
};
