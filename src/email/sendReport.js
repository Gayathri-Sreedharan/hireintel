const { google } = require("googleapis");

function getEmailConfig() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN || "",
    from: process.env.GMAIL_FROM || "",
    to: process.env.GMAIL_TO || "",

    // Optional. Several addresses can be separated by commas.
    cc: process.env.GMAIL_CC || "",
    bcc: process.env.GMAIL_BCC || ""
  };
}

/**
 * Clean a list of recipients such as
 *   "a@x.com, b@y.com; c@z.com"
 * into "a@x.com, b@y.com, c@z.com".
 * Invalid entries are skipped with a warning.
 */
function normalizeRecipients(value, label = "recipient") {
  const emailPattern = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/;

  const valid = [];

  String(value ?? "")
    .split(/[,;]/)
    .map((item) => item.replace(/[\r\n]/g, " ").trim())
    .filter(Boolean)
    .forEach((item) => {
      if (emailPattern.test(item)) {
        valid.push(item);
      } else {
        console.warn(
          `WARNING: Ignoring invalid ${label} address: ${item}`
        );
      }
    });

  return valid.join(", ");
}

function validateEmailConfig(config = getEmailConfig()) {
  const missing = [];

  if (!config.clientId) {
    missing.push("GOOGLE_CLIENT_ID");
  }

  if (!config.clientSecret) {
    missing.push("GOOGLE_CLIENT_SECRET");
  }

  if (!config.refreshToken) {
    missing.push("GOOGLE_REFRESH_TOKEN");
  }

  if (!config.from) {
    missing.push("GMAIL_FROM");
  }

  if (!config.to) {
    missing.push("GMAIL_TO");
  }

  return {
    valid: missing.length === 0,
    missing
  };
}

function createGmailClient(config = getEmailConfig()) {
  const oauth2Client = new google.auth.OAuth2(
    config.clientId,
    config.clientSecret
  );

  oauth2Client.setCredentials({
    refresh_token: config.refreshToken
  });

  return google.gmail({
    version: "v1",
    auth: oauth2Client
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(value) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function createHtmlReport(report = {}) {
  const summary = report.summary || {};

  const newJobs = Array.isArray(report.newJobs)
    ? report.newJobs
    : [];

  const jobRows = newJobs.length
    ? newJobs
        .map(
          (job) => `
            <tr>
              <td>${escapeHtml(job.title || "")}</td>
              <td>${escapeHtml(job.company || "")}</td>
              <td>${escapeHtml(job.location || "")}</td>
              <td>${escapeHtml(job.source || "")}</td>
              <td>${escapeHtml(
                formatDate(job.posted_date || job.postedDate)
              )}</td>
              <td>
                ${
                  job.job_url
                    ? `<a href="${escapeHtml(
                        job.job_url
                      )}">View Job</a>`
                    : "N/A"
                }
              </td>
            </tr>
          `
        )
        .join("")
    : `
        <tr>
          <td colspan="6">No new jobs were added in this run.</td>
        </tr>
      `;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>HireIntel Job Report</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.5;
      color: #222;
      margin: 0;
      padding: 24px;
      background: #f5f5f5;
    }

    .container {
      max-width: 1100px;
      margin: 0 auto;
      background: #ffffff;
      padding: 24px;
      border-radius: 8px;
    }

    h1 {
      margin-top: 0;
    }

    .summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin: 20px 0;
    }

    .card {
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 14px;
      text-align: center;
    }

    .number {
      font-size: 24px;
      font-weight: bold;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
    }

    th,
    td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
      vertical-align: top;
    }

    th {
      background: #f0f0f0;
    }

    .footer {
      margin-top: 24px;
      color: #666;
      font-size: 12px;
    }
  </style>
</head>

<body>
  <div class="container">
    <h1>HireIntel Daily Job Report</h1>

    <p>
      Automated job sourcing report for
      <strong>${escapeHtml(
        report.reportDate || formatDate(new Date())
      )}</strong>.
    </p>

    <div class="summary">
      <div class="card">
        <div>Total Keywords</div>
        <div class="number">${escapeHtml(
          summary.totalKeywords || 0
        )}</div>
      </div>

      <div class="card">
        <div>Raw Jobs</div>
        <div class="number">${escapeHtml(
          summary.rawJobs || 0
        )}</div>
      </div>

      <div class="card">
        <div>New Jobs</div>
        <div class="number">${escapeHtml(
          summary.newJobs || 0
        )}</div>
      </div>

      <div class="card">
        <div>Duplicates</div>
        <div class="number">${escapeHtml(
          summary.duplicates || 0
        )}</div>
      </div>
    </div>

    <h2>Run Summary</h2>

    <ul>
      <li>Keywords processed: ${escapeHtml(
        summary.keywordsProcessed || 0
      )}</li>
      <li>Sources processed: ${escapeHtml(
        summary.sourcesProcessed || 0
      )}</li>
      <li>Successful sources: ${escapeHtml(
        summary.successfulSources || 0
      )}</li>
      <li>Failed sources: ${escapeHtml(
        summary.failedSources || 0
      )}</li>
      <li>Raw jobs: ${escapeHtml(
        summary.rawJobs || 0
      )}</li>
      <li>Processed jobs: ${escapeHtml(
        summary.processedJobs || 0
      )}</li>
      <li>Invalid jobs: ${escapeHtml(
        summary.skippedInvalid || 0
      )}</li>
      <li>Processing failures: ${escapeHtml(
        summary.processingFailures || 0
      )}</li>
      <li>New jobs saved: ${escapeHtml(
        summary.newJobs || 0
      )}</li>
      <li>Duplicate jobs: ${escapeHtml(
        summary.duplicates || 0
      )}</li>
      <li>Failed saves: ${escapeHtml(
        summary.failed || 0
      )}</li>
    </ul>

    <h2>New Jobs</h2>

    <table>
      <thead>
        <tr>
          <th>Title</th>
          <th>Company</th>
          <th>Location</th>
          <th>Source</th>
          <th>Posted</th>
          <th>Link</th>
        </tr>
      </thead>

      <tbody>
        ${jobRows}
      </tbody>
    </table>

    ${
      newJobs.length
        ? `
          <p>
            <strong>${escapeHtml(
              newJobs.length
            )}</strong> new job(s) were found and are included
            in the attached CSV file.
          </p>
        `
        : `
          <p>
            <strong>No new jobs were found today.</strong>
          </p>
        `
    }

    <div class="footer">
      Generated automatically by HireIntel.
    </div>
  </div>
</body>
</html>
`;
}

function createTextReport(report = {}) {
  const summary = report.summary || {};

  const newJobs = Array.isArray(report.newJobs)
    ? report.newJobs
    : [];

  const lines = [
    "HireIntel Daily Job Report",
    "==========================",
    "",
    `Report date: ${
      report.reportDate || formatDate(new Date())
    }`,
    "",
    `Keywords processed: ${summary.keywordsProcessed || 0}`,
    `Sources processed: ${summary.sourcesProcessed || 0}`,
    `Successful sources: ${summary.successfulSources || 0}`,
    `Failed sources: ${summary.failedSources || 0}`,
    `Raw jobs: ${summary.rawJobs || 0}`,
    `Processed jobs: ${summary.processedJobs || 0}`,
    `Invalid jobs: ${summary.skippedInvalid || 0}`,
    `Processing failures: ${
      summary.processingFailures || 0
    }`,
    `New jobs saved: ${summary.newJobs || 0}`,
    `Duplicates: ${summary.duplicates || 0}`,
    `Failed saves: ${summary.failed || 0}`,
    "",
    "New Jobs",
    "--------"
  ];

  if (!newJobs.length) {
    lines.push("No new jobs were found today.");
  } else {
    newJobs.forEach((job, index) => {
      lines.push("");
      lines.push(
        `${index + 1}. ${job.title || "Untitled"}`
      );
      lines.push(
        `   Company: ${job.company || "N/A"}`
      );
      lines.push(
        `   Location: ${job.location || "N/A"}`
      );
      lines.push(
        `   Source: ${job.source || "N/A"}`
      );
      lines.push(
        `   Posted: ${
          job.posted_date || job.postedDate || "N/A"
        }`
      );
      lines.push(
        `   URL: ${job.job_url || "N/A"}`
      );
    });
  }

  if (report.csvAttachment?.filename) {
    lines.push("");
    lines.push(
      `CSV attachment: ${report.csvAttachment.filename}`
    );
  }

  return lines.join("\n");
}

function encodeBase64Url(value) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function encodeBase64(value) {
  return Buffer.from(value).toString("base64");
}

function sanitizeHeader(value) {
  return String(value ?? "")
    .replace(/[\r\n]/g, " ")
    .trim();
}

function createRawEmail({
  from,
  to,
  cc = "",
  bcc = "",
  subject,
  text,
  html,
  csvAttachment = null
}) {
  const mixedBoundary = "HireIntelMixedBoundary";
  const alternativeBoundary = "HireIntelAlternativeBoundary";

  const hasAttachment =
    csvAttachment &&
    csvAttachment.filename &&
    csvAttachment.content !== undefined &&
    csvAttachment.content !== null;

  const safeFrom = sanitizeHeader(from);
  const safeTo = sanitizeHeader(to);
  const safeSubject = sanitizeHeader(subject);

  const safeCc = normalizeRecipients(cc, "CC");
  const safeBcc = normalizeRecipients(bcc, "BCC");

  const parts = [
    `From: ${safeFrom}`,
    `To: ${safeTo}`
  ];

  if (safeCc) {
    parts.push(`Cc: ${safeCc}`);
  }

  // Gmail removes the Bcc header before delivery, so BCC
  // recipients receive the mail but are not visible to others.
  if (safeBcc) {
    parts.push(`Bcc: ${safeBcc}`);
  }

  parts.push(`Subject: ${safeSubject}`);
  parts.push("MIME-Version: 1.0");

  if (hasAttachment) {
    parts.push(
      `Content-Type: multipart/mixed; boundary="${mixedBoundary}"`
    );
    parts.push("");
    parts.push(`--${mixedBoundary}`);
    parts.push(
      `Content-Type: multipart/alternative; boundary="${alternativeBoundary}"`
    );
    parts.push("");
  } else {
    parts.push(
      `Content-Type: multipart/alternative; boundary="${alternativeBoundary}"`
    );
    parts.push("");
  }

  parts.push(`--${alternativeBoundary}`);
  parts.push("Content-Type: text/plain; charset=UTF-8");
  parts.push("Content-Transfer-Encoding: 8bit");
  parts.push("");
  parts.push(text);
  parts.push("");

  parts.push(`--${alternativeBoundary}`);
  parts.push("Content-Type: text/html; charset=UTF-8");
  parts.push("Content-Transfer-Encoding: 8bit");
  parts.push("");
  parts.push(html);
  parts.push("");

  parts.push(`--${alternativeBoundary}--`);

  if (hasAttachment) {
    const filename = String(csvAttachment.filename)
      .replace(/[\r\n"]/g, "_");

    const attachmentContent = Buffer.isBuffer(
      csvAttachment.content
    )
      ? csvAttachment.content
      : Buffer.from(String(csvAttachment.content), "utf8");

    const attachmentBase64 = encodeBase64(
      attachmentContent
    );

    const wrappedBase64 = attachmentBase64.match(
      /.{1,76}/g
    ) || [];

    parts.push("");
    parts.push(`--${mixedBoundary}`);
    parts.push(
      `Content-Type: text/csv; name="${filename}"`
    );
    parts.push(
      `Content-Disposition: attachment; filename="${filename}"`
    );
    parts.push(
      "Content-Transfer-Encoding: base64"
    );
    parts.push("");
    parts.push(wrappedBase64.join("\r\n"));
    parts.push("");
    parts.push(`--${mixedBoundary}--`);
  }

  return encodeBase64Url(
    parts.join("\r\n")
  );
}

async function sendReport(report = {}) {
  const config = getEmailConfig();

  const validation = validateEmailConfig(config);

  if (!validation.valid) {
    throw new Error(
      `Gmail email configuration missing: ${validation.missing.join(
        ", "
      )}`
    );
  }

  const gmail = createGmailClient(config);

  const subject =
    report.subject ||
    `HireIntel Daily Job Report - ${
      report.summary?.newJobs || 0
    } New Jobs`;

  const html = createHtmlReport(report);
  const text = createTextReport(report);

  const raw = createRawEmail({
    from: config.from,
    to: config.to,
    cc: config.cc,
    bcc: config.bcc,
    subject,
    text,
    html,
    csvAttachment: report.csvAttachment || null
  });

  const response = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw
    }
  });

  return {
    success: true,
    messageId: response.data.id || null,
    threadId: response.data.threadId || null,
    attachment:
      report.csvAttachment?.filename || null
  };
}

module.exports = {
  getEmailConfig,
  validateEmailConfig,
  createGmailClient,
  createHtmlReport,
  createTextReport,
  createRawEmail,
  sendReport
};
