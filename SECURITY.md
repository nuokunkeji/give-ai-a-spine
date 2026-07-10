# Security policy

## Supported versions

The latest tagged release receives security fixes.

## Report a vulnerability

Use GitHub's private vulnerability reporting for this repository. Do not open a public issue containing credentials, private paths, or an exploit that could harm users.

Include the affected version, installation target, reproduction steps, impact, and a suggested mitigation if available. You should receive an acknowledgment within seven days.

## Security model

Spine has no runtime service, account, API key, telemetry, or network request. Its installer copies a fixed local directory. Conflicting destinations stop by default; `--force` moves the existing directory to a timestamped backup before replacement.
