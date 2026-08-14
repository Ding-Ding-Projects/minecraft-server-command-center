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

The current verified record is `v0.1.42` for source commit
`052144ce44c7daf068170375d448b2da001a052a`. Its published `Setup.exe` asset is
`140395520` bytes; the supporting release workflow is run `31792576349` with
timing `00:03:53`, and the release's dim-sum code name is
`Steamed Beef Balls · 山竹牛肉`.

Read [Verified installer handoff](../docs/site/verified-installer-handoff.md)
before changing the record.

## Changelog viewer

The **Changelog** destination renders all 28 non-draft, non-prerelease versions
available from the repository's factual release records. It uses the
categorized checked-in `CHANGELOG.md` records where available and the verified
published release records for the remaining versions. Each entry keeps its release date, categories, exact
commit SHA links, and release-record links. The browser-local controls provide
plain-text search with the adjacent anchored regex builder, typed ISO or local
date input, inclusive range filtering, date presets, clipboard copy, and
durable Markdown export of the active filtered view. The viewer does not fetch
release data, include `Unreleased` notes, or claim runtime or capture evidence.

Read [Changelog viewer](../docs/site/changelog-viewer.md) before changing this
surface. The focused source guard is `npm run test:site-changelog-viewer`.

## Owner-managed source validation

The standard source validation command is:

```bash
npm run build
```

Run it only in an owner-managed implementation or verification task. This
documentation lane did not run it, and its presence does not prove deployment,
runtime behavior, or a published artifact.

## Continue safely

Keep the ten public destinations consistent with the parent documentation:
**Overview**, **Configure**, **Paper CLI**, **Spigot setup**, **Runtime**,
**Safety**, **Docs**, **Release status**, **Changelog**, and **Notification centre**. Read `../docs/site/` before
changing planner behavior, preserve the source-only boundary, and update the
public documentation alongside any user-visible change. The Release status
destination is a direct version-pinned-link handoff, not a release feed or update
service. The Changelog destination is a checked-in release-record viewer, not a
runtime release feed.
