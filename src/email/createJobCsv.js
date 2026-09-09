const fs = require("fs");
const path = require("path");

const CSV_COLUMNS = [
  { key: "title", header: "Job Title" },
  { key: "company", header: "Company" },
  { key: "location", header: "Location" },
  { key: "source", header: "Source" },
  { key: "job_url", header: "Job URL" },
  { key: "posted_date", header: "Posted Date" },
  { key: "scraped_at", header: "Scraped At" },
  { key: "experience_min", header: "Experience Min" },
  { key: "experience_max", header: "Experience Max" },
  { key: "salary_min", header: "Salary Min" },
  { key: "salary_max", header: "Salary Max" },
  { key: "salary_currency", header: "Salary Currency" },
  { key: "employment_type", header: "Employment Type" },
  { key: "work_mode", header: "Work Mode" },
  { key: "key_skills", header: "Key Skills" },
  { key: "extracted_skills", header: "Extracted Skills" },
  { key: "domain", header: "Domain" },
  { key: "recruiter_name", header: "Recruiter Name" },
  { key: "recruiter_email", header: "Recruiter Email" },
  { key: "recruiter_phone", header: "Recruiter Phone" },
  { key: "recruiter_linkedin_url", header: "Recruiter LinkedIn" },
  { key: "unique_key", header: "Unique Key" }
];

function escapeCsvValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  let output = value;

  if (Array.isArray(output)) {
    output = output.join(", ");
  } else if (typeof output === "object") {
    output = JSON.stringify(output);
  }

  output = String(output);

  output = output.replace(/\r\n/g, " ");
  output = output.replace(/\n/g, " ");
  output = output.replace(/\r/g, " ");

  if (
    output.includes(",") ||
    output.includes('"') ||
    output.includes("\n")
  ) {
    output = `"${output.replace(/"/g, '""')}"`;
  }

  return output;
}

function createJobCsv(jobs = []) {
  if (!Array.isArray(jobs)) {
    throw new Error("jobs must be an array.");
  }

  const header = CSV_COLUMNS
    .map((column) => escapeCsvValue(column.header))
    .join(",");

  const rows = jobs.map((job) => {
    return CSV_COLUMNS
      .map((column) => {
        return escapeCsvValue(job[column.key]);
      })
      .join(",");
  });

  return [header, ...rows].join("\r\n") + "\r\n";
}

function getIndiaDateString(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function createJobCsvFile(
  jobs = [],
  outputDirectory = path.join(
    process.cwd(),
    "reports"
  ),
  reportDate = getIndiaDateString()
) {
  if (!Array.isArray(jobs)) {
    throw new Error("jobs must be an array.");
  }

  fs.mkdirSync(outputDirectory, {
    recursive: true
  });

  const filename =
    `hireintel_new_jobs_${reportDate}.csv`;

  const filePath = path.join(
    outputDirectory,
    filename
  );

  const csv = createJobCsv(jobs);

  fs.writeFileSync(
    filePath,
    csv,
    "utf8"
  );

  return {
    filename,
    filePath,
    jobCount: jobs.length,
    sizeBytes: Buffer.byteLength(csv, "utf8")
  };
}

module.exports = {
  CSV_COLUMNS,
  escapeCsvValue,
  createJobCsv,
  getIndiaDateString,
  createJobCsvFile
};
