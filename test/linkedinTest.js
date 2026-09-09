require("dotenv").config();

const {
  scrape
} = require("../src/scrapers/linkedin");

async function main() {
  console.log("");
  console.log("================================");
  console.log("HIREINTEL - LINKEDIN TEST");
  console.log("================================");

  try {
    const result = await scrape({
      keyword: "data scientist",
      maxJobs: 5,
      includeJobDescription: true,
      timeoutSecs: 300,
      maxTotalChargeUsd: 0.50,
      saveToDatabase: false
    });

    console.log("");
    console.log("================================");
    console.log("LINKEDIN TEST SUMMARY");
    console.log("================================");

    console.log("Raw jobs:", result.rawCount);
    console.log("Processed jobs:", result.count);
    console.log(
      "Skipped invalid:",
      result.skippedJobs.length
    );
    console.log(
      "Processing failures:",
      result.processingFailures.length
    );

    console.log("");
    console.log("JOBS");
    console.log("--------------------------------");

    result.jobs.forEach((job, index) => {
      console.log("");
      console.log(`JOB ${index + 1}`);
      console.log("Title:", job.title);
      console.log("Company:", job.company);
      console.log("Location:", job.location);
      console.log("Source:", job.source);
      console.log("Job URL:", job.job_url);
      console.log(
        "Source Job ID:",
        job.source_job_id
      );
      console.log(
        "Posted Date:",
        job.posted_date
      );
      console.log(
        "Experience:",
        job.experience
      );
      console.log(
        "Employment Type:",
        job.employment_type
      );
      console.log(
        "Work Mode:",
        job.work_mode
      );
      console.log(
        "Salary:",
        job.salary
      );
      console.log(
        "Salary Min:",
        job.salary_min
      );
      console.log(
        "Salary Max:",
        job.salary_max
      );
      console.log(
        "Salary Currency:",
        job.salary_currency
      );
      console.log(
        "Recruiter Name:",
        job.recruiter_name
      );
      console.log(
        "Recruiter Email:",
        job.recruiter_email
      );
      console.log(
        "Recruiter Phone:",
        job.recruiter_phone
      );
      console.log(
        "Recruiter LinkedIn:",
        job.recruiter_linkedin_url
      );
      console.log(
        "Domain:",
        job.domain
      );
      console.log(
        "Extracted Skills:",
        job.extracted_skills
      );
      console.log(
        "Unique Key:",
        job.unique_key
      );
      console.log(
        "Description Length:",
        job.description
          ? job.description.length
          : 0
      );
    });

    console.log("");
    console.log("================================");
    console.log("TEST COMPLETE");
    console.log("================================");

  } catch (error) {
    console.error("");
    console.error("================================");
    console.error("LINKEDIN TEST FAILED");
    console.error("================================");
    console.error(error);
    process.exitCode = 1;
  }
}

main();
