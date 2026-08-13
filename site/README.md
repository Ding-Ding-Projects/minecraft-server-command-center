# Minecraft Server Command Center Companion Planner

This is the Vinext/Sites-compatible **source** for the browser-local companion
planner. It supports planning and documentation for Minecraft Server Command
Center; it is not a deployed site, an installer, or a live server-management
service.

## Scope boundary

- Do not claim a deployment, public URL, release, hosted endpoint, or server
  connection from this source workspace.
- Do not start, stop, inspect, configure, query, or otherwise control a
  Minecraft server from the companion planner.
- Do not add external APIs, authentication, cloud synchronization, telemetry,
  analytics, remote assets, remote fonts, or third-party services.
- Use local checked-in assets only. `public/og.png` is the approved local social
  preview asset; do not generate, fetch, or replace it as an incidental change.

## Browser-local data

Any retained planner state must stay in browser-local storage for the current
origin and contain only bounded, versioned, resettable, non-secret planning
records. Never retain or export passwords, tokens, keys, keystores, private
server addresses, player data, file contents, logs, browser history, or machine
identifiers.

The planner may produce non-secret configuration and command drafts for review,
but those drafts must never execute commands or become a request to a server.

## Source layout

| Path | Purpose |
| --- | --- |
| `app/` | Companion planner screens, layout, and local UI behavior. |
| `public/` | Checked-in local assets, including `public/og.png`. |
| `tests/` | Focused source-level coverage when an owner authorizes it. |
| `../docs/site/` | Public companion-planner behavior and boundary documentation. |

## Owner-managed source validation

The standard source validation command is:

```bash
npm run build
```

Run it only in an owner-managed implementation or verification task. This
documentation lane did not run it, and its presence does not prove deployment,
runtime behavior, or a published artifact.

## Continue safely

Keep the eight public destinations consistent with the parent documentation:
**Overview**, **Configure**, **Paper CLI**, **Spigot setup**, **Runtime**,
**Safety**, **Docs**, and **Release status**. Read `../docs/site/` before
changing planner behavior, preserve the source-only boundary, and update the
public documentation alongside any user-visible change.
