# Companion Site Documentation

This category documents the browser-local companion for Minecraft Server
Command Center. Its planning experience remains local and source-bound: it
must not be described as connected to a Minecraft server or backed by an
external service. One narrowly scoped, user-activated version-pinned installer link
is documented separately; it is not a release API, download manager, or
evidence of installation.

## Articles

- [Configuration planner](configuration-planner.md) — page model, structured
  settings, local-state limits, safety boundaries, and continuation guidance.
- [Planner Handoff v1](planner-handoff-v1.md) — strict versioned, non-secret,
  user-mediated local JSON exchange between the browser planner and desktop
  draft boundary; it excludes paths, commands, credentials, remote transfer,
  server operation, configuration writes, and arbitrary filesystem access.
- [Static Pages export](static-pages-export.md) — static Vinext output,
  project-path deployment boundary, and publication requirements.
- [Verified installer handoff](verified-installer-handoff.md) — embedded
  version-pinned release metadata, direct asset-link behavior, unsigned warning,
  and update boundary.

## Canonical navigation destinations

The companion documentation uses these exact destination names: **Overview**,
**Configure**, **Paper CLI**, **Spigot setup**, **Runtime**, **Safety**,
**Docs**, and **Release status**. They are planning and documentation labels,
not claims of a live server connection, external service, transfer completion,
installation, or Minecraft server operation. **Release status** can display a
separately verified, hard-coded version-pinned release record.

## Documentation rules

- Keep descriptions factual about the current source state.
- Separate planned behavior from verified behavior; a source edit is not proof
  of hosting, live server control, or production availability.
- Describe browser-local data as non-secret, bounded, versioned, resettable,
  and exportable.
- Describe planner handoff as user-selected local JSON import/export, never as
  a browser-to-desktop transport, server-control route, or filesystem escape.
- Do not include passwords, tokens, private addresses, player data, file
  contents, server logs, or other sensitive material in examples or diagrams.
- Do not add remote client fetching, third-party assets, analytics, telemetry,
  or external service claims to the companion-site documentation. The only
  allowed public-release exception is a user-activated, version-pinned GitHub
  release or asset URL documented by the verified installer handoff article.

## Related records

- [Repository overview](../../README.md)
- [Roadmap](../../ROADMAP.md)
- [Handoff](../../HANDOFF.md)
