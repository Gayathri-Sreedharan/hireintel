# HireIntel

HireIntel is an India-focused automated **job sourcing and job intelligence pipeline** built to discover relevant job opportunities, normalize and enrich job data, remove duplicates, persist jobs in Supabase, and send a daily report containing only genuinely new jobs.

The system is designed to start with a controlled number of job sources and gradually expand as scraper quality, cost, data quality, and automation reliability are validated.

---

## 1. Current Status

**Status: Production-ready controlled pipeline**

The current production implementation supports:

- Naukri
- LinkedIn
- 90 normalized role keywords
- Apify-based scraping
- Job validation
- Job normalization
- Experience extraction
- Skill extraction
- Domain classification
- Deduplication
- Supabase persistence
- Persistent Apify budget tracking
- Genuine-new-job detection
- CSV generation
- Gmail API reporting
- GitHub Actions execution
- Manual workflow triggering
- External scheduler integration planned for automated daily triggering

The production configuration is intentionally conservative while Apify cost and source quality are being monitored.

Current controlled configuration:

```text
Sources:
Naukri + LinkedIn

Configured keywords:
90

Keywords processed per run:
1

Jobs per keyword per source:
1

Database saving:
Enabled

Email reporting:
Enabled

Dry run:
Disabled
2. Objective

The primary objective of HireIntel is to automate job discovery across Indian job platforms and create a reliable, structured job database that can be used for:

Job discovery
Recruiter outreach
Company intelligence
Hiring-partner intelligence
Candidate/job matching
Career-preparation workflows
Job-market analytics
Historical job analysis

The system is intentionally designed so that source-specific scraping logic is separated from the common processing pipeline.

3. End-to-End Architecture

The current architecture is:

                     90 Role Keywords
                            |
                            v
                  +---------------------+
                  | Naukri + LinkedIn   |
                  +---------------------+
                            |
                            v
                     Raw Job Data
                            |
                            v
                       Validation
                            |
                            v
                      Normalization
                            |
                            v
                   Experience Parsing
                            |
                            v
                  Skill / Domain Parsing
                            |
                            v
                      Deduplication
                            |
                            v
                        Supabase
                            |
                            v
                 Genuine New Job Detection
                            |
                  +---------+---------+
                  |                   |
                  v                   v
             CSV Generation       Email Report
                                      |
                                      v
                                  Gmail API

The cloud execution flow is:

External Scheduler
       |
       v
GitHub Actions workflow_dispatch
       |
       v
HireIntel
       |
       v
Naukri + LinkedIn
       |
       v
Processing + Deduplication
       |
       v
Supabase
       |
       v
CSV
       |
       v
Gmail API
4. Project Architecture

The source code is divided into logical layers.

hireintel/
|
├── src/
|   |
|   ├── apify/
|   |   ├── actors.js
|   |   ├── budget.js
|   |   ├── client.js
|   |   └── runActor.js
|   |
|   ├── config/
|   |   ├── keywords.js
|   |   ├── sources.js
|   |   └── supabase.js
|   |
|   ├── database/
|   |   ├── companies.js
|   |   ├── hiringPartners.js
|   |   ├── jobs.js
|   |   └── saveJobs.js
|   |
|   ├── email/
|   |   ├── createJobCsv.js
|   |   └── sendReport.js
|   |
|   ├── enrichment/
|   |   ├── companyInfo.js
|   |   └── hiringPartner.js
|   |
|   ├── pipeline/
|   |   └── jobPipeline.js
|   |
|   ├── processors/
|   |   ├── deduplicate.js
|   |   ├── extractSkills.js
|   |   └── normalizeJob.js
|   |
|   ├── scrapers/
|   |   ├── index.js
|   |   ├── linkedin.js
|   |   └── naukri.js
|   |
|   └── index.js
|
├── test/
|   ├── gmailOAuth.js
|   ├── gmailSendTest.js
|   ├── jobPipelineTest.js
|   ├── linkedinTest.js
|   └── saveNaukriJobs.js
|
├── .github/
|   └── workflows/
|       └── hireintel-daily.yml
|
├── reports/
|
├── package.json
├── package-lock.json
└── README.md

Unused legacy scraper implementations have been removed from the current production codebase.

5. Source Configuration

Current production sources are:

Naukri
LinkedIn

Source configuration is maintained in:

src/config/sources.js

Apify Actor configuration is maintained in:

src/apify/actors.js

The common pipeline is maintained in:

src/pipeline/jobPipeline.js

This separation allows source-specific implementations to change without redesigning the entire pipeline.

6. Naukri

Current Naukri Actor:

themineworks/naukri-jobs

Scraper implementation:

src/scrapers/naukri.js

The scraper passes the search keyword and runtime controls to the Apify Actor.

Naukri processing supports:

Job title
Company
Location
Job URL
Source job ID
Posted date
Job description
Experience
Salary
Employment type
Work mode
Skills
Recruiter information where exposed by the source/Actor

The Actor can be overridden using:

APIFY_NAUKRI_ACTOR_ID=

If the variable is not provided, the default Actor is:

themineworks/naukri-jobs
7. LinkedIn

Current LinkedIn Actor:

harshmaur/linkedin-jobs-scraper

Scraper implementation:

src/scrapers/linkedin.js

LinkedIn processing supports available fields such as:

Job title
Company
Location
Job URL
Source job ID
Posted date
Job description
Experience
Salary
Employment type
Work mode
Skills
Recruiter/job poster information where publicly exposed

The Actor can be overridden using:

APIFY_LINKEDIN_ACTOR_ID=

If the variable is not provided, the default Actor is:

harshmaur/linkedin-jobs-scraper
8. Keyword Strategy

HireIntel maintains a centralized role keyword configuration in:

src/config/keywords.js

The current configuration contains:

90 normalized role keywords

Major keyword categories include:

Data Analytics
AI / ML / GenAI
Software Engineering
Cloud
DevOps
Cybersecurity
Networking / IT
Entry-level technology roles

Examples:

Data Analyst
Data Scientist
Business Analyst
Associate Analyst
BI Analyst
Product Analyst
Data Engineer

Machine Learning Engineer
AI Engineer
AI/ML Engineer
GenAI Engineer
LLM Engineer
Artificial Intelligence Engineer
Generative AI Engineer

Software Engineer
Software Developer
Python Developer
Java Developer
Full Stack Developer
Backend Developer
Frontend Developer
Application Developer
SDE

AWS Engineer
AWS Cloud Engineer
Azure Engineer
GCP Engineer
Cloud Engineer
Cloud Architect
Cloud Solutions Architect

DevOps Engineer
Site Reliability Engineer
SRE Engineer
Infrastructure Engineer
Platform Engineer
Kubernetes Engineer
Docker Engineer

SOC Analyst
Cybersecurity Analyst
Cybersecurity Engineer
Information Security Analyst
Security Engineer
Cloud Security Engineer
Application Security Engineer
GRC Analyst
IAM Analyst

NOC Engineer
Network Engineer
Network Support Engineer
IT Support Engineer
Technical Support Engineer
System Administrator
Systems Engineer

Graduate Engineer
IT Engineer
Technology Engineer
Associate Engineer
9. Experience Search Strategy

Experience ranges are intentionally not embedded in search keywords.

The system does not create separate searches such as:

Data Analyst 0-2 years
Data Analyst 2-4 years
Data Analyst 4-6 years
Data Analyst 6-8 years

Instead:

Data Analyst

is searched broadly.

The actual experience requirement is extracted from the source data or job description.

This approach:

Reduces keyword duplication
Reduces unnecessary scraper calls
Avoids missing jobs due to inconsistent experience labels
Allows experience to be stored as structured fields
Makes later experience-based filtering easier
10. Job Validation

Raw source records are validated before they are processed further.

Validation helps prevent incomplete records from reaching the database.

The pipeline distinguishes between:

Invalid source record

and:

Processing failure

This allows source quality problems to be monitored separately from software errors.

11. Job Normalization

Normalization is handled by:

src/processors/normalizeJob.js

Source-specific job formats are converted into a common HireIntel structure.

Normalization includes:

Text cleanup
URL cleanup
Number parsing
Experience normalization
Salary normalization
Skill normalization
Unique-key generation
Common database field mapping

The normalized job structure allows Naukri and LinkedIn records to be processed through the same downstream pipeline.

12. Experience Extraction

Experience is extracted in the following order:

1. Explicit source experience field
2. Experience range fields
3. Job description

Supported patterns include:

0-2 years
1-3 years
2 to 5 years
3+ years
Minimum 2 years
At least 3 years
5 years
Freshers
Freshers welcome
No prior experience required
No experience required

The normalized database fields are:

experience_min
experience_max

Examples:

2-5 years
experience_min = 2
experience_max = 5
3+ years
experience_min = 3
experience_max = null
Freshers
experience_min = 0
experience_max = 0

This allows experience-based filtering to happen later without relying on the original text format.

13. Skill Extraction

Skill processing is handled by:

src/processors/extractSkills.js

The normalized job can contain:

key_skills
extracted_skills

The system extracts relevant technologies and skills from available job information.

Examples may include:

Python
SQL
Excel
Power BI
Tableau
Java
AWS
Azure
GCP
Docker
Kubernetes
Machine Learning
Generative AI

The exact extracted values depend on the job data returned by the source.

14. Domain Classification

Jobs are also classified into a broader domain.

The normalized field is:

domain

This allows later analysis to group jobs into areas such as:

Data Analytics
Data Science
AI / ML
Software Engineering
Cloud
DevOps
Cybersecurity
Networking / IT

Domain extraction is intentionally separate from individual skill extraction.

15. Deduplication

Deduplication is handled by:

src/processors/deduplicate.js

A normalized unique key is generated for jobs.

The key uses identifying job information such as:

Company
+
Job Title
+
Location

Where source-specific identifiers are available, they can also be used as part of the normalized identity.

The basic logic is:

Scraped Job
    |
    v
Generate Unique Key
    |
    +---- Existing ----> Duplicate
    |
    +---- New ---------> Save

Duplicate jobs are not inserted again.

16. Genuine New Job Definition

HireIntel does not define a "new job" simply by looking at the job's posted date.

A job is considered genuinely new for a run when it is successfully inserted into Supabase during that run.

Example:

Job posted:
September 8

First discovered:
September 10

First database insertion:
September 10

This job is included in the September 10 report.

If it is scraped again on September 11:

Already exists in database
        |
        v
Duplicate
        |
        v
Not included in September 11 CSV

Therefore:

Genuinely New Job
=
Job successfully inserted into Supabase during the current run

This is the basis for daily CSV reporting.

17. Database

Supabase is used as the persistent database.

Database modules are located in:

src/database/

Main modules:

companies.js
hiringPartners.js
jobs.js
saveJobs.js

The jobs table contains fields including:

title
company
company_id
location
source
job_url
source_job_id
posted_date
scraped_at
description
experience_min
experience_max
salary_min
salary_max
salary_currency
employment_type
work_mode
key_skills
extracted_skills
domain
hiring_partner_id
recruiter_name
recruiter_email
recruiter_phone
recruiter_linkedin_url
company_enriched
hiring_partner_enriched
processed
unique_key
18. Database Save Logic

Job persistence is handled through:

src/database/saveJobs.js

Before inserting a job, HireIntel checks whether its normalized unique key already exists.

The result is categorized as:

created
duplicate
failed

This result is also used by the reporting layer.

Only:

created

jobs are considered genuinely new for the current report.

19. Enrichment

The repository contains enrichment modules:

src/enrichment/companyInfo.js
src/enrichment/hiringPartner.js

These modules are intended to support future company and hiring-partner intelligence.

They are kept separate from the core scraping and normalization layers so that enrichment can evolve independently.

Future enrichment capabilities can include:

Company information
Hiring partner information
Company identifiers
Employer intelligence
Recruiter/company relationships

Enrichment should only use legitimate and permitted data sources.

20. Recruiter Information

HireIntel supports storing recruiter information when the source explicitly exposes it.

Possible fields include:

recruiter_name
recruiter_email
recruiter_phone
recruiter_linkedin_url

Important rule:

HireIntel does not infer private recruiter contact information.

For example:

Public recruiter name
→ Can be stored
Public recruiter LinkedIn profile
→ Can be stored
Private/unpublished email
→ Must not be inferred
Private phone number
→ Must not be inferred

Recruiter-data coverage depends on what the source and selected Apify Actor publicly expose.

21. Apify Architecture

Apify integration is located in:

src/apify/

Main modules:

actors.js
client.js
runActor.js
budget.js

Responsibilities:

actors.js

Maintains source-to-Actor configuration.

client.js

Handles communication with the Apify API.

runActor.js

Coordinates Actor execution and budget protection.

budget.js

Maintains persistent monthly budget reservations and usage information through Supabase.

22. Apify Actors

Current Actors:

Naukri
themineworks/naukri-jobs
LinkedIn
harshmaur/linkedin-jobs-scraper

The current Actors are not necessarily permanent.

Before replacing an Actor, HireIntel should compare:

Actual cost
Job count
Data completeness
Description quality
Experience quality
Skills quality
Duplicate rate
Recruiter-data availability
Runtime
Reliability

A controlled A/B test should be performed before production replacement.

23. Apify Budget Protection

HireIntel maintains a persistent monthly budget through Supabase.

Naukri and LinkedIn run on separate Apify accounts, each with its own token and its own monthly budget.

Tokens:

APIFY_TOKEN_NAUKRI=
APIFY_TOKEN_LINKEDIN=

Monthly limits (optional, default 5 each):

APIFY_MONTHLY_LIMIT_NAUKRI_USD=5
APIFY_MONTHLY_LIMIT_LINKEDIN_USD=5

Budget rows in Supabase are keyed per source and month, for example:

2026-10:naukri
2026-10:linkedin

The legacy APIFY_TOKEN and APIFY_MONTHLY_LIMIT_USD are only used as a fallback (with a warning) when a source-specific value is missing.

To confirm both sources use different accounts (free, runs no Actor):

node test/apifyAccountsCheck.js

The system uses a reservation model.

Simplified flow:

Before Actor run
       |
       v
Check monthly budget
       |
       v
Reserve estimated cost
       |
       v
Execute Actor
       |
       +---- Success ----> Record run
       |
       +---- Failure -----> Refund reservation

The budget protection exists to prevent separate runs from independently exceeding the configured monthly limit.

The persistent budget value is an internal safety mechanism and should not be considered an exact replacement for Apify's official billing data.

24. Maximum Actor Charge

HireIntel supports a per-run maximum charge control:

HIREINTEL_MAX_TOTAL_CHARGE_USD=0.50

This is intended as an additional protection against unexpectedly expensive Actor executions.

The exact cost depends on the Actor configuration and Apify billing behavior.

25. Runtime Controls

The main runtime controls are:

HIREINTEL_MAX_KEYWORDS=1
HIREINTEL_MAX_JOBS_PER_KEYWORD=1
HIREINTEL_DRY_RUN=false
HIREINTEL_INCLUDE_DESCRIPTION=true
HIREINTEL_SAVE_TO_DATABASE=true
HIREINTEL_SEND_EMAIL_REPORT=true
HIREINTEL_TIMEOUT_SECS=300
HIREINTEL_MAX_TOTAL_CHARGE_USD=0.50
HIREINTEL_MAX_KEYWORDS

Controls how many role keywords are processed in a run.

Current production value:

1
HIREINTEL_MAX_JOBS_PER_KEYWORD

Controls the maximum jobs requested per keyword per source.

Current production value:

1
HIREINTEL_DRY_RUN

Controls whether production actions are disabled.

Current production value:

false
HIREINTEL_INCLUDE_DESCRIPTION

Controls whether job descriptions are requested/processed where supported.

HIREINTEL_SAVE_TO_DATABASE

Controls whether jobs are persisted to Supabase.

Current production value:

true
HIREINTEL_SEND_EMAIL_REPORT

Controls whether the Gmail report is sent.

Current production value:

true
HIREINTEL_TIMEOUT_SECS

Controls the maximum wait time for an Apify run.

HIREINTEL_MAX_TOTAL_CHARGE_USD

Provides a maximum charge parameter for supported Apify executions.

26. Daily CSV Reporting

CSV generation is handled by:

src/email/createJobCsv.js

The CSV is created only when:

report.newJobs.length > 0

The generated filename is:

hireintel_new_jobs_YYYY-MM-DD.csv

Example:

hireintel_new_jobs_2026-09-10.csv

The CSV contains fields including:

Job Title
Company
Location
Source
Job URL
Posted Date
Scraped At
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

The CSV is generated from jobs that were genuinely created in the database during the current run.

27. No-New-Job Behavior

If no genuinely new jobs are inserted:

No CSV is generated.

However:

Email is still sent.

The email states:

No new jobs were found today.

This is intentional.

The email therefore acts as both:

A job report
Confirmation that the pipeline executed
28. Gmail API

Email reporting is handled by:

src/email/sendReport.js

HireIntel uses:

Google Gmail API

The email flow is:

Pipeline
   |
   v
New Jobs
   |
   v
CSV
   |
   v
Gmail API
   |
   v
Recipient Inbox

The email subject follows:

HireIntel Daily Job Report - YYYY-MM-DD - X New Jobs

Example:

HireIntel Daily Job Report - 2026-09-10 - 5 New Jobs

If there are no new jobs, the email is still sent without a CSV attachment.

29. Gmail Authentication

Google OAuth 2.0 is used.

The required local credentials include:

google-oauth-client.json
.gmail-refresh-token

These files must never be committed to Git.

The refresh token is stored securely and supplied to GitHub Actions through:

GOOGLE_REFRESH_TOKEN

HireIntel does not use:

SMTP
Gmail App Passwords
Resend
30. GitHub Actions

The production workflow is:

.github/workflows/hireintel-daily.yml

The current workflow supports:

on:
  workflow_dispatch:

This means the workflow can be manually triggered from GitHub Actions.

The workflow uses:

actions/checkout@v5
actions/setup-node@v5
Node.js 24
npm ci
node src/index.js
31. GitHub Scheduled Execution

GitHub's built-in scheduled trigger is currently not enabled.

The workflow does not currently contain:

schedule:

The earlier scheduled configuration was removed because scheduled workflow runs were not reliably being created, while manual workflow_dispatch runs were working.

Therefore, GitHub Actions currently provides:

Manual workflow execution

rather than being the scheduler itself.

32. External Scheduler

The intended automated execution architecture is:

External Scheduler
        |
        v
GitHub Actions API
        |
        v
workflow_dispatch
        |
        v
HireIntel

The external scheduler is responsible for triggering the existing GitHub workflow.

This keeps the production job logic inside GitHub Actions while moving scheduling responsibility to a separate service.

The external scheduler should trigger:

POST
https://api.github.com/repos/Gayathri-Sreedharan/hireintel/actions/workflows/hireintel-daily.yml/dispatches

with:

{
  "ref": "main"
}

The scheduler should authenticate using a dedicated GitHub token with only the permissions required to trigger the workflow.

GitHub tokens must never be stored in source code or committed to the repository.

33. GitHub Actions Environment

The production workflow currently supplies:

SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
APIFY_TOKEN_NAUKRI
APIFY_TOKEN_LINKEDIN
APIFY_MONTHLY_LIMIT_NAUKRI_USD
APIFY_MONTHLY_LIMIT_LINKEDIN_USD

GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REFRESH_TOKEN
GMAIL_FROM
GMAIL_TO

Runtime controls are supplied through the workflow environment.

Current production controls are:

HIREINTEL_MAX_KEYWORDS=1
HIREINTEL_MAX_JOBS_PER_KEYWORD=1
HIREINTEL_DRY_RUN=false
HIREINTEL_SAVE_TO_DATABASE=true
HIREINTEL_SEND_EMAIL_REPORT=true
34. GitHub Actions Secrets

The following should be stored as GitHub Actions Secrets:

SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
APIFY_TOKEN_NAUKRI
APIFY_TOKEN_LINKEDIN
APIFY_MONTHLY_LIMIT_NAUKRI_USD
APIFY_MONTHLY_LIMIT_LINKEDIN_USD

GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REFRESH_TOKEN

GMAIL_FROM
GMAIL_TO

Secrets should never be hard-coded into:

JavaScript source files
README
workflow YAML
shell scripts
public documentation
35. Environment Variables

Local .env example:

SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

APIFY_TOKEN_NAUKRI=
APIFY_TOKEN_LINKEDIN=
APIFY_MONTHLY_LIMIT_NAUKRI_USD=5
APIFY_MONTHLY_LIMIT_LINKEDIN_USD=5

APIFY_NAUKRI_ACTOR_ID=
APIFY_LINKEDIN_ACTOR_ID=

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
HIREINTEL_TIMEOUT_SECS=300
HIREINTEL_MAX_TOTAL_CHARGE_USD=0.50

Actor override variables are optional.

If they are not set, the default Actors in src/apify/actors.js are used.

36. Local Installation
Prerequisites

Install:

Node.js 24+
Git
Supabase project
Apify account
Apify API token
Google Cloud project
Gmail API enabled
GitHub repository

Verify Node:

node --version

Expected:

v24.x.x

Install dependencies:

npm install
37. Local Environment

Create:

.env

Do not commit it.

Example:

SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

APIFY_TOKEN_NAUKRI=your_naukri_account_apify_token
APIFY_TOKEN_LINKEDIN=your_linkedin_account_apify_token
APIFY_MONTHLY_LIMIT_NAUKRI_USD=5
APIFY_MONTHLY_LIMIT_LINKEDIN_USD=5

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REFRESH_TOKEN=your_google_refresh_token

GMAIL_FROM=sender@example.com
GMAIL_TO=recipient@example.com

HIREINTEL_MAX_KEYWORDS=1
HIREINTEL_MAX_JOBS_PER_KEYWORD=1
HIREINTEL_DRY_RUN=false
HIREINTEL_INCLUDE_DESCRIPTION=true
HIREINTEL_SAVE_TO_DATABASE=true
HIREINTEL_SEND_EMAIL_REPORT=true
HIREINTEL_TIMEOUT_SECS=300
HIREINTEL_MAX_TOTAL_CHARGE_USD=0.50

Never paste actual secrets into the README.

38. Local Tests
Keyword configuration

Check syntax:

node --check src/config/keywords.js

Check keyword count:

node -e "const {ALL_KEYWORDS}=require('./src/config/keywords'); console.log('Total normalized keywords:', ALL_KEYWORDS.length);"

Expected:

Total normalized keywords: 90
Actor configuration
node --check src/apify/actors.js

Check enabled Actors:

node -e "const { ACTORS, getEnabledActors } = require('./src/apify/actors'); console.log('Actors:', Object.keys(ACTORS)); console.log('Enabled:', getEnabledActors().map(a => ({ key:a.key, actorId:a.actorId })));"

Expected:

Actors:
[ 'naukri', 'linkedin' ]
39. Job Pipeline Test

Run:

node test/jobPipelineTest.js

This validates the production pipeline including:

Naukri
LinkedIn
Validation
Normalization
Experience extraction
Skill extraction
Deduplication
Supabase interaction

Important:

This test can perform real Apify executions depending on the current environment configuration.

Keep:

HIREINTEL_MAX_KEYWORDS=1
HIREINTEL_MAX_JOBS_PER_KEYWORD=1

while testing to control cost.

40. LinkedIn Test

The LinkedIn-specific test is:

node test/linkedinTest.js

This is useful for checking the LinkedIn scraper output independently from the full pipeline.

41. Gmail OAuth

Google OAuth setup/testing is handled through:

node test/gmailOAuth.js

The refresh token should be stored securely.

Do not commit:

.gmail-refresh-token
42. Gmail Send Test

Test Gmail reporting using:

node test/gmailSendTest.js

This validates the Gmail API integration without requiring a complete production scraping run.

Avoid running the full production workflow solely to test email.

43. Running HireIntel

The main application entry point is:

node src/index.js

The controlled production-style configuration is:

HIREINTEL_MAX_KEYWORDS=1
HIREINTEL_MAX_JOBS_PER_KEYWORD=1
HIREINTEL_DRY_RUN=false
HIREINTEL_SAVE_TO_DATABASE=true
HIREINTEL_SEND_EMAIL_REPORT=true

Before increasing keyword coverage, review:

Apify monthly budget
Actor pricing
Number of returned jobs
Valid job percentage
Duplicate percentage
Runtime
Data quality
44. Dry Run

Dry-run mode:

HIREINTEL_DRY_RUN=true

Dry run is intended to test control flow without performing production actions.

Production mode:

HIREINTEL_DRY_RUN=false
45. Production Scaling Strategy

The current 90-keyword configuration should not automatically be interpreted as:

90 keywords every run

The actual production run is deliberately limited.

Current:

90 configured
1 processed per run

The keyword count should be increased gradually.

A recommended progression is:

1 keyword
   ↓
2-5 keywords
   ↓
10 keywords
   ↓
25 keywords
   ↓
50 keywords
   ↓
90 keywords

Each stage should be evaluated for:

Cost
Volume
Quality
Duplicates
Runtime

Only increase the next level after reviewing the previous run.

46. Apify Actor Evaluation Strategy

Before replacing the current Actors, conduct a controlled comparison.

Use the same:

Keyword
Location
Maximum jobs
Description requirement

for each Actor.

Compare:

1. Total jobs returned
2. Valid jobs
3. Duplicate jobs
4. Full descriptions
5. Experience extraction quality
6. Skills
7. Salary
8. Work mode
9. Recruiter information
10. Runtime
11. Actual Apify cost
12. Failure rate

The cheapest Actor is not automatically the best Actor.

The selected production Actor should provide an acceptable balance between:

Cost
+
Data quality
+
Reliability
+
Coverage
47. Additional Job Sources

Additional sources are not currently enabled.

The intended process for adding a source is:

1. Evaluate source
2. Evaluate scraper/Apify Actor
3. Test source output
4. Add source configuration
5. Add source scraper
6. Map fields
7. Run through common normalization
8. Test experience extraction
9. Test skill/domain extraction
10. Test deduplication
11. Validate Supabase persistence
12. Validate reporting
13. Enable gradually

The current production sources remain:

Naukri
LinkedIn
48. Security

Sensitive credentials must never be committed.

Do not commit:

.env
google-oauth-client.json
.gmail-refresh-token
Supabase service-role keys
Apify API tokens
Google refresh tokens
GitHub personal access tokens

Credentials should be stored using appropriate secret-management mechanisms.

If a credential is accidentally exposed:

1. Revoke it
2. Generate a replacement
3. Update the relevant secret
4. Verify the integration

Never put credentials into:

GitHub repository files
URLs
README files
screenshots
public logs
source code
49. Git Hygiene

Before committing changes:

git status --short

Review the exact changes:

git diff

Check whitespace/errors:

git diff --check

Then commit only the intended files.

Example:

git add README.md
git commit -m "Update HireIntel documentation"
git push origin main

Before pushing production code changes, always review:

git diff
50. Reports Directory

Generated daily CSV files are stored under:

reports/

Example:

reports/hireintel_new_jobs_2026-09-10.csv

The directory is intended for generated reports and should not be used for credentials or permanent application configuration.

51. Package Configuration

HireIntel uses:

Node.js
CommonJS

The project uses:

"type": "commonjs"

The main entry point is:

src/index.js

Dependencies include:

@supabase/supabase-js
axios
cheerio
dotenv
googleapis
nodemailer

Dependency cleanup is planned separately so that unused packages can be verified before removal.

52. Error Categories

HireIntel tracks different outcomes separately.

Typical outcomes include:

successful source
failed source
raw jobs
processed jobs
invalid jobs
processing failures
created jobs
duplicates
failed database saves

This makes it possible to distinguish:

Source returned bad data

from:

Pipeline processing failed

and:

Database insertion failed
53. Troubleshooting
No jobs created

Check:

1. Source returned valid jobs
2. Jobs are not already in Supabase
3. Unique-key generation
4. Apify Actor output
5. Supabase credentials

A run returning:

created = 0
duplicates > 0

does not necessarily indicate a failure.

It can simply mean all discovered jobs already exist.

No CSV

A CSV is only generated when:

created > 0

If:

created = 0

then no CSV is expected.

The email should still be sent.

Gmail failure

Check:

GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REFRESH_TOKEN
GMAIL_FROM
GMAIL_TO

If OAuth returns:

invalid_grant

the refresh token may need to be regenerated.

Apify budget failure

Check:

APIFY_MONTHLY_LIMIT_NAUKRI_USD
APIFY_MONTHLY_LIMIT_LINKEDIN_USD

and the persistent budget status in Supabase.

Do not increase the monthly limit simply to bypass a failed run without first checking why the budget was consumed.

GitHub Actions failure

Check:

GitHub Actions
→ HireIntel Daily Job Sourcing
→ Failed run
→ Logs

Verify:

Repository secrets
Node.js setup
npm installation
Apify credentials
Supabase credentials
Gmail credentials
54. Current Production Flow

The current validated flow is:

Keyword
   |
   v
Naukri
   |
   +------------------+
                      |
Keyword               |
   |                  |
   v                  |
LinkedIn              |
   |                  |
   +--------+---------+
            |
            v
        Validation
            |
            v
       Normalization
            |
            v
    Experience Extraction
            |
            v
      Skill Extraction
            |
            v
      Domain Extraction
            |
            v
       Deduplication
            |
            v
         Supabase
            |
            v
     New Job Detection
            |
       +----+----+
       |         |
       v         v
     CSV       No CSV
       |         |
       +----+----+
            |
            v
        Gmail API
            |
            v
       Daily Report
55. What Has Been Validated

The following components have been tested:

 Naukri scraper
 LinkedIn scraper
 Naukri + LinkedIn pipeline
 Source validation
 Job normalization
 Experience extraction from source fields
 Experience extraction from job descriptions
 Skill extraction
 Domain extraction
 Deduplication
 Supabase persistence
 Genuine-new-job detection
 Persistent Apify budget tracking
 Gmail OAuth
 Gmail API email sending
 Daily CSV generation
 No-new-job email behavior
 GitHub Actions execution
 Node.js 24 GitHub Actions environment
 Controlled production run
56. Current Limitations

The following limitations are intentionally known:

Keyword coverage

Only a controlled subset of the 90 keywords is currently processed per run.

Apify cost

The current Actors are being evaluated for cost and output quality.

Recruiter information

Recruiter data is only available when explicitly exposed by the source/Actor.

GitHub scheduling

GitHub's native scheduled trigger is currently disabled.

External scheduler

An external scheduler is required to provide automatic daily triggering.

Enrichment

Company and hiring-partner enrichment modules exist but are not yet the primary focus of the production pipeline.

Additional sources

Only Naukri and LinkedIn are currently active.

57. Roadmap
Immediate
 Stabilize Naukri sourcing
 Stabilize LinkedIn sourcing
 Normalize 90 role keywords
 Validate job processing
 Validate experience extraction
 Validate skill/domain extraction
 Validate deduplication
 Validate Supabase
 Add persistent Apify budget protection
 Add Gmail API
 Add CSV reporting
 Add genuine-new-job reporting
 Validate GitHub Actions
 Remove unused legacy scrapers
 Complete external scheduler setup
 Evaluate cheaper Naukri Actors
 Evaluate cheaper LinkedIn Actors
 Compare Actor quality and cost
 Gradually increase keyword coverage
Medium term
 Improve source-specific field mapping
 Improve recruiter-data coverage
 Activate company enrichment
 Activate hiring-partner enrichment
 Improve company identification
 Improve job classification
 Add more automated quality checks
Long term
 Add additional job sources
 Add company intelligence
 Add recruiter intelligence based on public information
 Add analytics/dashboard layer
 Add historical job trends
 Add job-market insights
 Add candidate/job matching
 Add automated monitoring and alerts
58. Design Principles

HireIntel is built around the following principles.

1. Search broadly

Use role-oriented keywords rather than creating unnecessary experience-specific searches.

2. Normalize centrally

Different job sources should produce a common normalized job structure.

3. Persist before reporting

A job should be considered genuinely new only after successful database insertion.

4. Never repeatedly report duplicates

Existing jobs should not be sent again simply because the scraper discovers them again.

5. Protect the Apify budget

Scraping should be controlled through:

Keyword limits
Job limits
Per-run charge limits
Persistent monthly budget tracking
6. Validate before scaling

Large scraping runs should only happen after controlled testing.

7. Do not infer private information

Recruiter information should only come from legitimate publicly exposed source data.

8. Keep source-specific code isolated

Adding a new source should not require rebuilding the complete processing pipeline.

59. Current Production Architecture Summary
                    HireIntel
                        |
             +----------+----------+
             |                     |
          Naukri                LinkedIn
             |                     |
             +----------+----------+
                        |
                    Processing
                        |
          +-------------+-------------+
          |             |             |
      Normalize     Experience     Skills
          |             |             |
          +-------------+-------------+
                        |
                      Domain
                        |
                   Deduplication
                        |
                     Supabase
                        |
              Genuine New Jobs
                        |
              +---------+---------+
              |                   |
             CSV               No CSV
              |                   |
              +---------+---------+
                        |
                    Gmail API
                        |
                    Daily Email
60. Final Status

HireIntel currently has a functioning controlled production pipeline for:

Naukri
+
LinkedIn
      ↓
Job Processing
      ↓
Supabase
      ↓
Genuine New Job Detection
      ↓
CSV
      ↓
Gmail API
      ↓
GitHub Actions

The repository contains:

90 role keywords
2 active job sources
1 common processing pipeline
1 persistent database
1 budget-protection layer
1 CSV reporting layer
1 Gmail reporting layer
1 GitHub Actions workflow

The next major operational priorities are:

1. Complete external scheduler
2. Evaluate cheaper Apify Actors
3. Compare actual cost and output quality
4. Increase keyword coverage gradually
5. Improve enrichment and recruiter intelligence
6. Expand into broader job intelligence

The project should remain in controlled execution until the cost and quality of larger-scale scraping have been validated.
