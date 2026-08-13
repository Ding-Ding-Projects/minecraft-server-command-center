# Documentation

This documentation describes the desktop-foundation branch of Minecraft Server Command Center. It records current product boundaries and source-design mapping; it does not substitute for version-specific Paper, Spigot, plugin, build, or runtime verification.

## Categories

- [Architecture](architecture/README.md) — process boundaries, typed draft ownership, and command-preview data flow.
- [Server configuration](server-configuration/README.md) — Paper and Spigot command-line categories and the current no-launch limit.
- [Verification](verification/README.md) — the hand-written completeness inventory and evidence boundary.

## Current product boundary

The desktop foundation may create and persist a normalized configuration draft, open guided local pickers through a restricted bridge, and render a copyable argument-vector preview. It must not start, stop, restart, or directly mutate a Minecraft server. A future lifecycle feature needs its own design and evidence.

