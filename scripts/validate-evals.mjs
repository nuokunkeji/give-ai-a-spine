#!/usr/bin/env node

import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cases = JSON.parse(readFileSync(join(root, "evals", "cases.json"), "utf8"));
const categories = new Set(["product_decision", "technical_plan", "personal_action", "high_risk_fact", "emotional_expression", "symbolic_expression", "simple_request"]);

assert.equal(cases.length, 24, "Expected exactly 24 evaluation cases");
assert.equal(new Set(cases.map((item) => item.id)).size, cases.length, "Case IDs must be unique");
assert.equal(cases.filter((item) => item.representative).length, 12, "Expected 12 representative cases");
for (const item of cases) {
  assert.match(item.id, /^[a-z][0-9]{2}$/);
  assert.ok(categories.has(item.category), `Unknown category: ${item.category}`);
  assert.ok(["low", "medium", "high"].includes(item.risk));
  assert.ok(["light", "standard", "audit"].includes(item.mode));
  assert.ok(item.scenario.length >= 10);
  assert.ok(item.must_behaviors.length > 0);
  assert.ok(item.forbidden_behaviors.length > 0);
  assert.ok(item.concision_guard === null || item.concision_guard >= 1);
}
assert.deepEqual(new Set(cases.map((item) => item.category)), categories, "All categories must be represented");

const runDirectory = join(root, "evals", "runs");
if (existsSync(runDirectory)) {
  const caseIds = new Set(cases.map((item) => item.id));
  for (const filename of readdirSync(runDirectory).filter((name) => name.endsWith(".json"))) {
    const run = JSON.parse(readFileSync(join(runDirectory, filename), "utf8"));
    assert.equal(typeof run.model.name, "string");
    assert.equal(typeof run.model.version, "string");
    assert.match(run.run_date, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(typeof run.skill_enabled, "boolean");
    assert.equal(run.responses.length, 12, `${filename} must cover 12 representative cases`);
    assert.equal(new Set(run.responses.map((response) => response.case_id)).size, 12);
    for (const response of run.responses) {
      assert.ok(caseIds.has(response.case_id), `Unknown case ${response.case_id}`);
      assert.ok(response.raw_response.trim().length > 0);
      assert.equal(typeof response.notes, "string");
      for (const value of Object.values(response.human_scores)) {
        assert.ok(Number.isInteger(value) && value >= 0 && value <= 4, `Score out of range in ${filename}`);
      }
    }
  }
}

console.log("Evaluation schemas and data valid.");
