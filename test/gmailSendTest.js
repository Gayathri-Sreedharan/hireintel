require("dotenv").config({ override: true });

const {
  sendReport
} = require("../src/email/sendReport");

async function main() {
  try {
    console.log("");
    console.log("==============================================");
    console.log("HIREINTEL GMAIL API TEST");
    console.log("==============================================");
    console.log("");

    const result = await sendReport({
      subject: "HireIntel Gmail API Test",
      summary: {
        totalKeywords: 1,
        keywordsProcessed: 1,
        sourcesProcessed: 2,
        successfulSources: 2,
        failedSources: 0,
        rawJobs: 2,
        processedJobs: 2,
        skippedInvalid: 0,
        processingFailures: 0,
        newJobs: 1,
        duplicates: 1,
        failed: 0
      },
      newJobs: [
        {
          title: "Gmail API Test Job",
          company: "HireIntel",
          location: "India",
          source: "Test",
          posted_date: new Date().toISOString(),
          job_url: "https://example.com"
        }
      ]
    });

    console.log("");
    console.log("EMAIL SENT SUCCESSFULLY");
    console.log("==============================================");
    console.log("");
    console.log("Gmail API accepted the message.");
    console.log("Message ID received:", result.messageId ? "YES" : "NO");
    console.log("");
    console.log("Check your Gmail inbox for:");
    console.log("HireIntel Gmail API Test");
    console.log("");
  } catch (error) {
    console.error("");
    console.error("GMAIL TEST FAILED");
    console.error("==============================================");
    console.error(error.message);

    if (error.response?.data) {
      console.error("");
      console.error(
        JSON.stringify(error.response.data, null, 2)
      );
    }

    process.exitCode = 1;
  }
}

main();
