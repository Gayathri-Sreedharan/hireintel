const fs = require("fs");
const http = require("http");
const path = require("path");
const { google } = require("googleapis");

const CLIENT_FILE = path.join(__dirname, "..", "google-oauth-client.json");
const TOKEN_FILE = path.join(__dirname, "..", ".gmail-refresh-token");

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send"
];

const host = "127.0.0.1";
const port = 3000;
const callbackPath = "/oauth2callback";

const redirectUri =
  "http://" + host + ":" + port + callbackPath;

function loadClientCredentials() {
  if (!fs.existsSync(CLIENT_FILE)) {
    throw new Error(
      "google-oauth-client.json was not found in the HireIntel project folder."
    );
  }

  const credentials = JSON.parse(
    fs.readFileSync(CLIENT_FILE, "utf8")
  );

  const installed = credentials.installed || credentials.web;

  if (!installed) {
    throw new Error(
      "Could not find OAuth client credentials in google-oauth-client.json."
    );
  }

  if (!installed.client_id || !installed.client_secret) {
    throw new Error(
      "OAuth client ID or client secret is missing from google-oauth-client.json."
    );
  }

  return {
    clientId: installed.client_id,
    clientSecret: installed.client_secret
  };
}

async function main() {
  try {
    const { clientId, clientSecret } = loadClientCredentials();

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    const authorizationUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: SCOPES
    });

    console.log("");
    console.log("==============================================");
    console.log("HIREINTEL GMAIL AUTHORIZATION");
    console.log("==============================================");
    console.log("");
    console.log("Open this URL in your browser:");
    console.log("");
    console.log(authorizationUrl);
    console.log("");
    console.log("Waiting for authorization...");
    console.log("");

    const server = http.createServer(async (req, res) => {
      try {
        const requestUrl = new URL(
          req.url,
          "http://" + host + ":" + port
        );

        if (requestUrl.pathname !== callbackPath) {
          res.writeHead(404);
          res.end("Not found");
          return;
        }

        const code = requestUrl.searchParams.get("code");
        const error = requestUrl.searchParams.get("error");

        if (error) {
          res.writeHead(400, {
            "Content-Type": "text/html; charset=utf-8"
          });

          res.end(
            "<h2>HireIntel Gmail authorization failed.</h2>" +
            "<p>You can close this browser window.</p>"
          );

          console.error("");
          console.error("AUTHORIZATION FAILED");
          console.error("Google returned:", error);

          server.close();
          return;
        }

        if (!code) {
          res.writeHead(400, {
            "Content-Type": "text/html; charset=utf-8"
          });

          res.end(
            "<h2>No authorization code received.</h2>" +
            "<p>You can close this browser window.</p>"
          );

          return;
        }

        const { tokens } = await oauth2Client.getToken(code);

        if (!tokens.refresh_token) {
          throw new Error(
            "Google did not return a refresh token. Please run the authorization again with consent."
          );
        }

        fs.writeFileSync(
          TOKEN_FILE,
          tokens.refresh_token + "\n",
          {
            encoding: "utf8",
            mode: 0o600
          }
        );

        res.writeHead(200, {
          "Content-Type": "text/html; charset=utf-8"
        });

        res.end(
          "<h2>HireIntel Gmail authorization successful.</h2>" +
          "<p>You can close this browser window.</p>"
        );

        console.log("");
        console.log("==============================================");
        console.log("AUTHORIZATION SUCCESSFUL");
        console.log("==============================================");
        console.log("");
        console.log("Refresh token saved securely on this Mac.");
        console.log("");
        console.log("Token file:");
        console.log(".gmail-refresh-token");
        console.log("");
        console.log("The token was NOT displayed.");
        console.log("");

        server.close();
      } catch (error) {
        console.error("");
        console.error("AUTHORIZATION ERROR");
        console.error("==============================================");
        console.error(error.message);

        res.writeHead(500, {
          "Content-Type": "text/html; charset=utf-8"
        });

        res.end(
          "<h2>HireIntel Gmail authorization failed.</h2>" +
          "<p>Check the Terminal for the error.</p>"
        );

        server.close();
      }
    });

    server.listen(port, host, () => {
      console.log(
        "Local callback server listening on " +
        redirectUri
      );
      console.log("");
      console.log(
        "Open the authorization URL above in your browser."
      );
    });

    server.on("error", (error) => {
      console.error("");
      console.error("LOCAL SERVER ERROR");
      console.error("==============================================");

      if (error.code === "EADDRINUSE") {
        console.error(
          "Port 3000 is already in use."
        );
        console.error(
          "Stop the existing process and run this script again."
        );
      } else {
        console.error(error.message);
      }

      process.exitCode = 1;
    });
  } catch (error) {
    console.error("");
    console.error("GMAIL OAUTH SETUP FAILED");
    console.error("==============================================");
    console.error(error.message);
    process.exitCode = 1;
  }
}

main();
