#!/usr/bin/env node

import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ignored = new Set([".git", "node_modules"]);

function markdownFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (ignored.has(entry.name)) return [];
    const path = join(directory, entry.name);
    return entry.isDirectory() ? markdownFiles(path) : extname(path) === ".md" ? [path] : [];
  });
}

for (const file of markdownFiles(root)) {
  const body = readFileSync(file, "utf8");
  for (const match of body.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].split("#")[0];
    if (!target || /^(https?:|mailto:)/.test(target)) continue;
    assert.ok(existsSync(resolve(dirname(file), decodeURIComponent(target))), `Broken local link in ${file}: ${target}`);
  }
}

console.log("Local Markdown links valid.");
