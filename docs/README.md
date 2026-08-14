# Documentation

This documentation describes the desktop-foundation branch of Minecraft Server Command Center. It records current product boundaries and source-design mapping; it does not substitute for version-specific Paper, Spigot, plugin, build, or runtime verification.

## Categories

- [Companion site](site/README.md) — browser-local planning, the non-secret
  Planner Handoff v1 specification, static export, and version-pinned installer
  handoff boundaries.
- [Architecture](architecture/README.md) — process boundaries, typed draft ownership, and command-preview data flow.
- [Runtime reference](reference/README.md) — bounded Java runtime discovery, opaque candidate ownership, version probing, and Paper/Spigot compatibility limits.
- [Universal settings](reference/universal-settings.md) — the shared settings schema, local storage, bounded personal-vocabulary file contract, School mode, logo boundary, and evidence limits.
- [Server configuration](server-configuration/README.md) — Paper and Spigot command-line categories and the current no-launch limit.
- [Verification](verification/README.md) — the hand-written completeness inventory and evidence boundary.

## Current product boundary

The desktop foundation may create and persist a normalized configuration draft, open guided local pickers through a restricted bridge, discover Java only through bounded conventional locations or the native picker, probe one selected Java runtime with fixed direct arguments, validate the bundled official Paper Downloads Service project-version snapshot, and render a copyable argument-vector preview. It must not start, stop, restart, install Java, invoke a package manager, download artifacts, or directly mutate a Minecraft server. Paper compatibility is resolved only for a snapshot-present target covered by the documented matrix; Spigot requires its own sourced resolver.

Planner Handoff v1 is a documented user-mediated local JSON contract between
the browser-local planner and the desktop draft boundary. It remains
non-secret, versioned, bounded, and explicitly non-executing.

