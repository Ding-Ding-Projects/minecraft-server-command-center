# Desktop foundation completeness inventory

## Evidence rule

This is a hand-written inventory for the desktop foundation, not a discovered list. A source path in the table is source-only evidence until it has corresponding test, build, runtime, and capture evidence. Source inspection does not prove that a behavior runs in a built application.

## Inventory

| Foundation item | Implementation path or paths | Documentation | Source status | Test/build/runtime/capture evidence |
| --- | --- | --- | --- | --- |
| Project metadata and desktop package declaration | `package.json`, `electron-builder.yml` | [README](../../README.md), [architecture](../architecture/desktop-foundation.md) | Source inspected; not executed | Not recorded |
| Renderer and main-process TypeScript configuration | `vite.renderer.config.ts`, `tsconfig.json`, `tsconfig.main.json` | [architecture](../architecture/desktop-foundation.md) | Source inspected; not executed | Not recorded |
| Windows build entry point | `build.bat` | [README](../../README.md), [handoff](../../HANDOFF.md) | Source inspected and executed at `ffe3c43df50c29d254526d616db5150325179af2` | `build.bat /s` completed locally; no desktop runtime interaction was performed |
| Windows installer entry point | `build-installer.bat`, `scripts/verify-unsigned.mjs` | [README](../../README.md), [handoff](../../HANDOFF.md) | Source inspected and executed at `ffe3c43df50c29d254526d616db5150325179af2` | `build-installer.bat /s` produced and verified unsigned `Setup.exe`, `RELEASES`, and the full `.nupkg`; no installer execution was performed |
| Release packaging definition | `.github/workflows/release.yml` | [handoff](../../HANDOFF.md) | Source inspected and executed by run `31770796058` | Run succeeded and published `v0.1.30` for `ffe3c43df50c29d254526d616db5150325179af2`; workflow runs no automated tests or lint |
| Application mark source | `assets/app-mark.svg` | [README](../../README.md) | Source inspected; generated ICO header verified with seven 32-bit sizes; packaged rendering unverified | Not recorded |
| Typed server draft | `src/shared/server-draft.ts` | [architecture](../architecture/desktop-foundation.md) | Source inspected; schema version 1 with bounded normalization | Not recorded |
| Shared narrow bridge contract | `src/shared/desktop-api.ts` | [architecture](../architecture/desktop-foundation.md) | Source inspected; no launch method | Not recorded |
| Guided Java runtime discovery and compatibility review | `src/main/java-runtime-manager.cjs`, `src/main/java-runtime-controller.ts`, `src/shared/desktop-api.ts`, `src/main/index.ts`, `src/preload/index.ts`, `src/renderer/index.html`, `src/renderer/main.ts`, `src/renderer/styles.css` | [Java runtime setup](../reference/java-runtime-setup.md), [architecture](../architecture/desktop-foundation.md) | Source inspected; main-process-owned opaque candidate IDs, fixed direct version probe, bundled Paper target catalog snapshot with bounded count/provenance projection, Spigot explicitly unverified, and review-only plan presentation | This feature lane intentionally ran no focused test, runtime, or capture; shared release build/package/site checks are recorded separately |
| Draft persistence and native picker ownership | `src/main/index.ts`, `src/main/draft-store.ts` | [architecture](../architecture/desktop-foundation.md) | Source inspected; JSON under Electron userData, three generic picker kinds, and a dedicated privileged Java chooser | Not recorded |
| Bounded Paper/Spigot catalog adapter | `src/main/cli-catalog.ts`, optional `src/shared/paper-spigot-cli-catalog.cjs` | [Paper and Spigot CLI guidance](../server-configuration/paper-spigot-cli.md) | Source inspected; visible fallback when optional catalog is absent | Not recorded |
| Typed direct argv adapter | `src/main/argv-preview.ts`, `src/shared/paper-spigot-cli-catalog.cjs` | [Paper and Spigot CLI guidance](../server-configuration/paper-spigot-cli.md), [Java runtime setup](../reference/java-runtime-setup.md) | Source inspected; registry-only direct-array preview, non-executable Java placeholder, main-process-owned Java review path, and explicit Spigot omissions | Not recorded |
| Automatic-update availability boundary | `src/main/update-boundary.ts`, `src/main/index.ts`, `src/preload/index.ts`, `src/renderer/main.ts` | [architecture](../architecture/desktop-foundation.md) | Source inspected; explicitly unavailable, without update transport | Not recorded |
| Narrow renderer bridge | `src/preload/index.ts` | [architecture](../architecture/desktop-foundation.md) | Source inspected; no launch method | Not recorded |
| Desktop document shell | `src/renderer/index.html` | [architecture](../architecture/desktop-foundation.md), [Java runtime setup](../reference/java-runtime-setup.md) | Source inspected; custom title bar, seven vertical tabs, guided form, runtime candidate and assessment card, preview, and catalog shell | Not recorded |
| Guided Material Design 3 renderer behavior | `src/renderer/main.ts`, `src/renderer/styles.css` | [architecture](../architecture/desktop-foundation.md), [Java runtime setup](../reference/java-runtime-setup.md) | Source inspected; state wiring, Material Design 3 tokens, visible focus, responsive styles, reduced-motion rules, opaque runtime candidate cards, and review-only recovery states | Not recorded |
| Tabbed draft form | `src/renderer/index.html`, `src/renderer/main.ts`, `src/renderer/styles.css` | [architecture](../architecture/desktop-foundation.md) | Source inspected; vertical tab semantics and responsive presentation declarations | Not recorded |
| Paper CLI category mapping | `src/main/cli-catalog.ts`, `src/shared/paper-spigot-cli-catalog.cjs`, `src/renderer/main.ts` | [Paper and Spigot CLI guidance](../server-configuration/paper-spigot-cli.md) | Typed registry projection and renderer source inspected | Not recorded |
| Spigot unavailable/compatibility catalogue | `src/main/cli-catalog.ts`, `src/main/argv-preview.ts`, `src/renderer/main.ts` | [Paper and Spigot CLI guidance](../server-configuration/paper-spigot-cli.md) | Typed registry compatibility boundary and renderer source inspected | Not recorded |
| Copyable tokenized argv preview | `src/main/argv-preview.ts`, `src/shared/paper-spigot-cli-catalog.cjs`, `src/renderer/main.ts` | [Paper and Spigot CLI guidance](../server-configuration/paper-spigot-cli.md) | Typed registry emitter and renderer source inspected | Not recorded |
| No server-launch IPC | `src/shared/desktop-api.ts`, `src/main/index.ts`, `src/preload/index.ts` | [architecture](../architecture/desktop-foundation.md), [CLI guidance](../server-configuration/paper-spigot-cli.md) | Source inspected intentional boundary; no launch method exists | Not recorded; no launch behavior should be tested as present |
| Documentation indexes and handoff | `README.md`, `ROADMAP.md`, `HANDOFF.md`, `CHANGELOG.md`, `docs/**`, `AGENTS.md` | This inventory and category indexes | Documented | Documentation-only evidence |

| Planner Handoff v1 envelope and selected-file import boundary | src/shared/planner-handoff.ts, src/shared/desktop-api.ts, src/main/planner-handoff-file.ts, src/main/index.ts, src/preload/index.ts, src/renderer/main.ts | [Planner Handoff v1](../site/planner-handoff-v1.md), [architecture](../architecture/desktop-foundation.md) | Source-design contract recorded; implementation, selected-file flow, preview, apply/save behavior, local-only draft retention, and prohibited-route enforcement remain unverified | Not recorded |

## Required evidence before a release claim

Before release documentation can mark a row verified, it must name the exact source revision, focused test or check, built-artifact interaction, and capture evidence where a visible surface exists. The evidence should also record whether the server-launch boundary remained unavailable.

## Negative regression requirement

A future verification suite should include explicit negative checks that fail when the typed draft registration, Planner Handoff v1 schema or prohibited-field rejection, restricted bridge, Java runtime opaque-ID registration or Paper-catalog-validation/Spigot-non-mapping state, argv tokenization, Paper/Spigot category registration, documentation article, or explicit no-launch boundary is removed. The checks must be exact enough to detect an entirely missing registration rather than merely a renamed descendant.

## Current status

At this documentation revision, the listed shared/main/preload, renderer, Java-runtime guidance, and most feature definitions retain source or source-design evidence. The release audit separately records local build, unsigned package, companion-site build and lint, Pages staging, GitHub Actions, and published-release results for `ffe3c43df50c29d254526d616db5150325179af2`. Planner Handoff v1 remains a source-design record whose selected-file, preview, apply/save, and prohibited-route behavior is unverified. Desktop runtime interaction, accessibility interaction, real capture evidence, automated desktop tests, installer execution, and server integration remain unverified.
