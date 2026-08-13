# Desktop foundation completeness inventory

## Evidence rule

This is a hand-written inventory for the desktop foundation, not a discovered list. A source path in the table is source-only evidence until it has corresponding test, build, runtime, and capture evidence. Source inspection does not prove that a behavior runs in a built application.

## Inventory

| Foundation item | Implementation path or paths | Documentation | Source status | Test/build/runtime/capture evidence |
| --- | --- | --- | --- | --- |
| Project metadata and desktop package declaration | `package.json`, `electron-builder.yml` | [README](../../README.md), [architecture](../architecture/desktop-foundation.md) | Source inspected; not executed | Not recorded |
| Renderer and main-process TypeScript configuration | `vite.renderer.config.ts`, `tsconfig.json`, `tsconfig.main.json` | [architecture](../architecture/desktop-foundation.md) | Source inspected; not executed | Not recorded |
| Windows build entry point | `build.bat` | [README](../../README.md), [handoff](../../HANDOFF.md) | Source inspected; not executed | Not recorded |
| Windows installer entry point | `build-installer.bat`, `scripts/verify-unsigned.mjs` | [README](../../README.md), [handoff](../../HANDOFF.md) | Source inspected; not executed | Not recorded |
| Release packaging definition | `.github/workflows/release.yml` | [handoff](../../HANDOFF.md) | Source inspected; not executed | Not recorded |
| Application mark source | `assets/app-mark.svg` | [README](../../README.md) | Source inspected; packaged icon output unverified | Not recorded |
| Typed server draft | `src/shared/server-draft.ts` | [architecture](../architecture/desktop-foundation.md) | Source inspected; schema version 1 with bounded normalization | Not recorded |
| Shared narrow bridge contract | `src/shared/desktop-api.ts` | [architecture](../architecture/desktop-foundation.md) | Source inspected; no launch method | Not recorded |
| Draft persistence and native picker ownership | `src/main/index.ts`, `src/main/draft-store.ts` | [architecture](../architecture/desktop-foundation.md) | Source inspected; JSON under Electron userData and four picker kinds | Not recorded |
| Bounded Paper/Spigot catalog adapter | `src/main/cli-catalog.ts`, optional `src/shared/paper-spigot-cli-catalog.cjs` | [Paper and Spigot CLI guidance](../server-configuration/paper-spigot-cli.md) | Source inspected; visible fallback when optional catalog is absent | Not recorded |
| Typed direct argv adapter | `src/main/argv-preview.ts`, `src/shared/paper-spigot-cli-catalog.cjs` | [Paper and Spigot CLI guidance](../server-configuration/paper-spigot-cli.md) | Source inspected; registry-only direct-array preview and explicit Spigot omissions | Not recorded |
| Automatic-update availability boundary | `src/main/update-boundary.ts`, `src/main/index.ts`, `src/preload/index.ts`, `src/renderer/main.ts` | [architecture](../architecture/desktop-foundation.md) | Source inspected; explicitly unavailable, without update transport | Not recorded |
| Narrow renderer bridge | `src/preload/index.ts` | [architecture](../architecture/desktop-foundation.md) | Source inspected; no launch method | Not recorded |
| Desktop document shell | `src/renderer/index.html` | [architecture](../architecture/desktop-foundation.md) | Source inspected; custom title bar, seven vertical tabs, guided form, preview, and catalog shell | Not recorded |
| Guided Material Design 3 renderer behavior | `src/renderer/main.ts`, `src/renderer/styles.css` | [architecture](../architecture/desktop-foundation.md) | Source inspected; state wiring, Material Design 3 tokens, visible focus, responsive styles, and reduced-motion rules | Not recorded |
| Tabbed draft form | `src/renderer/index.html`, `src/renderer/main.ts`, `src/renderer/styles.css` | [architecture](../architecture/desktop-foundation.md) | Source inspected; vertical tab semantics and responsive presentation declarations | Not recorded |
| Paper CLI category mapping | `src/main/cli-catalog.ts`, `src/shared/paper-spigot-cli-catalog.cjs`, `src/renderer/main.ts` | [Paper and Spigot CLI guidance](../server-configuration/paper-spigot-cli.md) | Typed registry projection and renderer source inspected | Not recorded |
| Spigot unavailable/compatibility catalogue | `src/main/cli-catalog.ts`, `src/main/argv-preview.ts`, `src/renderer/main.ts` | [Paper and Spigot CLI guidance](../server-configuration/paper-spigot-cli.md) | Typed registry compatibility boundary and renderer source inspected | Not recorded |
| Copyable tokenized argv preview | `src/main/argv-preview.ts`, `src/shared/paper-spigot-cli-catalog.cjs`, `src/renderer/main.ts` | [Paper and Spigot CLI guidance](../server-configuration/paper-spigot-cli.md) | Typed registry emitter and renderer source inspected | Not recorded |
| No server-launch IPC | `src/shared/desktop-api.ts`, `src/main/index.ts`, `src/preload/index.ts` | [architecture](../architecture/desktop-foundation.md), [CLI guidance](../server-configuration/paper-spigot-cli.md) | Source inspected intentional boundary; no launch method exists | Not recorded; no launch behavior should be tested as present |
| Documentation indexes and handoff | `README.md`, `ROADMAP.md`, `HANDOFF.md`, `CHANGELOG.md`, `docs/**`, `AGENTS.md` | This inventory and category indexes | Documented | Documentation-only evidence |

## Required evidence before a release claim

Before release documentation can mark a row verified, it must name the exact source revision, focused test or check, built-artifact interaction, and capture evidence where a visible surface exists. The evidence should also record whether the server-launch boundary remained unavailable.

## Negative regression requirement

A future verification suite should include explicit negative checks that fail when the typed draft registration, restricted bridge, argv tokenization, Paper/Spigot category registration, documentation article, or explicit no-launch boundary is removed. The checks must be exact enough to detect an entirely missing registration rather than merely a renamed descendant.

## Current status

At this documentation revision, the listed shared/main/preload, renderer, and build/package definitions have source-only inspection evidence. No test, build, package, runtime, accessibility, server integration, or capture result has been recorded.
