# Reddit draft

## Suggested title

I open-sourced a cross-agent “reality check” skill with raw before/after evals

## Post

I kept running into the same failure mode: confident plans received supportive elaboration before the key premise was tested.

Spine adds a `reality-check` skill to Codex, Claude Code, Cursor, Gemini CLI, and OpenCode. It is deliberately small: clarify the real goal, separate facts from inference and values, check user and assistant bias, seek real counterevidence, then define one observable next step.

I did not want “anti-sycophancy” to become another claim with a polished demo, so the repo preserves 24 scenarios, 12 paired raw Codex responses, scoring notes, schemas, and concision checks. It also names the opposite failure: arguing for sport, diagnosing the user, or turning every simple request into an audit.

No MCP, accounts, analytics, or telemetry. The universal installer has no dependencies and refuses to overwrite an existing skill unless `--force` is explicit, in which case it makes a backup.

I am looking for hard cases where it still agrees too quickly—or pushes too hard.

https://github.com/nuokunkeji/give-ai-a-spine
