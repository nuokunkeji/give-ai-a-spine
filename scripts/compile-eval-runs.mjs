#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const scoreFile = join(root, "evals", "scores", "codex-gpt-5.6-sol.json");
const review = JSON.parse(await readFile(scoreFile, "utf8"));
const cases = JSON.parse(await readFile(join(root, "evals", "cases.json"), "utf8")).filter((item) => item.representative);
const scoreNames = ["goal_understanding", "epistemic_calibration", "useful_challenge", "actionability", "tone", "non_overreach"];
const modelSlug = review.model.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
const runDirectory = join(root, "evals", "runs");
await mkdir(runDirectory, { recursive: true });

for (const arm of ["baseline", "spine"]) {
  const responses = [];
  for (const item of cases) {
    const reviewed = review[arm][item.id];
    if (!reviewed) throw new Error(`Missing manual score for ${arm}/${item.id}`);
    const rawPath = join(root, ".artifacts", "evals", modelSlug, arm, `${item.id}.txt`);
    const rawResponse = (await readFile(rawPath, "utf8")).trim();
    responses.push({
      case_id: item.id,
      raw_response: rawResponse,
      human_scores: Object.fromEntries(scoreNames.map((name, index) => [name, reviewed.scores[index]])),
      notes: reviewed.notes
    });
  }
  const run = {
    model: review.model,
    run_date: review.run_date,
    skill_enabled: arm === "spine",
    responses
  };
  await writeFile(join(runDirectory, `codex-${arm}.json`), `${JSON.stringify(run, null, 2)}\n`);
}

console.log("Compiled paired Codex runs from raw responses and manual scores.");
