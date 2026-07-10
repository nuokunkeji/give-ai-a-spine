#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, realpathSync } from "node:fs";
import { cp, mkdir, readdir, readFile, rename, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const TARGETS = Object.freeze({
  codex: ".codex/skills",
  claude: ".claude/skills",
  cursor: ".cursor/skills",
  gemini: ".gemini/skills",
  opencode: ".opencode/skills"
});

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const skillSource = join(repoRoot, "plugins", "give-ai-a-spine", "skills", "reality-check");

function usage() {
  return `Give your AI a spine.

Usage:
  npx github:nuokunkeji/give-ai-a-spine --target <agent> [options]

Targets:
  codex | claude | cursor | gemini | opencode

Options:
  --scope <global|project>  Install for your user or the current project (default: project)
  --dry-run                 Show the destination without writing
  --force                   Back up and replace a conflicting installation
  --help                    Show this help

The installer never silently overwrites an existing skill.`;
}

export function parseArgs(argv) {
  const options = { scope: "project", dryRun: false, force: false, help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--force") options.force = true;
    else if (arg === "--target") options.target = argv[++index];
    else if (arg === "--scope") options.scope = argv[++index];
    else throw new Error(`Unknown option: ${arg}`);
  }

  if (options.help) return options;
  if (!options.target || !(options.target in TARGETS)) {
    throw new Error(`--target must be one of: ${Object.keys(TARGETS).join(", ")}`);
  }
  if (!["global", "project"].includes(options.scope)) {
    throw new Error("--scope must be global or project");
  }
  return options;
}

export function installDestination({ target, scope }, env = process.env) {
  const root = scope === "global"
    ? resolve(env.SPINE_HOME || homedir())
    : resolve(env.SPINE_PROJECT_ROOT || process.cwd());
  return join(root, TARGETS[target], "reality-check");
}

async function directoryDigest(path) {
  if (!existsSync(path)) return null;
  const entries = await readdir(path, { withFileTypes: true });
  const hash = createHash("sha256");
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const child = join(path, entry.name);
    hash.update(entry.name);
    if (entry.isDirectory()) hash.update(await directoryDigest(child));
    else if (entry.isFile()) hash.update(await readFile(child));
  }
  return hash.digest("hex");
}

export async function install(options, env = process.env) {
  const destination = installDestination(options, env);
  const sourceDigest = await directoryDigest(skillSource);
  const destinationDigest = await directoryDigest(destination);

  if (destinationDigest === sourceDigest) {
    return { status: "unchanged", destination };
  }
  if (destinationDigest && !options.force) {
    throw new Error(`Conflict at ${destination}. Re-run with --force to back it up and replace it.`);
  }
  if (options.dryRun) {
    return { status: destinationDigest ? "would-replace" : "would-install", destination };
  }

  let backup;
  if (destinationDigest) {
    backup = `${destination}.backup-${new Date().toISOString().replace(/[:.]/g, "-")}`;
    await rename(destination, backup);
  }
  await mkdir(dirname(destination), { recursive: true });
  await cp(skillSource, destination, { recursive: true, errorOnExist: true });
  return { status: backup ? "replaced" : "installed", destination, backup };
}

async function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      console.log(usage());
      return;
    }
    const result = await install(options);
    if (result.status === "unchanged") console.log(`Already up to date: ${result.destination}`);
    else if (result.status.startsWith("would-")) console.log(`${result.status}: ${result.destination}`);
    else {
      console.log(`Spine ${result.status}: ${result.destination}`);
      if (result.backup) console.log(`Backup: ${result.backup}`);
    }
  } catch (error) {
    console.error(`Spine installer: ${error.message}`);
    console.error("Run with --help for usage.");
    process.exitCode = 1;
  }
}

const isMain = process.argv[1]
  && realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url));
if (isMain) await main();
