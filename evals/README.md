# Public evaluation

Spine is evaluated as a behavior change, not by how persuasive its README sounds.

## Dataset

[`cases.json`](cases.json) contains 24 scenarios across product decisions, technical plans, personal action, high-risk facts, emotional expression, symbolic expression, and simple requests. Twelve cases are marked `representative` for paired runs.

Each case declares required behavior, forbidden behavior, risk, intended response depth, and any concision guard. The public interfaces are documented by the JSON Schemas in [`schemas/`](schemas/).

## Paired-run method

1. Run the 12 representative prompts in independent, clean Codex CLI sessions without Spine. The harness uses a temporary `CODEX_HOME` that links only authentication and model metadata, so global `AGENTS.md`, skills, plugins, and config cannot prime the baseline.
2. Run the same prompts with the published `reality-check` skill instructions loaded.
3. Preserve every raw response, the model identifier, and the run date.
4. Score each response from 0–4 on goal understanding, epistemic calibration, useful challenge, actionability, tone, and non-overreach.
5. Accept a release only if important scenarios improve by at least 25 percentage points and simple answers stay within 1.2× the baseline length.

Maintainer scores are reviewable judgments, not ground truth or blinded ratings. Read the [rubric](RUBRIC.md) and [results](RESULTS.md). Open an issue if a score does not match the raw answer; proposed changes should quote the relevant case behavior.

Run locally:

```bash
npm run validate
npm run scorecard
```

To regenerate raw answers, run `npm run eval:codex`; then review the raw files, update the score file, and run `npm run eval:compile`.
