# Handoff

## Current snapshot

The repository currently records a **source-only companion-site foundation**.
The application source is under `site/`; the root documentation describes the
planned local browser companion and does not claim a live site, deployment,
external service, or server connection.

## Documentation added in this foundation lane

- `README.md` — scope, boundaries, source map, and continuation sequence.
- `ROADMAP.md` — ordered implementation work and explicitly deferred areas.
- `docs/site/README.md` — documentation index and evidence boundary.
- `docs/site/configuration-planner.md` — planner pages, schema, safety, local
  storage, and no-execution contract.
- `AGENTS.md` — sanitized operational mirror for subsequent contributors.

## Behavioral contract

- The companion site is a browser-local planning and documentation surface.
- It must not start, stop, query, configure, or otherwise control a Minecraft
  server.
- It must not require or retain secrets, private server information, account
  material, file contents, server logs, or player data.
- It must not call external services, perform telemetry, fetch remote assets,
  publish a release, or imply a deployment without a separately authorized
  implementation and verification task.
- Any future retained data must be bounded, versioned, resettable, exportable,
  and limited to non-secret planning records stored locally in the browser.

## Canonical planner destinations

Use these exact public destination names when composing or documenting the
companion-site navigation: **Overview**, **Configure**, **Paper CLI**, **Spigot
setup**, **Runtime**, **Safety**, **Docs**, and **Release status**. The labels
describe planning and documentation surfaces only; they do not grant server,
deployment, or external-service capability.

## Source structure for the next owner

| Location | Use it for |
| --- | --- |
| `site/app/page.tsx` | Primary companion-site screen composition. |
| `site/app/layout.tsx` | Shared document layout and metadata. |
| `site/app/globals.css` | Shared visual tokens and global styling. |
| `site/public/` | Checked-in local static assets. |
| `site/tests/` | Focused source-level coverage. |
| `docs/site/` | Public contract and feature documentation. |

## Verification boundary

No build, lint, automated test, browser interaction, accessibility audit,
deployment, publishing action, external service call, or release was performed
for this documentation-only lane. The listed scripts in `site/package.json`
remain available to future implementers but are not evidence for this handoff.

## Safe continuation

1. Read `docs/site/configuration-planner.md` before changing planner behavior.
2. Keep the implementation browser-local and do not introduce a server or
   external-service call as an incidental convenience.
3. Give each new form field a clear non-secret data classification, validation,
   persistence rule, reset route, and user-facing explanation.
4. Add focused verification with the implementation; record exact results here.
5. If a future task needs deployment, privileged server operations, credentials,
   or an external integration, stop and obtain that task's explicit scope first.
