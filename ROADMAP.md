# Roadmap

## Status

This is a source-only companion-site foundation. It has no deployment, public
endpoint, release, installer, server integration, or external-service
integration to verify.

## Completed foundation record

- Documented the companion site's source-only and local-only boundary.
- Defined the planning surfaces and the configuration-planner model.
- Added continuation and handoff records that distinguish source work from
  deployment or runtime evidence.
- Added a sanitized operational mirror in `AGENTS.md` for future contributors.

## Next implementation slices

1. **Companion shell** — replace the starter screen with the accessible
   browser-local planning navigation and clear empty states.
2. **Planner schema** — define a bounded, versioned non-secret schema for
   server profiles, configuration selections, command drafts, and exports.
3. **Configuration controls** — render typed, validated controls with
   provenance, effective values, restart requirements, and safety context.
4. **Command guidance** — provide searchable, version-aware Paper, Spigot, and
   vanilla command descriptions with command previews that never execute.
5. **Privacy and reset** — provide visible local-storage status, export,
   replace, and clear flows that do not retain paths, files, secrets, or
   server-derived data.
6. **Focused verification** — add source-level tests for validation, local
   storage, accessibility, keyboard use, no-network behavior, and rendered
   states.

## Explicitly deferred

- Deploying, hosting, publishing, or advertising a live companion site.
- Connecting to Minecraft servers, RCON, management protocols, local files,
  external registries, or third-party APIs.
- Handling passwords, tokens, keystores, player records, or any other secrets.
- Releasing installers or treating this companion-site source as a production
  control plane.

## Completion criteria for the next implementation task

A future implementation slice is ready to hand off only when it has a bounded
source scope, documented local-only data behavior, an explicit no-secret
boundary, focused verification evidence, and no unsupported claim of
deployment or live server control.
