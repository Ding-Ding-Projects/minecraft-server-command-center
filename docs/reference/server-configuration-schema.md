# Server Configuration Schema

`src/shared/server-configuration-schema.cjs` is the application-facing catalog for rendering typed Paper and Spigot configuration controls. It is deliberately descriptive: it does not read or write a server directory, run a process, parse arbitrary YAML, or make network requests.

## Purpose

The schema gives the desktop application one consistent source for:

- configuration-file families and their applicable server types;
- a control type appropriate to each documented value (`select`, switch, numeric stepper, native file or folder picker, collection chips, or a structured editor where a map is intrinsic to the setting);
- validation constraints that can be applied before a privileged save path is invoked;
- restart, safety, and provenance badges;
- official reference links for every field family; and
- minimal per-world override operations that preserve inherited values.

It intentionally does **not** expose an unrestricted YAML, properties, command, or script text box. A raw document editor would bypass the typed validation, provenance, and safety model. Values that genuinely need a discovered registry or an app-owned workflow remain visibly unavailable until that capability is present.

## Version-aware catalog contract

Minecraft server configuration changes across server families and builds. The baseline fields in this module are only eligible for editing after the application supplies a complete context:

1. `serverFamily`: `paper` or `spigot`.
2. `minecraftVersion`: the selected target game version.
3. `paperBuild` or `spigotBuild`: the selected implementation build.
4. `catalogRevision`: the official reference revision used to describe that build.
5. Discovered capabilities where required, such as a datapack, plugin-generator, entity, block, or packet registry.

`resolveConfigurationCatalog(runtime)` returns a family-and-field view with an explicit availability state. It reports `needs-version`, `needs-build`, `needs-catalog-revision`, or `needs-discovery` rather than enabling a control from a stale or guessed schema. The module does not fetch a catalog itself; fetch and provenance recording belong to the host application's privileged update workflow.

## Supported configuration families

| Family | Applies to | Managed file(s) | Rich-control examples |
| --- | --- | --- | --- |
| Minecraft properties | Paper and Spigot | `server.properties` | game mode and difficulty selects; numeric view-distance and permission steppers; network-host and port pickers; secret-vault references for remote-console credentials; discovery-backed datapack chips |
| Bukkit | Paper and Spigot | `bukkit.yml` | lifecycle switches; directory/file pickers; connection throttle stepper; spawn and tick-rate controls; discovered plugin generator and biome-provider selectors |
| Spigot | Paper and Spigot | `spigot.yml` | watchdog and logging switches; numeric thresholds; registry-backed command chips; structured statistics map; default and named world controls |
| Paper global | Paper only | `config/paper-global.yml` | console, chunk-worker, packet-limit, proxy-forwarding, update, profiler, watchdog, and risk-gated unsupported-setting controls |
| Paper world | Paper only | `config/paper-world-defaults.yml`, `world/dimensions/<namespace>/<key>/paper-world.yml` | anti-xray, chunk, entity, hopper, redstone, tick-rate, and explicit risk-gated unsupported-setting controls |

The baseline is deliberately catalog-scoped rather than a claim that every key is valid on every release. A selected server/build must supply a matching official catalog before a host enables writes. Unsupported or unknown keys are not silently converted into generic free-form YAML fields.

## Provenance and world inheritance

The UI should always display the effective value and its source badge. The schema recognizes these sources:

- `server.properties`, `bukkit.yml`, `spigot.yml`, and `paper-global.yml` for server-level values;
- `paper-world-defaults.yml` for Paper's global world defaults;
- `paper-world.yml` for a Paper per-world leaf override;
- `spigot.yml:world-settings.default` for Spigot's default world settings; and
- `spigot.yml:world-settings.<world>` for a named Spigot world override.

For Paper, unspecified values in `paper-world.yml` inherit from `paper-world-defaults.yml`. `createMinimalWorldOverride()` accepts one `worldKey` only when it appears in its `discoveredWorldKeys` argument, then returns one `set-leaf` operation; it never clones an entire default document into a world file or constructs a target path from arbitrary text. The same principle applies to Spigot's `world-settings.default` and named world settings. `resolveWorldEffectiveValue()` exposes the final value and the badge that explains why it won.

## Safety model

Every field has a safety classification. The UI can render it as a factual badge and enforce the required acknowledgement before a risky value is committed:

- `normal` and `operational-impact` identify ordinary behavior/performance controls.
- `network-exposure` identifies listeners, status/query behavior, binding, or remote endpoints.
- `access-control` identifies authentication, whitelisting, proxy forwarding, or permission-related controls.
- `credential-bearing` requires a vault reference; plaintext credentials are not accepted by schema validation.
- `data-integrity` identifies player data, world data, watchdog, or save behavior that could have durable effects.
- `plugin-compatibility` identifies controls that can affect plugin loading or events.
- `unsupported-upstream` identifies Paper settings documented as unsupported and subject to removal or side effects.
- `server-managed` identifies fields such as `spigot.yml`'s `config-version` that must remain read-only.

Secret values such as `rcon.password` and the Velocity forwarding secret are modeled only as `{ kind: 'vault-reference', key: '...' }`. The host application must hold plaintext in the operating system credential vault and must never put it in ordinary settings, exports, history, logs, or UI diagnostics.

## Validation API

`validateConfigurationValue(fieldId, value)` validates a proposed value without changing any configuration file. It returns `{ valid, normalizedValue }` or `{ valid: false, error }`.

`validateConfigurationDraft(values)` validates a field-id/value record and returns one result per field. It rejects unknown fields, raw-edit boundaries, read-only values, out-of-range documented numeric values, malformed UUID or SHA-1 input, malformed URLs, duplicate chip values, non-vault secret material, and invalid typed values.

Validation is an input guard, not proof that a selected server build supports an option. The host must also require a catalog availability state of `available` before save.

## Required discovery boundaries

The schema will not invent dynamic values. The host must discover and provide a matching capability before these controls are enabled:

- datapacks for world-creation pack selections;
- plugin generators and biome providers from installed plugins;
- current API versions;
- vanilla commands for command-replacement choices;
- block, entity behavior, and entity sensor registries;
- serverbound packet identifiers for packet-limiter overrides; and
- resource-location statistics where a structured map requires them.

An unavailable dynamic control is an honest state with its exact missing capability named. It is not replaced with an arbitrary free-text command, plugin expression, YAML fragment, or filesystem path.

## Explicit advanced boundaries

The schema includes visible unavailable descriptors for:

- unrestricted raw YAML and Java-properties editors;
- Spigot's arbitrary `restart-script`, because arbitrary operating-system commands are not safe configuration controls; and
- server-managed configuration version values.

Paper's legacy `paper.yml` is migration-only. The current Paper CLI reference says that `--paper`/`--paper-settings` exists to migrate the legacy file and should not be used for new servers. A future UI should offer a backup-first migration notice, not create a new `paper.yml` editor.

## Official sources

- [Paper configuration overview](https://docs.papermc.io/paper/reference/configuration/)
- [Paper `server.properties` reference](https://docs.papermc.io/paper/reference/server-properties/)
- [Paper `bukkit.yml` reference](https://docs.papermc.io/paper/reference/bukkit-configuration/)
- [Paper `spigot.yml` reference](https://docs.papermc.io/paper/reference/spigot-configuration/)
- [Paper global configuration reference](https://docs.papermc.io/paper/reference/global-configuration/)
- [Paper world configuration reference](https://docs.papermc.io/paper/reference/world-configuration/)
- [Paper CLI argument reference](https://docs.papermc.io/paper/reference/cli-arguments/)
- [Paper command reference](https://docs.papermc.io/paper/reference/commands/)
- [Paper system-property reference](https://docs.papermc.io/paper/reference/system-properties/)
- [Spigot `spigot.yml` configuration guide](https://www.spigotmc.org/wiki/spigot-configuration/)

## Verification status

This change adds source and documentation only. No configuration file was written, no server was started, and no automated checks, build, package, runtime launch, or capture was run under the active rapid-delivery scope.
