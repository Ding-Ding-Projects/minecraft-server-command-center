# Changelog

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

### Added

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

- Documentation-only change. No test, lint, build, package, runtime interaction, capture, release, or server-process action is represented as having occurred.
- Planner Handoff v1 documentation adds no verified browser UI, desktop UI,
  selected-file import, preview, apply/save, accessibility, review, website
  publication, source-control publication, or server-control evidence.
- Java runtime guidance adds no verified discovery, probe, catalog, compatibility,
  installation, package-manager, runtime, or capture evidence. The supported
  build and package result is reported separately with the exact candidate artifact.

