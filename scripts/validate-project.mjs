#!/usr/bin/env node

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const required = [
  ".agents/plugins/marketplace.json",
  ".claude-plugin/marketplace.json",
  "plugins/give-ai-a-spine/.codex-plugin/plugin.json",
  "plugins/give-ai-a-spine/.claude-plugin/plugin.json",
  "plugins/give-ai-a-spine/skills/reality-check/SKILL.md",
  "plugins/give-ai-a-spine/skills/reality-check/agents/openai.yaml",
  "plugins/give-ai-a-spine/skills/reality-check/references/protocol.md"
];

for (const path of required) assert.ok(existsSync(resolve(root, path)), `Missing ${path}`);

const plugin = JSON.parse(readFileSync(resolve(root, "plugins/give-ai-a-spine/.codex-plugin/plugin.json")));
assert.equal(plugin.name, "give-ai-a-spine");
assert.match(plugin.version, /^\d+\.\d+\.\d+$/);
assert.equal(plugin.author.name, "nuokunkeji");
assert.equal(plugin.license, "MIT");
assert.equal(plugin.skills, "./skills/");
assert.ok(plugin.interface.shortDescription.length <= 80);

const marketplace = JSON.parse(readFileSync(resolve(root, ".agents/plugins/marketplace.json")));
assert.equal(marketplace.plugins[0].name, plugin.name);
assert.equal(marketplace.plugins[0].source.path, "./plugins/give-ai-a-spine");

const skill = readFileSync(resolve(root, "plugins/give-ai-a-spine/skills/reality-check/SKILL.md"), "utf8").replace(/\r\n/g, "\n");
assert.match(skill, /^---\nname: reality-check\ndescription: .+\n---\n/);
assert.ok(!skill.includes("TODO"));
assert.ok(skill.length < 5000, "SKILL.md should stay compact");

console.log("Project and plugin structure valid.");
