#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cases = JSON.parse(readFileSync(join(root, "evals", "cases.json"), "utf8"));
const baseline = JSON.parse(readFileSync(join(root, "evals", "runs", "codex-baseline.json"), "utf8"));
const spine = JSON.parse(readFileSync(join(root, "evals", "runs", "codex-spine.json"), "utf8"));
const byId = new Map(cases.map((item) => [item.id, item]));
const maxPerResponse = 24;

function score(response) {
  return Object.values(response.human_scores).reduce((total, value) => total + value, 0) / maxPerResponse * 100;
}

function importantAverage(run) {
  const responses = run.responses.filter((response) => byId.get(response.case_id).category !== "simple_request");
  return responses.reduce((total, response) => total + score(response), 0) / responses.length;
}

function contentLength(text) {
  return text.trim().split(/\s+/u).filter(Boolean).length;
}

const baselineImportant = importantAverage(baseline);
const spineImportant = importantAverage(spine);
const improvement = spineImportant - baselineImportant;

const baselineById = new Map(baseline.responses.map((response) => [response.case_id, response]));
const simpleRatios = spine.responses
  .filter((response) => byId.get(response.case_id).category === "simple_request")
  .map((response) => {
    const baseLength = Math.max(1, contentLength(baselineById.get(response.case_id).raw_response));
    return { caseId: response.case_id, ratio: contentLength(response.raw_response) / baseLength };
  });

console.log(`Important cases: ${baselineImportant.toFixed(1)}% -> ${spineImportant.toFixed(1)}% (${improvement.toFixed(1)} pp)`);
for (const item of simpleRatios) console.log(`Simple-case length ${item.caseId}: ${item.ratio.toFixed(2)}x baseline`);

assert.ok(improvement >= 25, `Expected at least 25 percentage points improvement, got ${improvement.toFixed(1)}`);
for (const item of simpleRatios) assert.ok(item.ratio <= 1.2, `${item.caseId} exceeded 1.2x baseline length`);

console.log("Evaluation acceptance thresholds passed.");
