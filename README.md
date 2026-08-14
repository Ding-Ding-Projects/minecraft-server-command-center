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
logo selection, and a local personal-vocabulary JSON boundary. These controls
are source and focused-contract evidence only; full app-wide localization,
credential-factor behavior, every-element appearance editing, complete tab
management, and built-artifact interaction remain unverified. See
[Universal settings](docs/reference/universal-settings.md) and the
[completeness inventory](docs/verification/completeness-inventory.md).

## Current boundaries

The companion site is a browser-local planning and documentation surface. It
does not access a local server, external API, private browser data, or secrets.
Planner Handoff v1 is specified as a separate user-mediated local JSON exchange
with the desktop planning draft boundary. It carries only versioned, bounded,
non-secret selected planning fields. It excludes paths, URLs, credentials,
secrets, raw command or argument text, file contents, remote transfer, server
operation, configuration-file writes, and arbitrary filesystem read or
execution. See [Planner Handoff v1](docs/site/planner-handoff-v1.md).

The desktop foundation can collect a typed normalized draft, use narrow native
folder/JAR/Java/configuration pickers, guide bounded Java runtime discovery
through opaque candidate IDs, probe one selected Java runtime with fixed direct
arguments, validate a bounded snapshot of the official Paper Downloads Service
project-version catalog, persist a local draft, display a tokenized
direct-argument preview, and show typed Paper/Spigot catalog categories. A
Paper target present in the snapshot and covered by the documented requirements
matrix can produce the existing requirement state; malformed, unknown, absent,
or out-of-matrix targets remain unverified, and Spigot compatibility remains
separately unverified. It deliberately does not expose a renderer process
launcher, Java-path text field, shell field, RCON route, arbitrary command
route, installer, package-manager action, download, or automatic-update
transport.

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
- **Release status** — a source-embedded version-pinned release record with a
  direct Windows installer handoff, explicit unsigned warning, and no browser
  release lookup or download-completion claim.

See [the companion-site documentation](docs/site/README.md) for its detailed
contract.

## Desktop foundation

The desktop renderer has nine vertical guided tabs: Overview, Runtime, World,
Access, Paths, Start preview, CLI catalog, Docs, and Universal settings. Its
preview is an array of argument tokens sourced from the versioned typed
Paper/Spigot registry; it is not a shell command and remains non-launching. The
Docs tab bundles the desktop Markdown set, renders it through one escaped local
path, searches title/body text, and resolves only local article links.

- [Desktop documentation index](docs/README.md)
- [Desktop foundation architecture](docs/architecture/desktop-foundation.md)
- [Planner Handoff v1](docs/site/planner-handoff-v1.md)
- [Paper and Spigot CLI guidance](docs/server-configuration/paper-spigot-cli.md)
- [Typed Paper and Spigot registry reference](docs/reference/paper-spigot-cli-catalog.md)
- [Java runtime setup reference](docs/reference/java-runtime-setup.md)
- [Universal settings foundation](docs/reference/universal-settings.md)
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
record does not claim automated desktop tests, browser or desktop interaction,
accessibility review, local installer operation, automatic-update behavior, or
server-process action. The 2026-08-14 release audit did verify the root build,
unsigned Squirrel.Windows package, companion-site build and lint, Pages staging,
GitHub Actions run `31775779448`, and published release `v0.1.33` for commit
`44d23c9c8bbbe9aa2967f17b5c27f49cebcdee10`. Read the relevant handoff and
completeness inventory before calling a surface fully verified.

The Planner Handoff v1 record and Java runtime guidance remain source-design
implementation records only. They do not claim that JSON export/import, native
selected-file parsing, Java discovery/probing, catalog validation,
compatibility assessment, preview, apply, save, browser UI, desktop UI, or any
excluded action boundary has been exercised.

## Continue from here

1. Keep companion-site implementation browser-local and non-secret.
2. Build the desktop foundation only through its bounded bridge and typed
   registry seams.
3. Add focused verification and built-artifact evidence before changing any
   source-only status to verified.
4. Add a server, update, deployment, or external-service route only through a
   separately authorized, documented, and verified feature.
