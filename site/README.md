# Minecraft Server Command Center Companion Planner

This is the Vinext **source** for the browser-local companion planner. It
supports planning and documentation for Minecraft Server Command Center. It is
not an installer manager or a live server-management service; its release
surface can only hand a person to one embedded, version-pinned installer asset.

## Scope boundary

- Do not infer a deployment, public URL, release, hosted endpoint, or server
  connection from this source workspace. A hard-coded installer manifest must
  be backed by a separately verified, published release record.
- Do not start, stop, inspect, configure, query, or otherwise control a
  Minecraft server from the companion planner.
- Do not add external APIs, authentication, cloud synchronization, telemetry,
  analytics, remote assets, remote fonts, or third-party services. The narrow
  exception is a person-activated version-pinned GitHub Release or asset anchor;
  client code must not fetch or discover release data.
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

## Static GitHub Pages export

`next.config.ts` uses Vinext's `output: "export"` mode. A build emits raw
static output to `dist/client`. Run `npm run stage:github-pages` after the
build before publishing to GitHub Pages. That command creates the deployable
`dist/github-pages` root, keeps the root document and local assets together,
places `_next` at that same root for the project's asset URLs, adds `.nojekyll`,
and refuses to stage if an emitted project-prefixed asset reference lacks its
file. The Pages publication route must publish the contents of
`dist/github-pages`, not `dist/`, `dist/client`, its nested prefix directory,
or a Worker server bundle.

The static asset prefix is configured for the project path
`/minecraft-server-command-center`. Its metadata uses the corresponding
absolute Pages URL so the local `public/og.png` social image remains under that
path instead of incorrectly resolving to the owner site's root. Static output
does not use D1, R2, a Worker, image-optimization endpoint, or runtime request
headers.

## Verified installer handoff

The Home and **Release status** destinations consume a typed in-source manifest
for one verified version-pinned Windows `Setup.exe` release asset. The site renders
the exact tag, source commit, published size, unsigned warning, release URL,
and asset URL. It never uses a moving `latest` link, requests release data,
starts a background transfer, or claims that a transfer or installation
completed. Update all manifest fields together only after a published,
non-draft release record has been verified.

Read [Verified installer handoff](../docs/site/verified-installer-handoff.md)
before changing the record.

## Owner-managed source validation

The standard source validation command is:

```bash
npm run build
```

Run it only in an owner-managed implementation or verification task. This
documentation lane did not run it, and its presence does not prove deployment,
runtime behavior, or a published artifact.

## Continue safely

Keep the nine public destinations consistent with the parent documentation:
**Overview**, **Configure**, **Paper CLI**, **Spigot setup**, **Runtime**,
**Safety**, **Docs**, **Notification centre**, and **Release status**. Read `../docs/site/` before
changing planner behavior, preserve the source-only boundary, and update the
public documentation alongside any user-visible change. The Release status
destination is a direct version-pinned-link handoff, not a release feed or update
service.
