const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const APIFY_TOKEN = process.env.APIFY_TOKEN;

if (!APIFY_TOKEN) {
  throw new Error("Missing APIFY_TOKEN in .env");
}

const APIFY_BASE_URL = "https://api.apify.com/v2";

const apifyClient = axios.create({
  baseURL: APIFY_BASE_URL,
  timeout: 180000,
  headers: {
    Authorization: `Bearer ${APIFY_TOKEN}`,
    "Content-Type": "application/json"
  }
});

/**
 * Get Actor metadata.
 */
async function getActorInfo(actorId) {
  if (!actorId) {
    throw new Error("Actor ID is required");
  }

  const response = await apifyClient.get(
    `/acts/${encodeURIComponent(actorId)}`
  );

  return response.data;
}

/**
 * Start an Actor run.
 *
 * We use the asynchronous endpoint here so that we can
 * inspect the run and dataset separately.
 */
async function startActor({
  actorId,
  input = {},
  timeoutSecs = 300,
  maxTotalChargeUsd = null
}) {
  if (!actorId) {
    throw new Error("Actor ID is required");
  }

  const params = {
    timeout: timeoutSecs
  };

  if (maxTotalChargeUsd !== null) {
    params.maxTotalChargeUsd = maxTotalChargeUsd;
  }

  const response = await apifyClient.post(
    `/acts/${encodeURIComponent(actorId)}/runs`,
    input,
    {
      params
    }
  );

  return response.data;
}

/**
 * Get the current status/details of an Actor run.
 */
async function getRun(runId) {
  if (!runId) {
    throw new Error("Run ID is required");
  }

  const response = await apifyClient.get(
    `/actor-runs/${encodeURIComponent(runId)}`
  );

  return response.data;
}

/**
 * Get dataset items.
 */
async function getDatasetItems(datasetId, options = {}) {
  if (!datasetId) {
    throw new Error("Dataset ID is required");
  }

  const response = await apifyClient.get(
    `/datasets/${encodeURIComponent(datasetId)}/items`,
    {
      params: {
        format: "json",
        ...options
      }
    }
  );

  return Array.isArray(response.data)
    ? response.data
    : [];
}

/**
 * Run an Actor and wait until completion.
 *
 * Returns:
 * {
 *   run,
 *   items
 * }
 */
async function runActorAndGetItems({
  actorId,
  input = {},
  timeoutSecs = 300,
  maxTotalChargeUsd = null,
  pollIntervalMs = 3000
}) {
  const startResponse = await startActor({
    actorId,
    input,
    timeoutSecs,
    maxTotalChargeUsd
  });

  const initialRun = startResponse.data;

  if (!initialRun?.id) {
    throw new Error(
      "Apify did not return a run ID"
    );
  }

  const runId = initialRun.id;

  console.log(`Apify Run ID: ${runId}`);

  const startTime = Date.now();
  const maxWaitMs = timeoutSecs * 1000;

  let currentRun = initialRun;

  while (true) {
    const status = currentRun.status;

    console.log(`Apify status: ${status}`);

    if (
      [
        "SUCCEEDED",
        "FAILED",
        "ABORTED",
        "TIMED-OUT"
      ].includes(status)
    ) {
      break;
    }

    if (Date.now() - startTime >= maxWaitMs) {
      throw new Error(
        `Apify Actor timed out after ${timeoutSecs} seconds. Run ID: ${runId}`
      );
    }

    await new Promise(resolve =>
      setTimeout(resolve, pollIntervalMs)
    );

    const runResponse = await getRun(runId);

    currentRun = runResponse.data;
  }

  if (currentRun.status !== "SUCCEEDED") {
    throw new Error(
      `Apify Actor run did not succeed. ` +
      `Status: ${currentRun.status}, ` +
      `Run ID: ${runId}`
    );
  }

  let items = [];

  if (currentRun.defaultDatasetId) {
    items = await getDatasetItems(
      currentRun.defaultDatasetId
    );
  }

  return {
    run: currentRun,
    items
  };
}

module.exports = {
  apifyClient,
  getActorInfo,
  startActor,
  runActor: startActor,
  getRun,
  getDatasetItems,
  runActorAndGetItems
};
