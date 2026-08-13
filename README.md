# Minecraft Server Command Center

This repository contains the **source-only companion-site foundation** for a
guided Material Design 3 control center for Minecraft server setup,
configuration, Paper, and Spigot. It is a planning and documentation surface,
not a deployed service and not a replacement for the desktop application.

## Current boundary

- No deployment, hosting configuration, live URL, release, or installer is
  claimed by this repository.
- No server is started, stopped, inspected, configured, or contacted by the
  companion site.
- The source baseline has no external API, cloud service, authentication,
  telemetry, analytics, remote asset fetch, or background synchronization
  contract.
- Sensitive material is out of scope. Do not put RCON passwords, keystores,
  account tokens, SSH material, private server addresses, player data, or
  secrets in browser storage, source, examples, documentation, or test data.

The product direction is a browser-local planning experience: a person can
model a server plan, understand effective configuration, browse command
guidance, and export a non-secret plan without the site performing privileged
machine or server actions.

## Companion-site surfaces

The companion site is organized around these exact planning destinations:

- **Overview** — explains the local-only boundary and gives an honest empty
  state when no server plan exists.
- **Configure** — presents typed controls and effective-value provenance for
  server, world, network, and plugin settings.
- **Paper CLI** — helps construct and review Paper launch and administration
  arguments without executing them.
- **Spigot setup** — guides non-secret Spigot-specific planning choices and
  compatibility notes without writing configuration files.
- **Runtime** — captures non-secret version, Java requirement, memory target,
  and local-reference planning data supplied by the user.
- **Safety** — makes consequential operations, missing information, and
  desktop-app boundaries explicit.
- **Docs** — provides local companion documentation and source-boundary
  guidance.
- **Release status** — displays only factual, source-provided release planning
  information and never invents a deployment or published artifact.

See [the companion-site documentation](docs/site/README.md) for the detailed
configuration-planner contract.

## Source layout

| Path | Purpose |
| --- | --- |
| `site/app/` | React/Vinext presentation source for the companion site. |
| `site/public/` | Local static assets only. |
| `site/tests/` | Source-level test location for future focused coverage. |
| `docs/site/` | Companion-site behavior, privacy, and continuation documentation. |
| `ROADMAP.md` | Ordered implementation and verification work. |
| `HANDOFF.md` | Current source-only handoff and safe next steps. |

## Local data contract

Any future persisted planning state belongs in browser-local storage for the
current origin only. It must be bounded, versioned, resettable, exportable, and
limited to non-secret planner data. The site must not silently collect file
contents, browser data, server logs, credentials, or identifiers.

## Development and verification

The nested `site/` workspace contains the source scripts declared in
`site/package.json`. They are not evidence of a deployed site or a completed
product. This documentation-only foundation lane did not run a build, lint,
test suite, browser session, deployment, publication, or release.

Before later implementation work is described as complete, verify the exact
changed behavior in the source workspace and document the result in
`HANDOFF.md`. Do not infer deployment or runtime-server evidence from a source
edit.

## Continue from here

1. Implement the public companion-site shell under `site/app/` without
   extending the source-only boundary.
2. Wire browser-local, non-secret planner state with clear reset and export
   behavior.
3. Add focused source-level checks for the configuration schema, validation,
   accessibility, and local-storage failure paths.
4. Only publish or connect an external service after a separately authorized
   task establishes the required privacy, deployment, and verification record.
