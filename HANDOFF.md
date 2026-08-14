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

The companion Notification centre is a browser-local foundation for its
existing non-blocking toast path. The desktop renderer now has a separate
renderer-local foundation for its own snackbar path. Each surface retains
bounded active and dismissed records, supports current-view or every-match
selection, inverse selection, and bulk dismissal for active dismissible
records. Neither surface sends notices remotely or deletes review records;
desktop storage does not add a preload, main-process, filesystem, or network
route.

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

Read `docs/reference/notification-centre.md` before extending either review
surface. The desktop article is already registered in
`src/renderer/offline-documentation-registry.ts`; the current evidence is
source, focused contract, and renderer/main build only, not packaged runtime
interaction or capture evidence.

## Current release proof

The release audit for commit `052144ce44c7daf068170375d448b2da001a052a`
verified GitHub Actions run
[`31792576349`](https://github.com/Ding-Ding-Projects/minecraft-server-command-center/actions/runs/31792576349)
as successful and published release `v0.1.42`.

The release targets that commit and exposes `Setup.exe`, `RELEASES`, and
`minecraft-server-command-center-0.1.42-full.nupkg`. The published
`Setup.exe` URL is
<https://github.com/Ding-Ding-Projects/minecraft-server-command-center/releases/download/v0.1.42/Setup.exe>
and its exact published size is `140395520` bytes. The release timing is
`00:03:53`, the dim-sum code name is `Steamed Beef Balls · 山竹牛肉`, and the
assets are unsigned; no signing material is used.

The published line-count table reports 61 own-source files / 19749 total lines /
18256 non-blank, 0 test files / 0 / 0, 47 styles-or-markup files / 7329 / 6103,
1 generated file / 5 / 4, and 2 other-project-text files / 54 / 44. Its project
total is 110 files / 27132 lines / 24403 non-blank; its grand total is 111 /
27137 / 24407; and its attribution total is 111 / 27137 / 24407. One package-
manager lockfile is excluded.

The release workflow does not run automated tests or lint. This Pages source
lane ran the companion-site build, lint, type-check, focused changelog guard,
and Pages staging commands. It did not exercise the packaged desktop UI,
installer execution, accessibility interaction, or real captures.

## Planner Handoff v1 record

Planner Handoff v1 is documented as a strict, versioned, bounded, non-secret
planning envelope between the browser-local companion and the Windows desktop
draft boundary. The user mediates it with local JSON export/import: the browser
uses only browser storage and user-selected local JSON files, while the
desktop uses a native .json picker, main-process bounded parse, safe preview,
and a separate explicit save-normalized-plan-locally action.

The record permits only selected structured planning fields: a server name and
kind, selected Minecraft and Java presets, a memory target, a world preset,
EULA acknowledgement, online-mode intent, server port, and RCON enabled and
port planning values. It excludes RCON passwords, paths, URLs, private server
addresses, credentials, secrets, raw argument or command text, file contents,
remote transfer, server operation, configuration-file writes, arbitrary
filesystem reads, and arbitrary execution. It must not be described as a
browser-to-desktop service channel or as proof that a server was configured.

The implementation source now provides the browser's guided local JSON
export/import controls and the desktop's native selected-file picker, bounded
main-process parser, normalized preview, typed preload bridge, and explicit
save-normalized-plan-locally action. `scripts/test-planner-handoff.mjs` checks
the complete payload contract, selected-file bounds, local-only draft retention,
prohibited-field rejection, and exact source registrations. The focused check
passed locally; relevant build and type evidence is recorded separately below.
This does not claim packaged runtime interaction, accessibility interaction,
or real capture evidence. Read the [Planner Handoff v1 article](docs/site/planner-handoff-v1.md)
before extending this boundary.

The issue #3 lane's local evidence on 2026-08-14 is:

- `npm run test:planner-handoff` — passed, 185 focused assertions;
- `npm run build` — passed for the main process, renderer, generated icon, and
  typed catalog copy;
- `npx tsc --noEmit -p site/tsconfig.json` — passed for the companion source;
- `npm --prefix site run build` — passed for the static companion build; and
- `git diff --check` — passed with no whitespace errors.

The approved headless route was unavailable, so this lane does not claim
packaged desktop/browser interaction, keyboard or screen-reader interaction,
accessibility review, or real captures. No CI link is claimed before the task
the task branch is pushed and observed.

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
- a desktop presentation-settings catalog in
  `src/shared/desktop-presentation.ts`, applied to the real settings surface
  with persisted English, playful Hong Kong-style Cantonese, and bilingual
  modes, independent funny-level sliders, and dialog/message-box emoji
  decoration;
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
scripts/test-planner-handoff.mjs
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
src/shared/desktop-presentation.ts
src/shared/regex-search.ts
src/shared/offline-documentation.ts
scripts/test-offline-documentation.mjs
scripts/test-desktop-search-foundation.mjs
scripts/test-desktop-presentation-settings.mjs
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

For the desktop presentation-settings lane, the focused payload-free check
`npm run test:desktop-presentation-settings` covers all three language modes,
independent funny-level changes, emoji-on/emoji-off rendering, persistence
registrations, and one exact negative regression per required registration.
The related `npm run test:offline-documentation`, universal-settings check,
desktop search check, main and renderer builds, and root build are source/build
evidence only. No packaged runtime interaction, screen-reader interaction, or
real capture evidence is claimed for this lane.

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
   privileged bounded parse, normalized preview, explicit local save, and no
   path/secret/command/filesystem/execution escape.
