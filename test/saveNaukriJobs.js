const { saveJobs } = require("../src/database/saveJobs");

async function main() {
  console.log("\nHireIntel - Supabase Job Save Test");
  console.log("====================================\n");

  const sampleJobs = [
    {
      title: "Data Scientist",
      company: "Cisco",
      location: "Bengaluru",
      source: "naukri",
      job_url: "https://example.com/hireintel-test-naukri-job",
      source_job_id: "hireintel-test-001",

      posted_date: null,
      scraped_at: new Date().toISOString(),

      description:
        "Data Scientist role involving Python, SQL, machine learning and AI.",

      experience_min: 7,
      experience_max: 10,

      salary_min: null,
      salary_max: null,
      salary_currency: "INR",

      employment_type: null,
      work_mode: null,

      key_skills: [
        "Python",
        "SQL",
        "Machine Learning",
        "Artificial Intelligence"
      ],

      extracted_skills: [
        "python",
        "sql",
        "machine_learning",
        "artificial_intelligence",
        "data_science"
      ],

      domain: "ai_ml_genai",

      hiring_partner_id: null,

      recruiter_name: null,
      recruiter_email: null,
      recruiter_phone: null,
      recruiter_linkedin_url: null,

      company_enriched: false,
      hiring_partner_enriched: false,
      processed: false,

      unique_key: "cisco|data scientist|bengaluru"
    }
  ];

  console.log(`Jobs received: ${sampleJobs.length}\n`);

  const result = await saveJobs(sampleJobs);

  console.log("Save Result");
  console.log("-----------");

  console.log(`Total:      ${result.summary.total}`);
  console.log(`Created:    ${result.summary.created}`);
  console.log(`Duplicates: ${result.summary.duplicates}`);
  console.log(`Failed:     ${result.summary.failed}`);

  if (result.created.length > 0) {
    console.log("\nCreated Jobs:");

    for (const job of result.created) {
      console.log(`✓ ${job.company} - ${job.title}`);
      console.log(`  ID: ${job.id}`);
      console.log(`  Unique Key: ${job.unique_key}`);
    }
  }

  if (result.duplicates.length > 0) {
    console.log("\nDuplicate Jobs:");

    for (const job of result.duplicates) {
      console.log(`↻ ${job.company} - ${job.title}`);
      console.log(`  Existing ID: ${job.existing_id}`);
    }
  }

  if (result.failed.length > 0) {
    console.log("\nFailed Jobs:");

    for (const item of result.failed) {
      console.log(
        `✗ ${item.job?.company || "Unknown"} - ${
          item.job?.title || "Unknown"
        }`
      );

      console.log(`  Reason: ${item.reason}`);
    }
  }

  console.log("\nSupabase save test completed.");
}

main().catch((error) => {
  console.error("\nTEST FAILED");
  console.error(error.message);
  process.exit(1);
});
