import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { spawn } from "node:child_process";

import { install, installDestination, parseArgs } from "../scripts/install.mjs";

test("parses supported targets and options", () => {
  assert.deepEqual(parseArgs(["--target", "cursor", "--scope", "global", "--dry-run"]), {
    target: "cursor",
    scope: "global",
    dryRun: true,
    force: false,
    help: false
  });
  assert.throws(() => parseArgs(["--target", "unknown"]), /must be one of/);
});

test("maps every target to a project-local skill directory", () => {
  for (const target of ["codex", "claude", "cursor", "gemini", "opencode"]) {
    const destination = installDestination({ target, scope: "project" }, { SPINE_PROJECT_ROOT: "/project" });
    assert.ok(destination.endsWith(join(`.${target}`, "skills", "reality-check")));
  }
});

test("dry run writes nothing", async () => {
  const root = await mkdtemp(join(tmpdir(), "spine-dry-"));
  try {
    const result = await install({ target: "gemini", scope: "project", dryRun: true, force: false }, { SPINE_PROJECT_ROOT: root });
    assert.equal(result.status, "would-install");
    await assert.rejects(readFile(result.destination));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("install is idempotent", async () => {
  const root = await mkdtemp(join(tmpdir(), "spine-idempotent-"));
  try {
    const first = await install({ target: "opencode", scope: "project", dryRun: false, force: false }, { SPINE_PROJECT_ROOT: root });
    const second = await install({ target: "opencode", scope: "project", dryRun: false, force: false }, { SPINE_PROJECT_ROOT: root });
    assert.equal(first.status, "installed");
    assert.equal(second.status, "unchanged");
    assert.match(await readFile(join(first.destination, "SKILL.md"), "utf8"), /Run the correction loop/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("conflicts are protected and force creates a backup", async () => {
  const root = await mkdtemp(join(tmpdir(), "spine-conflict-"));
  const env = { SPINE_PROJECT_ROOT: root };
  const options = { target: "cursor", scope: "project", dryRun: false, force: false };
  const destination = installDestination(options, env);
  try {
    await mkdir(destination, { recursive: true });
    await writeFile(join(destination, "SKILL.md"), "user content");
    await assert.rejects(install(options, env), /Conflict/);
    assert.equal(await readFile(join(destination, "SKILL.md"), "utf8"), "user content");

    const replaced = await install({ ...options, force: true }, env);
    assert.equal(replaced.status, "replaced");
    assert.match(await readFile(join(replaced.backup, "SKILL.md"), "utf8"), /user content/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("runs when launched through an npm-style bin symlink", async () => {
  const root = await mkdtemp(join(tmpdir(), "spine-bin-"));
  const bin = join(root, "give-ai-a-spine");
  try {
    await symlink(new URL("../scripts/install.mjs", import.meta.url), bin);
    const child = spawn(process.execPath, [bin, "--target", "cursor", "--scope", "project"], {
      env: { ...process.env, SPINE_PROJECT_ROOT: root }
    });
    let output = "";
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.stderr.on("data", (chunk) => { output += chunk; });
    const exitCode = await new Promise((accept, reject) => {
      child.on("error", reject);
      child.on("close", accept);
    });
    assert.equal(exitCode, 0, output);
    assert.match(output, /Spine installed/);
    assert.match(await readFile(join(root, ".cursor", "skills", "reality-check", "SKILL.md"), "utf8"), /Reality Check/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
