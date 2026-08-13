'use strict';

/**
 * A version-aware, UI-facing configuration catalog for Paper and Spigot.
 *
 * This module intentionally contains no file-system, process, network, YAML, or
 * properties-file write operations. It describes safe rich controls and their
 * validation so a host application can render and persist configuration through
 * its own privileged, transactional boundary.
 *
 * The catalog is a baseline, not an assertion that a key exists in every server
 * release. Consumers must resolve it against the selected server family, game
 * version, and official catalog revision before exposing a write control.
 */

const CONFIGURATION_SCHEMA_REVISION = '2026-08-13';

const OFFICIAL_SOURCES = Object.freeze({
  paperConfiguration: 'https://docs.papermc.io/paper/reference/configuration/',
  paperServerProperties: 'https://docs.papermc.io/paper/reference/server-properties/',
  paperBukkit: 'https://docs.papermc.io/paper/reference/bukkit-configuration/',
  paperSpigot: 'https://docs.papermc.io/paper/reference/spigot-configuration/',
  paperGlobal: 'https://docs.papermc.io/paper/reference/global-configuration/',
  paperWorld: 'https://docs.papermc.io/paper/reference/world-configuration/',
  paperCli: 'https://docs.papermc.io/paper/reference/cli-arguments/',
  paperCommands: 'https://docs.papermc.io/paper/reference/commands/',
  paperSystemProperties: 'https://docs.papermc.io/paper/reference/system-properties/',
  spigotConfiguration: 'https://www.spigotmc.org/wiki/spigot-configuration/',
});

const SERVER_FAMILIES = Object.freeze(['paper', 'spigot']);

const CONTROL_TYPES = Object.freeze({
  SWITCH: 'switch',
  SELECT: 'select',
  TEXT: 'validated-text',
  URL: 'validated-url',
  NUMBER_STEPPER: 'number-stepper',
  DURATION_STEPPER: 'duration-stepper',
  PORT_STEPPER: 'port-stepper',
  NETWORK_HOST_PICKER: 'network-host-picker',
  FILE_PICKER: 'file-picker',
  DIRECTORY_PICKER: 'directory-picker',
  SECRET_VAULT: 'secret-vault-reference',
  CHIP_COLLECTION: 'chip-collection',
  DISCOVERED_SELECT: 'discovered-registry-select',
  DISCOVERED_CHIP_COLLECTION: 'discovered-registry-chip-collection',
  STRUCTURED_KEY_VALUE: 'structured-key-value-editor',
  INHERITABLE_NUMBER: 'inheritable-number-stepper',
  INHERITABLE_SELECT: 'inheritable-select',
  RISK_GATED_SWITCH: 'risk-gated-switch',
  READ_ONLY: 'read-only-value',
  ADVANCED_UNAVAILABLE: 'advanced-unavailable',
});

const SAFETY_CLASSIFICATIONS = Object.freeze({
  NORMAL: 'normal',
  OPERATIONAL: 'operational-impact',
  NETWORK: 'network-exposure',
  ACCESS: 'access-control',
  SECRET: 'credential-bearing',
  DATA: 'data-integrity',
  PLUGIN: 'plugin-compatibility',
  UNSUPPORTED: 'unsupported-upstream',
  SERVER_MANAGED: 'server-managed',
});

const RESTART_BADGES = Object.freeze({
  REQUIRED: 'restart-required',
  STARTUP_ONLY: 'startup-only',
  UNKNOWN: 'verify-with-selected-build',
});

const PROVENANCE_BADGES = Object.freeze({
  SERVER_PROPERTIES: 'server.properties',
  BUKKIT: 'bukkit.yml',
  SPIGOT: 'spigot.yml',
  PAPER_GLOBAL: 'paper-global.yml',
  PAPER_WORLD_DEFAULT: 'paper-world-defaults.yml',
  PAPER_WORLD_OVERRIDE: 'paper-world.yml',
  SPIGOT_WORLD_DEFAULT: 'spigot.yml:world-settings.default',
  SPIGOT_WORLD_OVERRIDE: 'spigot.yml:world-settings.<world>',
  SHIPPED_DEFAULT: 'server-default',
  UNKNOWN: 'unknown',
});

const ADVANCED_DOCUMENT_BOUNDARIES = Object.freeze({
  rawYaml: Object.freeze({
    id: 'advanced.raw-yaml',
    label: 'Raw YAML document editor',
    control: CONTROL_TYPES.ADVANCED_UNAVAILABLE,
    availability: 'unavailable-by-design',
    reason: 'Configuration is represented as typed controls; an unrestricted YAML editor cannot preserve validation, provenance, or safety acknowledgement.',
  }),
  rawProperties: Object.freeze({
    id: 'advanced.raw-properties',
    label: 'Raw properties document editor',
    control: CONTROL_TYPES.ADVANCED_UNAVAILABLE,
    availability: 'unavailable-by-design',
    reason: 'Configuration is represented as typed controls; an unrestricted properties editor cannot preserve validation, provenance, or safety acknowledgement.',
  }),
  arbitraryRestartScript: Object.freeze({
    id: 'spigot.restart-script',
    label: 'Arbitrary restart script',
    control: CONTROL_TYPES.ADVANCED_UNAVAILABLE,
    availability: 'unavailable-by-design',
    reason: 'An arbitrary operating-system command or script is not a safe configuration control. A future app-owned restart workflow must remain separately allowlisted.',
  }),
});

function option(value, label) {
  return Object.freeze({ value, label });
}

function source(url, key) {
  return Object.freeze({ url, key });
}

function field(definition) {
  return Object.freeze({
    restart: RESTART_BADGES.REQUIRED,
    safety: SAFETY_CLASSIFICATIONS.NORMAL,
    versioning: Object.freeze({ mode: 'catalog-scoped' }),
    ...definition,
  });
}

const SHARED_SERVER_PROPERTIES_FIELDS = Object.freeze([
  field({
    id: 'server-properties.motd',
    path: 'motd',
    label: 'Server list message',
    control: CONTROL_TYPES.TEXT,
    valueType: 'string',
    validation: { allowEmpty: true, trim: false },
    source: source(OFFICIAL_SOURCES.paperServerProperties, 'motd'),
    provenance: [PROVENANCE_BADGES.SERVER_PROPERTIES],
  }),
  field({
    id: 'server-properties.gamemode',
    path: 'gamemode',
    label: 'Default game mode',
    control: CONTROL_TYPES.SELECT,
    valueType: 'enum',
    options: [
      option('survival', 'Survival'),
      option('creative', 'Creative'),
      option('adventure', 'Adventure'),
      option('spectator', 'Spectator'),
    ],
    source: source(OFFICIAL_SOURCES.paperServerProperties, 'gamemode'),
    provenance: [PROVENANCE_BADGES.SERVER_PROPERTIES],
  }),
  field({
    id: 'server-properties.difficulty',
    path: 'difficulty',
    label: 'Difficulty',
    control: CONTROL_TYPES.SELECT,
    valueType: 'enum',
    options: [
      option('peaceful', 'Peaceful'),
      option('easy', 'Easy'),
      option('normal', 'Normal'),
      option('hard', 'Hard'),
    ],
    source: source(OFFICIAL_SOURCES.paperServerProperties, 'difficulty'),
    provenance: [PROVENANCE_BADGES.SERVER_PROPERTIES],
  }),
  field({
    id: 'server-properties.max-players',
    path: 'max-players',
    label: 'Maximum players',
    control: CONTROL_TYPES.NUMBER_STEPPER,
    valueType: 'integer',
    validation: { integer: true },
    source: source(OFFICIAL_SOURCES.paperServerProperties, 'max-players'),
    provenance: [PROVENANCE_BADGES.SERVER_PROPERTIES],
    safety: SAFETY_CLASSIFICATIONS.OPERATIONAL,
  }),
  field({
    id: 'server-properties.player-idle-timeout',
    path: 'player-idle-timeout',
    label: 'Idle disconnect timeout',
    control: CONTROL_TYPES.NUMBER_STEPPER,
    valueType: 'integer',
    unit: 'minutes',
    validation: { integer: true, min: 0 },
    source: source(OFFICIAL_SOURCES.paperServerProperties, 'player-idle-timeout'),
    provenance: [PROVENANCE_BADGES.SERVER_PROPERTIES],
    safety: SAFETY_CLASSIFICATIONS.ACCESS,
  }),
  field({
    id: 'server-properties.online-mode',
    path: 'online-mode',
    label: 'Require authenticated player accounts',
    control: CONTROL_TYPES.RISK_GATED_SWITCH,
    valueType: 'boolean',
    source: source(OFFICIAL_SOURCES.paperServerProperties, 'online-mode'),
    provenance: [PROVENANCE_BADGES.SERVER_PROPERTIES],
    safety: SAFETY_CLASSIFICATIONS.ACCESS,
    acknowledgement: 'Changing authentication mode changes who can connect. Proxy forwarding requires matching proxy configuration.',
  }),
  field({
    id: 'server-properties.white-list',
    path: 'white-list',
    label: 'Whitelist enforcement',
    control: CONTROL_TYPES.SWITCH,
    valueType: 'boolean',
    source: source(OFFICIAL_SOURCES.paperServerProperties, 'white-list'),
    provenance: [PROVENANCE_BADGES.SERVER_PROPERTIES],
    safety: SAFETY_CLASSIFICATIONS.ACCESS,
  }),
  field({
    id: 'server-properties.enforce-whitelist',
    path: 'enforce-whitelist',
    label: 'Enforce whitelist immediately',
    control: CONTROL_TYPES.SWITCH,
    valueType: 'boolean',
    source: source(OFFICIAL_SOURCES.paperServerProperties, 'enforce-whitelist'),
    provenance: [PROVENANCE_BADGES.SERVER_PROPERTIES],
    safety: SAFETY_CLASSIFICATIONS.ACCESS,
  }),
  field({
    id: 'server-properties.server-ip',
    path: 'server-ip',
    label: 'Bind address',
    control: CONTROL_TYPES.NETWORK_HOST_PICKER,
    valueType: 'host-or-empty',
    validation: { allowEmpty: true, hostOrIp: true },
    source: source(OFFICIAL_SOURCES.paperServerProperties, 'server-ip'),
    provenance: [PROVENANCE_BADGES.SERVER_PROPERTIES],
    safety: SAFETY_CLASSIFICATIONS.NETWORK,
    acknowledgement: 'An empty value binds all available interfaces. Selecting a specific address can prevent remote or local connections if that address is unavailable.',
  }),
  field({
    id: 'server-properties.server-port',
    path: 'server-port',
    label: 'Game port',
    control: CONTROL_TYPES.PORT_STEPPER,
    valueType: 'port',
    validation: { integer: true, min: 1, max: 65535 },
    source: source(OFFICIAL_SOURCES.paperServerProperties, 'server-port'),
    provenance: [PROVENANCE_BADGES.SERVER_PROPERTIES],
    safety: SAFETY_CLASSIFICATIONS.NETWORK,
  }),
  field({
    id: 'server-properties.enable-status',
    path: 'enable-status',
    label: 'Advertise status in the server list',
    control: CONTROL_TYPES.SWITCH,
    valueType: 'boolean',
    source: source(OFFICIAL_SOURCES.paperServerProperties, 'enable-status'),
    provenance: [PROVENANCE_BADGES.SERVER_PROPERTIES],
    safety: SAFETY_CLASSIFICATIONS.NETWORK,
  }),
  field({
    id: 'server-properties.enable-query',
    path: 'enable-query',
    label: 'Enable GameSpy query listener',
    control: CONTROL_TYPES.RISK_GATED_SWITCH,
    valueType: 'boolean',
    source: source(OFFICIAL_SOURCES.paperServerProperties, 'enable-query'),
    provenance: [PROVENANCE_BADGES.SERVER_PROPERTIES],
    safety: SAFETY_CLASSIFICATIONS.NETWORK,
  }),
  field({
    id: 'server-properties.query-port',
    path: 'query.port',
    label: 'Query port',
    control: CONTROL_TYPES.PORT_STEPPER,
    valueType: 'port',
    validation: { integer: true, min: 1, max: 65535 },
    source: source(OFFICIAL_SOURCES.paperServerProperties, 'query.port'),
    provenance: [PROVENANCE_BADGES.SERVER_PROPERTIES],
    safety: SAFETY_CLASSIFICATIONS.NETWORK,
  }),
  field({
    id: 'server-properties.enable-rcon',
    path: 'enable-rcon',
    label: 'Enable remote console',
    control: CONTROL_TYPES.RISK_GATED_SWITCH,
    valueType: 'boolean',
    source: source(OFFICIAL_SOURCES.paperServerProperties, 'enable-rcon'),
    provenance: [PROVENANCE_BADGES.SERVER_PROPERTIES],
    safety: SAFETY_CLASSIFICATIONS.SECRET,
    acknowledgement: 'Remote console access must be protected with a vault-backed secret and an appropriate network boundary.',
  }),
  field({
    id: 'server-properties.rcon-port',
    path: 'rcon.port',
    label: 'Remote console port',
    control: CONTROL_TYPES.PORT_STEPPER,
    valueType: 'port',
    validation: { integer: true, min: 1, max: 65535 },
    source: source(OFFICIAL_SOURCES.paperServerProperties, 'rcon.port'),
    provenance: [PROVENANCE_BADGES.SERVER_PROPERTIES],
    safety: SAFETY_CLASSIFICATIONS.SECRET,
  }),
  field({
    id: 'server-properties.rcon-password',
    path: 'rcon.password',
    label: 'Remote console password',
    control: CONTROL_TYPES.SECRET_VAULT,
    valueType: 'vault-reference',
    validation: { vaultReference: true },
    source: source(OFFICIAL_SOURCES.paperServerProperties, 'rcon.password'),
    provenance: [PROVENANCE_BADGES.SERVER_PROPERTIES],
    safety: SAFETY_CLASSIFICATIONS.SECRET,
    secretHandling: 'Never persist or render the plaintext value outside the operating-system credential vault.',
  }),
  field({
    id: 'server-properties.level-name',
    path: 'level-name',
    label: 'Primary world name',
    control: CONTROL_TYPES.TEXT,
    valueType: 'string',
    validation: { allowEmpty: false, trim: true, forbidPathSeparators: true },
    source: source(OFFICIAL_SOURCES.paperServerProperties, 'level-name'),
    provenance: [PROVENANCE_BADGES.SERVER_PROPERTIES],
    safety: SAFETY_CLASSIFICATIONS.DATA,
  }),
  field({
    id: 'server-properties.level-seed',
    path: 'level-seed',
    label: 'World seed',
    control: CONTROL_TYPES.TEXT,
    valueType: 'string',
    validation: { allowEmpty: true, trim: true },
    source: source(OFFICIAL_SOURCES.paperServerProperties, 'level-seed'),
    provenance: [PROVENANCE_BADGES.SERVER_PROPERTIES],
    safety: SAFETY_CLASSIFICATIONS.DATA,
  }),
  field({
    id: 'server-properties.level-type',
    path: 'level-type',
    label: 'World generator type',
    control: CONTROL_TYPES.SELECT,
    valueType: 'enum',
    options: [
      option('minecraft:normal', 'Normal'),
      option('flat', 'Flat'),
      option('large_biomes', 'Large biomes'),
      option('amplified', 'Amplified'),
      option('single_biome_surface', 'Single biome surface'),
      option('buffet', 'Buffet'),
      option('default_1_1', 'Default 1.1'),
      option('customized', 'Customized'),
    ],
    source: source(OFFICIAL_SOURCES.paperServerProperties, 'level-type'),
    provenance: [PROVENANCE_BADGES.SERVER_PROPERTIES],
    safety: SAFETY_CLASSIFICATIONS.DATA,
  }),
  field({
    id: 'server-properties.initial-enabled-packs',
    path: 'initial-enabled-packs',
    label: 'Datapacks enabled at world creation',
    control: CONTROL_TYPES.DISCOVERED_CHIP_COLLECTION,
    valueType: 'string-list',
    requiresCapability: 'datapack-registry',
    validation: { uniqueItems: true },
    source: source(OFFICIAL_SOURCES.paperServerProperties, 'initial-enabled-packs'),
    provenance: [PROVENANCE_BADGES.SERVER_PROPERTIES],
    safety: SAFETY_CLASSIFICATIONS.DATA,
  }),
  field({
    id: 'server-properties.initial-disabled-packs',
    path: 'initial-disabled-packs',
    label: 'Datapacks disabled at world creation',
    control: CONTROL_TYPES.DISCOVERED_CHIP_COLLECTION,
    valueType: 'string-list',
    requiresCapability: 'datapack-registry',
    validation: { uniqueItems: true },
    source: source(OFFICIAL_SOURCES.paperServerProperties, 'initial-disabled-packs'),
    provenance: [PROVENANCE_BADGES.SERVER_PROPERTIES],
    safety: SAFETY_CLASSIFICATIONS.DATA,
  }),
  field({
    id: 'server-properties.view-distance',
    path: 'view-distance',
    label: 'View distance',
    control: CONTROL_TYPES.NUMBER_STEPPER,
    valueType: 'integer',
    unit: 'chunks',
    validation: { integer: true, min: 3, max: 32 },
    source: source(OFFICIAL_SOURCES.paperServerProperties, 'view-distance'),
    provenance: [PROVENANCE_BADGES.SERVER_PROPERTIES],
    safety: SAFETY_CLASSIFICATIONS.OPERATIONAL,
  }),
  field({
    id: 'server-properties.simulation-distance',
    path: 'simulation-distance',
    label: 'Simulation distance',
    control: CONTROL_TYPES.NUMBER_STEPPER,
    valueType: 'integer',
    unit: 'chunks',
    validation: { integer: true, min: 3, max: 32 },
    source: source(OFFICIAL_SOURCES.paperServerProperties, 'simulation-distance'),
    provenance: [PROVENANCE_BADGES.SERVER_PROPERTIES],
    safety: SAFETY_CLASSIFICATIONS.OPERATIONAL,
  }),
  field({
    id: 'server-properties.entity-broadcast-range-percentage',
    path: 'entity-broadcast-range-percentage',
    label: 'Entity broadcast range',
    control: CONTROL_TYPES.NUMBER_STEPPER,
    valueType: 'integer',
    unit: 'percent',
    validation: { integer: true, min: 10, max: 1000 },
    source: source(OFFICIAL_SOURCES.paperServerProperties, 'entity-broadcast-range-percentage'),
    provenance: [PROVENANCE_BADGES.SERVER_PROPERTIES],
    safety: SAFETY_CLASSIFICATIONS.OPERATIONAL,
  }),
  field({
    id: 'server-properties.resource-pack',
    path: 'resource-pack',
    label: 'Resource-pack URL',
    control: CONTROL_TYPES.URL,
    valueType: 'url-or-empty',
    validation: { allowEmpty: true, url: true },
    source: source(OFFICIAL_SOURCES.paperServerProperties, 'resource-pack'),
    provenance: [PROVENANCE_BADGES.SERVER_PROPERTIES],
    safety: SAFETY_CLASSIFICATIONS.NETWORK,
  }),
  field({
    id: 'server-properties.resource-pack-id',
    path: 'resource-pack-id',
    label: 'Resource-pack identifier',
    control: CONTROL_TYPES.TEXT,
    valueType: 'uuid-or-empty',
    validation: { allowEmpty: true, uuid: true },
    source: source(OFFICIAL_SOURCES.paperServerProperties, 'resource-pack-id'),
    provenance: [PROVENANCE_BADGES.SERVER_PROPERTIES],
  }),
  field({
    id: 'server-properties.resource-pack-sha1',
    path: 'resource-pack-sha1',
    label: 'Resource-pack SHA-1',
    control: CONTROL_TYPES.TEXT,
    valueType: 'sha1-or-empty',
    validation: { allowEmpty: true, sha1: true },
    source: source(OFFICIAL_SOURCES.paperServerProperties, 'resource-pack-sha1'),
    provenance: [PROVENANCE_BADGES.SERVER_PROPERTIES],
    safety: SAFETY_CLASSIFICATIONS.DATA,
  }),
  field({
    id: 'server-properties.op-permission-level',
    path: 'op-permission-level',
    label: 'Operator permission level',
    control: CONTROL_TYPES.NUMBER_STEPPER,
    valueType: 'integer',
    validation: { integer: true, min: 0, max: 4 },
    source: source(OFFICIAL_SOURCES.paperServerProperties, 'op-permission-level'),
    provenance: [PROVENANCE_BADGES.SERVER_PROPERTIES],
    safety: SAFETY_CLASSIFICATIONS.ACCESS,
  }),
  field({
    id: 'server-properties.function-permission-level',
    path: 'function-permission-level',
    label: 'Function permission level',
    control: CONTROL_TYPES.NUMBER_STEPPER,
    valueType: 'integer',
    validation: { integer: true, min: 1, max: 4 },
    source: source(OFFICIAL_SOURCES.paperServerProperties, 'function-permission-level'),
    provenance: [PROVENANCE_BADGES.SERVER_PROPERTIES],
    safety: SAFETY_CLASSIFICATIONS.ACCESS,
  }),
  field({
    id: 'server-properties.max-tick-time',
    path: 'max-tick-time',
    label: 'Watchdog tick timeout',
    control: CONTROL_TYPES.NUMBER_STEPPER,
    valueType: 'integer',
    unit: 'milliseconds',
    validation: { integer: true, allowMinusOne: true },
    source: source(OFFICIAL_SOURCES.paperServerProperties, 'max-tick-time'),
    provenance: [PROVENANCE_BADGES.SERVER_PROPERTIES],
    safety: SAFETY_CLASSIFICATIONS.DATA,
    acknowledgement: 'A disabled watchdog can allow an unresponsive server to continue running.',
  }),
]);

const BUKKIT_FIELDS = Object.freeze([
  field({
    id: 'bukkit.settings.allow-end',
    path: 'settings.allow-end',
    label: 'Load End dimensions',
    control: CONTROL_TYPES.SWITCH,
    valueType: 'boolean',
    source: source(OFFICIAL_SOURCES.paperBukkit, 'settings.allow-end'),
    provenance: [PROVENANCE_BADGES.BUKKIT],
  }),
  field({
    id: 'bukkit.settings.warn-on-overload',
    path: 'settings.warn-on-overload',
    label: 'Log overload warnings',
    control: CONTROL_TYPES.SWITCH,
    valueType: 'boolean',
    source: source(OFFICIAL_SOURCES.paperBukkit, 'settings.warn-on-overload'),
    provenance: [PROVENANCE_BADGES.BUKKIT],
  }),
  field({
    id: 'bukkit.settings.permissions-file',
    path: 'settings.permissions-file',
    label: 'Permissions file',
    control: CONTROL_TYPES.FILE_PICKER,
    valueType: 'file-reference',
    validation: { filePicker: true },
    source: source(OFFICIAL_SOURCES.paperBukkit, 'settings.permissions-file'),
    provenance: [PROVENANCE_BADGES.BUKKIT],
    safety: SAFETY_CLASSIFICATIONS.ACCESS,
  }),
  field({
    id: 'bukkit.settings.update-folder',
    path: 'settings.update-folder',
    label: 'Plugin update directory',
    control: CONTROL_TYPES.DIRECTORY_PICKER,
    valueType: 'directory-reference',
    validation: { directoryPicker: true },
    source: source(OFFICIAL_SOURCES.paperBukkit, 'settings.update-folder'),
    provenance: [PROVENANCE_BADGES.BUKKIT],
    safety: SAFETY_CLASSIFICATIONS.PLUGIN,
  }),
  field({
    id: 'bukkit.settings.connection-throttle',
    path: 'settings.connection-throttle',
    label: 'Connection throttle',
    control: CONTROL_TYPES.NUMBER_STEPPER,
    valueType: 'integer',
    unit: 'milliseconds',
    validation: { integer: true, min: 0 },
    source: source(OFFICIAL_SOURCES.paperBukkit, 'settings.connection-throttle'),
    provenance: [PROVENANCE_BADGES.BUKKIT],
    safety: SAFETY_CLASSIFICATIONS.NETWORK,
  }),
  field({
    id: 'bukkit.settings.query-plugins',
    path: 'settings.query-plugins',
    label: 'Expose plugins in query responses',
    control: CONTROL_TYPES.SWITCH,
    valueType: 'boolean',
    source: source(OFFICIAL_SOURCES.paperBukkit, 'settings.query-plugins'),
    provenance: [PROVENANCE_BADGES.BUKKIT],
    safety: SAFETY_CLASSIFICATIONS.NETWORK,
  }),
  field({
    id: 'bukkit.settings.deprecated-verbose',
    path: 'settings.deprecated-verbose',
    label: 'Deprecated event warning policy',
    control: CONTROL_TYPES.SELECT,
    valueType: 'enum',
    options: [option('true', 'Always warn'), option('false', 'Never warn'), option('default', 'Use annotation default')],
    source: source(OFFICIAL_SOURCES.paperBukkit, 'settings.deprecated-verbose'),
    provenance: [PROVENANCE_BADGES.BUKKIT],
  }),
  field({
    id: 'bukkit.settings.shutdown-message',
    path: 'settings.shutdown-message',
    label: 'Shutdown message',
    control: CONTROL_TYPES.TEXT,
    valueType: 'string',
    validation: { allowEmpty: true, trim: false },
    source: source(OFFICIAL_SOURCES.paperBukkit, 'settings.shutdown-message'),
    provenance: [PROVENANCE_BADGES.BUKKIT],
  }),
  field({
    id: 'bukkit.settings.minimum-api',
    path: 'settings.minimum-api',
    label: 'Minimum plugin API version',
    control: CONTROL_TYPES.DISCOVERED_SELECT,
    valueType: 'version-or-none',
    requiresCapability: 'server-api-version-catalog',
    source: source(OFFICIAL_SOURCES.paperBukkit, 'settings.minimum-api'),
    provenance: [PROVENANCE_BADGES.BUKKIT],
    safety: SAFETY_CLASSIFICATIONS.PLUGIN,
  }),
  field({
    id: 'bukkit.settings.world-container',
    path: 'settings.world-container',
    label: 'World container directory',
    control: CONTROL_TYPES.DIRECTORY_PICKER,
    valueType: 'directory-reference',
    validation: { directoryPicker: true },
    source: source(OFFICIAL_SOURCES.paperBukkit, 'settings.world-container'),
    provenance: [PROVENANCE_BADGES.BUKKIT],
    safety: SAFETY_CLASSIFICATIONS.DATA,
  }),
  field({
    id: 'bukkit.spawn-limits.monsters',
    path: 'spawn-limits.monsters',
    label: 'Monster spawn limit',
    control: CONTROL_TYPES.NUMBER_STEPPER,
    valueType: 'integer',
    validation: { integer: true },
    source: source(OFFICIAL_SOURCES.paperBukkit, 'spawn-limits.monsters'),
    provenance: [PROVENANCE_BADGES.BUKKIT, PROVENANCE_BADGES.PAPER_WORLD_OVERRIDE],
    safety: SAFETY_CLASSIFICATIONS.OPERATIONAL,
    worldOverride: 'paper',
  }),
  field({
    id: 'bukkit.spawn-limits.animals',
    path: 'spawn-limits.animals',
    label: 'Animal spawn limit',
    control: CONTROL_TYPES.NUMBER_STEPPER,
    valueType: 'integer',
    validation: { integer: true },
    source: source(OFFICIAL_SOURCES.paperBukkit, 'spawn-limits.animals'),
    provenance: [PROVENANCE_BADGES.BUKKIT, PROVENANCE_BADGES.PAPER_WORLD_OVERRIDE],
    safety: SAFETY_CLASSIFICATIONS.OPERATIONAL,
    worldOverride: 'paper',
  }),
  field({
    id: 'bukkit.spawn-limits.water-animals',
    path: 'spawn-limits.water-animals',
    label: 'Water-animal spawn limit',
    control: CONTROL_TYPES.NUMBER_STEPPER,
    valueType: 'integer',
    validation: { integer: true },
    source: source(OFFICIAL_SOURCES.paperBukkit, 'spawn-limits.water-animals'),
    provenance: [PROVENANCE_BADGES.BUKKIT, PROVENANCE_BADGES.PAPER_WORLD_OVERRIDE],
    safety: SAFETY_CLASSIFICATIONS.OPERATIONAL,
    worldOverride: 'paper',
  }),
  field({
    id: 'bukkit.ticks-per.animal-spawns',
    path: 'ticks-per.animal-spawns',
    label: 'Animal spawn attempt interval',
    control: CONTROL_TYPES.NUMBER_STEPPER,
    valueType: 'integer',
    unit: 'ticks',
    validation: { integer: true, allowMinusOne: true },
    source: source(OFFICIAL_SOURCES.paperBukkit, 'ticks-per.animal-spawns'),
    provenance: [PROVENANCE_BADGES.BUKKIT, PROVENANCE_BADGES.PAPER_WORLD_OVERRIDE],
    safety: SAFETY_CLASSIFICATIONS.OPERATIONAL,
    worldOverride: 'paper',
  }),
  field({
    id: 'bukkit.ticks-per.monster-spawns',
    path: 'ticks-per.monster-spawns',
    label: 'Monster spawn attempt interval',
    control: CONTROL_TYPES.NUMBER_STEPPER,
    valueType: 'integer',
    unit: 'ticks',
    validation: { integer: true, allowMinusOne: true },
    source: source(OFFICIAL_SOURCES.paperBukkit, 'ticks-per.monster-spawns'),
    provenance: [PROVENANCE_BADGES.BUKKIT, PROVENANCE_BADGES.PAPER_WORLD_OVERRIDE],
    safety: SAFETY_CLASSIFICATIONS.OPERATIONAL,
    worldOverride: 'paper',
  }),
  field({
    id: 'bukkit.ticks-per.autosave',
    path: 'ticks-per.autosave',
    label: 'Autosave interval',
    control: CONTROL_TYPES.NUMBER_STEPPER,
    valueType: 'integer',
    unit: 'ticks',
    validation: { integer: true, allowMinusOne: true },
    source: source(OFFICIAL_SOURCES.paperBukkit, 'ticks-per.autosave'),
    provenance: [PROVENANCE_BADGES.BUKKIT, PROVENANCE_BADGES.PAPER_WORLD_OVERRIDE],
    safety: SAFETY_CLASSIFICATIONS.DATA,
    worldOverride: 'paper',
  }),
  field({
    id: 'bukkit.worlds.generator',
    path: 'worlds.<world>.generator',
    label: 'Per-world chunk generator',
    control: CONTROL_TYPES.DISCOVERED_SELECT,
    valueType: 'discovered-plugin-generator',
    requiresCapability: 'installed-plugin-generator-registry',
    unavailableReason: 'A generator can only be selected from a discovered installed-plugin registry; arbitrary plugin expressions are not accepted.',
    source: source(OFFICIAL_SOURCES.paperBukkit, 'worlds.<world>.generator'),
    provenance: [PROVENANCE_BADGES.BUKKIT],
    safety: SAFETY_CLASSIFICATIONS.PLUGIN,
  }),
  field({
    id: 'bukkit.worlds.biome-provider',
    path: 'worlds.<world>.biome-provider',
    label: 'Per-world biome provider',
    control: CONTROL_TYPES.DISCOVERED_SELECT,
    valueType: 'discovered-plugin-biome-provider',
    requiresCapability: 'installed-plugin-biome-provider-registry',
    unavailableReason: 'A biome provider can only be selected from a discovered installed-plugin registry; arbitrary plugin expressions are not accepted.',
    source: source(OFFICIAL_SOURCES.paperBukkit, 'worlds.<world>.biome-provider'),
    provenance: [PROVENANCE_BADGES.BUKKIT],
    safety: SAFETY_CLASSIFICATIONS.PLUGIN,
  }),
]);

const SPIGOT_FIELDS = Object.freeze([
  field({
    id: 'spigot.settings.debug',
    path: 'settings.debug',
    label: 'Debug logging',
    control: CONTROL_TYPES.SWITCH,
    valueType: 'boolean',
    source: source(OFFICIAL_SOURCES.paperSpigot, 'settings.debug'),
    provenance: [PROVENANCE_BADGES.SPIGOT],
    safety: SAFETY_CLASSIFICATIONS.OPERATIONAL,
  }),
  field({
    id: 'spigot.settings.timeout-time',
    path: 'settings.timeout-time',
    label: 'Watchdog timeout',
    control: CONTROL_TYPES.NUMBER_STEPPER,
    valueType: 'integer',
    unit: 'seconds',
    validation: { integer: true },
    source: source(OFFICIAL_SOURCES.paperSpigot, 'settings.timeout-time'),
    provenance: [PROVENANCE_BADGES.SPIGOT],
    safety: SAFETY_CLASSIFICATIONS.DATA,
  }),
  field({
    id: 'spigot.settings.restart-on-crash',
    path: 'settings.restart-on-crash',
    label: 'Restart when watchdog stops the server',
    control: CONTROL_TYPES.RISK_GATED_SWITCH,
    valueType: 'boolean',
    source: source(OFFICIAL_SOURCES.paperSpigot, 'settings.restart-on-crash'),
    provenance: [PROVENANCE_BADGES.SPIGOT],
    safety: SAFETY_CLASSIFICATIONS.OPERATIONAL,
    acknowledgement: 'This only invokes the configured server restart mechanism after a watchdog stop; it does not handle arbitrary external termination.',
  }),
  field({
    id: 'spigot.settings.restart-script',
    path: 'settings.restart-script',
    label: 'Restart script',
    control: CONTROL_TYPES.ADVANCED_UNAVAILABLE,
    valueType: 'unavailable',
    source: source(OFFICIAL_SOURCES.paperSpigot, 'settings.restart-script'),
    provenance: [PROVENANCE_BADGES.SPIGOT],
    safety: SAFETY_CLASSIFICATIONS.OPERATIONAL,
    unavailableReason: ADVANCED_DOCUMENT_BOUNDARIES.arbitraryRestartScript.reason,
  }),
  field({
    id: 'spigot.settings.bungeecord',
    path: 'settings.bungeecord',
    label: 'BungeeCord compatibility mode',
    control: CONTROL_TYPES.RISK_GATED_SWITCH,
    valueType: 'boolean',
    source: source(OFFICIAL_SOURCES.paperSpigot, 'settings.bungeecord'),
    provenance: [PROVENANCE_BADGES.SPIGOT],
    safety: SAFETY_CLASSIFICATIONS.ACCESS,
    acknowledgement: 'Proxy forwarding must be configured consistently across the server and the proxy.',
  }),
  field({
    id: 'spigot.players.disable-saving',
    path: 'players.disable-saving',
    label: 'Disable player-data saving',
    control: CONTROL_TYPES.RISK_GATED_SWITCH,
    valueType: 'boolean',
    source: source(OFFICIAL_SOURCES.paperSpigot, 'players.disable-saving'),
    provenance: [PROVENANCE_BADGES.SPIGOT],
    safety: SAFETY_CLASSIFICATIONS.DATA,
    acknowledgement: 'This prevents player data from being saved.',
  }),
  field({
    id: 'spigot.stats.disable-saving',
    path: 'stats.disable-saving',
    label: 'Disable statistics saving',
    control: CONTROL_TYPES.RISK_GATED_SWITCH,
    valueType: 'boolean',
    source: source(OFFICIAL_SOURCES.paperSpigot, 'stats.disable-saving'),
    provenance: [PROVENANCE_BADGES.SPIGOT],
    safety: SAFETY_CLASSIFICATIONS.DATA,
    acknowledgement: 'This prevents player statistics from being saved.',
  }),
  field({
    id: 'spigot.stats.forced-stats',
    path: 'stats.forced-stats',
    label: 'Forced statistics',
    control: CONTROL_TYPES.STRUCTURED_KEY_VALUE,
    valueType: 'resource-location-integer-map',
    requiresCapability: 'statistic-resource-location-registry',
    validation: { keysFromRegistry: true, integerValues: true },
    source: source(OFFICIAL_SOURCES.paperSpigot, 'stats.forced-stats'),
    provenance: [PROVENANCE_BADGES.SPIGOT],
    safety: SAFETY_CLASSIFICATIONS.OPERATIONAL,
  }),
  field({
    id: 'spigot.commands.tab-complete',
    path: 'commands.tab-complete',
    label: 'Command completion threshold',
    control: CONTROL_TYPES.NUMBER_STEPPER,
    valueType: 'integer',
    validation: { integer: true, allowNegative: true },
    source: source(OFFICIAL_SOURCES.paperSpigot, 'commands.tab-complete'),
    provenance: [PROVENANCE_BADGES.SPIGOT],
    safety: SAFETY_CLASSIFICATIONS.ACCESS,
  }),
  field({
    id: 'spigot.commands.log',
    path: 'commands.log',
    label: 'Log player commands',
    control: CONTROL_TYPES.SWITCH,
    valueType: 'boolean',
    source: source(OFFICIAL_SOURCES.paperSpigot, 'commands.log'),
    provenance: [PROVENANCE_BADGES.SPIGOT],
    safety: SAFETY_CLASSIFICATIONS.DATA,
  }),
  field({
    id: 'spigot.commands.replace-commands',
    path: 'commands.replace-commands',
    label: 'Vanilla commands to replace',
    control: CONTROL_TYPES.DISCOVERED_CHIP_COLLECTION,
    valueType: 'command-id-list',
    requiresCapability: 'vanilla-command-registry',
    validation: { uniqueItems: true, valuesFromRegistry: true },
    source: source(OFFICIAL_SOURCES.paperSpigot, 'commands.replace-commands'),
    provenance: [PROVENANCE_BADGES.SPIGOT],
    safety: SAFETY_CLASSIFICATIONS.PLUGIN,
  }),
  field({
    id: 'spigot.commands.spam-exclusions',
    path: 'commands.spam-exclusions',
    label: 'Spam-filter exclusions',
    control: CONTROL_TYPES.CHIP_COLLECTION,
    valueType: 'command-prefix-list',
    validation: { uniqueItems: true, itemPrefix: '/' },
    source: source(OFFICIAL_SOURCES.paperSpigot, 'commands.spam-exclusions'),
    provenance: [PROVENANCE_BADGES.SPIGOT],
    safety: SAFETY_CLASSIFICATIONS.ACCESS,
  }),
  field({
    id: 'spigot.world-settings.default.view-distance',
    path: 'world-settings.default.view-distance',
    label: 'Default world view distance',
    control: CONTROL_TYPES.INHERITABLE_NUMBER,
    valueType: 'default-or-integer',
    inheritValue: 'default',
    unit: 'chunks',
    validation: { integer: true, allowInheritToken: 'default' },
    source: source(OFFICIAL_SOURCES.paperSpigot, 'world-settings.default.view-distance'),
    provenance: [PROVENANCE_BADGES.SERVER_PROPERTIES, PROVENANCE_BADGES.SPIGOT_WORLD_DEFAULT, PROVENANCE_BADGES.SPIGOT_WORLD_OVERRIDE],
    safety: SAFETY_CLASSIFICATIONS.OPERATIONAL,
    worldOverride: 'spigot',
  }),
  field({
    id: 'spigot.world-settings.default.simulation-distance',
    path: 'world-settings.default.simulation-distance',
    label: 'Default world simulation distance',
    control: CONTROL_TYPES.INHERITABLE_NUMBER,
    valueType: 'default-or-integer',
    inheritValue: 'default',
    unit: 'chunks',
    validation: { integer: true, allowInheritToken: 'default' },
    source: source(OFFICIAL_SOURCES.paperSpigot, 'world-settings.default.simulation-distance'),
    provenance: [PROVENANCE_BADGES.SERVER_PROPERTIES, PROVENANCE_BADGES.SPIGOT_WORLD_DEFAULT, PROVENANCE_BADGES.SPIGOT_WORLD_OVERRIDE],
    safety: SAFETY_CLASSIFICATIONS.OPERATIONAL,
    worldOverride: 'spigot',
  }),
  field({
    id: 'spigot.world-settings.default.verbose',
    path: 'world-settings.default.verbose',
    label: 'Log world settings',
    control: CONTROL_TYPES.SWITCH,
    valueType: 'boolean',
    source: source(OFFICIAL_SOURCES.paperSpigot, 'world-settings.default.verbose'),
    provenance: [PROVENANCE_BADGES.SPIGOT_WORLD_DEFAULT, PROVENANCE_BADGES.SPIGOT_WORLD_OVERRIDE],
    safety: SAFETY_CLASSIFICATIONS.OPERATIONAL,
    worldOverride: 'spigot',
  }),
  field({
    id: 'spigot.config-version',
    path: 'config-version',
    label: 'Configuration version',
    control: CONTROL_TYPES.READ_ONLY,
    valueType: 'server-managed',
    source: source(OFFICIAL_SOURCES.paperSpigot, 'config-version'),
    provenance: [PROVENANCE_BADGES.SPIGOT],
    safety: SAFETY_CLASSIFICATIONS.SERVER_MANAGED,
    unavailableReason: 'The server manages this upgrade marker. Do not edit it.',
  }),
]);

const PAPER_GLOBAL_FIELDS = Object.freeze([
  field({
    id: 'paper-global.console.enable-brigadier-completions',
    path: 'console.enable-brigadier-completions',
    label: 'Console command completions',
    control: CONTROL_TYPES.SWITCH,
    valueType: 'boolean',
    source: source(OFFICIAL_SOURCES.paperGlobal, 'console.enable-brigadier-completions'),
    provenance: [PROVENANCE_BADGES.PAPER_GLOBAL],
  }),
  field({
    id: 'paper-global.console.enable-brigadier-highlighting',
    path: 'console.enable-brigadier-highlighting',
    label: 'Console command highlighting',
    control: CONTROL_TYPES.SWITCH,
    valueType: 'boolean',
    source: source(OFFICIAL_SOURCES.paperGlobal, 'console.enable-brigadier-highlighting'),
    provenance: [PROVENANCE_BADGES.PAPER_GLOBAL],
  }),
  field({
    id: 'paper-global.chunk-system.io-threads',
    path: 'chunk-system.io-threads',
    label: 'Chunk I/O threads',
    control: CONTROL_TYPES.NUMBER_STEPPER,
    valueType: 'integer',
    validation: { integer: true, allowNegative: true },
    source: source(OFFICIAL_SOURCES.paperGlobal, 'chunk-system.io-threads'),
    provenance: [PROVENANCE_BADGES.PAPER_GLOBAL],
    safety: SAFETY_CLASSIFICATIONS.OPERATIONAL,
  }),
  field({
    id: 'paper-global.chunk-system.worker-threads',
    path: 'chunk-system.worker-threads',
    label: 'Chunk worker threads',
    control: CONTROL_TYPES.NUMBER_STEPPER,
    valueType: 'integer',
    validation: { integer: true, allowNegative: true },
    source: source(OFFICIAL_SOURCES.paperGlobal, 'chunk-system.worker-threads'),
    provenance: [PROVENANCE_BADGES.PAPER_GLOBAL],
    safety: SAFETY_CLASSIFICATIONS.OPERATIONAL,
  }),
  field({
    id: 'paper-global.packet-limiter.all-packets.action',
    path: 'packet-limiter.all-packets.action',
    label: 'Packet-limit response',
    control: CONTROL_TYPES.SELECT,
    valueType: 'enum',
    options: [option('DROP', 'Drop excess packets'), option('KICK', 'Kick the player')],
    source: source(OFFICIAL_SOURCES.paperGlobal, 'packet-limiter.all-packets.action'),
    provenance: [PROVENANCE_BADGES.PAPER_GLOBAL],
    safety: SAFETY_CLASSIFICATIONS.ACCESS,
  }),
  field({
    id: 'paper-global.packet-limiter.all-packets.interval',
    path: 'packet-limiter.all-packets.interval',
    label: 'Packet-limit interval',
    control: CONTROL_TYPES.DURATION_STEPPER,
    valueType: 'number',
    unit: 'seconds',
    validation: { number: true, min: 0 },
    source: source(OFFICIAL_SOURCES.paperGlobal, 'packet-limiter.all-packets.interval'),
    provenance: [PROVENANCE_BADGES.PAPER_GLOBAL],
    safety: SAFETY_CLASSIFICATIONS.NETWORK,
  }),
  field({
    id: 'paper-global.packet-limiter.all-packets.max-packet-rate',
    path: 'packet-limiter.all-packets.max-packet-rate',
    label: 'Packet-rate maximum',
    control: CONTROL_TYPES.NUMBER_STEPPER,
    valueType: 'number',
    unit: 'packets per interval',
    validation: { number: true, min: 0 },
    source: source(OFFICIAL_SOURCES.paperGlobal, 'packet-limiter.all-packets.max-packet-rate'),
    provenance: [PROVENANCE_BADGES.PAPER_GLOBAL],
    safety: SAFETY_CLASSIFICATIONS.NETWORK,
  }),
  field({
    id: 'paper-global.packet-limiter.overrides',
    path: 'packet-limiter.overrides',
    label: 'Per-packet limiter overrides',
    control: CONTROL_TYPES.STRUCTURED_KEY_VALUE,
    valueType: 'packet-id-limiter-map',
    requiresCapability: 'serverbound-packet-registry',
    validation: { keysFromRegistry: true, structuredValues: ['action', 'interval', 'max-packet-rate'] },
    source: source(OFFICIAL_SOURCES.paperGlobal, 'packet-limiter.overrides'),
    provenance: [PROVENANCE_BADGES.PAPER_GLOBAL],
    safety: SAFETY_CLASSIFICATIONS.NETWORK,
  }),
  field({
    id: 'paper-global.proxies.bungee-cord.online-mode',
    path: 'proxies.bungee-cord.online-mode',
    label: 'BungeeCord proxy authentication mode',
    control: CONTROL_TYPES.RISK_GATED_SWITCH,
    valueType: 'boolean',
    source: source(OFFICIAL_SOURCES.paperGlobal, 'proxies.bungee-cord.online-mode'),
    provenance: [PROVENANCE_BADGES.PAPER_GLOBAL],
    safety: SAFETY_CLASSIFICATIONS.ACCESS,
    acknowledgement: 'The setting must match the proxy authentication mode.',
  }),
  field({
    id: 'paper-global.proxies.bungee-cord.proxy-protocol',
    path: 'proxies.bungee-cord.proxy-protocol',
    label: 'Process PROXY protocol messages',
    control: CONTROL_TYPES.RISK_GATED_SWITCH,
    valueType: 'boolean',
    source: source(OFFICIAL_SOURCES.paperGlobal, 'proxies.bungee-cord.proxy-protocol'),
    provenance: [PROVENANCE_BADGES.PAPER_GLOBAL],
    safety: SAFETY_CLASSIFICATIONS.NETWORK,
    acknowledgement: 'Enable only when an upstream proxy such as HAProxy sends PROXY protocol messages.',
  }),
  field({
    id: 'paper-global.proxies.velocity.enabled',
    path: 'proxies.velocity.enabled',
    label: 'Accept Velocity modern forwarding',
    control: CONTROL_TYPES.RISK_GATED_SWITCH,
    valueType: 'boolean',
    source: source(OFFICIAL_SOURCES.paperGlobal, 'proxies.velocity.enabled'),
    provenance: [PROVENANCE_BADGES.PAPER_GLOBAL],
    safety: SAFETY_CLASSIFICATIONS.ACCESS,
    acknowledgement: 'Enable only with a matching Velocity proxy configuration and vault-backed shared secret.',
  }),
  field({
    id: 'paper-global.proxies.velocity.online-mode',
    path: 'proxies.velocity.online-mode',
    label: 'Velocity proxy authentication mode',
    control: CONTROL_TYPES.RISK_GATED_SWITCH,
    valueType: 'boolean',
    source: source(OFFICIAL_SOURCES.paperGlobal, 'proxies.velocity.online-mode'),
    provenance: [PROVENANCE_BADGES.PAPER_GLOBAL],
    safety: SAFETY_CLASSIFICATIONS.ACCESS,
  }),
  field({
    id: 'paper-global.proxies.velocity.secret',
    path: 'proxies.velocity.secret',
    label: 'Velocity forwarding secret',
    control: CONTROL_TYPES.SECRET_VAULT,
    valueType: 'vault-reference',
    validation: { vaultReference: true },
    source: source(OFFICIAL_SOURCES.paperGlobal, 'proxies.velocity.secret'),
    provenance: [PROVENANCE_BADGES.PAPER_GLOBAL],
    safety: SAFETY_CLASSIFICATIONS.SECRET,
    secretHandling: 'Never persist or render the plaintext value outside the operating-system credential vault.',
  }),
  field({
    id: 'paper-global.player-auto-save.max-per-tick',
    path: 'player-auto-save.max-per-tick',
    label: 'Player saves per tick',
    control: CONTROL_TYPES.NUMBER_STEPPER,
    valueType: 'integer',
    validation: { integer: true, allowMinusOne: true },
    source: source(OFFICIAL_SOURCES.paperGlobal, 'player-auto-save.max-per-tick'),
    provenance: [PROVENANCE_BADGES.PAPER_GLOBAL],
    safety: SAFETY_CLASSIFICATIONS.DATA,
  }),
  field({
    id: 'paper-global.player-auto-save.rate',
    path: 'player-auto-save.rate',
    label: 'Player auto-save interval',
    control: CONTROL_TYPES.NUMBER_STEPPER,
    valueType: 'integer',
    unit: 'ticks',
    validation: { integer: true, allowMinusOne: true },
    source: source(OFFICIAL_SOURCES.paperGlobal, 'player-auto-save.rate'),
    provenance: [PROVENANCE_BADGES.PAPER_GLOBAL],
    safety: SAFETY_CLASSIFICATIONS.DATA,
  }),
  field({
    id: 'paper-global.spark.enabled',
    path: 'spark.enabled',
    label: 'Enable bundled spark profiler',
    control: CONTROL_TYPES.SWITCH,
    valueType: 'boolean',
    source: source(OFFICIAL_SOURCES.paperGlobal, 'spark.enabled'),
    provenance: [PROVENANCE_BADGES.PAPER_GLOBAL],
    safety: SAFETY_CLASSIFICATIONS.OPERATIONAL,
  }),
  field({
    id: 'paper-global.update-checker.enabled',
    path: 'update-checker.enabled',
    label: 'Check for Paper updates on startup',
    control: CONTROL_TYPES.SWITCH,
    valueType: 'boolean',
    source: source(OFFICIAL_SOURCES.paperGlobal, 'update-checker.enabled'),
    provenance: [PROVENANCE_BADGES.PAPER_GLOBAL],
    safety: SAFETY_CLASSIFICATIONS.NETWORK,
  }),
  field({
    id: 'paper-global.watchdog.early-warning-delay',
    path: 'watchdog.early-warning-delay',
    label: 'Watchdog early-warning delay',
    control: CONTROL_TYPES.NUMBER_STEPPER,
    valueType: 'integer',
    unit: 'milliseconds',
    validation: { integer: true, min: 0 },
    source: source(OFFICIAL_SOURCES.paperGlobal, 'watchdog.early-warning-delay'),
    provenance: [PROVENANCE_BADGES.PAPER_GLOBAL],
    safety: SAFETY_CLASSIFICATIONS.DATA,
  }),
  field({
    id: 'paper-global.watchdog.early-warning-every',
    path: 'watchdog.early-warning-every',
    label: 'Watchdog early-warning interval',
    control: CONTROL_TYPES.NUMBER_STEPPER,
    valueType: 'integer',
    unit: 'milliseconds',
    validation: { integer: true, min: 0 },
    source: source(OFFICIAL_SOURCES.paperGlobal, 'watchdog.early-warning-every'),
    provenance: [PROVENANCE_BADGES.PAPER_GLOBAL],
    safety: SAFETY_CLASSIFICATIONS.DATA,
  }),
  field({
    id: 'paper-global.unsupported-settings.allow-piston-duplication',
    path: 'unsupported-settings.allow-piston-duplication',
    label: 'Allow piston duplication',
    control: CONTROL_TYPES.RISK_GATED_SWITCH,
    valueType: 'boolean',
    source: source(OFFICIAL_SOURCES.paperGlobal, 'unsupported-settings.allow-piston-duplication'),
    provenance: [PROVENANCE_BADGES.PAPER_GLOBAL],
    safety: SAFETY_CLASSIFICATIONS.UNSUPPORTED,
    acknowledgement: 'Paper marks unsupported settings as subject to unintended side effects and removal or behavior changes in future releases.',
  }),
  field({
    id: 'paper-global.unsupported-settings.allow-permanent-block-break-exploits',
    path: 'unsupported-settings.allow-permanent-block-break-exploits',
    label: 'Allow permanent-block break exploits',
    control: CONTROL_TYPES.RISK_GATED_SWITCH,
    valueType: 'boolean',
    source: source(OFFICIAL_SOURCES.paperGlobal, 'unsupported-settings.allow-permanent-block-break-exploits'),
    provenance: [PROVENANCE_BADGES.PAPER_GLOBAL],
    safety: SAFETY_CLASSIFICATIONS.UNSUPPORTED,
    acknowledgement: 'Paper marks unsupported settings as subject to unintended side effects and removal or behavior changes in future releases.',
  }),
]);

const PAPER_WORLD_FIELDS = Object.freeze([
  field({
    id: 'paper-world.anticheat.anti-xray.enabled',
    path: 'anticheat.anti-xray.enabled',
    label: 'Enable anti-xray',
    control: CONTROL_TYPES.SWITCH,
    valueType: 'boolean',
    source: source(OFFICIAL_SOURCES.paperWorld, 'anticheat.anti-xray.enabled'),
    provenance: [PROVENANCE_BADGES.PAPER_WORLD_DEFAULT, PROVENANCE_BADGES.PAPER_WORLD_OVERRIDE],
    worldOverride: 'paper',
    safety: SAFETY_CLASSIFICATIONS.OPERATIONAL,
  }),
  field({
    id: 'paper-world.anticheat.anti-xray.engine-mode',
    path: 'anticheat.anti-xray.engine-mode',
    label: 'Anti-xray engine mode',
    control: CONTROL_TYPES.SELECT,
    valueType: 'enum',
    options: [option(1, 'Mode 1'), option(2, 'Mode 2'), option(3, 'Mode 3')],
    source: source(OFFICIAL_SOURCES.paperWorld, 'anticheat.anti-xray.engine-mode'),
    provenance: [PROVENANCE_BADGES.PAPER_WORLD_DEFAULT, PROVENANCE_BADGES.PAPER_WORLD_OVERRIDE],
    worldOverride: 'paper',
    safety: SAFETY_CLASSIFICATIONS.OPERATIONAL,
  }),
  field({
    id: 'paper-world.anticheat.anti-xray.hidden-blocks',
    path: 'anticheat.anti-xray.hidden-blocks',
    label: 'Anti-xray hidden blocks',
    control: CONTROL_TYPES.DISCOVERED_CHIP_COLLECTION,
    valueType: 'block-id-list',
    requiresCapability: 'block-registry',
    validation: { uniqueItems: true, valuesFromRegistry: true },
    source: source(OFFICIAL_SOURCES.paperWorld, 'anticheat.anti-xray.hidden-blocks'),
    provenance: [PROVENANCE_BADGES.PAPER_WORLD_DEFAULT, PROVENANCE_BADGES.PAPER_WORLD_OVERRIDE],
    worldOverride: 'paper',
    safety: SAFETY_CLASSIFICATIONS.OPERATIONAL,
  }),
  field({
    id: 'paper-world.chunks.auto-save-interval',
    path: 'chunks.auto-save-interval',
    label: 'World autosave interval',
    control: CONTROL_TYPES.INHERITABLE_NUMBER,
    valueType: 'default-or-integer',
    inheritValue: 'default',
    unit: 'ticks',
    validation: { integer: true, allowInheritToken: 'default' },
    source: source(OFFICIAL_SOURCES.paperWorld, 'chunks.auto-save-interval'),
    provenance: [PROVENANCE_BADGES.BUKKIT, PROVENANCE_BADGES.PAPER_WORLD_DEFAULT, PROVENANCE_BADGES.PAPER_WORLD_OVERRIDE],
    globalFallbackFieldId: 'bukkit.ticks-per.autosave',
    worldOverride: 'paper',
    safety: SAFETY_CLASSIFICATIONS.DATA,
  }),
  field({
    id: 'paper-world.chunks.delay-chunk-unloads-by',
    path: 'chunks.delay-chunk-unloads-by',
    label: 'Chunk-unload delay',
    control: CONTROL_TYPES.DURATION_STEPPER,
    valueType: 'duration',
    validation: { duration: true, units: ['d', 'h', 'm', 's'] },
    source: source(OFFICIAL_SOURCES.paperWorld, 'chunks.delay-chunk-unloads-by'),
    provenance: [PROVENANCE_BADGES.PAPER_WORLD_DEFAULT, PROVENANCE_BADGES.PAPER_WORLD_OVERRIDE],
    worldOverride: 'paper',
    safety: SAFETY_CLASSIFICATIONS.OPERATIONAL,
  }),
  field({
    id: 'paper-world.chunks.flush-regions-on-save',
    path: 'chunks.flush-regions-on-save',
    label: 'Flush region files on save',
    control: CONTROL_TYPES.SWITCH,
    valueType: 'boolean',
    source: source(OFFICIAL_SOURCES.paperWorld, 'chunks.flush-regions-on-save'),
    provenance: [PROVENANCE_BADGES.PAPER_WORLD_DEFAULT, PROVENANCE_BADGES.PAPER_WORLD_OVERRIDE],
    worldOverride: 'paper',
    safety: SAFETY_CLASSIFICATIONS.DATA,
  }),
  field({
    id: 'paper-world.entities.spawning.spawn-limits.monster',
    path: 'entities.spawning.spawn-limits.monster',
    label: 'Monster spawn limit override',
    control: CONTROL_TYPES.INHERITABLE_NUMBER,
    valueType: 'inherit-or-integer',
    inheritValue: -1,
    validation: { integer: true, allowInheritToken: -1 },
    source: source(OFFICIAL_SOURCES.paperWorld, 'entities.spawning.spawn-limits.monster'),
    provenance: [PROVENANCE_BADGES.BUKKIT, PROVENANCE_BADGES.PAPER_WORLD_DEFAULT, PROVENANCE_BADGES.PAPER_WORLD_OVERRIDE],
    globalFallbackFieldId: 'bukkit.spawn-limits.monsters',
    worldOverride: 'paper',
    safety: SAFETY_CLASSIFICATIONS.OPERATIONAL,
  }),
  field({
    id: 'paper-world.entities.spawning.spawn-limits.creature',
    path: 'entities.spawning.spawn-limits.creature',
    label: 'Creature spawn limit override',
    control: CONTROL_TYPES.INHERITABLE_NUMBER,
    valueType: 'inherit-or-integer',
    inheritValue: -1,
    validation: { integer: true, allowInheritToken: -1 },
    source: source(OFFICIAL_SOURCES.paperWorld, 'entities.spawning.spawn-limits.creature'),
    provenance: [PROVENANCE_BADGES.BUKKIT, PROVENANCE_BADGES.PAPER_WORLD_DEFAULT, PROVENANCE_BADGES.PAPER_WORLD_OVERRIDE],
    globalFallbackFieldId: 'bukkit.spawn-limits.animals',
    worldOverride: 'paper',
    safety: SAFETY_CLASSIFICATIONS.OPERATIONAL,
  }),
  field({
    id: 'paper-world.entities.spawning.ticks-per-spawn.monster',
    path: 'entities.spawning.ticks-per-spawn.monster',
    label: 'Monster spawn interval override',
    control: CONTROL_TYPES.INHERITABLE_NUMBER,
    valueType: 'inherit-or-integer',
    inheritValue: -1,
    unit: 'ticks',
    validation: { integer: true, allowInheritToken: -1 },
    source: source(OFFICIAL_SOURCES.paperWorld, 'entities.spawning.ticks-per-spawn.monster'),
    provenance: [PROVENANCE_BADGES.BUKKIT, PROVENANCE_BADGES.PAPER_WORLD_DEFAULT, PROVENANCE_BADGES.PAPER_WORLD_OVERRIDE],
    globalFallbackFieldId: 'bukkit.ticks-per.monster-spawns',
    worldOverride: 'paper',
    safety: SAFETY_CLASSIFICATIONS.OPERATIONAL,
  }),
  field({
    id: 'paper-world.entities.spawning.per-player-mob-spawns',
    path: 'entities.spawning.per-player-mob-spawns',
    label: 'Count mob caps per player',
    control: CONTROL_TYPES.SWITCH,
    valueType: 'boolean',
    source: source(OFFICIAL_SOURCES.paperWorld, 'entities.spawning.per-player-mob-spawns'),
    provenance: [PROVENANCE_BADGES.PAPER_WORLD_DEFAULT, PROVENANCE_BADGES.PAPER_WORLD_OVERRIDE],
    worldOverride: 'paper',
    safety: SAFETY_CLASSIFICATIONS.OPERATIONAL,
  }),
  field({
    id: 'paper-world.hopper.cooldown-when-full',
    path: 'hopper.cooldown-when-full',
    label: 'Cool down full hoppers',
    control: CONTROL_TYPES.SWITCH,
    valueType: 'boolean',
    source: source(OFFICIAL_SOURCES.paperWorld, 'hopper.cooldown-when-full'),
    provenance: [PROVENANCE_BADGES.PAPER_WORLD_DEFAULT, PROVENANCE_BADGES.PAPER_WORLD_OVERRIDE],
    worldOverride: 'paper',
    safety: SAFETY_CLASSIFICATIONS.OPERATIONAL,
  }),
  field({
    id: 'paper-world.hopper.disable-move-event',
    path: 'hopper.disable-move-event',
    label: 'Disable hopper move event',
    control: CONTROL_TYPES.RISK_GATED_SWITCH,
    valueType: 'boolean',
    source: source(OFFICIAL_SOURCES.paperWorld, 'hopper.disable-move-event'),
    provenance: [PROVENANCE_BADGES.PAPER_WORLD_DEFAULT, PROVENANCE_BADGES.PAPER_WORLD_OVERRIDE],
    worldOverride: 'paper',
    safety: SAFETY_CLASSIFICATIONS.PLUGIN,
    acknowledgement: 'This can improve performance but breaks protection plugins and other plugins that depend on InventoryMoveItemEvent.',
  }),
  field({
    id: 'paper-world.misc.redstone-implementation',
    path: 'misc.redstone-implementation',
    label: 'Redstone implementation',
    control: CONTROL_TYPES.SELECT,
    valueType: 'enum',
    options: [
      option('VANILLA', 'Vanilla'),
      option('EIGENCRAFT', 'Eigencraft'),
      option('ALTERNATE_CURRENT', 'Alternate Current'),
    ],
    source: source(OFFICIAL_SOURCES.paperWorld, 'misc.redstone-implementation'),
    provenance: [PROVENANCE_BADGES.PAPER_WORLD_DEFAULT, PROVENANCE_BADGES.PAPER_WORLD_OVERRIDE],
    worldOverride: 'paper',
    safety: SAFETY_CLASSIFICATIONS.OPERATIONAL,
    acknowledgement: 'Alternative redstone implementations can change redstone behavior.',
  }),
  field({
    id: 'paper-world.misc.disable-end-credits',
    path: 'misc.disable-end-credits',
    label: 'Disable End credits',
    control: CONTROL_TYPES.SWITCH,
    valueType: 'boolean',
    source: source(OFFICIAL_SOURCES.paperWorld, 'misc.disable-end-credits'),
    provenance: [PROVENANCE_BADGES.PAPER_WORLD_DEFAULT, PROVENANCE_BADGES.PAPER_WORLD_OVERRIDE],
    worldOverride: 'paper',
  }),
  field({
    id: 'paper-world.misc.update-pathfinding-on-block-update',
    path: 'misc.update-pathfinding-on-block-update',
    label: 'Update pathfinding on block update',
    control: CONTROL_TYPES.SWITCH,
    valueType: 'boolean',
    source: source(OFFICIAL_SOURCES.paperWorld, 'misc.update-pathfinding-on-block-update'),
    provenance: [PROVENANCE_BADGES.PAPER_WORLD_DEFAULT, PROVENANCE_BADGES.PAPER_WORLD_OVERRIDE],
    worldOverride: 'paper',
    safety: SAFETY_CLASSIFICATIONS.OPERATIONAL,
  }),
  field({
    id: 'paper-world.tick-rates.behavior',
    path: 'tick-rates.behavior.<entity-type>.<behavior-name>',
    label: 'Entity behavior tick rate',
    control: CONTROL_TYPES.STRUCTURED_KEY_VALUE,
    valueType: 'entity-behavior-rate-map',
    requiresCapability: 'entity-behavior-registry',
    validation: { keysFromRegistry: true, integerValues: true, allowMinusOne: true },
    source: source(OFFICIAL_SOURCES.paperWorld, 'tick-rates.behavior'),
    provenance: [PROVENANCE_BADGES.PAPER_WORLD_DEFAULT, PROVENANCE_BADGES.PAPER_WORLD_OVERRIDE],
    worldOverride: 'paper',
    safety: SAFETY_CLASSIFICATIONS.OPERATIONAL,
  }),
  field({
    id: 'paper-world.tick-rates.sensor',
    path: 'tick-rates.sensor.<entity-type>.<sensor-name>',
    label: 'Entity sensor tick rate',
    control: CONTROL_TYPES.STRUCTURED_KEY_VALUE,
    valueType: 'entity-sensor-rate-map',
    requiresCapability: 'entity-sensor-registry',
    validation: { keysFromRegistry: true, integerValues: true, allowMinusOne: true },
    source: source(OFFICIAL_SOURCES.paperWorld, 'tick-rates.sensor'),
    provenance: [PROVENANCE_BADGES.PAPER_WORLD_DEFAULT, PROVENANCE_BADGES.PAPER_WORLD_OVERRIDE],
    worldOverride: 'paper',
    safety: SAFETY_CLASSIFICATIONS.OPERATIONAL,
  }),
  field({
    id: 'paper-world.unsupported-settings.disable-world-ticking-when-empty',
    path: 'unsupported-settings.disable-world-ticking-when-empty',
    label: 'Stop ticking empty worlds',
    control: CONTROL_TYPES.RISK_GATED_SWITCH,
    valueType: 'boolean',
    source: source(OFFICIAL_SOURCES.paperWorld, 'unsupported-settings.disable-world-ticking-when-empty'),
    provenance: [PROVENANCE_BADGES.PAPER_WORLD_DEFAULT, PROVENANCE_BADGES.PAPER_WORLD_OVERRIDE],
    worldOverride: 'paper',
    safety: SAFETY_CLASSIFICATIONS.UNSUPPORTED,
    acknowledgement: 'Paper marks unsupported settings as subject to unintended side effects and removal or behavior changes in future releases.',
  }),
]);

const CONFIGURATION_FAMILIES = Object.freeze([
  Object.freeze({
    id: 'server-properties',
    label: 'Minecraft server.properties',
    file: 'server.properties',
    format: 'java-properties',
    appliesTo: SERVER_FAMILIES,
    sourceUrls: [OFFICIAL_SOURCES.paperServerProperties],
    versioning: 'Shared settings must still be resolved against the selected server version.',
    fields: SHARED_SERVER_PROPERTIES_FIELDS,
  }),
  Object.freeze({
    id: 'bukkit',
    label: 'Bukkit configuration',
    file: 'bukkit.yml',
    format: 'yaml',
    appliesTo: SERVER_FAMILIES,
    sourceUrls: [OFFICIAL_SOURCES.paperBukkit],
    versioning: 'The Paper reference is the current source for the shared Bukkit file. Dynamic plugin values require runtime discovery.',
    fields: BUKKIT_FIELDS,
  }),
  Object.freeze({
    id: 'spigot',
    label: 'Spigot configuration',
    file: 'spigot.yml',
    format: 'yaml',
    appliesTo: SERVER_FAMILIES,
    sourceUrls: [OFFICIAL_SOURCES.paperSpigot, OFFICIAL_SOURCES.spigotConfiguration],
    versioning: 'Spigot world settings and historical behavior vary by build; resolve against the selected build before enabling a write.',
    fields: SPIGOT_FIELDS,
  }),
  Object.freeze({
    id: 'paper-global',
    label: 'Paper global configuration',
    file: 'config/paper-global.yml',
    format: 'yaml',
    appliesTo: ['paper'],
    sourceUrls: [OFFICIAL_SOURCES.paperGlobal],
    versioning: 'Resolve against the selected Paper build. Unsupported settings remain visibly risk-gated, not hidden.',
    fields: PAPER_GLOBAL_FIELDS,
  }),
  Object.freeze({
    id: 'paper-world',
    label: 'Paper world configuration',
    file: 'config/paper-world-defaults.yml and world/dimensions/<namespace>/<key>/paper-world.yml',
    format: 'yaml',
    appliesTo: ['paper'],
    sourceUrls: [OFFICIAL_SOURCES.paperConfiguration, OFFICIAL_SOURCES.paperWorld],
    versioning: 'World overrides are leaf-only and inherit all unspecified values from paper-world-defaults.yml.',
    fields: PAPER_WORLD_FIELDS,
  }),
]);

const ALL_FIELDS = Object.freeze(CONFIGURATION_FAMILIES.flatMap((family) => family.fields));
const FIELDS_BY_ID = new Map(ALL_FIELDS.map((definition) => [definition.id, definition]));

function clone(value) {
  if (Array.isArray(value)) {
    return value.map(clone);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, clone(entry)]));
  }
  return value;
}

function supportedServerFamily(serverFamily) {
  return SERVER_FAMILIES.includes(serverFamily);
}

function normalizeRuntime(runtime = {}) {
  const serverFamily = runtime.serverFamily || runtime.family;
  const capabilities = new Set(Array.isArray(runtime.capabilities) ? runtime.capabilities : []);

  return {
    serverFamily: supportedServerFamily(serverFamily) ? serverFamily : null,
    minecraftVersion: typeof runtime.minecraftVersion === 'string' ? runtime.minecraftVersion : null,
    paperBuild: typeof runtime.paperBuild === 'string' ? runtime.paperBuild : null,
    spigotBuild: typeof runtime.spigotBuild === 'string' ? runtime.spigotBuild : null,
    catalogRevision: typeof runtime.catalogRevision === 'string' ? runtime.catalogRevision : null,
    capabilities,
  };
}

function fieldAvailability(definition, runtime) {
  if (!runtime.serverFamily) {
    return Object.freeze({ state: 'needs-server-family', reason: 'Choose Paper or Spigot before configuration controls are enabled.' });
  }

  const family = CONFIGURATION_FAMILIES.find((candidate) => candidate.fields.includes(definition));
  if (!family || !family.appliesTo.includes(runtime.serverFamily)) {
    return Object.freeze({ state: 'not-applicable', reason: 'This field does not apply to the selected server family.' });
  }

  if (definition.control === CONTROL_TYPES.ADVANCED_UNAVAILABLE || definition.control === CONTROL_TYPES.READ_ONLY) {
    return Object.freeze({ state: 'unavailable', reason: definition.unavailableReason || 'This value is not user-editable.' });
  }

  if (definition.requiresCapability && !runtime.capabilities.has(definition.requiresCapability)) {
    return Object.freeze({
      state: 'needs-discovery',
      reason: `This control needs the ${definition.requiresCapability} capability from the selected server before values can be chosen.`,
    });
  }

  if (!runtime.minecraftVersion) {
    return Object.freeze({ state: 'needs-version', reason: 'Choose the target Minecraft version before enabling a version-scoped configuration write.' });
  }

  if (runtime.serverFamily === 'paper' && !runtime.paperBuild) {
    return Object.freeze({ state: 'needs-build', reason: 'Choose the target Paper build before enabling a Paper configuration write.' });
  }

  if (runtime.serverFamily === 'spigot' && !runtime.spigotBuild) {
    return Object.freeze({ state: 'needs-build', reason: 'Choose the target Spigot build before enabling a Spigot configuration write.' });
  }

  if (!runtime.catalogRevision) {
    return Object.freeze({ state: 'needs-catalog-revision', reason: 'Record the official configuration catalog revision used for this selected server before enabling a write.' });
  }

  return Object.freeze({ state: 'available', reason: 'The field is applicable to the selected server context.' });
}

function resolveConfigurationCatalog(runtimeInput = {}) {
  const runtime = normalizeRuntime(runtimeInput);
  return Object.freeze({
    revision: CONFIGURATION_SCHEMA_REVISION,
    runtime: Object.freeze({
      serverFamily: runtime.serverFamily,
      minecraftVersion: runtime.minecraftVersion,
      paperBuild: runtime.paperBuild,
      spigotBuild: runtime.spigotBuild,
      catalogRevision: runtime.catalogRevision,
      capabilities: [...runtime.capabilities].sort(),
    }),
    families: CONFIGURATION_FAMILIES
      .filter((family) => !runtime.serverFamily || family.appliesTo.includes(runtime.serverFamily))
      .map((family) => Object.freeze({
        ...family,
        fields: family.fields.map((definition) => Object.freeze({
          ...definition,
          availability: fieldAvailability(definition, runtime),
        })),
      })),
  });
}

function getField(fieldId) {
  return FIELDS_BY_ID.get(fieldId) || null;
}

function hasOwn(record, key) {
  return Boolean(record) && Object.prototype.hasOwnProperty.call(record, key);
}

function isVaultReference(value) {
  return Boolean(value)
    && typeof value === 'object'
    && value.kind === 'vault-reference'
    && typeof value.key === 'string'
    && value.key.length > 0;
}

function validateConfigurationValue(fieldId, value) {
  const definition = getField(fieldId);
  if (!definition) {
    return Object.freeze({ valid: false, error: `Unknown configuration field: ${fieldId}` });
  }

  if (definition.control === CONTROL_TYPES.ADVANCED_UNAVAILABLE || definition.control === CONTROL_TYPES.READ_ONLY) {
    return Object.freeze({ valid: false, error: definition.unavailableReason || 'This value is not editable.' });
  }

  const rules = definition.validation || {};
  const allowEmpty = Boolean(rules.allowEmpty);
  if (value === '' && allowEmpty) {
    return Object.freeze({ valid: true, normalizedValue: value });
  }

  if (definition.valueType === 'boolean' && typeof value !== 'boolean') {
    return Object.freeze({ valid: false, error: 'Expected a boolean value.' });
  }

  if (definition.valueType === 'enum') {
    const available = (definition.options || []).map((entry) => entry.value);
    if (!available.includes(value)) {
      return Object.freeze({ valid: false, error: 'Choose a value from the available options.' });
    }
  }

  if (definition.valueType === 'vault-reference' && !isVaultReference(value)) {
    return Object.freeze({ valid: false, error: 'Expected a vault reference; plaintext secrets are not accepted.' });
  }

  if (rules.allowInheritToken !== undefined && value === rules.allowInheritToken) {
    return Object.freeze({ valid: true, normalizedValue: value });
  }

  const numeric = rules.integer || rules.number || definition.valueType === 'port';
  if (numeric) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return Object.freeze({ valid: false, error: 'Expected a finite numeric value.' });
    }
    if (rules.integer && !Number.isInteger(value)) {
      return Object.freeze({ valid: false, error: 'Expected an integer value.' });
    }
    if (rules.allowMinusOne && value === -1) {
      return Object.freeze({ valid: true, normalizedValue: value });
    }
    if (typeof rules.min === 'number' && value < rules.min) {
      return Object.freeze({ valid: false, error: `Value must be at least ${rules.min}.` });
    }
    if (typeof rules.max === 'number' && value > rules.max) {
      return Object.freeze({ valid: false, error: `Value must be at most ${rules.max}.` });
    }
  }

  if (definition.valueType === 'default-or-integer' && value !== definition.inheritValue && (!Number.isInteger(value))) {
    return Object.freeze({ valid: false, error: 'Expected the inherit value or an integer.' });
  }

  if (definition.valueType === 'inherit-or-integer' && value !== definition.inheritValue && (!Number.isInteger(value))) {
    return Object.freeze({ valid: false, error: 'Expected the inherit value or an integer.' });
  }

  if (rules.url && typeof value === 'string' && value.length > 0) {
    try {
      // Construction validates URL syntax without making a network request.
      new URL(value);
    } catch {
      return Object.freeze({ valid: false, error: 'Expected a valid URL.' });
    }
  }

  if (rules.uuid && typeof value === 'string' && value.length > 0 && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    return Object.freeze({ valid: false, error: 'Expected a UUID.' });
  }

  if (rules.sha1 && typeof value === 'string' && value.length > 0 && !/^[0-9a-f]{40}$/i.test(value)) {
    return Object.freeze({ valid: false, error: 'Expected a 40-character SHA-1 hexadecimal digest.' });
  }

  if (rules.hostOrIp && typeof value === 'string' && value.length > 0 && /[\s/\\]/.test(value)) {
    return Object.freeze({ valid: false, error: 'A bind address cannot contain whitespace or path separators.' });
  }

  if (rules.forbidPathSeparators && typeof value === 'string' && /[\\/]/.test(value)) {
    return Object.freeze({ valid: false, error: 'This value cannot contain path separators.' });
  }

  if (rules.itemPrefix && Array.isArray(value) && value.some((entry) => typeof entry !== 'string' || !entry.startsWith(rules.itemPrefix))) {
    return Object.freeze({ valid: false, error: `Each value must begin with ${rules.itemPrefix}.` });
  }

  if (rules.uniqueItems && Array.isArray(value) && new Set(value).size !== value.length) {
    return Object.freeze({ valid: false, error: 'Duplicate values are not allowed.' });
  }

  return Object.freeze({ valid: true, normalizedValue: clone(value) });
}

function validateConfigurationDraft(values = {}) {
  const results = Object.entries(values).map(([fieldId, value]) => Object.freeze({
    fieldId,
    ...validateConfigurationValue(fieldId, value),
  }));

  return Object.freeze({
    valid: results.every((result) => result.valid),
    results: Object.freeze(results),
  });
}

function resolveWorldEffectiveValue({ fieldId, globalValues = {}, defaultWorldValues = {}, worldValues = {} } = {}) {
  const definition = getField(fieldId);
  if (!definition || !definition.worldOverride) {
    return Object.freeze({
      fieldId,
      value: undefined,
      provenance: PROVENANCE_BADGES.UNKNOWN,
      error: 'This field does not support a modeled world override.',
    });
  }

  if (hasOwn(worldValues, fieldId)) {
    return Object.freeze({ fieldId, value: clone(worldValues[fieldId]), provenance: definition.worldOverride === 'paper' ? PROVENANCE_BADGES.PAPER_WORLD_OVERRIDE : PROVENANCE_BADGES.SPIGOT_WORLD_OVERRIDE });
  }

  if (hasOwn(defaultWorldValues, fieldId)) {
    return Object.freeze({ fieldId, value: clone(defaultWorldValues[fieldId]), provenance: definition.worldOverride === 'paper' ? PROVENANCE_BADGES.PAPER_WORLD_DEFAULT : PROVENANCE_BADGES.SPIGOT_WORLD_DEFAULT });
  }

  if (definition.globalFallbackFieldId && hasOwn(globalValues, definition.globalFallbackFieldId)) {
    return Object.freeze({ fieldId, value: clone(globalValues[definition.globalFallbackFieldId]), provenance: PROVENANCE_BADGES.BUKKIT });
  }

  return Object.freeze({ fieldId, value: undefined, provenance: PROVENANCE_BADGES.UNKNOWN, error: 'No explicit global, default-world, or per-world value is available.' });
}

function createMinimalWorldOverride({ fieldId, worldKey, value, discoveredWorldKeys = [] } = {}) {
  const definition = getField(fieldId);
  if (!definition || !definition.worldOverride) {
    return Object.freeze({ valid: false, error: 'Choose a field that supports per-world overrides.' });
  }
  if (!Array.isArray(discoveredWorldKeys) || !discoveredWorldKeys.includes(worldKey)) {
    return Object.freeze({ valid: false, error: 'Choose a world identifier from the discovered world registry.' });
  }

  const validation = validateConfigurationValue(fieldId, value);
  if (!validation.valid) {
    return Object.freeze({ valid: false, error: validation.error });
  }

  if (definition.worldOverride === 'paper') {
    return Object.freeze({
      valid: true,
      kind: 'minimal-paper-world-leaf-override',
      worldKey,
      targetFilePattern: 'world/dimensions/<namespace>/<key>/paper-world.yml',
      operation: Object.freeze({ op: 'set-leaf', path: definition.path, value: validation.normalizedValue }),
      provenance: PROVENANCE_BADGES.PAPER_WORLD_OVERRIDE,
      note: 'Only this leaf is represented. Unspecified values inherit from paper-world-defaults.yml.',
    });
  }

  return Object.freeze({
    valid: true,
    kind: 'minimal-spigot-world-leaf-override',
    worldKey,
    targetFile: 'spigot.yml',
    operation: Object.freeze({ op: 'set-leaf', path: `world-settings.${worldKey}.${definition.path.replace('world-settings.default.', '')}`, value: validation.normalizedValue }),
    provenance: PROVENANCE_BADGES.SPIGOT_WORLD_OVERRIDE,
    note: 'Only this leaf is represented. Unspecified values inherit from world-settings.default.',
  });
}

function getConfigurationFamily(familyId) {
  return CONFIGURATION_FAMILIES.find((family) => family.id === familyId) || null;
}

module.exports = Object.freeze({
  CONFIGURATION_SCHEMA_REVISION,
  OFFICIAL_SOURCES,
  SERVER_FAMILIES,
  CONTROL_TYPES,
  SAFETY_CLASSIFICATIONS,
  RESTART_BADGES,
  PROVENANCE_BADGES,
  ADVANCED_DOCUMENT_BOUNDARIES,
  CONFIGURATION_FAMILIES,
  getConfigurationFamily,
  getField,
  normalizeRuntime,
  fieldAvailability,
  resolveConfigurationCatalog,
  validateConfigurationValue,
  validateConfigurationDraft,
  resolveWorldEffectiveValue,
  createMinimalWorldOverride,
});
