# Minecraft Server Command Center

Minecraft Server Command Center is an early Material Design 3 workspace for
planning Minecraft server setup, Paper and Spigot configuration, and future
safe lifecycle workflows. This repository currently contains two source-only
foundations:

- a browser-local companion-site planner under `site/`; and
- a Windows desktop configuration foundation under `src/`.

Neither planner nor desktop runtime claims a live server connection or
server-process action. The companion site can display one separately verified,
published, version-pinned installer handoff; that static record is not evidence of a
local download, installation, update, or runtime action.

The current implementation also contains a partial universal-settings
foundation. The companion site and desktop renderer expose a bounded persisted
settings record with language mode, independent funny levels, dialog emoji,
renameable School mode, display name, theme, density, seed color, tab docking,
logo selection, and a local personal-vocabulary JSON boundary. The current
personal-vocabulary repair also serializes desktop cache operations, refuses to
delete a malformed cache after its bytes have changed, re-reads after cleanup,
exposes a direct retry action on both surfaces, and ignores stale settings-save
successes and failures. These controls are source and focused-contract
evidence only; full app-wide localization, credential-factor behavior,
every-element appearance editing, complete tab management, and built-artifact
interaction remain unverified. See
[Universal settings](docs/reference/universal-settings.md), [desktop presentation settings](docs/reference/desktop-presentation-settings.md), and the
[completeness inventory](docs/verification/completeness-inventory.md).

The desktop presentation-settings slice wires the existing local record into
the real settings surface: English, playful Hong Kong-style Cantonese, and
bilingual copy modes; independent English and Cantonese funny-level sliders;
and dialog/message-box emoji decoration that never enters control labels or
accessible names. Its focused payload-free check is
`npm run test:desktop-presentation-settings`. This remains source and focused
build evidence, not packaged-runtime or capture evidence.

## Current boundaries

The companion site is a browser-local planning and documentation surface. It
does not access a local server, external API, private browser data, or secrets.
Planner Handoff v1 is specified as a separate user-mediated local JSON exchange
with the desktop planning draft boundary. It carries only versioned, bounded,
non-secret selected planning fields. It excludes paths, URLs, credentials,
secrets, raw command or argument text, file contents, remote transfer, server
operation, configuration-file writes, and arbitrary filesystem read or
execution. See [Planner Handoff v1](docs/site/planner-handoff-v1.md).

The v1 source flow now implements that boundary: the companion exports and
imports only through user-activated local JSON actions, and the desktop uses a
native selected-file picker, bounded main-process validation, a normalized
preview, and a separate **Save normalized plan locally** action. The focused
`npm run test:planner-handoff` check covers malformed, version, duplicate-key,
size, prohibited-field, source-registration, and local-only draft-retention
regressions. On 2026-08-14, `npm run build`,
`npx tsc --noEmit -p site/tsconfig.json`, `npm --prefix site run build`, and
`git diff --check` also passed. The companion-site vertical-tab keyboard guard
also passed with its negative registration regression. This remains partial
accessibility evidence: the packaged desktop and companion surfaces have not
received a complete screen-reader audit.

The desktop foundation can collect a typed normalized draft, use narrow native
folder/JAR/Java/configuration pickers, guide bounded Java runtime discovery
through opaque candidate IDs, show safe candidate metadata, choose either a Java
executable or Java home folder, probe one selected Java runtime with fixed
direct arguments, validate a bounded snapshot of the official Paper Downloads
Service project-version catalog, persist a local draft, display a tokenized
direct-argument preview, and show typed Paper/Spigot catalog categories. A
Paper target present in the snapshot and covered by the documented requirements
matrix can produce the existing requirement state; malformed, unknown, absent,
or out-of-matrix targets remain unverified, and Spigot compatibility remains
separately unverified. When no compatible Java runtime is available, the
desktop shows a review-only setup plan with official Paper source metadata; it
does not execute any route. It deliberately does not expose a renderer process
launcher, Java-path text field, shell field, RCON route, arbitrary command
route, installer, package-manager action, download, server configuration write,
or automatic-update transport.

Sensitive material is out of scope across both surfaces. Do not put RCON
passwords, keystores, tokens, SSH material, private server addresses, player
data, or other secrets in source, browser storage, desktop draft storage,
documentation, or examples.

## Companion-site surfaces

The browser-local companion uses these planning destinations:

- **Overview** — local-only boundary and honest empty state.
- **Configure** — typed server, world, network, and plugin planning.
- **Paper CLI** — non-executing Paper launch and administration guidance.
- **Spigot setup** — non-secret compatibility planning.
- **Runtime** — version, Java requirement, and resource planning.
- **Safety** — consequential-operation and desktop-boundary explanations.
- **Docs** — local companion documentation.
- **Notification centre** — browser-local and desktop-renderer review of
  non-blocking notices, explicit selection scopes, inverse selection, and bulk
  dismissal for dismissible records.
- **Release status** — a source-embedded version-pinned release record with a
  direct Windows installer handoff, explicit unsigned warning, and no browser
  release lookup or download-completion claim.

See [the companion-site documentation](docs/site/README.md) for its detailed
contract.

## Desktop foundation

The desktop renderer has ten vertical guided tabs: Overview, Runtime, World,
Access, Paths, Start preview, CLI catalog, Docs, Universal settings, and
Notification centre. Its
preview is an array of argument tokens sourced from the versioned typed
Paper/Spigot registry; it is not a shell command and remains non-launching. The
Docs tab bundles the desktop Markdown set, renders it through one escaped local
path, searches title/body text through the shared bounded search matcher and
anchored regex builder, and resolves only local article links. Universal
settings uses the same builder path, and `Ctrl+Shift+F` opens a bounded command
palette for those existing desktop search surfaces. Notification centre records
the existing snackbar events in bounded renderer-local schema-v1 storage and
supports Active/Dismissed/All review, Review/Dismiss actions, scoped select-all,
inverse selection, and dismissible-only bulk dismissal. Complete menu,
dropdown, app-wide command, localization, and packaged runtime coverage remain
partial.

- [Desktop documentation index](docs/README.md)
- [Desktop foundation architecture](docs/architecture/desktop-foundation.md)
- [Planner Handoff v1](docs/site/planner-handoff-v1.md)
- [Paper and Spigot CLI guidance](docs/server-configuration/paper-spigot-cli.md)
- [Typed Paper and Spigot registry reference](docs/reference/paper-spigot-cli-catalog.md)
- [Java runtime setup reference](docs/reference/java-runtime-setup.md)
- [Universal settings foundation](docs/reference/universal-settings.md)
- [Notification centre foundation](docs/reference/notification-centre.md)
- [Offline documentation browser foundation](docs/reference/offline-documentation-browser.md)
- [Desktop completeness inventory](docs/verification/completeness-inventory.md)

## Source layout

| Path | Purpose |
| --- | --- |
| `site/app/` | React/Vinext companion-site presentation source. |
| `site/public/` | Companion-site local static assets. |
| `site/tests/` | Focused companion-site source-level test location. |
| `src/shared/` | Desktop typed draft and narrow bridge contracts. |
| `src/main/` | Desktop privileged process, draft store, typed preview adapter, and IPC. |
| `src/preload/` | Context-isolated desktop bridge. |
| `src/renderer/` | Frameless desktop Material Design 3 renderer. |
| `docs/site/` | Companion-site behavior and privacy documentation. |
| `docs/architecture/` | Desktop architecture documentation. |
| `docs/server-configuration/` | Desktop Paper/Spigot guidance. |

## Packaging and update boundary

The repository contains Windows Squirrel.Windows packaging and root
`build.bat` / `build-installer.bat` entry points. The intended installer is
unsigned. A generated application icon is created from the committed SVG
master during the build path; packaged icon rendering remains unverified.

The companion's Home and Release status destinations can link directly to one
verified published `Setup.exe` asset. The record includes the exact release
tag, source commit, published size, release URL, and unsigned warning; it does
not use a `latest` URL, request release data in the browser, start a background
transfer, or claim that an installer completed. See
[the verified installer handoff](docs/site/verified-installer-handoff.md).

Automatic updates are intentionally unavailable in the desktop foundation.
There is no configured update feed, integrity-validation path, background
download, staging, restart, rollback, or unsaved-work recovery implementation.

## Evidence status

The planner and desktop sources remain distinct from runtime evidence. This
record does not claim automated desktop tests, a complete accessibility audit,
automatic-update behavior, or server-process action. The 2026-08-14 release
audit verified the root build, unsigned Squirrel.Windows package, companion-site
build, GitHub Actions run `31838299717`, and published release `v0.1.50` for
commit `21fbb9b1377e4efdfc6a00798fa2749bf7aaa785`. The release record names the
unsigned `Setup.exe` asset at `140467200` bytes, workflow timing `00:02:33`,
dim-sum code name `Steamed Beef Tripe with Ginger and Scallion · 薑蔥牛柏葉`,
and the exact line-count table. The verified catalog photo is attached to the
release. Read the relevant handoff and completeness inventory before calling a
surface fully verified.

The Planner Handoff v1 source record now covers JSON export/import, native
selected-file parsing, normalized preview, explicit local save, local-only
draft retention, and prohibited-action rejection. The released `app-0.1.50`
package was launched through the approved headless route; the real planner
file-picker, normalized-preview, save, and discard flow was exercised, and the
Java runtime surface showed bounded discovery and review-only compatibility
states. A complete screen-reader audit, a positive local Java probe, and a
direct installer process exit-code capture remain unverified. Java runtime
guidance remains a separate source-design record.

## Continue from here

1. Keep companion-site implementation browser-local and non-secret.
2. Build the desktop foundation only through its bounded bridge and typed
   registry seams.
3. Add focused verification and built-artifact evidence before changing any
   source-only status to verified.
4. Add a server, update, deployment, or external-service route only through a
   separately authorized, documented, and verified feature.
