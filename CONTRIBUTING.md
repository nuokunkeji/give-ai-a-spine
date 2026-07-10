# Contributing to Spine

Spine improves when it faces realistic failure cases, not when the protocol grows longer.

## Best ways to help

1. Report a case where an assistant agreed too easily.
2. Report a case where Spine became combative, diagnostic, or unnecessarily verbose.
3. Add an evaluation case with observable required and forbidden behaviors.
4. Improve installation compatibility without adding hidden network access or telemetry.

## Development

Requirements: Node.js 20 or 22.

```bash
npm test
npm run validate
npm run scorecard
```

Every behavior change should include an evaluation case. Keep `SKILL.md` compact; move detailed reasoning to `references/`. Do not add an MCP server, cloud dependency, account requirement, analytics, or telemetry without first opening a design issue.

## Scoring changes

Human scores must be defensible from the preserved raw response. In a pull request, quote the exact language that justifies any changed score and name the applicable required or forbidden behavior. Do not rewrite old raw responses.

## Pull requests

- Keep changes focused.
- Explain the user-visible behavior change.
- Include tests for installer changes.
- Confirm that no existing skill is silently overwritten.
- Use respectful, specific language when challenging another contributor's reasoning.
