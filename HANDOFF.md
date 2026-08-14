# Handoff

## Current snapshot

The repository currently records two implementation foundations:

- a browser-local companion-site planner under `site/`; and
- a Windows desktop configuration foundation under `src/`.

A static companion publication and published, version-pinned GitHub Release asset record are
available separately. Neither record proves local installer operation,
external-service integration, live server connection, or server-process action.

## Companion-site record

The companion site is a browser-local planning and documentation surface. Its
source documents the exact destinations Overview, Configure, Paper CLI, Spigot
setup, Runtime, Safety, Docs, Notification centre, and Release status. It must
not retain secrets,
private server data, file contents, logs, player data, or browser information
outside its bounded non-secret planner contract.

The Notification centre is a browser-local foundation for the existing
non-blocking toast path. It retains bounded active and dismissed records,
supports current-view or every-match selection, inverse selection, and bulk
dismissal for active dismissible records. It does not send notices remotely,
delete review records, or provide a desktop notification centre.

The Home and Release status destinations can hand a person to one verified,
published, version-pinned Windows `Setup.exe` asset. Its record is embedded in source with the
exact tag, source commit, asset URL, published size, release URL, and unsigned
warning. It does not fetch a release feed, start or observe a transfer, or
claim installation, update, application, or server completion.

Read `docs/site/README.md` and
`docs/site/configuration-planner.md` before changing companion behavior.

The companion and desktop also contain a partial universal-settings
foundation. Read `docs/reference/universal-settings.md` before extending it.
The foundation is bounded and local-only: it does not imply cloud sync,
credential storage, server access, or complete localization. The companion
personal-vocabulary loader validates a private file but does not yet replace
text across every surface, and the desktop does not yet expose that picker.

## Current release proof

The release audit for commit `fbd75307e14bbe049adf73c40bb74fc375f970c3`
verified GitHub Actions run
[`31782817096`](https://github.com/Ding-Ding-Projects/minecraft-server-command-center/actions/runs/31782817096)
as successful and published release `v0.1.38`.

The release targets that commit and exposes `Setup.exe`, `RELEASES`, and
`minecraft-server-command-center-0.1.38-full.nupkg`. The published asset URLs
responded with HTTP 200 and the release notes contain workflow timing, the
committed line-count table, and the linked public dim-sum catalog metadata.
The assets are unsigned; no signing material is used.

The release workflow does not run automated tests or lint. The local audit did
run `build.bat /s`, `build-installer.bat /s`, the companion-site build and Pages
staging commands, and companion-site lint. It did not exercise the packaged
desktop UI, installer execution, accessibility interaction, or real captures.

## Planner Handoff v1 record

Planner Handoff v1 is documented as a strict, versioned, bounded, non-secret
planning envelope between the browser-local companion and the Windows desktop
draft boundary. The user mediates it with local JSON export/import: the browser
uses only browser storage and user-selected local JSON files, while the
desktop uses a native .json picker, main-process bounded parse, safe preview,
and a separate explicit apply or save action.

The record permits only selected structured planning fields: a server name and
kind, selected Minecraft and Java presets, a memory target, a world preset,
EULA acknowledgement, online-mode intent, server port, and RCON enabled and
port planning values. It excludes RCON passwords, paths, URLs, private server
addresses, credentials, secrets, raw argument or command text, file contents,
remote transfer, server operation, configuration-file writes, arbitrary
filesystem reads, and arbitrary execution. It must not be described as a
browser-to-desktop service channel or as proof that a server was configured.

This is source-design documentation only. No test, lint, review, accessibility
assessment, browser UI interaction, screen capture, build, package, release,
website publication, source-control publication, selected-file flow, preview,
apply/save action, or server action is represented as verified. Read the
Planner Handoff v1 article before implementing this boundary.

## Desktop foundation record

The desktop source contains:

- a normalized schema-version-1 server draft stored under Electron user data;
- narrow generic native folder, JAR, and configuration picker requests, plus a
  dedicated privileged Java-runtime chooser;
- a frameless, sandboxed, context-isolated Material Design 3 renderer with
  nine vertical setup tabs, including a bundle-only Docs reader;
- a guided Java runtime card that keeps candidate paths in the main process,
  shows opaque candidate/source summaries, probes selected Java with fixed
  direct arguments, validates a bounded official Paper project-version
  snapshot, and renders structured catalog and Spigot-unverified states;
- typed Paper/Spigot registry projection and direct argument-array preview;
- explicit no-launch IPC and automatic-update-unavailable boundaries;
- Windows Squirrel.Windows packaging configuration, unsigned-only settings,
  root build scripts, and an SVG icon master generated to an ICO during build;
- a schema-version-1 universal-settings record with local desktop persistence,
  language/funny-level/emoji/School-mode controls, appearance basics, tab
  docking, and companion-site logo and personal-vocabulary foundations.
- a shared bounded desktop search matcher and anchored regex-builder binding for
  the existing Docs, Universal settings, and command-palette search fields;
  `Ctrl+Shift+F` focuses those existing surfaces or their builders without
  claiming a complete app-wide command registry.

The following desktop paths are source-only evidence:

```text
package.json
electron-builder.yml
vite.renderer.config.ts
tsconfig.json
tsconfig.main.json
build.bat
build-installer.bat
.github/workflows/release.yml
scripts/verify-unsigned.mjs
assets/app-mark.svg
src/shared/server-draft.ts
src/shared/planner-handoff.ts
src/shared/desktop-api.ts
src/main/index.ts
src/main/planner-handoff-file.ts
src/main/java-runtime-manager.cjs
src/main/java-runtime-controller.ts
src/main/draft-store.ts
src/main/argv-preview.ts
src/main/cli-catalog.ts
src/main/update-boundary.ts
src/preload/index.ts
src/renderer/index.html
src/renderer/main.ts
src/renderer/regex-builder.ts
src/renderer/offline-documentation-registry.ts
src/renderer/offline-documentation.ts
src/renderer/styles.css
src/shared/regex-search.ts
src/shared/offline-documentation.ts
scripts/test-offline-documentation.mjs
scripts/test-desktop-search-foundation.mjs
```

The desktop renderer has no process-start IPC, shell command field, RCON
transport, arbitrary-command execution route, or update transport. It should
continue to render those facts honestly until separately implemented and
verified.

The Java runtime bridge has no generic Java-path input, command execution,
install, package-manager, download, configuration-write, credential, or server
route. It validates a checked-in versioned numeric-key snapshot of the official
Paper Downloads Service project catalog and passes only the bounded validated
version array into the existing Paper requirement resolver. Malformed, unknown,
absent, or out-of-matrix targets remain unverified. It never applies Paper
requirements to Spigot.

## Verification boundary

The current release audit claims local build, unsigned package, companion-site
build, Pages staging, companion-site lint, GitHub Actions, and published-release
evidence as recorded above. It does not claim automated desktop tests, browser or
desktop interaction, accessibility interaction, installer execution, update
operation, server-process action, or real capture evidence. The embedded
installer fields originate from the separately verified published release
record; source paths and scripts do not prove anything beyond that bounded
record.

For the current universal-settings lane, `npm run test:universal-contracts`
passed and the root `npm run build` passed. `npm --prefix site run lint` completed with
two image-element warnings. `npm --prefix site run build` and
`npx tsc --noEmit -p site/tsconfig.json` also completed. No
packaged runtime interaction, accessibility interaction, or real capture
evidence is claimed. The implementation and this local verification record are
carried by [`130f2b1`](https://github.com/Ding-Ding-Projects/minecraft-server-command-center/commit/130f2b1b45586c16c07efc1957b3cb150f67e922).

For the offline documentation browser lane, `npm run test:offline-documentation`,
`npm run test:universal-contracts`, and `npm run build` passed on 2026-08-14.
Those checks cover the hand-written article completeness boundary, the shared
renderer/search/link contract, and the supported root build. They do not claim
packaged desktop interaction, accessibility interaction, or real capture
evidence.

For the bounded desktop search lane, `npm run test:desktop-search`,
`npm run test:offline-documentation`, `npm run test:universal-contracts`,
`npm run build:main`, `npm run build:renderer`, and `npm run build` passed on
2026-08-14. The negative regression covers exact shared-builder registrations
and the `Ctrl+Shift+F` shortcut. These are source/build checks only; packaged
runtime interaction, screen-reader interaction, and real captures remain
unverified. The implementation and this verification record are carried by
[`a6468a9`](https://github.com/Ding-Ding-Projects/minecraft-server-command-center/commit/a6468a924620761622714ff1d545c8827eab14a6).

## Safe continuation

1. Preserve the companion site's browser-local, non-secret contract.
2. Keep desktop changes behind the narrow bridge and typed registry seam.
3. Keep future catalog refreshes on the official Paper project-version
   semantics, preserving schema validation, entry bounds, and the no-network
   runtime boundary.
4. Exercise the built desktop application through the approved headless route
   before claiming visual or interaction behavior.
5. Record exact command, artifact, version, and capture evidence when a future
   authorized verification or release lane performs it.
6. Obtain explicit scope before adding secrets, live server control, updater
   transport, deployment, or external integration.
7. Preserve the Planner Handoff v1 boundary: selected local JSON only,
   privileged bounded parse, safe preview, explicit apply/save, and no
   path/secret/command/filesystem/execution escape.
