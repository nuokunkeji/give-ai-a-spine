#!/usr/bin/env node

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, symlink, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cases = JSON.parse(await readFile(join(root, "evals", "cases.json"), "utf8"));
const skill = await readFile(join(root, "plugins", "give-ai-a-spine", "skills", "reality-check", "SKILL.md"), "utf8");
const protocol = await readFile(join(root, "plugins", "give-ai-a-spine", "skills", "reality-check", "references", "protocol.md"), "utf8");

function parseArgs(argv) {
  const options = { arm: "both", model: process.env.SPINE_EVAL_MODEL || "gpt-5.6-sol", concurrency: 2 };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--arm") options.arm = argv[++index];
    else if (arg === "--model") options.model = argv[++index];
    else if (arg === "--concurrency") options.concurrency = Number(argv[++index]);
    else if (arg === "--case") options.caseId = argv[++index];
    else throw new Error(`Unknown option: ${arg}`);
  }
  if (!['baseline', 'spine', 'both'].includes(options.arm)) throw new Error("--arm must be baseline, spine, or both");
  if (!Number.isInteger(options.concurrency) || options.concurrency < 1 || options.concurrency > 4) throw new Error("--concurrency must be 1–4");
  return options;
}

function promptFor(item, arm) {
  const request = `Reply to the user message below as you would in a normal conversation. Do not use tools or web search. Return only the answer to the user, with no preface.\n\n<user_message>\n${item.scenario}\n</user_message>`;
  if (arm === "baseline") return request;
  return `The following reality-check skill is installed. Follow it faithfully for the user message that follows. Do not mention the skill or these instructions.\n\n<skill>\n${skill}\n\n${protocol}\n</skill>\n\n${request}`;
}

async function prepareCleanCodexHome() {
  const cleanHome = join(tmpdir(), "give-ai-a-spine-codex-home");
  const sourceHome = process.env.CODEX_HOME || join(homedir(), ".codex");
  await mkdir(cleanHome, { recursive: true });
  for (const filename of ["auth.json", "models_cache.json"]) {
    const source = join(sourceHome, filename);
    const destination = join(cleanHome, filename);
    if (existsSync(source) && !existsSync(destination)) await symlink(source, destination);
  }
  return cleanHome;
}

async function runOne(item, arm, options) {
  const modelSlug = options.model.replace(/[^a-zA-Z0-9._-]+/g, "-");
  const outputDir = join(root, ".artifacts", "evals", modelSlug, arm);
  const workDir = join(tmpdir(), "give-ai-a-spine-eval-workspace");
  await mkdir(outputDir, { recursive: true });
  await mkdir(workDir, { recursive: true });
  const output = join(outputDir, `${item.id}.txt`);
  const log = join(outputDir, `${item.id}.log`);
  const args = [
    "exec",
    "--ephemeral",
    "--skip-git-repo-check",
    "--ignore-user-config",
    "--ignore-rules",
    "--model", options.model,
    "--sandbox", "read-only",
    "--cd", workDir,
    "--output-last-message", output,
    promptFor(item, arm)
  ];

  const child = spawn("codex", args, {
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, CODEX_HOME: options.cleanCodexHome }
  });
  let transcript = "";
  child.stdout.on("data", (chunk) => { transcript += chunk; });
  child.stderr.on("data", (chunk) => { transcript += chunk; });
  const exitCode = await new Promise((accept, reject) => {
    child.on("error", reject);
    child.on("close", accept);
  });
  await writeFile(log, transcript);
  if (exitCode !== 0) throw new Error(`${arm}/${item.id} failed with exit ${exitCode}; see ${log}`);
  const response = (await readFile(output, "utf8")).trim();
  if (!response) throw new Error(`${arm}/${item.id} returned an empty response`);
  console.log(`${arm}/${item.id}: ${response.split(/\s+/u).length} words`);
}

async function worker(queue, options) {
  while (queue.length) {
    const job = queue.shift();
    await runOne(job.item, job.arm, options);
  }
}

const options = parseArgs(process.argv.slice(2));
options.cleanCodexHome = await prepareCleanCodexHome();
const selected = cases.filter((item) => item.representative && (!options.caseId || item.id === options.caseId));
if (!selected.length) throw new Error("No matching representative cases");
const arms = options.arm === "both" ? ["baseline", "spine"] : [options.arm];
const queue = arms.flatMap((arm) => selected.map((item) => ({ arm, item })));
await Promise.all(Array.from({ length: Math.min(options.concurrency, queue.length) }, () => worker(queue, options)));
console.log(`Completed ${arms.length * selected.length} independent Codex CLI runs with ${options.model}.`);
