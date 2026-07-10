# Show HN draft

## Title

Show HN: Spine – An open skill that makes coding agents less agreeable

## Post

I built Spine because “helpful” agents often accept the premise that most needs scrutiny.

Spine is a portable `reality-check` skill for Codex, Claude Code, Cursor, Gemini CLI, and OpenCode. On consequential decisions it separates facts from inference, finds the load-bearing assumption, checks the assistant's own tendency to flatter or overclaim, and ends with one observable test. On simple requests it stays out of the way.

The repository includes 24 public scenarios and 12 paired raw Codex runs. The release gate requires at least a 25-point improvement on important cases while keeping simple answers within 1.2× baseline length. There is no MCP server, account, telemetry, or cloud service—just Markdown and a dependency-free installer with conflict protection.

I would especially value examples where the skill still overcorrects, becomes too verbose, or challenges the wrong assumption.

Repository: https://github.com/nuokunkeji/give-ai-a-spine
