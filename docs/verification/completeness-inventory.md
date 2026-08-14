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

## Universal surface contract audit

This second list is intentionally hand-written and covers the universal
features required independently by the desktop application and the companion
site. A source mention, a label, or a partial foundation does not satisfy a
row. Every row needs an implementation, its own documentation, localized
copy, persistence where applicable, a focused check, built-artifact
interaction evidence, and a real capture before it can be marked verified.

| Canonical feature | Desktop surface | Companion site surface | Documentation / localization / persistence | Focused check / built interaction / capture |
| --- | --- | --- | --- | --- |
| English, playful Cantonese, bilingual modes; independent funny levels; emoji toggle; renameable School mode | Not implemented in `src/` | Not implemented in `site/` | No feature article, localized resources, or persisted contract | Not recorded |
| Spoken narrator, language choice, voice pickers, rate, pitch, queue, and accessibility coexistence | Not implemented in `src/` | Not implemented in `site/` | No documentation or persisted contract | Not recorded |
| Scheduled settings and validated external/Home Assistant sources | Not implemented in `src/` | Not implemented in `site/` | No schema article, localized copy, or persistence | Not recorded |
| Local personal-vocabulary JSON upload, validation, cache, replace, and clear | Not implemented in `src/` | Not implemented in `site/` | No private-loader article or localized control | Not recorded |
| Startup dim-sum surprise with bundled/public-catalog asset boundary | Not implemented in `src/` | Not implemented in `site/` | No runtime feature article or persisted behavior | Not recorded |
| Full anchored regex builder on every search, menu, dropdown, and settings surface | Partial planner regex control in `site/app/page.tsx`; no complete desktop coverage | Partial planner search control; no universal coverage | No complete per-surface inventory or localized coverage | No focused regression or built-artifact capture |
| Non-blocking notifications, notification centre, and bulk notification actions | Not implemented in `src/` | Partial notice rendering only; no centre/bulk contract | No complete article, persistence, or localized contract | Not recorded |
| Material 3 appearance system, every-element editor, infinite color translator, presets, import/export, and app-logo customization | Partial visual foundation only; no universal editor or logo surface | Partial theme controls only; no universal editor or logo surface | No complete appearance article, localized copy, or persisted schema | Not recorded |
| Complete browser-style tabs: docking, overflow, reorder, pin, groups, four searches, bulk close, and per-element appearance | Partial vertical tab shell in `src/renderer/` and `site/app/page.tsx` | Partial page tabs only | No complete tab/group article or persisted model | Not recorded |
| Toy locks on every element, tab/group locks, independent credentials, QR pairing, and recovery | Not implemented in `src/` | Not implemented in `site/` | No lock/authenticator/support-ticket records | Not recorded |
| Built-in authenticator, TOTP/HOTP standards, secret-safe history, and protected history manager | Not implemented in `src/` | Not implemented in `site/` | No authenticator or secret-history article | Not recorded |
| Support Tickets local recovery desk | Not implemented in `src/` | Not implemented in `site/` | No feature article or local ticket model | Not recorded |
| Command palette on `Ctrl+Shift+F`, rich controls, and exact teleport targets | Partial command palette in `site/app/page.tsx`; no desktop implementation | Partial planner palette; no complete destination/setting inventory | No complete command registry or localized coverage | No shortcut, teleport, or built-artifact capture proof |
| Destructive-action super confirmation and emergency exit | Not implemented in `src/` | Not implemented in `site/` | No destructive-action article or persisted history path | Not recorded |
| Local Git-backed version history for every user-managed record | Partial draft persistence only; no local history repository | Browser storage only; no local history manager | No complete history schema, export, or retention article | Not recorded |
| Changelog viewer with date picker, search, commit links, copy, and export | Not implemented in `src/` | Not implemented in `site/` | `CHANGELOG.md` exists but no viewer contract | Not recorded |
| External-editor handoff, especially Visual Studio Code workspace opening | Not implemented in `src/` | Not implemented in `site/` | No feature article or editor detection contract | Not recorded |
| Complete export formats and re-importable records | Planner JSON handoff is partial and bounded; universal format set absent | Planner JSON export is partial; universal format set absent | No format matrix or loss disclosure for every record | Not recorded |
| Bulk actions on every list, table, grid, history, and notification surface | Not implemented in `src/` | Not implemented in `site/` | No bulk-action inventory or localized contract | Not recorded |
| Local categorized file converter with bundled adapters, PDF operations, queue, cancellation, and output validation | Not implemented in `src/` | Not implemented in `site/` | No converter catalog, adapter article, or persistence | Not recorded |
| Complete local Ollama suite manager, exhaustive model catalog, hardware fit, chat, and allowlisted harness | Not implemented in `src/` | Not implemented in `site/` | No Ollama article, schema, or local state | Not recorded |
| Browser-extension Start download, Downloading, and Download complete surfaces | Not implemented in `src/` | Not implemented in `site/` | No extension integration or capture inventory | Not recorded |
| Offline in-app documentation browser and complete landing/documentation site | Partial documentation source only; no bundled app browser | Partial planner docs surface; not full contract | No article bundle completeness guard | Not recorded |
| Accessibility, responsive sizing, high-scale layout, reduced motion, and real captures for every surface | Source declarations exist in places; full coverage unverified | Source declarations exist in places; full coverage unverified | No per-surface localized capture matrix | No approved headless UI interaction or capture evidence |
| Shared live Status Hub registration and app-owned status surface | Not implemented | Not implemented | Scratchpad fallback exists only for this session | No authenticated delivery or app proof |
| Negative regression guard for the complete inventory | Not implemented; current negative list is future work | Not implemented | No fail-closed universal inventory test | Not recorded |

## Required evidence before a release claim

Before release documentation can mark a row verified, it must name the exact source revision, focused test or check, built-artifact interaction, and capture evidence where a visible surface exists. The evidence should also record whether the server-launch boundary remained unavailable.

## Negative regression requirement

A future verification suite should include explicit negative checks that fail when the typed draft registration, Planner Handoff v1 schema or prohibited-field rejection, restricted bridge, Java runtime opaque-ID registration or Paper-catalog-validation/Spigot-non-mapping state, argv tokenization, Paper/Spigot category registration, documentation article, or explicit no-launch boundary is removed. The checks must be exact enough to detect an entirely missing registration rather than merely a renamed descendant.

## Current status

At this documentation revision, the listed shared/main/preload, renderer, Java-runtime guidance, and most feature definitions retain source or source-design evidence. The release audit separately records local build, unsigned package, companion-site build and lint, Pages staging, GitHub Actions, and published-release results for `ffe3c43df50c29d254526d616db5150325179af2`. Planner Handoff v1 remains a source-design record whose selected-file, preview, apply/save, and prohibited-route behavior is unverified. Desktop runtime interaction, accessibility interaction, real capture evidence, automated desktop tests, installer execution, and server integration remain unverified.
