# HireIntel

**HireIntel** is an automated India-focused job sourcing and intelligence pipeline that collects job postings from multiple sources, validates and normalizes the data, extracts experience and skills, removes duplicates, stores jobs in Supabase, and sends a daily email report with a CSV of genuinely new jobs.

The current production setup uses:

* **Naukri**
* **LinkedIn**
* **Apify** for job scraping
* **Supabase** for persistent storage and budget tracking
* **Gmail API** for daily email reporting
* **GitHub Actions** for automated daily execution

---

## 1. What HireIntel Does

HireIntel automates the following workflow:

```text
Role Keywords
     ↓
Naukri + LinkedIn
     ↓
Raw Job Data
     ↓
Validation
     ↓
Normalization
     ↓
Experience Extraction
     ↓
Skill & Domain Extraction
     ↓
Deduplication
     ↓
Supabase
     ↓
Daily New Jobs Report
     ↓
CSV + Gmail
```

The objective is to reduce manual effort involved in discovering and tracking relevant job opportunities across different job platforms.

---

## 2. Key Features

### Multi-source job sourcing

HireIntel currently supports:

* Naukri
* LinkedIn

The architecture is designed so that additional sources can be added later without redesigning the complete pipeline.

### Normalized role keywords

The system maintains a centralized list of role-oriented keywords.

Examples:

* Data Analyst
* Data Scientist
* Business Analyst
* Machine Learning Engineer
* AI Engineer
* Software Engineer
* Python Developer
* Backend Developer
* Cloud Engineer
* DevOps Engineer
* Cybersecurity Engineer
* Network Engineer
* Graduate Engineer

The current keyword configuration contains **90 normalized role keywords**.

Experience ranges are intentionally **not embedded into the search keywords**.

For example, instead of searching:

```text
Data Analyst 0-2 years
Data Analyst 2-4 years
Data Analyst 4-6 years
```

HireIntel searches:

```text
Data Analyst
```

and extracts the experience requirement from the job data/JD.

This prevents unnecessary keyword duplication and allows the same job to be classified correctly based on its actual requirements.

---

## 3. Job Processing

Every scraped job goes through a processing pipeline.

### Validation

Invalid or incomplete records are identified before database insertion.

### Normalization

HireIntel standardizes fields such as:

* Job title
* Company
* Location
* Job URL
* Posted date
* Salary
* Employment type
* Work mode
* Skills
* Experience

### Experience extraction

Experience can be extracted from an explicit source field or from the job description.

Examples supported include:

```text
0-2 years
1-3 years
2 to 5 years
3+ years
Minimum 2 years
At least 3 years
5 years
Freshers
No prior experience required
```

The normalized output is stored as:

```text
experience_min
experience_max
```

For example:

```text
2-5 years → experience_min = 2, experience_max = 5

3+ years → experience_min = 3, experience_max = null

Freshers → experience_min = 0, experience_max = 0
```

### Skill extraction

The pipeline extracts relevant skills from available job information and stores them in structured fields.

### Domain classification

Jobs are classified into relevant technical/business domains based on the extracted information.

---

## 4. Deduplication

HireIntel prevents duplicate job records from being repeatedly inserted into Supabase.

A normalized unique key is generated using job attributes such as:

```text
Company + Job Title + Location
```

When the same job is encountered again:

```text
New job → Insert into Supabase

Existing job → Mark as duplicate
```

This also helps when the same role appears across different sources.

---

## 5. Database

HireIntel uses **Supabase** as the persistent database.

The jobs table stores information including:

```text
Job Title
Company
Location
Source
Job URL
Source Job ID
Posted Date
Scraped At
Description
Experience Min
Experience Max
Salary Min
Salary Max
Salary Currency
Employment Type
Work Mode
Key Skills
Extracted Skills
Domain
Recruiter Name
Recruiter Email
Recruiter Phone
Recruiter LinkedIn
Unique Key
```

Recruiter information is stored only when it is explicitly available from the source.

HireIntel does **not** infer private contact information.

---

## 6. Daily New Jobs Report

The daily report contains only jobs that were **genuinely newly inserted into Supabase during that run**.

This is different from simply checking the job's posted date.

For example:

```text
Job posted on Sep 8
First discovered by HireIntel on Sep 10
```

If it is inserted into the database for the first time on Sep 10, it is considered a **new job for the Sep 10 report**.

If HireIntel discovers the same job again on Sep 11:

```text
Duplicate → Not included in Sep 11 CSV
```

This prevents the daily report from repeatedly sending the same jobs.

---

## 7. CSV Report

When new jobs are found, HireIntel automatically creates:

```text
hireintel_new_jobs_YYYY-MM-DD.csv
```

The CSV contains information such as:

* Job Title
* Company
* Location
* Source
* Job URL
* Posted Date
* Scraped At
* Experience
* Salary
* Employment Type
* Work Mode
* Skills
* Domain
* Recruiter information
* Unique Key

Example:

```text
hireintel_new_jobs_2026-09-10.csv
```

If no new jobs are found:

* No CSV is created
* An email is still sent
* The email clearly states that no new jobs were found

This ensures there is always confirmation that the scheduled job actually ran.

---

## 8. Email Reporting

HireIntel uses the **Gmail API** for automated reporting.

The email flow is:

```text
GitHub Actions
      ↓
HireIntel
      ↓
Scraping + Processing
      ↓
Supabase
      ↓
Gmail API
      ↓
Daily Email
```

When new jobs are found:

```text
Subject:
HireIntel Daily Job Report - YYYY-MM-DD - X New Jobs
```

The CSV is attached to the email.

When no new jobs are found, the email is still sent without an attachment.

### Why Gmail API?

The project uses Gmail API instead of:

* SMTP
* Gmail App Passwords
* Resend

This allows GitHub Actions to authenticate using Google's OAuth 2.0 refresh-token mechanism.

---

## 9. GitHub Actions Automation

HireIntel runs automatically using GitHub Actions.

The workflow is:

```text
.github/workflows/hireintel-daily.yml
```

Current schedule:

```text
10:05 AM IST every day
```

Cron:

```text
35 4 * * *
```

GitHub Actions uses UTC, so:

```text
04:35 UTC
=
10:05 AM IST
```

The workflow can also be manually triggered using:

```text
workflow_dispatch
```

### Automated execution

The GitHub Actions workflow:

1. Checks out the repository
2. Installs Node.js
3. Installs dependencies
4. Runs `src/index.js`
5. Scrapes configured sources
6. Processes jobs
7. Saves new jobs to Supabase
8. Generates the daily CSV when applicable
9. Sends the Gmail report

---

## 10. Apify

HireIntel uses Apify Actors for job scraping.

Current Actors:

### Naukri

```text
themineworks/naukri-jobs
```

### LinkedIn

```text
harshmaur/linkedin-jobs-scraper
```

Actor IDs can be overridden through environment variables.

---

## 11. Apify Budget Protection

HireIntel includes persistent Apify budget tracking through Supabase.

The purpose is to prevent multiple runs from independently spending beyond the configured monthly limit.

The monthly limit is configured using:

```text
APIFY_MONTHLY_LIMIT_USD
```

Example:

```text
APIFY_MONTHLY_LIMIT_USD=5
```

Before supported Apify runs, the system reserves the estimated budget.

If the monthly limit has been reached, the run is blocked.

This provides an additional safety layer against accidental excessive scraping.

---

## 12. Production Controls

HireIntel supports runtime controls to limit scraping during testing and production.

### Maximum keywords

```text
HIREINTEL_MAX_KEYWORDS
```

Example:

```text
HIREINTEL_MAX_KEYWORDS=1
```

### Maximum jobs per keyword

```text
HIREINTEL_MAX_JOBS_PER_KEYWORD
```

Example:

```text
HIREINTEL_MAX_JOBS_PER_KEYWORD=1
```

### Dry run

```text
HIREINTEL_DRY_RUN=true
```

A dry run allows pipeline testing without performing production actions such as database saving and email reporting.

### Database saving

```text
HIREINTEL_SAVE_TO_DATABASE=true
```

### Email reporting

```text
HIREINTEL_SEND_EMAIL_REPORT=true
```

### Job description

```text
HIREINTEL_INCLUDE_DESCRIPTION=true
```

---

## 13. Environment Variables

Create a local `.env` file.

Example structure:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

APIFY_TOKEN=
APIFY_MONTHLY_LIMIT_USD=5

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=

GMAIL_FROM=
GMAIL_TO=

HIREINTEL_MAX_KEYWORDS=1
HIREINTEL_MAX_JOBS_PER_KEYWORD=1
HIREINTEL_DRY_RUN=false
HIREINTEL_INCLUDE_DESCRIPTION=true
HIREINTEL_SAVE_TO_DATABASE=true
HIREINTEL_SEND_EMAIL_REPORT=true
```

**Never commit `.env` or OAuth credentials to GitHub.**

The following files are intentionally excluded from Git:

```text
.env
.gmail-refresh-token
google-oauth-client.json
reports/
node_modules/
```

---

## 14. Project Structure

```text
hireintel/
│
├── src/
│   ├── apify/
│   │   ├── actors.js
│   │   ├── budget.js
│   │   ├── client.js
│   │   └── runActor.js
│   │
│   ├── config/
│   │   ├── keywords.js
│   │   ├── sources.js
│   │   └── supabase.js
│   │
│   ├── database/
│   │   ├── companies.js
│   │   ├── hiringPartners.js
│   │   ├── jobs.js
│   │   └── saveJobs.js
│   │
│   ├── email/
│   │   ├── createJobCsv.js
│   │   └── sendReport.js
│   │
│   ├── enrichment/
│   │   ├── companyInfo.js
│   │   └── hiringPartner.js
│   │
│   ├── pipeline/
│   │   └── jobPipeline.js
│   │
│   ├── processors/
│   │   ├── deduplicate.js
│   │   ├── extractSkills.js
│   │   └── normalizeJob.js
│   │
│   ├── scrapers/
│   │   ├── linkedin.js
│   │   └── naukri.js
│   │
│   └── index.js
│
├── test/
│   ├── jobPipelineTest.js
│   ├── linkedinTest.js
│   ├── gmailOAuth.js
│   └── gmailSendTest.js
│
├── supabase/
│   └── config.toml
│
├── reports/
│
├── .github/
│   └── workflows/
│       └── hireintel-daily.yml
│
├── package.json
├── package-lock.json
└── README.md
```

---

## 15. Installation

### Prerequisites

Install:

* Node.js 24+
* Git
* Supabase project
* Apify account/API token
* Google Cloud project with Gmail API enabled
* GitHub repository

Check Node.js:

```bash
node --version
```

Install dependencies:

```bash
npm install
```

---

## 16. Local Testing

### Test keyword configuration

```bash
node --check src/config/keywords.js
```

Check keyword count:

```bash
node -e "const {ALL_KEYWORDS}=require('./src/config/keywords'); console.log('Total normalized keywords:', ALL_KEYWORDS.length);"
```

Expected:

```text
Total normalized keywords: 90
```

### Test the job pipeline

```bash
node test/jobPipelineTest.js
```

This validates the Naukri + LinkedIn pipeline, including:

* Scraping
* Validation
* Normalization
* Experience extraction
* Skill extraction
* Deduplication
* Supabase saving

### Test Gmail

```bash
node test/gmailSendTest.js
```

This validates Gmail API reporting without requiring a full production scraping run.

---

## 17. Running HireIntel Locally

The main production entry point is:

```bash
node src/index.js
```

For a controlled test, use low limits:

```env
HIREINTEL_MAX_KEYWORDS=1
HIREINTEL_MAX_JOBS_PER_KEYWORD=1
```

This is recommended before increasing scraping volume.

---

## 18. Adding New Job Sources

The architecture is designed to allow additional sources to be added later.

The intended process is:

```text
1. Add scraper
2. Register source
3. Map source fields
4. Pass through existing processing pipeline
5. Test
```

The existing normalization, experience extraction, skill extraction, deduplication, database, CSV, email, and GitHub Actions components do not need to be redesigned for each source.

Current production sources are intentionally limited to:

```text
Naukri
LinkedIn
```

---

## 19. Recruiter Information

HireIntel can capture recruiter information when the source explicitly exposes it.

Potential fields include:

```text
Recruiter Name
Recruiter LinkedIn URL
Recruiter Email
Recruiter Phone
```

The system does **not** attempt to infer private contact information.

For example:

```text
Publicly provided recruiter profile
→ Can be stored

Private/unpublished email
→ Not inferred

Private phone number
→ Not inferred
```

---

## 20. Current Production Configuration

The current controlled configuration is intentionally conservative to protect the Apify budget.

```text
Sources:
Naukri + LinkedIn

Maximum keywords per run:
1

Maximum jobs per keyword/source:
1

Database saving:
Enabled

Email reporting:
Enabled

Daily schedule:
10:05 AM IST

Apify monthly budget:
$5
```

The keyword list contains:

```text
90 normalized role keywords
```

The production configuration can be increased gradually after monitoring actual scraping cost and output quality.

---

## 21. GitHub Actions Secrets

The following values should be configured as GitHub Actions Secrets:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
APIFY_TOKEN
APIFY_MONTHLY_LIMIT_USD

GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REFRESH_TOKEN
GMAIL_FROM
GMAIL_TO
```

Do not store these values directly in the workflow YAML.

Runtime configuration such as job limits can remain in the workflow file when appropriate.

---

## 22. Security

Sensitive credentials must never be committed to the repository.

Do not commit:

```text
.env
.google-oauth credentials
.gmail-refresh-token
Supabase service-role keys
Apify API tokens
Google refresh tokens
```

If a credential is accidentally exposed, revoke/rotate it immediately.

---

## 23. Future Roadmap

### Current

* [x] Naukri sourcing
* [x] LinkedIn sourcing
* [x] 90 normalized role keywords
* [x] Job validation
* [x] Job normalization
* [x] Experience extraction
* [x] Skill extraction
* [x] Domain extraction
* [x] Deduplication
* [x] Supabase storage
* [x] Persistent Apify budget tracking
* [x] Gmail API reporting
* [x] Daily CSV generation
* [x] GitHub Actions automation
* [x] Daily scheduled execution

### Future

* [ ] Add additional job sources
* [ ] Increase controlled keyword coverage
* [ ] Improve source-specific field mapping
* [ ] Improve recruiter-data coverage where publicly available
* [ ] Add advanced company intelligence
* [ ] Add analytics/dashboard layer
* [ ] Add historical job trend analysis

---

## 24. Design Principle

HireIntel is designed around a simple principle:

> **Add more sources without rebuilding the pipeline.**

The source-specific logic is isolated at the scraper layer, while the rest of the system follows a common flow:

```text
Source
  ↓
Raw Job
  ↓
Validation
  ↓
Normalization
  ↓
Enrichment
  ↓
Deduplication
  ↓
Database
  ↓
Reporting
```

This allows the system to grow from a two-source job collector into a broader job intelligence platform without changing the core processing architecture.

---

## 25. Status

**Current status: Production-ready controlled demo**

The end-to-end workflow has been validated:

```text
Naukri
   +
LinkedIn
   ↓
Processing
   ↓
Supabase
   ↓
New Job Detection
   ↓
CSV Generation
   ↓
Gmail API
   ↓
Email Report
   ↓
GitHub Actions
```

The automated daily schedule is configured for:

**10:05 AM IST every day.**
