# Handoff

## Current snapshot

The repository currently records two implementation foundations:

- a browser-local companion-site planner under `site/`; and
- a Windows desktop configuration foundation under `src/`.

A static companion publication and published, version-pinned GitHub Release asset record are
available separately. Neither record proves local installer operation,
external-service integration, live server connection, or server-process action.

The source-build route now includes a committed root `package-lock.json`, and
`build.bat` installs it with `npm ci`. This closes the prior fresh-archive
failure where the documented build route had no deterministic dependency
graph. The lock/build verification does not claim installer execution or
installed-application lifecycle evidence.

On 2026-08-20, `npm ci --no-audit --no-fund`,
`npm run test:security-audit`, and `npm run build` completed successfully. The
audit resolved Electron 42.9.3 with zero reported vulnerabilities, and the
build produced `dist/main/index.js` plus `dist/renderer/index.html`.

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
personal-vocabulary loader validates a private file and applies it only at the
documented user-facing boundary. The desktop now exposes its local picker,
replace, clear, and malformed-cache retry controls. Full app-wide localization,
credential-factor behavior, and packaged interaction remain unverified.

## Personal-vocabulary recovery boundary

The current source hardens the local personal-vocabulary cache boundary on both
surfaces. Desktop load, replace, and clear operations serialize per
application-data directory. Malformed-cache recovery records a bounded byte
snapshot, deletes only when the cache is unchanged, and re-reads after cleanup;
a valid replacement written during recovery therefore survives. A failed
cleanup returns an explicit empty state with a retry action instead of leaving a
disabled clear control as the only route. The companion site exposes the same
retry state through browser-local storage.

The settings save path uses versioned debouncing and ignores both stale success
and stale failure results. The protected-token scanner also preserves unquoted
paths whose names contain comma or semicolon characters while still recognizing
adjacent UI text. The focused evidence is:

- `npm run test:personal-vocabulary-races` — passed, including stale-success,
  stale-failure, recovery-projection, and executable negative regressions;
- `npm run test:desktop-personal-vocabulary` — passed with 74 exact negative
  regressions and a replacement-during-cleanup probe;
- `npm run test:personal-vocabulary` — passed, including the comma/semicolon
  path boundary;
- `npm run build` — passed for the desktop main process, renderer, and icon;
- `npm --prefix site run build` — passed for the static companion build; and
- `git diff --check` plus the focused syntax checks — passed.

Packaged runtime interaction and real capture evidence were subsequently
verified for the released `app-0.1.50` package through the approved headless
route. Accessibility evidence is partial: tab focus movement was observed,
but a complete screen-reader audit and full arrow/Home/End coverage across all
surfaces remain open.

Read `docs/reference/notification-centre.md` before extending either review
surface. The desktop article is already registered in
`src/renderer/offline-documentation-registry.ts`; the current evidence is
source, focused contract, and renderer/main build only, not packaged runtime
interaction or capture evidence.

## Current release proof (v0.1.52)

The current release audit for commit `53f304e9a389e5264739d2cab9383f10083f70e6`
verified GitHub Actions run
[`31847230951`](https://github.com/Ding-Ding-Projects/minecraft-server-command-center/actions/runs/31847230951)
and published release `v0.1.52`.

The release targets that commit and exposes `Setup.exe`, `RELEASES`, and
`minecraft-server-command-center-0.1.52-full.nupkg`. The published `Setup.exe`
URL is
<https://github.com/Ding-Ding-Projects/minecraft-server-command-center/releases/download/v0.1.52/Setup.exe>
and its exact published size is `140467200` bytes with SHA-256
`b196aa8bfccf716406560c68f97e781c473f8240543d18980c9e7716ec289302`.
`RELEASES` has SHA-256
`b5c708d33fff25b121d81add33b78f10788a384163a372b778530c54c679f249`; the
full nupkg has SHA-256
`b8b19c1c73f577cdec01ec08c8a4844aeead72abab147a6bf542664e51d2f15c`.
The release timing is `00:03:00`, the dim-sum code name is
`Steamed Curry Cuttlefish · 咖喱蒸魷魚`, and the assets are unsigned; no signing
material is used. The release notes link to the public catalog photo, but do
not copy or attach a second catalog image.

The published line-count table reports 73 own-source files / 24062 total lines /
22289 non-blank, 0 test files / 0 / 0, 49 styles-or-markup files / 8090 /
6778, 1 generated file / 5 / 4, and 2 other-project-text files / 54 / 44. Its
project total is 124 files / 32206 lines / 29111 non-blank; its grand total is
125 / 32211 / 29115; and its attribution total matches. One package-manager
lockfile is excluded.

The release workflow does not run automated tests or lint. Local evidence also
includes the companion-site build, type-check, changelog guard, vertical-tab
keyboard guard, the real built focus capture, and direct `Setup.exe /silent`
exit code `0`. A complete screen-reader audit and a positive local Java probe
remain unverified.

## Previous release proof (v0.1.51)

The release audit for commit `0e599ccb0fc7a1d0cf256db3d775e86c200ec913`
verified GitHub Actions run
[`31844310617`](https://github.com/Ding-Ding-Projects/minecraft-server-command-center/actions/runs/31844310617)
and published release `v0.1.51`.

The release targets that commit and exposes `Setup.exe`, `RELEASES`, and
`minecraft-server-command-center-0.1.51-full.nupkg`. The published `Setup.exe`
URL is
<https://github.com/Ding-Ding-Projects/minecraft-server-command-center/releases/download/v0.1.51/Setup.exe>
and its exact published size is `140467200` bytes. The release timing is
`00:02:35`, the dim-sum code name is
`Steamed Beef Tripe with Chu Hou Sauce · 柱侯金錢肚`, and the assets are
unsigned; no signing material is used. The verified catalog photo is attached
to the release.

The published line-count table reports 73 own-source files / 23979 total lines /
22208 non-blank, 0 test files / 0 / 0, 49 styles-or-markup files / 8071 /
6760, 1 generated file / 5 / 4, and 2 other-project-text files / 54 / 44. Its
project total is 124 files / 32104 lines / 29012 non-blank; its grand total is
125 / 32109 / 29016; and its attribution total is 125 / 32109 / 29016. One
package-manager lockfile is excluded.

The release workflow does not run automated tests or lint. Local evidence also
includes the companion-site build, type-check, changelog guard, vertical-tab
keyboard guard, packaged launch, installed `app-0.1.51` launch, direct
`Setup.exe /silent` exit code `0`, planner import /
normalized-preview / save / discard flow, bounded Java discovery, and review-only
Paper compatibility states. A complete screen-reader audit and a positive local
Java probe remain unverified.

## Java runtime package-seam repair

The historical isolated task ref carried the bounded repair at
`4017a9d8fb814580bc466e709eb77f2c3f1913b3`.
The repair is now integrated into `main` at
`21fbb9b1377e4efdfc6a00798fa2749bf7aaa785`; `build:main` copies the checked-in
`src/main/java-runtime-manager.cjs` beside the compiled
`dist/main/java-runtime-controller.js`; the focused package-seam check proves
the byte match and deliberately fails when the manager is absent from staged
main output.

The supported `build-installer.bat /s` path returned exit code 0. Its extracted
`app.asar` contains both required entries, the packaged manager matches the
source SHA-256, and `Setup.exe` is unsigned. Exact local artifact sizes and
hashes are recorded in
[`docs/verification/java-runtime-package-seam.md`](docs/verification/java-runtime-package-seam.md).
The v0.1.50 packaged and installed launches verified that the manager is present
in the released app. Direct installer process exit-code capture remains
unverified; the release and remote workflow evidence are recorded above.

## Universal inventory guard repair

The second bounded repair lane is based on exact target commit
`fdbef9e265fac3bf015f6f3fc52dd1a26df4e180`, whose requested base is
`958d4439c77bff27d5a726655269b479087f0b6a`. The earlier target/base pair
`958d4439c77bff27d5a726655269b479087f0b6a` /
`d04c246b8a5282b7a7ee252c57f0f9a778c78114` is historical first-repair
context, not the source of this lane.

The hand-written oracle still preserves exactly 27 canonical rows, 7 evidence
slots, and 2 independent surface keys per row. It continues to validate the
production registry and the metadata-owned Markdown projection, reject
not-applicable values for mandatory slots, and allow persistence to be
not-applicable only with an explicit reason. Product rows retain their existing
partial, not-implemented, and unverified states.

The guard now records both kinds of proof honestly. Aggregate mutations keep
the stale-document checks that prove the Markdown projection and row shape.
Targeted R2-R5 mutations regenerate the affected metadata-owned projection
before running the semantic assertion, so stale Markdown cannot be the reason
they fail: surface records and path arrays are independently owned; the
mandatory applicability mutation changes only `status`; the staged-only path
is rejected by immutable `HEAD` membership rather than the mutable index; and
  duplicate desktop/companion-site and overlap path mutations isolate uniqueness
  and disjointness. Reparse
coverage retains the final-component symlink and adds an ancestor junction
probe whose descendant file remains valid; the probe calls the shared
path-component assertion directly, making that assertion itself decisive.
Reparse creation accepts only `EACCES`, `EINVAL`, `ENOTSUP`, or `EPERM`, and
every fixture is removed and verified.

Verification for this lane: `npm run test:universal-contract-inventory`
passed with 27 canonical rows, 7 evidence slots, 2 independent surface keys
per row, and 894 negative mutations on the host supporting both
`ancestor-junction` and `final-symlink` fixtures. Aggregate stale-projection,
regenerated-projection, staged-only, status-only applicability,
uniqueness/disjointness, ancestor-reparse, final-symlink, and cleanup probes
passed. The focused `npm run test:universal-contracts`,
`npm run test:offline-documentation`, both syntax checks, and `git diff --check`
also passed. Temporary assertion-removal probes for R2-R6 were restored before
the final run; the independent audit found R3-R5 red and R2/R6 green. Node emitted only
the existing `MODULE_TYPELESS_PACKAGE_JSON` warnings for the TypeScript
contract modules; no packaged runtime, accessibility interaction, release, or
capture evidence is claimed.

This follow-up starts from exact base commit
`3e6671a5ff79b4a6d9f78c8da2117175112f53e9`. It adds an exact source-contract
mutation for the production `assertNoReparseComponents(relativePath, context);`
call inside `assertRepositoryFile`; removing that call must turn the inventory
check red. The independent assertion-removal audit of the prior R2-R6 probes
was narrower than the earlier wording claimed: R3-R5 turned red, while R2 and
R6 stayed green. This record therefore makes no claim that all R2-R6 probes
turned red.

Follow-up verification: `npm run test:universal-contract-inventory` passed with
27 canonical rows, 7 evidence slots, 2 independent surface keys per row, and
895 negative mutations, including `ancestor-junction` and `final-symlink`
fixtures. The added production-call removal mutation turned the checker red;
fixture cleanup also passed. No packaged runtime, accessibility interaction,
release, or capture evidence is claimed.

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
passed locally; relevant build, type, packaged-runtime, and capture evidence is
recorded below. Read the [Planner Handoff v1 article](docs/site/planner-handoff-v1.md)
before extending this boundary.

The issue #3 lane's local evidence on 2026-08-14 is:

- `npm run test:planner-handoff` — passed, 185 focused assertions;
- `npm run build` — passed for the main process, renderer, generated icon, and
  typed catalog copy;
- `npx tsc --noEmit -p site/tsconfig.json` — passed for the companion source;
- `npm --prefix site run build` — passed for the static companion build; and
- `git diff --check` — passed with no whitespace errors.

The approved headless route then exercised the packaged planner file picker,
normalized preview, explicit local save, discard, and a real keyboard Tab focus
transition. The issue-specific planner capture is linked from the public handoff
comment. The full screen-reader audit and a direct installer process exit-code
capture remain unverified; the current release and CI links are recorded above.

## Desktop foundation record

The desktop source contains:

- a normalized schema-version-1 server draft stored under Electron user data;
- narrow generic native folder, JAR, and configuration picker requests, plus a
  dedicated privileged Java-runtime chooser;
- a frameless, sandboxed, context-isolated Material Design 3 renderer with
  nine vertical setup tabs, including a bundle-only Docs reader;
- a guided Java runtime card that keeps candidate paths in the main process,
  shows opaque candidate/source summaries with safe metadata, accepts native
  executable and Java-home-folder choices, probes selected Java with fixed
  direct arguments, validates a bounded official Paper project-version
  snapshot, and renders structured catalog, compatibility, and Spigot-
  unverified states;
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
requirements to Spigot. When no compatible runtime is selected, its setup plan
contains only review metadata, official source links, and explicit-confirmation
requirements; every route remains `not-executed` and `no-system-state-changed`.

## Issue #4 task handoff

The task branch `issue/java-runtime-compatibility-20260814` is isolated in
`C:\Users\Administrator\Documents\GitHub\_puppy-issue4-java-compatibility-20260814`.
It adds native executable and Java-home-folder choices, real bounded candidate
metadata, direct selected-executable probing, canonical official Paper
recommendation assessment, and review-only setup routes. It does not install
Java, invoke a package manager, execute shell text, start or stop a server,
download artifacts, write server configuration, transfer credentials, or claim
Spigot compatibility. The focused test is
`npm run test:java-runtime-guidance`; the fresh linked checkout has no local
`node_modules`, so the `npm run build:main` wrapper cannot start because
`tsc` is unavailable without a package-manager install. The direct main
type-check and Vite renderer build passed with the already-installed toolchain
through a temporary process-local configuration that was removed afterward.

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
