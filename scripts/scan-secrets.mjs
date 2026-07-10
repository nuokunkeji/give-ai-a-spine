#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const textExtensions = new Set([".md", ".json", ".yaml", ".yml", ".js", ".mjs", ".txt", ".svg"]);
const ignored = new Set([".git", "node_modules", "package-lock.json"]);
const patterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bgh[pousr]_[A-Za-z0-9_]{30,}\b/,
  /\bsk-[A-Za-z0-9_-]{20,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/
];

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (ignored.has(entry.name)) return [];
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : textExtensions.has(extname(path)) ? [path] : [];
  });
}

for (const file of walk(root)) {
  const body = readFileSync(file, "utf8");
  for (const pattern of patterns) assert.ok(!pattern.test(body), `Possible secret in ${file}`);
}

console.log("No common secret patterns found.");
