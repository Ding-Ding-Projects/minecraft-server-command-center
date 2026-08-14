# Changelog

## 0.1.33 — 2026-08-14

### Changed

- Published the bounded universal-settings foundation and its linked evidence
  records from commits
  [`130f2b1`](https://github.com/Ding-Ding-Projects/minecraft-server-command-center/commit/130f2b1b45586c16c07efc1957b3cb150f67e922) and
  [`44d23c9`](https://github.com/Ding-Ding-Projects/minecraft-server-command-center/commit/44d23c9c8bbbe9aa2967f17b5c27f49cebcdee10).
- Published the unsigned Windows Squirrel.Windows artifacts with dim-sum code
  name `Quail Egg Siu Mai · 鵪鶉蛋燒賣`.

### Verification

- GitHub Actions run
  [`31775779448`](https://github.com/Ding-Ding-Projects/minecraft-server-command-center/actions/runs/31775779448)
  completed successfully and published the non-draft release
  [`v0.1.33`](https://github.com/Ding-Ding-Projects/minecraft-server-command-center/releases/tag/v0.1.33)
  for exact commit `44d23c9c8bbbe9aa2967f17b5c27f49cebcdee10`.
- Release timing was `00:02:21`; `Setup.exe`, `RELEASES`, and the full
  `.nupkg` were published, unsigned, and each download URL returned HTTP 200.
- The release line-count table reported 20,855 non-generated total lines and
  18,676 non-blank lines, with 20,860 grand-total lines and 18,680 grand-total
  non-blank lines.

## 0.1.32 — 2026-08-14

### Changed

- Recorded the universal surface coverage baseline at commit
  [`7974e8b`](https://github.com/Ding-Ding-Projects/minecraft-server-command-center/commit/7974e8b975838ed167710e1aa130024fd457f897).
- Published the unsigned Windows Squirrel.Windows artifacts with dim-sum code
  name `Crab Roe Siu Mai · 蟹籽燒賣`.

### Verification

- GitHub Actions run
  [`31771514026`](https://github.com/Ding-Ding-Projects/minecraft-server-command-center/actions/runs/31771514026)
  completed successfully and published the non-draft release
  [`v0.1.32`](https://github.com/Ding-Ding-Projects/minecraft-server-command-center/releases/tag/v0.1.32).
- Release timing was `00:02:22`; the release contains `Setup.exe`, `RELEASES`,
  and the full `.nupkg`, all unsigned. The release workflow builds and packages
  but does not run tests or lint.
- The release line-count table reported 19,382 non-generated total lines and
  17,327 non-blank lines, with 19,387 grand-total lines and 17,331 grand-total
  non-blank lines.

## 0.1.31 — 2026-08-14

### Changed

- Refreshed release handoff evidence at commit
  [`c75f0e0`](https://github.com/Ding-Ding-Projects/minecraft-server-command-center/commit/c75f0e0efa5330b4262a7699a8c7f9af29ed14c5).
- Published the unsigned Windows Squirrel.Windows artifacts with dim-sum code
  name `Classic Siu Mai · 燒賣`.

### Verification

- Release [`v0.1.31`](https://github.com/Ding-Ding-Projects/minecraft-server-command-center/releases/tag/v0.1.31)
  was published from the verified release workflow. Its line-count table
  reported 19,344 non-generated total lines and 17,292 non-blank lines.

## 0.1.30 — 2026-08-14

### Changed

- Corrected companion-site lint findings around deferred browser-storage
  restoration, checkbox naming, overlay dismissal, and an unused helper.
- Refreshed the embedded installer handoff to the published `v0.1.30`
  `Setup.exe` asset for commit `ffe3c43df50c29d254526d616db5150325179af2`.

### Verification

- Local `build.bat /s`, `build-installer.bat /s`, companion-site build, Pages
  staging, and companion-site lint completed. GitHub Actions run
  `31770796058` published the unsigned Squirrel.Windows artifacts. No automated
  desktop tests, runtime interaction, or captures were run.

## Unreleased

### Changed

- Added a browser-local notification centre foundation for the companion site's
  non-blocking notices: bounded persistence, Active/Dismissed/All review,
  accessible dismiss and Review actions, explicit selection scope, inverse
  selection, and bulk dismissal for active dismissible records
  ([`eab9433`](https://github.com/Ding-Ding-Projects/minecraft-server-command-center/commit/eab94338fbb0f75621213f2b66cd569478853c3e)). Records use schema v1,
  stay in bounded browser-local storage, fail closed on malformed or
  unsupported data, and are never delivered remotely. The current controls
  ship English source copy; complete localization, desktop implementation, and
  packaged-runtime interaction remain outside this partial boundary.
- Added the desktop renderer notification-centre foundation with bounded local
  schema-v1 records for existing snackbar events, non-blocking Review/Dismiss
  actions, Active/Dismissed/All views, scoped select-all, inverse selection, and
  dismissible-only bulk dismissal
  ([`d12e8f7`](https://github.com/Ding-Ding-Projects/minecraft-server-command-center/commit/d12e8f7dd1211df706ec18857b004f714ae5d6be)). The article is registered in
  the offline documentation bundle. Focused source checks and renderer/main
  builds passed; packaged runtime interaction, complete localization, and
  capture evidence remain unverified.
- Kept warning and error notices visible until dismissal while preserving the
  short informational and success timeout
  ([`7b37bd6`](https://github.com/Ding-Ding-Projects/minecraft-server-command-center/commit/7b37bd6332924bf0d2c13fd59bd154a256af9139)).

### Verification

- `npm run test:site-notification-center` passed; TypeScript passed via the
  primary checkout's installed `tsc`; the site build passed via the existing
  Vinext toolchain; and site lint passed with 0 errors and 2 existing `img`
  warnings at `site/app/page.tsx` lines 2150 and 2217.
- No browser interaction, packaged-artifact interaction, capture, deployment,
  or CI verdict is claimed for this source-only lane.

### Added

- A shared desktop search foundation for the existing Docs and Universal
  settings surfaces: plain text remains the default, regex is an explicit
  opt-in through an anchored builder, local evaluation is bounded, and
  `Ctrl+Shift+F` opens a command palette that focuses those searches or their
  builders. The hand-written negative regression removes each registration and
  the shortcut one at a time; complete app-wide menu, dropdown, and command
  coverage remains partial ([`a6468a9`](https://github.com/Ding-Ding-Projects/minecraft-server-command-center/commit/a6468a924620761622714ff1d545c8827eab14a6)).

- A desktop-only offline documentation browser foundation: a typed bundle of
  the non-site Markdown articles, one escaped local renderer path, title/body
  search with a bounded opt-in regex hook, local article-link resolution, and a
  hand-written completeness check ([`f05a8bf`](https://github.com/Ding-Ding-Projects/minecraft-server-command-center/commit/f05a8bf0bafdeddc75647b35b4e0e4a62d31517f)).
  `npm run test:offline-documentation`, `npm run test:universal-contracts`,
  and `npm run build` passed; packaged desktop interaction and captures remain
  unverified.

- A partial universal-settings foundation for the desktop and companion site:
  bounded schema-version-1 normalization, local persistence, independent
  language funny levels, dialog emoji, renameable School mode, display name,
  theme, density, seed color, tab docking, local logo selection, and a
  fail-closed personal-vocabulary JSON parser ([`130f2b1`](https://github.com/Ding-Ding-Projects/minecraft-server-command-center/commit/130f2b1b45586c16c07efc1957b3cb150f67e922)). Full app-wide contract coverage
  remains tracked in the completeness inventory.

- Guided desktop Java-runtime discovery and review controls using opaque
  candidate IDs, bounded conventional locations, a native executable picker,
  fixed direct version probing, and review-only recovery states.
- Strict schema-version-1 Paper Downloads Service project-version catalog
  adapter with a bounded 54-entry numeric-key snapshot, including the `1.14`
  key in group `1.14`, fail-closed malformed/unknown entry handling, and
  structured catalog provenance/count projection.
- Planner Handoff v1 documentation for a strict versioned, bounded, non-secret,
  user-mediated local JSON exchange between the browser planner and desktop
  draft boundary.
- Desktop-foundation architecture documentation for a typed Minecraft server draft, narrow native path selection, renderer bridge, and tokenized argument preview.
- Paper and Spigot command-line configuration guidance that makes the current no-launch boundary explicit.
- A hand-written completeness inventory and categorized documentation indexes.
- Typed-registry-only argv preview composition and a visible automatic-update-unavailable boundary.

### Changed

- The companion site now applies already-validated personal-vocabulary entries
  to its private user-facing text boundary in one pass. Clear, invalid-cache,
  file-read, and local-storage failure paths keep the previous valid wording or
  restore the shipped wording without partial application; code, commands,
  URLs, paths, identifiers, and factual external values remain unchanged.
- The direct argv preview now keeps the selected Java executable in the
  privileged runtime-review controller and renders a non-executable `java`
  placeholder instead of accepting a renderer-supplied path as a process target.
- The project documentation now distinguishes source-design evidence from build, package, runtime, accessibility, and capture evidence.
- Future release notes generate their project line-count and surviving-line attribution table from the committed release metadata command.
- Release notes now resolve a next-unused public dim sum code name and link the published catalog photo when bounded metadata is available; they state an honest omission when it is not, without copying an image into this project.
- Release timing now derives its start from the earliest actual GitHub Actions job for the current attempt and labels release-publication completion separately from terminal workflow completion.
- The companion site's Home and Release status destinations now use an embedded version-pinned installer manifest with the exact release tag, source commit, `Setup.exe` asset URL, published size, release record, and unsigned warning. They do not use a latest-release URL, browser release lookup, background transfer, or completion claim.
- GitHub Pages publication now stages the static root document and the project-prefixed `_next` assets into the same publish root, adds `.nojekyll`, and checks every emitted project-prefixed asset reference before publication so the deployed companion keeps its styles and scripts.

- The handoff record now states explicit exclusions for paths, URLs,
  credentials, secrets, raw command or argument text, file contents, remote
  transfer, server operation, configuration-file writes, arbitrary filesystem
  access, and execution.

### Verification

- `npm run test:universal-contracts` passed and the root `npm run build` passed
  for the changed desktop source. `npm --prefix site run lint` completed with
  two image-element warnings. `npm --prefix site run build` and
  `npx tsc --noEmit -p site/tsconfig.json` also completed. No
  packaged runtime interaction, accessibility interaction, or real captures
  were run. This verification record is carried by
  [`130f2b1`](https://github.com/Ding-Ding-Projects/minecraft-server-command-center/commit/130f2b1b45586c16c07efc1957b3cb150f67e922).

- Documentation-only change. No test, lint, build, package, runtime interaction, capture, release, or server-process action is represented as having occurred.
- Planner Handoff v1 documentation adds no verified browser UI, desktop UI,
  selected-file import, preview, apply/save, accessibility, review, website
  publication, source-control publication, or server-control evidence.
- Java runtime guidance adds no verified discovery, probe, catalog, compatibility,
  installation, package-manager, runtime, or capture evidence. The supported
  build and package result is reported separately with the exact candidate artifact.

