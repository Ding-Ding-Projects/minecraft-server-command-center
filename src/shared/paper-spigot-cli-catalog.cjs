'use strict';

/**
 * Typed, no-shell command-line metadata for a future Paper/Spigot UI.
 *
 * This module deliberately creates argument arrays only. It does not locate a
 * Java runtime, inspect a server JAR, start a process, alter files, or decide
 * whether a server can run. Callers must pass `argvAfterJar` directly to a
 * process API with `shell: false` if a separately authorized launcher exists.
 */

const net = require('node:net');

const CATALOG_SCHEMA_VERSION = '1.0.0';
const PATH_MAX_LENGTH = 4096;
const DISPLAY_NAME_MAX_LENGTH = 128;
const WORLD_NAME_MAX_LENGTH = 255;
const MAX_REPEATABLE_VALUES = 64;
const MAX_PLAYERS_CATALOG_LIMIT = 2_147_483_647;
const MAX_MEMORY_BYTES = 1_099_511_627_776n; // 1 TiB catalog safety ceiling.

const PAPER_CLI_SOURCE_URL = 'https://docs.papermc.io/paper/reference/cli-arguments/';
const PAPER_GETTING_STARTED_SOURCE_URL = 'https://docs.papermc.io/paper/getting-started/';
const PAPER_SYSTEM_PROPERTIES_SOURCE_URL = 'https://docs.papermc.io/paper/reference/system-properties/';
const SPIGOT_STARTUP_PARAMETERS_SOURCE_URL = 'https://www.spigotmc.org/wiki/start-up-parameters/';
const SPIGOT_CONFIGURATION_SOURCE_URL = 'https://www.spigotmc.org/wiki/spigot-configuration/';

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) {
      deepFreeze(child);
    }
  }
  return value;
}

function hasOwn(record, key) {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function isPlainRecord(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function catalogError(code, field, message) {
  return { code, field, message };
}

class CatalogValidationError extends Error {
  constructor(errors) {
    super(errors.map((error) => `${error.field}: ${error.message}`).join('; '));
    this.name = 'CatalogValidationError';
    this.code = 'PAPER_SPIGOT_CLI_VALIDATION_FAILED';
    this.errors = deepFreeze([...errors]);
  }
}

const PAPER_CLI_CATEGORIES = deepFreeze([
  {
    id: 'preflight',
    label: 'Preflight information',
    description: 'Read-only help or version requests. These flags intentionally prevent a normal server start.',
    uiSection: 'Preflight',
  },
  {
    id: 'config-paths',
    label: 'Configuration paths',
    description: 'Locations for Bukkit, Spigot, commands, Minecraft properties, and Paper configuration.',
    uiSection: 'Configuration',
  },
  {
    id: 'plugin-locations',
    label: 'Plugin locations',
    description: 'Primary and additional plugin directories or explicitly selected plugin JAR files.',
    uiSection: 'Plugins',
  },
  {
    id: 'world-location',
    label: 'World paths and name',
    description: 'The world-container directory and primary world name.',
    uiSection: 'Worlds',
  },
  {
    id: 'network-overrides',
    label: 'Network and server-property overrides',
    description: 'Typed command-line overrides for bind host, port, online authentication, and player capacity.',
    uiSection: 'Network',
  },
  {
    id: 'console-ui',
    label: 'User interface and console',
    description: 'Console, JLine, and graphical-interface choices.',
    uiSection: 'Console',
  },
  {
    id: 'initialization-world-creation',
    label: 'Initialization and world creation',
    description: 'Settings-only initialization, demo mode, bonus chest, and datapack-safe mode.',
    uiSection: 'Startup behavior',
  },
  {
    id: 'process-identity',
    label: 'Process and crash identity',
    description: 'PID-file, server display-name, and crash-file identifier values.',
    uiSection: 'Process',
  },
  {
    id: 'legacy-migration',
    label: 'Legacy Paper migration',
    description: 'A migration-only legacy Paper settings path and the current Paper settings directory.',
    uiSection: 'Configuration',
  },
  {
    id: 'upgrade-diagnostics',
    label: 'World upgrade and diagnostics',
    description: 'High-consequence world-upgrade, cache, region-file, and Java Flight Recorder choices.',
    uiSection: 'Maintenance',
  },
]);

const SELECTION_MUTEX_GROUPS = deepFreeze([
  {
    id: 'preflight-action',
    optionIds: ['help', 'version'],
    minSelected: 0,
    maxSelected: 1,
    enforcement: 'catalog',
    reason: 'Both documented preflight flags prevent a normal start. The catalog requires one explicit preflight action at a time.',
  },
]);

const SELECTION_COMPOSITION_WARNINGS = deepFreeze([
  {
    id: 'console-disabled-jline-irrelevant',
    optionIds: ['noConsole', 'noJline'],
    severity: 'notice',
    reason: 'When the console is disabled, changing its JLine behavior has no useful UI effect. This is a catalog warning, not a claimed Paper parser restriction.',
  },
  {
    id: 'init-settings-world-options-deferred',
    optionIds: ['initSettings', 'demo', 'bonusChest', 'safeMode', 'forceUpgrade', 'eraseCache', 'recreateRegionFiles'],
    severity: 'notice',
    reason: 'Paper documents that --initSettings shuts down before worlds are created. World-related selections can remain configured but are not expected to take effect in that preflight-only run.',
  },
]);

const PAPER_CLI_OPTIONS = deepFreeze([
  {
    id: 'help',
    order: 10,
    category: 'preflight',
    flags: { canonical: '--help', aliases: ['-?'] },
    type: 'flag',
    value: { type: 'boolean', requiredWhenSelected: false },
    ui: { control: 'switch', label: 'Show Paper CLI help', richHelp: 'Requests Paper\'s CLI help and exits without a normal server start.' },
    defaults: { documented: null, emittedWhenUnset: false },
    limits: { selection: 'At most one preflight action.' },
    safety: { class: 'read-only-preflight', consequence: 'Does not normally start the server.' },
    mutuallyExclusiveGroups: ['preflight-action'],
    prerequisites: [],
    argv: { position: 'after-jar', form: 'flag', emitWhen: 'true', repeatable: false, shell: false },
    support: { paper: 'documented', spigot: 'documented' },
    source: PAPER_CLI_SOURCE_URL,
  },
  {
    id: 'commandsSettings',
    order: 20,
    category: 'config-paths',
    flags: { canonical: '--commands-settings', aliases: ['-C'] },
    type: 'yaml-file-path',
    value: { type: 'path', validator: 'yaml-file-path' },
    ui: { control: 'file-picker', browse: 'file', accept: ['.yml'], label: 'Commands settings file', richHelp: 'Routes command settings to a selected YAML file.' },
    defaults: { documented: 'commands.yml', emittedWhenUnset: false },
    limits: { catalog: `1-${PATH_MAX_LENGTH} characters; no control characters or option-looking value` },
    safety: { class: 'configuration-routing', consequence: 'A wrong path can make the server read or create configuration in an unintended location.' },
    mutuallyExclusiveGroups: [],
    prerequisites: [{ kind: 'path-review', text: 'Confirm the selected file is the intended server configuration file.' }],
    argv: { position: 'after-jar', form: 'flag-value', emitWhen: 'defined', repeatable: false, shell: false },
    support: { paper: 'documented', spigot: 'documented' },
    source: PAPER_CLI_SOURCE_URL,
  },
  {
    id: 'pluginsDirectory',
    order: 30,
    category: 'plugin-locations',
    flags: { canonical: '--plugins', aliases: ['-P'] },
    type: 'directory-path',
    value: { type: 'path', validator: 'directory-path' },
    ui: { control: 'folder-picker', browse: 'folder', label: 'Plugin directory', richHelp: 'Sets the primary directory in which Paper looks for plugin JARs.' },
    defaults: { documented: 'plugins', emittedWhenUnset: false },
    limits: { catalog: `1-${PATH_MAX_LENGTH} characters; no control characters or option-looking value` },
    safety: { class: 'plugin-loading', consequence: 'Plugin code is loaded from this directory; only use a reviewed and trusted location.' },
    mutuallyExclusiveGroups: [],
    prerequisites: [{ kind: 'plugin-trust-review', text: 'Review code and provenance of every plugin that can be discovered there.' }],
    argv: { position: 'after-jar', form: 'flag-value', emitWhen: 'defined', repeatable: false, shell: false },
    support: { paper: 'documented', spigot: 'documented' },
    source: PAPER_CLI_SOURCE_URL,
  },
  {
    id: 'spigotSettings',
    order: 40,
    category: 'config-paths',
    flags: { canonical: '--spigot-settings', aliases: ['-S'] },
    type: 'yaml-file-path',
    value: { type: 'path', validator: 'yaml-file-path' },
    ui: { control: 'file-picker', browse: 'file', accept: ['.yml'], label: 'Spigot settings file', richHelp: 'Routes the Spigot configuration to a selected YAML file.' },
    defaults: { documented: 'spigot.yml', emittedWhenUnset: false },
    limits: { catalog: `1-${PATH_MAX_LENGTH} characters; no control characters or option-looking value` },
    safety: { class: 'configuration-routing', consequence: 'A wrong path can change which Spigot configuration is read or written.' },
    mutuallyExclusiveGroups: [],
    prerequisites: [{ kind: 'path-review', text: 'Confirm the selected file is the intended Spigot configuration file.' }],
    argv: { position: 'after-jar', form: 'flag-value', emitWhen: 'defined', repeatable: false, shell: false },
    support: { paper: 'documented', spigot: 'documented' },
    source: PAPER_CLI_SOURCE_URL,
  },
  {
    id: 'worldContainer',
    order: 50,
    category: 'world-location',
    flags: { canonical: '--world-dir', aliases: ['-W', '--universe', '--world-container'] },
    type: 'directory-path',
    value: { type: 'path', validator: 'directory-path' },
    ui: { control: 'folder-picker', browse: 'folder', label: 'World container', richHelp: 'Sets the directory that contains the server\'s world folders.' },
    defaults: { documented: '.', emittedWhenUnset: false },
    limits: { catalog: `1-${PATH_MAX_LENGTH} characters; no control characters or option-looking value` },
    safety: { class: 'world-location', consequence: 'A wrong path can point a server at the wrong world data.' },
    mutuallyExclusiveGroups: [],
    prerequisites: [{ kind: 'world-backup-review', text: 'Confirm the selected directory contains the intended backed-up world set.' }],
    argv: { position: 'after-jar', form: 'flag-value', emitWhen: 'defined', repeatable: false, shell: false },
    support: { paper: 'documented', spigot: 'documented' },
    source: PAPER_CLI_SOURCE_URL,
  },
  {
    id: 'extraPluginDirectories',
    order: 60,
    category: 'plugin-locations',
    flags: { canonical: '--add-extra-plugin-dir', aliases: ['--add-plugin-dir'] },
    type: 'repeatable-directory-path',
    value: { type: 'array<path>', validator: 'repeatable-directory-path', maxItems: MAX_REPEATABLE_VALUES },
    ui: { control: 'repeatable-folder-picker', browse: 'folder', label: 'Additional plugin directories', richHelp: 'Adds one or more plugin directories. Paper documents that this argument may be supplied repeatedly.' },
    defaults: { documented: [], emittedWhenUnset: false },
    limits: { catalog: `0-${MAX_REPEATABLE_VALUES} directory values; each is 1-${PATH_MAX_LENGTH} characters` },
    safety: { class: 'plugin-loading', consequence: 'Every added directory is another source of executable plugin code.' },
    mutuallyExclusiveGroups: [],
    prerequisites: [{ kind: 'plugin-trust-review', text: 'Review each added plugin directory and the code it can contain.' }],
    argv: { position: 'after-jar', form: 'repeated-flag-value', emitWhen: 'non-empty array', repeatable: true, shell: false },
    support: { paper: 'documented', spigot: 'not-documented' },
    source: PAPER_CLI_SOURCE_URL,
  },
  {
    id: 'extraPluginJars',
    order: 70,
    category: 'plugin-locations',
    flags: { canonical: '--add-extra-plugin-jar', aliases: ['--add-plugin'] },
    type: 'repeatable-jar-file-path',
    value: { type: 'array<path>', validator: 'repeatable-plugin-jar-path', maxItems: MAX_REPEATABLE_VALUES },
    ui: { control: 'repeatable-file-picker', browse: 'file', accept: ['.jar'], label: 'Additional plugin JARs', richHelp: 'Adds one or more explicit plugin JAR files. Paper documents that this argument may be supplied repeatedly.' },
    defaults: { documented: [], emittedWhenUnset: false },
    limits: { catalog: `0-${MAX_REPEATABLE_VALUES} JAR values; each is 1-${PATH_MAX_LENGTH} characters` },
    safety: { class: 'plugin-loading', consequence: 'Each selected JAR can execute plugin code in the server process.' },
    mutuallyExclusiveGroups: [],
    prerequisites: [{ kind: 'plugin-trust-review', text: 'Review every selected plugin JAR and its provenance.' }],
    argv: { position: 'after-jar', form: 'repeated-flag-value', emitWhen: 'non-empty array', repeatable: true, shell: false },
    support: { paper: 'documented', spigot: 'not-documented' },
    source: PAPER_CLI_SOURCE_URL,
  },
  {
    id: 'bukkitSettings',
    order: 80,
    category: 'config-paths',
    flags: { canonical: '--bukkit-settings', aliases: ['-b'] },
    type: 'yaml-file-path',
    value: { type: 'path', validator: 'yaml-file-path' },
    ui: { control: 'file-picker', browse: 'file', accept: ['.yml'], label: 'Bukkit settings file', richHelp: 'Routes Bukkit configuration to a selected YAML file.' },
    defaults: { documented: 'bukkit.yml', emittedWhenUnset: false },
    limits: { catalog: `1-${PATH_MAX_LENGTH} characters; no control characters or option-looking value` },
    safety: { class: 'configuration-routing', consequence: 'A wrong path can change which Bukkit configuration is read or written.' },
    mutuallyExclusiveGroups: [],
    prerequisites: [{ kind: 'path-review', text: 'Confirm the selected file is the intended Bukkit configuration file.' }],
    argv: { position: 'after-jar', form: 'flag-value', emitWhen: 'defined', repeatable: false, shell: false },
    support: { paper: 'documented', spigot: 'documented' },
    source: PAPER_CLI_SOURCE_URL,
  },
  {
    id: 'serverProperties',
    order: 90,
    category: 'config-paths',
    flags: { canonical: '--config', aliases: ['-c'] },
    type: 'properties-file-path',
    value: { type: 'path', validator: 'properties-file-path' },
    ui: { control: 'file-picker', browse: 'file', accept: ['.properties'], label: 'server.properties file', richHelp: 'Routes the Minecraft server properties file to a selected location.' },
    defaults: { documented: 'server.properties', emittedWhenUnset: false },
    limits: { catalog: `1-${PATH_MAX_LENGTH} characters; no control characters or option-looking value` },
    safety: { class: 'configuration-routing', consequence: 'A wrong path can change core server-property behavior or create configuration in an unintended location.' },
    mutuallyExclusiveGroups: [],
    prerequisites: [{ kind: 'path-review', text: 'Confirm the selected file is the intended server.properties file.' }],
    argv: { position: 'after-jar', form: 'flag-value', emitWhen: 'defined', repeatable: false, shell: false },
    support: { paper: 'documented', spigot: 'documented' },
    source: PAPER_CLI_SOURCE_URL,
  },
  {
    id: 'demo',
    order: 100,
    category: 'initialization-world-creation',
    flags: { canonical: '--demo', aliases: [] },
    type: 'flag',
    value: { type: 'boolean', requiredWhenSelected: false },
    ui: { control: 'switch', label: 'Demo mode', richHelp: 'Loads demo mode, with a predictable generated world and extra demo reminders.' },
    defaults: { documented: false, emittedWhenUnset: false },
    limits: { selection: 'Boolean flag.' },
    safety: { class: 'world-generation', consequence: 'Changes initial world behavior and user-facing demo messaging.' },
    mutuallyExclusiveGroups: [],
    prerequisites: [{ kind: 'world-creation-review', text: 'Use only when a demo world is intentional.' }],
    argv: { position: 'after-jar', form: 'flag', emitWhen: 'true', repeatable: false, shell: false },
    support: { paper: 'documented', spigot: 'not-documented' },
    source: PAPER_CLI_SOURCE_URL,
  },
  {
    id: 'bonusChest',
    order: 110,
    category: 'initialization-world-creation',
    flags: { canonical: '--bonusChest', aliases: [] },
    type: 'flag',
    value: { type: 'boolean', requiredWhenSelected: false },
    ui: { control: 'switch', label: 'Create bonus chest', richHelp: 'Requests a bonus chest during initial world creation.' },
    defaults: { documented: false, emittedWhenUnset: false },
    limits: { selection: 'Boolean flag.' },
    safety: { class: 'world-generation', consequence: 'Affects initial world creation only.' },
    mutuallyExclusiveGroups: [],
    prerequisites: [{ kind: 'world-creation-review', text: 'Use only before creating a world where a bonus chest is desired.' }],
    argv: { position: 'after-jar', form: 'flag', emitWhen: 'true', repeatable: false, shell: false },
    support: { paper: 'documented', spigot: 'not-documented' },
    source: PAPER_CLI_SOURCE_URL,
  },
  {
    id: 'eraseCache',
    order: 120,
    category: 'upgrade-diagnostics',
    flags: { canonical: '--eraseCache', aliases: [] },
    type: 'flag',
    value: { type: 'boolean', requiredWhenSelected: false },
    ui: { control: 'danger-switch', label: 'Erase world upgrade cache', richHelp: 'Forces cache erasure during a world upgrade. Paper documents removal of heightmap and light data so it can be recalculated.' },
    defaults: { documented: false, emittedWhenUnset: false },
    limits: { selection: 'Boolean flag with explicit acknowledgement.' },
    safety: { class: 'destructive-world-upgrade', consequence: 'Removes upgrade cache data such as heightmaps and light data.' },
    mutuallyExclusiveGroups: [],
    prerequisites: [
      { kind: 'world-backup-confirmation', text: 'Require a current backup before this high-consequence maintenance option is emitted.' },
      { kind: 'explicit-danger-acknowledgement', text: 'Require an explicit acknowledgement that cached world data will be removed and recalculated.' },
    ],
    argv: { position: 'after-jar', form: 'flag', emitWhen: 'true', repeatable: false, shell: false },
    support: { paper: 'documented', spigot: 'not-documented' },
    source: PAPER_CLI_SOURCE_URL,
  },
  {
    id: 'forceUpgrade',
    order: 130,
    category: 'upgrade-diagnostics',
    flags: { canonical: '--forceUpgrade', aliases: [] },
    type: 'flag',
    value: { type: 'boolean', requiredWhenSelected: false },
    ui: { control: 'danger-switch', label: 'Force full world upgrade', richHelp: 'Requests a full world upgrade on startup. Paper warns that it should rarely be used because gradual upgrades are normally sufficient.' },
    defaults: { documented: false, emittedWhenUnset: false },
    limits: { selection: 'Boolean flag with explicit acknowledgement.' },
    safety: { class: 'destructive-world-upgrade', consequence: 'Triggers a full world-upgrade operation at server startup.' },
    mutuallyExclusiveGroups: [],
    prerequisites: [
      { kind: 'world-backup-confirmation', text: 'Require a current backup before requesting a full world upgrade.' },
      { kind: 'explicit-danger-acknowledgement', text: 'Paper documents this as a rarely appropriate option; require deliberate acknowledgement.' },
    ],
    argv: { position: 'after-jar', form: 'flag', emitWhen: 'true', repeatable: false, shell: false },
    support: { paper: 'documented', spigot: 'not-documented' },
    source: PAPER_CLI_SOURCE_URL,
  },
  {
    id: 'host',
    order: 140,
    category: 'network-overrides',
    flags: { canonical: '--host', aliases: ['-h', '--server-ip'] },
    type: 'hostname-or-ip',
    value: { type: 'hostname-or-ip', validator: 'hostname-or-ip' },
    ui: { control: 'host-input', label: 'Bind host or IP', richHelp: 'Overrides the host on which the server listens. Enter a hostname or an IP address, without a port.' },
    defaults: { documented: 'server.properties value', emittedWhenUnset: false },
    limits: { catalog: 'Hostname or IPv4/IPv6 literal only; no URL, port, whitespace, or shell token input.' },
    safety: { class: 'network-exposure', consequence: 'Changes which interface the server listens on.' },
    mutuallyExclusiveGroups: [],
    prerequisites: [{ kind: 'network-review', text: 'Review firewall, reverse-proxy, and intended interface exposure before applying a bind override.' }],
    argv: { position: 'after-jar', form: 'flag-value', emitWhen: 'defined', repeatable: false, shell: false },
    support: { paper: 'documented', spigot: 'documented' },
    source: PAPER_CLI_SOURCE_URL,
  },
  {
    id: 'initSettings',
    order: 150,
    category: 'initialization-world-creation',
    flags: { canonical: '--initSettings', aliases: [] },
    type: 'flag',
    value: { type: 'boolean', requiredWhenSelected: false },
    ui: { control: 'switch', label: 'Initialize settings only', richHelp: 'Creates setting files and exits before creating worlds, so configuration can be reviewed first.' },
    defaults: { documented: false, emittedWhenUnset: false },
    limits: { selection: 'Boolean flag.' },
    safety: { class: 'initialization-only', consequence: 'Writes initial settings and exits before world creation; it is not a normal server start.' },
    mutuallyExclusiveGroups: [],
    prerequisites: [{ kind: 'write-location-review', text: 'Confirm all selected configuration paths are safe locations for initial files.' }],
    argv: { position: 'after-jar', form: 'flag', emitWhen: 'true', repeatable: false, shell: false },
    support: { paper: 'documented', spigot: 'not-documented' },
    source: PAPER_CLI_SOURCE_URL,
  },
  {
    id: 'jfrProfile',
    order: 160,
    category: 'upgrade-diagnostics',
    flags: { canonical: '--jfrProfile', aliases: [] },
    type: 'flag',
    value: { type: 'boolean', requiredWhenSelected: false },
    ui: { control: 'danger-switch', label: 'Enable JFR profiling', richHelp: 'Enables Java Flight Recorder profiling through Paper\'s documented CLI flag.' },
    defaults: { documented: false, emittedWhenUnset: false },
    limits: { selection: 'Boolean flag with operational review.' },
    safety: { class: 'diagnostics-profile', consequence: 'Enables diagnostic profiling and can change operational data collection and overhead.' },
    mutuallyExclusiveGroups: [],
    prerequisites: [{ kind: 'diagnostics-review', text: 'Confirm the JVM and operational data-handling plan support JFR profiling.' }],
    argv: { position: 'after-jar', form: 'flag', emitWhen: 'true', repeatable: false, shell: false },
    support: { paper: 'documented', spigot: 'not-documented' },
    source: PAPER_CLI_SOURCE_URL,
  },
  {
    id: 'noConsole',
    order: 170,
    category: 'console-ui',
    flags: { canonical: '--noconsole', aliases: [] },
    type: 'flag',
    value: { type: 'boolean', requiredWhenSelected: false },
    ui: { control: 'switch', label: 'Disable console', richHelp: 'Disables the console. Spigot documents that logs are still written.' },
    defaults: { documented: false, emittedWhenUnset: false },
    limits: { selection: 'Boolean flag.' },
    safety: { class: 'console-ui', consequence: 'Removes interactive console access for this server invocation.' },
    mutuallyExclusiveGroups: [],
    prerequisites: [{ kind: 'operational-access-review', text: 'Confirm a safe operational route remains available before disabling console interaction.' }],
    argv: { position: 'after-jar', form: 'flag', emitWhen: 'true', repeatable: false, shell: false },
    support: { paper: 'documented', spigot: 'documented' },
    source: PAPER_CLI_SOURCE_URL,
  },
  {
    id: 'noGui',
    order: 180,
    category: 'console-ui',
    flags: { canonical: '--nogui', aliases: [] },
    type: 'flag',
    value: { type: 'boolean', requiredWhenSelected: false },
    ui: { control: 'switch', label: 'Disable graphical interface', richHelp: 'Disables the graphical server interface. Paper uses this in its command-line startup example.' },
    defaults: { documented: false, emittedWhenUnset: false },
    limits: { selection: 'Boolean flag.' },
    safety: { class: 'console-ui', consequence: 'Uses a non-graphical server interface.' },
    mutuallyExclusiveGroups: [],
    prerequisites: [],
    argv: { position: 'after-jar', form: 'flag', emitWhen: 'true', repeatable: false, shell: false },
    support: { paper: 'documented', spigot: 'documented' },
    source: PAPER_CLI_SOURCE_URL,
  },
  {
    id: 'noJline',
    order: 190,
    category: 'console-ui',
    flags: { canonical: '--nojline', aliases: [] },
    type: 'flag',
    value: { type: 'boolean', requiredWhenSelected: false },
    ui: { control: 'switch', label: 'Use Vanilla-style console', richHelp: 'Disables JLine and emulates the Vanilla console.' },
    defaults: { documented: false, emittedWhenUnset: false },
    limits: { selection: 'Boolean flag.' },
    safety: { class: 'console-ui', consequence: 'Changes console interaction behavior.' },
    mutuallyExclusiveGroups: [],
    prerequisites: [],
    argv: { position: 'after-jar', form: 'flag', emitWhen: 'true', repeatable: false, shell: false },
    support: { paper: 'documented', spigot: 'documented' },
    source: PAPER_CLI_SOURCE_URL,
  },
  {
    id: 'onlineMode',
    order: 200,
    category: 'network-overrides',
    flags: { canonical: '--online-mode', aliases: ['-o'] },
    type: 'boolean',
    value: { type: 'boolean', validator: 'boolean' },
    ui: { control: 'segmented-boolean', label: 'Use online authentication', richHelp: 'Overrides online authentication with an explicit true or false value.' },
    defaults: { documented: 'server.properties value', emittedWhenUnset: false },
    limits: { catalog: 'Boolean only; the emitter writes lowercase true or false as a separate argv value.' },
    safety: { class: 'authentication-mode', consequence: 'Changing this can materially alter player authentication behavior.' },
    mutuallyExclusiveGroups: [],
    prerequisites: [{ kind: 'authentication-security-review', text: 'Require an explicit security review before overriding online authentication.' }],
    argv: { position: 'after-jar', form: 'flag-value', emitWhen: 'defined', repeatable: false, shell: false },
    support: { paper: 'documented', spigot: 'removed' },
    source: PAPER_CLI_SOURCE_URL,
  },
  {
    id: 'port',
    order: 210,
    category: 'network-overrides',
    flags: { canonical: '--port', aliases: ['-p', '--server-port'] },
    type: 'tcp-port',
    value: { type: 'integer', validator: 'tcp-port' },
    ui: { control: 'number-input', label: 'Server port', richHelp: 'Overrides the port on which the server listens.' },
    defaults: { documented: 'server.properties value', emittedWhenUnset: false },
    limits: { catalog: 'Integer from 1 through 65535.' },
    safety: { class: 'network-exposure', consequence: 'Changes the network port that must be reachable and permitted by local network policy.' },
    mutuallyExclusiveGroups: [],
    prerequisites: [{ kind: 'network-review', text: 'Confirm port ownership, firewall rules, and forwarding requirements.' }],
    argv: { position: 'after-jar', form: 'flag-value', emitWhen: 'defined', repeatable: false, shell: false },
    support: { paper: 'documented', spigot: 'documented' },
    source: PAPER_CLI_SOURCE_URL,
  },
  {
    id: 'legacyPaperSettings',
    order: 220,
    category: 'legacy-migration',
    flags: { canonical: '--paper-settings', aliases: ['--paper'] },
    type: 'yaml-file-path',
    value: { type: 'path', validator: 'yaml-file-path' },
    ui: { control: 'migration-file-picker', browse: 'file', accept: ['.yml'], label: 'Legacy paper.yml migration source', richHelp: 'Paper documents this only for migrating a legacy paper.yml file to the new configuration format; do not offer it for a new server.' },
    defaults: { documented: 'paper.yml', emittedWhenUnset: false },
    limits: { catalog: `1-${PATH_MAX_LENGTH} characters; migration-only UI state` },
    safety: { class: 'legacy-migration', consequence: 'Uses a legacy configuration path solely for migration.' },
    mutuallyExclusiveGroups: [],
    prerequisites: [{ kind: 'migration-confirmation', text: 'Require an explicit legacy-migration workflow and preserve a backup first.' }],
    argv: { position: 'after-jar', form: 'flag-value', emitWhen: 'defined', repeatable: false, shell: false },
    support: { paper: 'documented-migration-only', spigot: 'not-documented' },
    source: PAPER_CLI_SOURCE_URL,
  },
  {
    id: 'paperSettingsDirectory',
    order: 230,
    category: 'config-paths',
    flags: { canonical: '--paper-settings-directory', aliases: ['--paper-dir'] },
    type: 'directory-path',
    value: { type: 'path', validator: 'directory-path' },
    ui: { control: 'folder-picker', browse: 'folder', label: 'Paper settings directory', richHelp: 'Sets the Paper settings directory.' },
    defaults: { documented: 'config', emittedWhenUnset: false },
    limits: { catalog: `1-${PATH_MAX_LENGTH} characters; no control characters or option-looking value` },
    safety: { class: 'configuration-routing', consequence: 'A wrong directory can change where Paper finds or creates configuration.' },
    mutuallyExclusiveGroups: [],
    prerequisites: [{ kind: 'path-review', text: 'Confirm the directory is the intended Paper configuration location.' }],
    argv: { position: 'after-jar', form: 'flag-value', emitWhen: 'defined', repeatable: false, shell: false },
    support: { paper: 'documented', spigot: 'not-documented' },
    source: PAPER_CLI_SOURCE_URL,
  },
  {
    id: 'pidFile',
    order: 240,
    category: 'process-identity',
    flags: { canonical: '--pidFile', aliases: [] },
    type: 'file-path',
    value: { type: 'path', validator: 'file-path' },
    ui: { control: 'file-save-picker', browse: 'save-file', label: 'PID file', richHelp: 'Sets the path at which the server writes its PID file.' },
    defaults: { documented: null, emittedWhenUnset: false },
    limits: { catalog: `1-${PATH_MAX_LENGTH} characters; no control characters or option-looking value` },
    safety: { class: 'process-identity', consequence: 'Can write process-identity data to the selected path.' },
    mutuallyExclusiveGroups: [],
    prerequisites: [{ kind: 'write-location-review', text: 'Confirm the application may safely create or replace this PID-file location.' }],
    argv: { position: 'after-jar', form: 'flag-value', emitWhen: 'defined', repeatable: false, shell: false },
    support: { paper: 'documented', spigot: 'not-documented' },
    source: PAPER_CLI_SOURCE_URL,
  },
  {
    id: 'recreateRegionFiles',
    order: 250,
    category: 'upgrade-diagnostics',
    flags: { canonical: '--recreateRegionFiles', aliases: [] },
    type: 'flag',
    value: { type: 'boolean', requiredWhenSelected: false },
    ui: { control: 'danger-switch', label: 'Recreate region files during upgrade', richHelp: 'Requests region-file recreation during world upgrades.' },
    defaults: { documented: false, emittedWhenUnset: false },
    limits: { selection: 'Boolean flag with explicit acknowledgement.' },
    safety: { class: 'destructive-world-upgrade', consequence: 'Can recreate world region files during an upgrade.' },
    mutuallyExclusiveGroups: [],
    prerequisites: [
      { kind: 'world-backup-confirmation', text: 'Require a current backup before region-file recreation.' },
      { kind: 'explicit-danger-acknowledgement', text: 'Require explicit acknowledgement of high-consequence world maintenance.' },
    ],
    argv: { position: 'after-jar', form: 'flag', emitWhen: 'true', repeatable: false, shell: false },
    support: { paper: 'documented', spigot: 'not-documented' },
    source: PAPER_CLI_SOURCE_URL,
  },
  {
    id: 'maxPlayers',
    order: 260,
    category: 'network-overrides',
    flags: { canonical: '--max-players', aliases: ['-s', '--size'] },
    type: 'positive-integer',
    value: { type: 'integer', validator: 'positive-integer' },
    ui: { control: 'number-input', label: 'Maximum players', richHelp: 'Overrides the maximum number of players.' },
    defaults: { documented: 'server.properties value', emittedWhenUnset: false },
    limits: { catalog: `Integer from 1 through ${MAX_PLAYERS_CATALOG_LIMIT}; Paper does not publish a CLI-specific upper limit on this page.` },
    safety: { class: 'capacity-override', consequence: 'Changes the server player-capacity setting.' },
    mutuallyExclusiveGroups: [],
    prerequisites: [{ kind: 'capacity-review', text: 'Review capacity against hardware, network, and server policy.' }],
    argv: { position: 'after-jar', form: 'flag-value', emitWhen: 'defined', repeatable: false, shell: false },
    support: { paper: 'documented', spigot: 'documented' },
    source: PAPER_CLI_SOURCE_URL,
  },
  {
    id: 'safeMode',
    order: 270,
    category: 'initialization-world-creation',
    flags: { canonical: '--safeMode', aliases: [] },
    type: 'flag',
    value: { type: 'boolean', requiredWhenSelected: false },
    ui: { control: 'switch', label: 'Vanilla datapack safe mode', richHelp: 'Loads worlds with only the Vanilla datapack enabled.' },
    defaults: { documented: false, emittedWhenUnset: false },
    limits: { selection: 'Boolean flag.' },
    safety: { class: 'world-datapack-mode', consequence: 'Changes world datapack loading for this invocation.' },
    mutuallyExclusiveGroups: [],
    prerequisites: [{ kind: 'world-behavior-review', text: 'Confirm that limiting worlds to the Vanilla datapack is intentional.' }],
    argv: { position: 'after-jar', form: 'flag', emitWhen: 'true', repeatable: false, shell: false },
    support: { paper: 'documented', spigot: 'not-documented' },
    source: PAPER_CLI_SOURCE_URL,
  },
  {
    id: 'serverName',
    order: 280,
    category: 'process-identity',
    flags: { canonical: '--server-name', aliases: [] },
    type: 'display-name',
    value: { type: 'string', validator: 'display-name' },
    ui: { control: 'text-input', label: 'Server name', richHelp: 'Sets Paper\'s server name. Paper documents the default as Unknown Server.' },
    defaults: { documented: 'Unknown Server', emittedWhenUnset: false },
    limits: { catalog: `1-${DISPLAY_NAME_MAX_LENGTH} characters; no control characters` },
    safety: { class: 'process-identity', consequence: 'Changes the documented server-name value.' },
    mutuallyExclusiveGroups: [],
    prerequisites: [],
    argv: { position: 'after-jar', form: 'flag-value', emitWhen: 'defined', repeatable: false, shell: false },
    support: { paper: 'documented', spigot: 'not-documented' },
    source: PAPER_CLI_SOURCE_URL,
  },
  {
    id: 'serverId',
    order: 290,
    category: 'process-identity',
    flags: { canonical: '--serverId', aliases: [] },
    type: 'identifier',
    value: { type: 'string', validator: 'server-identifier' },
    ui: { control: 'text-input', label: 'Server crash identifier', richHelp: 'Sets the server identifier that Paper uses in crash files.' },
    defaults: { documented: null, emittedWhenUnset: false },
    limits: { catalog: `1-${DISPLAY_NAME_MAX_LENGTH} characters; no control characters` },
    safety: { class: 'process-identity', consequence: 'Changes the identifier included in crash files.' },
    mutuallyExclusiveGroups: [],
    prerequisites: [{ kind: 'diagnostics-review', text: 'Use an identifier that is appropriate for diagnostic and crash-file handling.' }],
    argv: { position: 'after-jar', form: 'flag-value', emitWhen: 'defined', repeatable: false, shell: false },
    support: { paper: 'documented', spigot: 'not-documented' },
    source: PAPER_CLI_SOURCE_URL,
  },
  {
    id: 'version',
    order: 300,
    category: 'preflight',
    flags: { canonical: '--version', aliases: ['-v'] },
    type: 'flag',
    value: { type: 'boolean', requiredWhenSelected: false },
    ui: { control: 'switch', label: 'Show server version', richHelp: 'Requests the CraftBukkit version and prevents a normal server start.' },
    defaults: { documented: null, emittedWhenUnset: false },
    limits: { selection: 'At most one preflight action.' },
    safety: { class: 'read-only-preflight', consequence: 'Does not normally start the server.' },
    mutuallyExclusiveGroups: ['preflight-action'],
    prerequisites: [],
    argv: { position: 'after-jar', form: 'flag', emitWhen: 'true', repeatable: false, shell: false },
    support: { paper: 'documented', spigot: 'documented' },
    source: PAPER_CLI_SOURCE_URL,
  },
  {
    id: 'levelName',
    order: 310,
    category: 'world-location',
    flags: { canonical: '--level-name', aliases: ['-w', '--world'] },
    type: 'world-name',
    value: { type: 'string', validator: 'world-name' },
    ui: { control: 'text-input', label: 'World name', richHelp: 'Sets the primary world name.' },
    defaults: { documented: 'server.properties value', emittedWhenUnset: false },
    limits: { catalog: `1-${WORLD_NAME_MAX_LENGTH} characters; no path separators, traversal names, or control characters` },
    safety: { class: 'world-location', consequence: 'Changes which primary world name the server uses.' },
    mutuallyExclusiveGroups: [],
    prerequisites: [{ kind: 'world-backup-review', text: 'Confirm the intended world name before using existing world data.' }],
    argv: { position: 'after-jar', form: 'flag-value', emitWhen: 'defined', repeatable: false, shell: false },
    support: { paper: 'documented', spigot: 'documented' },
    source: PAPER_CLI_SOURCE_URL,
  },
]);

const JVM_ARGUMENT_CATALOG = deepFreeze([
  {
    id: 'initialHeap',
    position: 'before-jar',
    flags: { canonical: '-Xms', aliases: [] },
    type: 'memory-size',
    value: { type: '{ amount: integer, unit: "M" | "G" }', validator: 'memory-size' },
    ui: { control: 'memory-size-input', label: 'Initial JVM heap', richHelp: 'A managed JVM argument, kept separate from Paper CLI arguments. Paper\'s startup example uses -Xms before -jar.' },
    defaults: { documented: null, emittedWhenUnset: false },
    limits: { catalog: '1 MiB through 1 TiB; use an integer amount and unit M or G.' },
    safety: { class: 'jvm-memory', consequence: 'Changes Java heap reservation behavior.' },
    prerequisites: [{ kind: 'resource-review', text: 'Review available memory and leave capacity for the operating system and other workloads.' }],
    argv: { position: 'before-jar', form: 'concatenated-flag-value', emitWhen: 'defined', shell: false },
    source: PAPER_GETTING_STARTED_SOURCE_URL,
  },
  {
    id: 'maximumHeap',
    position: 'before-jar',
    flags: { canonical: '-Xmx', aliases: [] },
    type: 'memory-size',
    value: { type: '{ amount: integer, unit: "M" | "G" }', validator: 'memory-size' },
    ui: { control: 'memory-size-input', label: 'Maximum JVM heap', richHelp: 'A managed JVM argument, kept separate from Paper CLI arguments. Paper\'s startup example uses -Xmx before -jar.' },
    defaults: { documented: null, emittedWhenUnset: false },
    limits: { catalog: '1 MiB through 1 TiB; use an integer amount and unit M or G.' },
    safety: { class: 'jvm-memory', consequence: 'Changes the maximum Java heap budget.' },
    prerequisites: [{ kind: 'resource-review', text: 'Review available memory and leave capacity for the operating system and other workloads.' }],
    argv: { position: 'before-jar', form: 'concatenated-flag-value', emitWhen: 'defined', shell: false },
    source: PAPER_GETTING_STARTED_SOURCE_URL,
  },
  {
    id: 'eulaAgreement',
    position: 'before-jar',
    flags: { canonical: '-Dcom.mojang.eula.agree=true', aliases: [] },
    type: 'explicit-boolean-acknowledgement',
    value: { type: 'boolean', validator: 'boolean' },
    ui: { control: 'acknowledgement-switch', label: 'Record EULA agreement JVM property', richHelp: 'Paper documents this JVM system property as indicating EULA agreement and skipping eula.txt checks. A UI must never infer agreement.' },
    defaults: { documented: false, emittedWhenUnset: false },
    limits: { catalog: 'Only literal true emits this argument; false or absent does not.' },
    safety: { class: 'legal-acknowledgement', consequence: 'Signals agreement to the referenced EULA. The catalog does not evaluate legal acceptance.' },
    prerequisites: [{ kind: 'external-legal-acknowledgement', text: 'Obtain an informed user acknowledgement outside this catalog before setting true.' }],
    argv: { position: 'before-jar', form: 'flag', emitWhen: 'true', shell: false },
    source: PAPER_SYSTEM_PROPERTIES_SOURCE_URL,
  },
]);

const SPIGOT_UNAVAILABLE_OPTIONS = deepFreeze([
  {
    id: 'spigotDateFormat',
    flags: ['--date-format', '-d'],
    position: 'after-jar',
    visible: true,
    available: false,
    reason: 'Documented by Spigot, but not documented by Paper\'s CLI reference. No Paper mapping is guessed.',
    source: SPIGOT_STARTUP_PARAMETERS_SOURCE_URL,
  },
  {
    id: 'spigotOnlineModeRemoved',
    flags: ['--online-mode', '-o'],
    position: 'after-jar',
    visible: true,
    available: false,
    relatedCatalogId: 'onlineMode',
    reason: 'Spigot\'s startup-parameters page marks this argument removed. The Paper typed option must not be emitted for a Spigot target.',
    source: SPIGOT_STARTUP_PARAMETERS_SOURCE_URL,
  },
  {
    id: 'spigotOutdatedBuildBypass',
    flags: ['-DIReallyKnowWhatIAmDoingISwear'],
    position: 'before-jar',
    visible: true,
    available: false,
    reason: 'Spigot describes this as unsupported and potentially error-prone. It is intentionally not exposed as a typed action.',
    source: SPIGOT_STARTUP_PARAMETERS_SOURCE_URL,
  },
  {
    id: 'spigotLegacySignConversion',
    flags: ['-DconvertLegacySigns=true'],
    position: 'before-jar',
    visible: true,
    available: false,
    reason: 'Spigot documents this only for 1.8 sign conversion and warns not to use it on a world already loaded with 1.8.',
    source: SPIGOT_STARTUP_PARAMETERS_SOURCE_URL,
  },
  {
    id: 'spigotLegacyFileEncoding',
    flags: ['-Dfile.encoding=UTF-8'],
    position: 'before-jar',
    visible: true,
    available: false,
    reason: 'Spigot describes this as useful only for older Linux distributions and potentially problematic on Windows. It is not a generic UI setting.',
    source: SPIGOT_STARTUP_PARAMETERS_SOURCE_URL,
  },
  {
    id: 'spigotLegacyJlineProperty',
    flags: ['-Djline.terminal=jline.UnsupportedTerminal'],
    position: 'before-jar',
    visible: true,
    available: false,
    reason: 'Spigot documents this as a legacy workaround. The documented --nojline CLI option is modeled separately where available.',
    source: SPIGOT_STARTUP_PARAMETERS_SOURCE_URL,
  },
  {
    id: 'spigotLegacyLogStripColor',
    flags: ['--log-strip-color'],
    position: 'after-jar',
    visible: true,
    available: false,
    reason: 'Spigot documents this only for builds #1138 and below.',
    source: SPIGOT_STARTUP_PARAMETERS_SOURCE_URL,
  },
  {
    id: 'spigotLegacyNettyDisable',
    flags: ['-Dorg.spigotmc.netty.disabled=true'],
    position: 'before-jar',
    visible: true,
    available: false,
    reason: 'Spigot documents this only for builds #1138 and below.',
    source: SPIGOT_STARTUP_PARAMETERS_SOURCE_URL,
  },
]);

const PAPER_CLI_OPTIONS_BY_ID = deepFreeze(Object.fromEntries(
  PAPER_CLI_OPTIONS.map((option) => [option.id, option]),
));

const JVM_ARGUMENTS_BY_ID = deepFreeze(Object.fromEntries(
  JVM_ARGUMENT_CATALOG.map((option) => [option.id, option]),
));

const CATALOG_CONTRACT = deepFreeze({
  schemaVersion: CATALOG_SCHEMA_VERSION,
  transport: {
    kind: 'argument-arrays-only',
    jvm: 'emitManagedJvmArgv returns values positioned before -jar.',
    paperCli: 'emitPaperCliArgv returns values positioned after the server JAR.',
    spigotBoundary: 'emitSpigotCompatibleArgv permits only Paper option records that the official Spigot startup-parameters page documents.',
    shell: false,
    rawShellInput: false,
    launchesServer: false,
  },
  sourceUrls: {
    paperCli: PAPER_CLI_SOURCE_URL,
    paperGettingStarted: PAPER_GETTING_STARTED_SOURCE_URL,
    paperSystemProperties: PAPER_SYSTEM_PROPERTIES_SOURCE_URL,
    spigotStartupParameters: SPIGOT_STARTUP_PARAMETERS_SOURCE_URL,
    spigotConfiguration: SPIGOT_CONFIGURATION_SOURCE_URL,
  },
  defaults: {
    omission: 'A documented default is display metadata. It is not emitted unless the caller provides an explicit typed selection.',
    serverPropertyPrecedence: 'Paper documents that applicable CLI arguments override server.properties values.',
  },
  spigotBoundary: {
    statement: 'The catalog exposes shared documented configuration and server-property flags for a Spigot adapter. Paper-only, removed, undocumented, and legacy paths remain visible as unavailable instead of being guessed.',
    unavailableOptions: 'SPIGOT_UNAVAILABLE_OPTIONS',
  },
});

function validateString(value, field, maximumLength, purpose) {
  if (typeof value !== 'string') {
    return { error: catalogError('invalid_type', field, `${purpose} must be a string.`) };
  }

  if (value.length === 0 || value.trim().length === 0) {
    return { error: catalogError('empty_value', field, `${purpose} cannot be empty.`) };
  }

  if (value.length > maximumLength) {
    return { error: catalogError('too_long', field, `${purpose} exceeds the catalog limit of ${maximumLength} characters.`) };
  }

  if (/[\u0000-\u001F\u007F]/.test(value)) {
    return { error: catalogError('control_character', field, `${purpose} cannot contain control characters.`) };
  }

  return { value };
}

function validatePath(value, field, expectedSuffix) {
  const result = validateString(value, field, PATH_MAX_LENGTH, 'Path');
  if (result.error) {
    return result;
  }

  if (value.startsWith('-')) {
    return { error: catalogError('option_like_path', field, 'Path cannot start with a hyphen because it could be interpreted as another option by a downstream parser.') };
  }

  if (expectedSuffix && !value.toLowerCase().endsWith(expectedSuffix)) {
    return { error: catalogError('invalid_extension', field, `Path must end in ${expectedSuffix}.`) };
  }

  return { value };
}

function validateHostnameOrIp(value, field) {
  const result = validateString(value, field, 253, 'Host');
  if (result.error) {
    return result;
  }

  if (/\s/.test(value) || value.includes('://') || value.includes('/') || value.includes('\\')) {
    return { error: catalogError('invalid_host_shape', field, 'Host must be a hostname or IP address without a URL, path, port, or whitespace.') };
  }

  if (net.isIP(value) !== 0) {
    return { value };
  }

  const hostnamePattern = /^(?=.{1,253}$)(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)(?:\.(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?))*$/;
  if (!hostnamePattern.test(value)) {
    return { error: catalogError('invalid_hostname', field, 'Host must be a valid hostname label sequence or an IP address.') };
  }

  return { value };
}

function validatePort(value, field) {
  if (!Number.isSafeInteger(value) || value < 1 || value > 65_535) {
    return { error: catalogError('invalid_port', field, 'Port must be an integer from 1 through 65535.') };
  }
  return { value };
}

function validatePositiveInteger(value, field) {
  if (!Number.isSafeInteger(value) || value < 1 || value > MAX_PLAYERS_CATALOG_LIMIT) {
    return { error: catalogError('invalid_positive_integer', field, `Value must be an integer from 1 through ${MAX_PLAYERS_CATALOG_LIMIT}.`) };
  }
  return { value };
}

function validateWorldName(value, field) {
  const result = validateString(value, field, WORLD_NAME_MAX_LENGTH, 'World name');
  if (result.error) {
    return result;
  }

  if (value === '.' || value === '..' || value.startsWith('-') || /[\\/]/.test(value)) {
    return { error: catalogError('invalid_world_name', field, 'World name cannot be traversal text, option-looking text, or contain path separators.') };
  }

  return { value };
}

function validateDisplayName(value, field, purpose) {
  return validateString(value, field, DISPLAY_NAME_MAX_LENGTH, purpose);
}

function validateRepeatablePaths(value, field, expectedSuffix) {
  if (!Array.isArray(value)) {
    return { error: catalogError('invalid_type', field, 'Value must be an array of typed paths.') };
  }

  if (value.length > MAX_REPEATABLE_VALUES) {
    return { error: catalogError('too_many_values', field, `Value cannot contain more than ${MAX_REPEATABLE_VALUES} paths.`) };
  }

  const normalized = [];
  const seen = new Set();
  for (const [index, item] of value.entries()) {
    const itemResult = validatePath(item, `${field}[${index}]`, expectedSuffix);
    if (itemResult.error) {
      return itemResult;
    }
    if (seen.has(itemResult.value)) {
      return { error: catalogError('duplicate_value', field, 'Repeatable paths must not contain duplicates.') };
    }
    seen.add(itemResult.value);
    normalized.push(itemResult.value);
  }

  return { value: normalized };
}

function memoryBytes(memory) {
  const multiplier = memory.unit === 'G' ? 1_073_741_824n : 1_048_576n;
  return BigInt(memory.amount) * multiplier;
}

function validateMemorySize(value, field) {
  if (!isPlainRecord(value) || Object.keys(value).length !== 2 || !hasOwn(value, 'amount') || !hasOwn(value, 'unit')) {
    return { error: catalogError('invalid_memory_shape', field, 'Memory must be an object with exactly amount and unit fields.') };
  }

  if (!Number.isSafeInteger(value.amount) || value.amount < 1) {
    return { error: catalogError('invalid_memory_amount', field, 'Memory amount must be a positive integer.') };
  }

  if (value.unit !== 'M' && value.unit !== 'G') {
    return { error: catalogError('invalid_memory_unit', field, 'Memory unit must be M or G.') };
  }

  const normalized = { amount: value.amount, unit: value.unit };
  if (memoryBytes(normalized) > MAX_MEMORY_BYTES) {
    return { error: catalogError('memory_limit', field, 'Memory exceeds the catalog safety ceiling of 1 TiB.') };
  }

  return { value: normalized };
}

function validateValue(option, value) {
  const field = option.id;
  switch (option.value.validator) {
    case undefined:
      if (typeof value !== 'boolean') {
        return { error: catalogError('invalid_type', field, 'Flag value must be boolean.') };
      }
      return { value };
    case 'boolean':
      if (typeof value !== 'boolean') {
        return { error: catalogError('invalid_type', field, 'Value must be boolean.') };
      }
      return { value };
    case 'yaml-file-path':
      return validatePath(value, field, '.yml');
    case 'properties-file-path':
      return validatePath(value, field, '.properties');
    case 'directory-path':
    case 'file-path':
      return validatePath(value, field);
    case 'repeatable-directory-path':
      return validateRepeatablePaths(value, field);
    case 'repeatable-plugin-jar-path':
      return validateRepeatablePaths(value, field, '.jar');
    case 'hostname-or-ip':
      return validateHostnameOrIp(value, field);
    case 'tcp-port':
      return validatePort(value, field);
    case 'positive-integer':
      return validatePositiveInteger(value, field);
    case 'world-name':
      return validateWorldName(value, field);
    case 'display-name':
      return validateDisplayName(value, field, 'Server name');
    case 'server-identifier':
      return validateDisplayName(value, field, 'Server identifier');
    default:
      return { error: catalogError('unknown_validator', field, `Unknown validator ${option.value.validator}.`) };
  }
}

function selected(option, value) {
  if (option.type === 'flag') {
    return value === true;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return value !== undefined;
}

function validateSelectionShape(selection, validOptionIds, selectionName) {
  if (!isPlainRecord(selection)) {
    return { errors: [catalogError('invalid_selection', selectionName, 'Selection must be a plain object, not a shell command or argv array.')] };
  }

  const errors = [];
  for (const key of Object.keys(selection)) {
    if (!validOptionIds.has(key)) {
      errors.push(catalogError('unknown_selection_key', key, 'Unknown option key. Raw argv, command, shell, and arbitrary JVM flags are not accepted.'));
    }
  }

  return { errors };
}

function validatePaperCliSelection(selection) {
  const validOptionIds = new Set(PAPER_CLI_OPTIONS.map((option) => option.id));
  const shape = validateSelectionShape(selection, validOptionIds, 'paperCliSelection');
  if (shape.errors.length > 0) {
    return deepFreeze({ ok: false, errors: shape.errors, value: {} });
  }

  const errors = [];
  const normalized = {};
  for (const option of PAPER_CLI_OPTIONS) {
    if (!hasOwn(selection, option.id)) {
      continue;
    }
    const valueResult = validateValue(option, selection[option.id]);
    if (valueResult.error) {
      errors.push(valueResult.error);
    } else {
      normalized[option.id] = valueResult.value;
    }
  }

  if (errors.length === 0) {
    for (const group of SELECTION_MUTEX_GROUPS) {
      const selectedOptionIds = group.optionIds.filter((id) => selected(PAPER_CLI_OPTIONS_BY_ID[id], normalized[id]));
      if (selectedOptionIds.length > group.maxSelected || selectedOptionIds.length < group.minSelected) {
        errors.push(catalogError('mutually_exclusive_selection', group.id, `${group.id} permits ${group.minSelected}-${group.maxSelected} selections; received ${selectedOptionIds.join(', ') || 'none'}.`));
      }
    }
  }

  const warnings = [];
  if (errors.length === 0) {
    for (const warning of SELECTION_COMPOSITION_WARNINGS) {
      const active = warning.optionIds.filter((id) => selected(PAPER_CLI_OPTIONS_BY_ID[id], normalized[id]));
      if (active.length > 1) {
        warnings.push({ id: warning.id, optionIds: active, severity: warning.severity, reason: warning.reason });
      }
    }
  }

  return deepFreeze({ ok: errors.length === 0, errors, warnings, value: normalized });
}

function emitPaperCliArgv(selection) {
  const validation = validatePaperCliSelection(selection);
  if (!validation.ok) {
    throw new CatalogValidationError(validation.errors);
  }

  const argvAfterJar = [];
  for (const option of PAPER_CLI_OPTIONS) {
    const value = validation.value[option.id];
    if (!selected(option, value)) {
      continue;
    }

    if (option.type === 'flag') {
      argvAfterJar.push(option.flags.canonical);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        argvAfterJar.push(option.flags.canonical, String(item));
      }
    } else if (option.type === 'boolean') {
      argvAfterJar.push(option.flags.canonical, value ? 'true' : 'false');
    } else {
      argvAfterJar.push(option.flags.canonical, String(value));
    }
  }

  return deepFreeze([...argvAfterJar]);
}

function emitSpigotCompatibleArgv(selection) {
  const validation = validatePaperCliSelection(selection);
  if (!validation.ok) {
    throw new CatalogValidationError(validation.errors);
  }

  const unavailable = PAPER_CLI_OPTIONS
    .filter((option) => selected(option, validation.value[option.id]) && option.support.spigot !== 'documented')
    .map((option) => option.id);

  if (unavailable.length > 0) {
    throw new CatalogValidationError([
      catalogError('spigot_support_boundary', 'paperCliSelection', `Spigot emission is unavailable for: ${unavailable.join(', ')}. The catalog does not guess Paper-only, removed, or undocumented Spigot arguments.`),
    ]);
  }

  return emitPaperCliArgv(selection);
}

function validateManagedJvmSelection(selection) {
  const validOptionIds = new Set(JVM_ARGUMENT_CATALOG.map((option) => option.id));
  const shape = validateSelectionShape(selection, validOptionIds, 'managedJvmSelection');
  if (shape.errors.length > 0) {
    return deepFreeze({ ok: false, errors: shape.errors, value: {} });
  }

  const errors = [];
  const normalized = {};
  for (const option of JVM_ARGUMENT_CATALOG) {
    if (!hasOwn(selection, option.id)) {
      continue;
    }

    let result;
    if (option.value.validator === 'memory-size') {
      result = validateMemorySize(selection[option.id], option.id);
    } else if (option.value.validator === 'boolean') {
      result = typeof selection[option.id] === 'boolean'
        ? { value: selection[option.id] }
        : { error: catalogError('invalid_type', option.id, 'Value must be boolean.') };
    } else {
      result = { error: catalogError('unknown_validator', option.id, `Unknown validator ${option.value.validator}.`) };
    }

    if (result.error) {
      errors.push(result.error);
    } else {
      normalized[option.id] = result.value;
    }
  }

  if (errors.length === 0 && normalized.initialHeap && normalized.maximumHeap && memoryBytes(normalized.initialHeap) > memoryBytes(normalized.maximumHeap)) {
    errors.push(catalogError('heap_order', 'initialHeap', 'Initial heap cannot exceed maximum heap.'));
  }

  return deepFreeze({ ok: errors.length === 0, errors, value: normalized });
}

function emitManagedJvmArgv(selection) {
  const validation = validateManagedJvmSelection(selection);
  if (!validation.ok) {
    throw new CatalogValidationError(validation.errors);
  }

  const argvBeforeJar = [];
  for (const option of JVM_ARGUMENT_CATALOG) {
    const value = validation.value[option.id];
    if (value === undefined || value === false) {
      continue;
    }

    if (option.value.validator === 'memory-size') {
      argvBeforeJar.push(`${option.flags.canonical}${value.amount}${value.unit}`);
    } else {
      argvBeforeJar.push(option.flags.canonical);
    }
  }

  return deepFreeze([...argvBeforeJar]);
}

const PAPER_COMMANDS_SOURCE_URL = 'https://docs.papermc.io/paper/reference/commands/';
const PAPER_PERMISSIONS_SOURCE_URL = 'https://docs.papermc.io/paper/reference/permissions/';
const SPIGOT_COMMANDS_SOURCE_URL = 'https://www.spigotmc.org/wiki/spigot-commands/';
const VANILLA_COMMANDS_SOURCE_URL = 'https://www.minecraft.net/en-us/article/minecraft-commands';

const COMMAND_CATALOG_SCHEMA_VERSION = '1.0.0';
const PAPER_COMMAND_DOCUMENTATION_VERSION = '1.21.8';
const COMMAND_REFERENCE_LIMITS = deepFreeze({
  runtimeReferenceIdMaxLength: 128,
  integerMax: 2_147_483_647,
});

const COMMAND_FAMILIES = deepFreeze([
  {
    id: 'bukkit-admin',
    label: 'Bukkit administrative commands',
    source: PAPER_COMMANDS_SOURCE_URL,
  },
  {
    id: 'paper-admin',
    label: 'Paper administrative commands',
    source: PAPER_COMMANDS_SOURCE_URL,
  },
  {
    id: 'spigot-admin',
    label: 'Spigot administrative commands',
    source: SPIGOT_COMMANDS_SOURCE_URL,
  },
  {
    id: 'vanilla-versioned',
    label: 'Version-caveated vanilla command metadata',
    source: VANILLA_COMMANDS_SOURCE_URL,
  },
]);

const COMMAND_RUNTIME_BOUNDARY = deepFreeze({
  schemaVersion: COMMAND_CATALOG_SCHEMA_VERSION,
  staticReferenceVersion: {
    paperCommands: PAPER_COMMAND_DOCUMENTATION_VERSION,
    paperCaveat: 'Paper documents this as the earliest version for which its commands reference is fully accurate; older versions may be incomplete or differ.',
    spigotCaveat: 'Spigot command availability can depend on its documented build/version notes and active configuration.',
    vanillaCaveat: 'The official Minecraft guide is a bounded helpful-command reference, not a complete machine-readable Java server grammar. Runtime command metadata remains authoritative.',
  },
  transport: {
    kind: 'structured-command-request-only',
    acceptsRawCommandText: false,
    acceptsRawShellTokens: false,
    dispatchesToServer: false,
    launchesServer: false,
  },
  runtimeDiscovery: {
    requiredBeforeDispatch: true,
    permissions: 'Static permission metadata is informational. A future adapter must resolve actual sender permissions and server policy at runtime before dispatch.',
    pluginCommands: {
      state: 'pending-runtime-discovery',
      reason: 'Plugins can register commands dynamically. This static catalog intentionally invents no third-party plugin commands, aliases, arguments, permissions, or effects.',
      control: 'disabled runtime-command-discovery status until an authorized adapter supplies a verified command tree.',
    },
    registries: {
      worlds: 'runtime-provided choice list',
      players: 'runtime-provided choice list',
      entityTypes: 'runtime-provided choice list',
      items: 'runtime-provided choice list',
      structuresAndBiomes: 'runtime-provided choice list',
    },
  },
  sources: {
    paperCommands: PAPER_COMMANDS_SOURCE_URL,
    paperPermissions: PAPER_PERMISSIONS_SOURCE_URL,
    spigotCommands: SPIGOT_COMMANDS_SOURCE_URL,
    officialVanillaGuide: VANILLA_COMMANDS_SOURCE_URL,
  },
});

const ADMIN_COMMAND_PERMISSION_METADATA = deepFreeze({
  'bukkit.version': { node: 'bukkit.command.version', default: true, source: PAPER_PERMISSIONS_SOURCE_URL },
  'bukkit.plugins': { node: 'bukkit.command.plugins', default: true, source: PAPER_PERMISSIONS_SOURCE_URL },
  'bukkit.help': { node: 'bukkit.command.help', default: true, source: PAPER_PERMISSIONS_SOURCE_URL },
  'bukkit.reload': { node: 'bukkit.command.reload', default: false, source: PAPER_PERMISSIONS_SOURCE_URL },
  'paper.tps': { node: 'bukkit.command.tps', default: 'operator', source: SPIGOT_COMMANDS_SOURCE_URL },
  'paper.mspt': { status: 'not-specified-by-cited-command-page', source: PAPER_COMMANDS_SOURCE_URL },
  'paper.timings': { node: 'bukkit.command.timings', default: false, source: PAPER_PERMISSIONS_SOURCE_URL },
  'spigot.restart': { node: 'bukkit.command.restart', default: false, source: PAPER_PERMISSIONS_SOURCE_URL },
  'spigot.tps': { node: 'bukkit.command.tps', default: 'operator', source: SPIGOT_COMMANDS_SOURCE_URL },
  'spigot.timings': { node: 'bukkit.command.timings', default: 'operator', source: SPIGOT_COMMANDS_SOURCE_URL },
  'paper.chunkinfo': { node: 'bukkit.command.paper.chunkinfo', default: false, source: PAPER_PERMISSIONS_SOURCE_URL },
  'paper.debug': { node: 'bukkit.command.paper.debug', default: false, source: PAPER_PERMISSIONS_SOURCE_URL },
  'paper.dumpitem': { node: 'bukkit.command.paper.dumpitem', default: false, source: PAPER_PERMISSIONS_SOURCE_URL },
  'paper.dumplisteners': { node: 'bukkit.command.paper.dumplisteners', default: false, source: PAPER_PERMISSIONS_SOURCE_URL },
  'paper.dumpplugins': { node: 'bukkit.command.paper.dumpplugins', default: false, source: PAPER_PERMISSIONS_SOURCE_URL },
  'paper.entityList': { node: 'bukkit.command.paper.entity', default: false, source: PAPER_PERMISSIONS_SOURCE_URL },
  'paper.fixlight': { node: 'bukkit.command.paper.fixlight', default: false, source: PAPER_PERMISSIONS_SOURCE_URL },
  'paper.heap': { node: 'bukkit.command.paper.heap', default: false, source: PAPER_PERMISSIONS_SOURCE_URL },
  'paper.holderInfo': { node: 'bukkit.command.paper.holderinfo', default: false, source: PAPER_PERMISSIONS_SOURCE_URL },
  'paper.mobCaps': { node: 'bukkit.command.paper.mobcaps', default: false, source: PAPER_PERMISSIONS_SOURCE_URL },
  'paper.playerMobCaps': { node: 'bukkit.command.paper.playermobcaps', default: false, source: PAPER_PERMISSIONS_SOURCE_URL },
  'paper.reload': { node: 'bukkit.command.paper.reload', default: false, source: PAPER_PERMISSIONS_SOURCE_URL },
  'paper.syncLoadInfo': { node: 'bukkit.command.paper.syncloadinfo', default: false, source: PAPER_PERMISSIONS_SOURCE_URL },
  'paper.version': { node: 'bukkit.command.paper.version', default: false, source: PAPER_PERMISSIONS_SOURCE_URL },
  'paper.spark': { status: 'runtime-defined-by-spark', source: PAPER_COMMANDS_SOURCE_URL },
});

function adminCommand(definition) {
  return {
    scope: 'server-admin',
    emission: {
      kind: 'structured-command-request',
      acceptsRawCommandText: false,
      acceptsRawShellTokens: false,
      dispatchesToServer: false,
    },
    ...definition,
  };
}

const ADMIN_COMMAND_CATALOG = deepFreeze([
  adminCommand({
    id: 'bukkit.version',
    family: 'bukkit-admin',
    route: ['bukkit:version'],
    aliases: ['version', 'ver', 'about'],
    title: 'Server or loaded-plugin version',
    fields: [{ id: 'plugin', type: 'runtime-plugin-choice', required: false, control: 'runtime-plugin-picker', noFreeText: true }],
    ui: { control: 'command-action-with-runtime-plugin-picker', richHelp: 'Shows server version information; a verified runtime plugin selection can narrow it to one loaded plugin.' },
    safety: { class: 'read-only-diagnostics', consequence: 'Reads version information.' },
    availability: { state: 'documented', requestable: true },
    prerequisites: ['authorized runtime command adapter when a request is dispatched', 'runtime plugin list for the optional plugin field'],
    source: PAPER_COMMANDS_SOURCE_URL,
    versionCaveat: `Paper commands reference ${PAPER_COMMAND_DOCUMENTATION_VERSION}.`,
  }),
  adminCommand({
    id: 'bukkit.plugins',
    family: 'bukkit-admin',
    route: ['bukkit:plugins'],
    aliases: ['plugins', 'pl'],
    title: 'Loaded plugins',
    fields: [],
    ui: { control: 'command-action', richHelp: 'Lists loaded plugins; Paper documents Paper/Bukkit plugin state indicators.' },
    safety: { class: 'read-only-diagnostics', consequence: 'Reveals loaded plugin names and state.' },
    availability: { state: 'documented', requestable: true },
    prerequisites: ['authorized runtime command adapter when a request is dispatched'],
    source: PAPER_COMMANDS_SOURCE_URL,
    versionCaveat: `Paper commands reference ${PAPER_COMMAND_DOCUMENTATION_VERSION}.`,
  }),
  adminCommand({
    id: 'bukkit.help',
    family: 'bukkit-admin',
    route: ['bukkit:help'],
    aliases: ['help', '?'],
    title: 'Registered command help',
    fields: [],
    ui: { control: 'command-action', richHelp: 'Shows descriptions for registered built-in and plugin-added commands; plugin-derived results are runtime data.' },
    safety: { class: 'read-only-diagnostics', consequence: 'Reads registered-command help.' },
    availability: { state: 'documented', requestable: true },
    prerequisites: ['authorized runtime command adapter when a request is dispatched'],
    source: PAPER_COMMANDS_SOURCE_URL,
    versionCaveat: `Paper commands reference ${PAPER_COMMAND_DOCUMENTATION_VERSION}.`,
  }),
  adminCommand({
    id: 'bukkit.reload',
    family: 'bukkit-admin',
    route: ['bukkit:reload'],
    aliases: ['reload', 'spigot reload'],
    title: 'Deprecated Bukkit reload',
    fields: [],
    ui: { control: 'unavailable-command-card', richHelp: 'Visible for awareness only. Paper deprecates reload for removal and says plugin reloads are known to cause issues.' },
    safety: { class: 'unsupported-runtime-reload', consequence: 'Can cause plugin issues.' },
    availability: { state: 'deprecated-unavailable', requestable: false },
    prerequisites: ['none; use a planned restart workflow instead'],
    source: PAPER_COMMANDS_SOURCE_URL,
    versionCaveat: `Paper commands reference ${PAPER_COMMAND_DOCUMENTATION_VERSION}.`,
  }),
  adminCommand({
    id: 'paper.spark',
    family: 'paper-admin',
    route: ['spark'],
    aliases: [],
    title: 'Spark profiling command',
    fields: [],
    ui: { control: 'runtime-command-discovery-card', richHelp: 'Paper recommends /spark for performance information, but directs subcommand details to the dedicated Spark documentation. This source-bounded catalog does not invent those subcommands.' },
    safety: { class: 'runtime-diagnostics', consequence: 'Exact effects depend on the runtime-provided Spark command tree.' },
    availability: { state: 'runtime-discovery-required', requestable: false },
    prerequisites: ['verified runtime command tree'],
    source: PAPER_COMMANDS_SOURCE_URL,
    versionCaveat: `Paper commands reference ${PAPER_COMMAND_DOCUMENTATION_VERSION}; Spark subcommands are not defined by that source page.`,
  }),
  adminCommand({
    id: 'paper.tps',
    family: 'paper-admin',
    route: ['tps'],
    aliases: [],
    title: 'Ticks-per-second summary',
    fields: [],
    ui: { control: 'command-action', richHelp: 'Shows TPS for the last 1, 5, and 15 minutes. Paper says /spark is preferred for performance information.' },
    safety: { class: 'read-only-diagnostics', consequence: 'Reads performance telemetry.' },
    availability: { state: 'documented-superseded', requestable: true, preferredAlternative: 'paper.spark' },
    prerequisites: ['authorized runtime command adapter when a request is dispatched'],
    source: PAPER_COMMANDS_SOURCE_URL,
    versionCaveat: `Paper commands reference ${PAPER_COMMAND_DOCUMENTATION_VERSION}.`,
  }),
  adminCommand({
    id: 'paper.mspt',
    family: 'paper-admin',
    route: ['mspt'],
    aliases: [],
    title: 'Milliseconds-per-tick summary',
    fields: [],
    ui: { control: 'command-action', richHelp: 'Shows average, minimum, and maximum MSPT over documented rolling intervals. Paper says /spark is preferred for performance information.' },
    safety: { class: 'read-only-diagnostics', consequence: 'Reads performance telemetry.' },
    availability: { state: 'documented-superseded', requestable: true, preferredAlternative: 'paper.spark' },
    prerequisites: ['authorized runtime command adapter when a request is dispatched'],
    source: PAPER_COMMANDS_SOURCE_URL,
    versionCaveat: `Paper commands reference ${PAPER_COMMAND_DOCUMENTATION_VERSION}.`,
  }),
  adminCommand({
    id: 'paper.timings',
    family: 'paper-admin',
    route: ['timings'],
    aliases: [],
    title: 'Deprecated timings command',
    fields: [],
    ui: { control: 'unavailable-command-card', richHelp: 'Visible for awareness only. Paper deprecates timings for removal and recommends /spark.' },
    safety: { class: 'deprecated-diagnostics', consequence: 'Deprecated runtime behavior.' },
    availability: { state: 'deprecated-unavailable', requestable: false, preferredAlternative: 'paper.spark' },
    prerequisites: ['none; choose a runtime-discovered Spark action instead'],
    source: PAPER_COMMANDS_SOURCE_URL,
    versionCaveat: `Paper commands reference ${PAPER_COMMAND_DOCUMENTATION_VERSION}.`,
  }),
  adminCommand({
    id: 'spigot.restart',
    family: 'spigot-admin',
    route: ['restart'],
    aliases: [],
    title: 'Spigot restart mechanism',
    fields: [],
    ui: { control: 'danger-command-action', richHelp: 'Requests the Spigot restart mechanism. Spigot documents that restart-script must be configured in spigot.yml for this to work.' },
    safety: { class: 'server-lifecycle', consequence: 'Requests a server restart and can disconnect players.' },
    availability: { state: 'documented', requestable: true },
    prerequisites: ['verified restart-script configuration', 'explicit lifecycle confirmation', 'authorized runtime command adapter when a request is dispatched'],
    source: SPIGOT_COMMANDS_SOURCE_URL,
    versionCaveat: 'Spigot command behavior depends on the active Spigot configuration and server version.',
  }),
  adminCommand({
    id: 'spigot.tps',
    family: 'spigot-admin',
    route: ['tps'],
    aliases: [],
    title: 'Spigot TPS summary',
    fields: [],
    ui: { control: 'command-action', richHelp: 'Shows TPS averages for the documented 1, 5, and 15 minute windows.' },
    safety: { class: 'read-only-diagnostics', consequence: 'Reads performance telemetry.' },
    availability: { state: 'documented', requestable: true },
    prerequisites: ['authorized runtime command adapter when a request is dispatched'],
    source: SPIGOT_COMMANDS_SOURCE_URL,
    versionCaveat: 'Spigot command behavior depends on active version and permissions.',
  }),
  adminCommand({
    id: 'spigot.timings',
    family: 'spigot-admin',
    route: ['timings'],
    aliases: [],
    title: 'Spigot timings actions',
    fields: [{ id: 'action', type: 'enum', values: ['on', 'off', 'merged', 'separate', 'paste', 'reset'], required: true, control: 'segmented-select' }],
    ui: { control: 'unavailable-command-card', richHelp: 'Spigot documents timings actions, including version-specific disabled build ranges. Paper deprecates timings, so the static UI keeps this unavailable until a version-aware runtime adapter can prove support.' },
    safety: { class: 'version-sensitive-diagnostics', consequence: 'May collect, write, upload, or reset timing data depending on selected action and runtime version.' },
    availability: { state: 'version-sensitive-unavailable', requestable: false },
    prerequisites: ['verified target build and runtime capability'],
    source: SPIGOT_COMMANDS_SOURCE_URL,
    versionCaveat: 'Spigot documents disabled build ranges for several timings actions; do not assume availability.',
  }),
  adminCommand({
    id: 'paper.chunkinfo',
    family: 'paper-admin',
    route: ['paper', 'chunkinfo'],
    aliases: [],
    title: 'Loaded-chunk information',
    fields: [{ id: 'world', type: 'runtime-world-choice-or-all', required: false, control: 'runtime-world-picker-with-all', noFreeText: true }],
    ui: { control: 'command-action-with-runtime-world-picker', richHelp: 'Displays loaded chunk information for a selected runtime world or all worlds.' },
    safety: { class: 'read-only-diagnostics', consequence: 'Reads loaded chunk state.' },
    availability: { state: 'documented', requestable: true },
    prerequisites: ['authorized runtime command adapter when a request is dispatched', 'runtime world list for a specific-world selection'],
    source: PAPER_COMMANDS_SOURCE_URL,
    versionCaveat: `Paper commands reference ${PAPER_COMMAND_DOCUMENTATION_VERSION}.`,
  }),
  adminCommand({
    id: 'paper.debug',
    family: 'paper-admin',
    route: ['paper', 'debug'],
    aliases: [],
    title: 'Chunk-debug file',
    fields: [{ id: 'chunks', type: 'positive-integer', minimum: 1, maximum: COMMAND_REFERENCE_LIMITS.integerMax, required: true, control: 'number-input' }],
    ui: { control: 'danger-command-action-with-number-input', richHelp: 'Dumps information about loaded chunks to a file; Paper says it is generally for developers.' },
    safety: { class: 'diagnostic-file-write', consequence: 'Writes a diagnostic file and can produce operational data.' },
    availability: { state: 'documented', requestable: true },
    prerequisites: ['free-space review', 'authorized runtime command adapter when a request is dispatched'],
    source: PAPER_COMMANDS_SOURCE_URL,
    versionCaveat: `Paper commands reference ${PAPER_COMMAND_DOCUMENTATION_VERSION}; the reference does not publish a maximum chunks argument.`,
  }),
  adminCommand({
    id: 'paper.dumpitem',
    family: 'paper-admin',
    route: ['paper', 'dumpitem'],
    aliases: [],
    title: 'Held-item data components',
    fields: [{ id: 'mode', type: 'enum', values: ['held', 'all'], required: false, default: 'held', control: 'segmented-select' }],
    ui: { control: 'command-action-with-segmented-select', richHelp: 'Returns data-component representation of the held item; all includes default components.' },
    safety: { class: 'read-only-diagnostics', consequence: 'Reads held-item data.' },
    availability: { state: 'documented', requestable: true },
    prerequisites: ['authorized runtime command adapter when a request is dispatched'],
    source: PAPER_COMMANDS_SOURCE_URL,
    versionCaveat: `Paper commands reference ${PAPER_COMMAND_DOCUMENTATION_VERSION}.`,
  }),
  adminCommand({
    id: 'paper.dumplisteners',
    family: 'paper-admin',
    route: ['paper', 'dumplisteners'],
    aliases: [],
    title: 'Event-listener diagnostic',
    fields: [{ id: 'mode', type: 'runtime-event-class-or-tofile', required: true, control: 'runtime-event-class-picker-or-file-action', noFreeText: true }],
    ui: { control: 'runtime-command-discovery-card', richHelp: 'Paper documents tofile or a specific event class. The event-class list is runtime-only, and tofile writes diagnostics, so the static catalog does not build a dispatch string.' },
    safety: { class: 'diagnostic-file-write', consequence: 'Can write all listener data to a file or expose event-handler detail.' },
    availability: { state: 'runtime-argument-discovery-required', requestable: false },
    prerequisites: ['verified runtime event-class metadata', 'free-space review for tofile'],
    source: PAPER_COMMANDS_SOURCE_URL,
    versionCaveat: `Paper commands reference ${PAPER_COMMAND_DOCUMENTATION_VERSION}.`,
  }),
  adminCommand({
    id: 'paper.dumpplugins',
    family: 'paper-admin',
    route: ['paper', 'dumpplugins'],
    aliases: [],
    title: 'Plugin loading diagnostic',
    fields: [],
    ui: { control: 'command-action', richHelp: 'Reports plugin dependency, bootstrapper, loading-order, and class-loader information for diagnosis.' },
    safety: { class: 'read-only-diagnostics', consequence: 'Reveals plugin loading and dependency details.' },
    availability: { state: 'documented', requestable: true },
    prerequisites: ['authorized runtime command adapter when a request is dispatched'],
    source: PAPER_COMMANDS_SOURCE_URL,
    versionCaveat: `Paper commands reference ${PAPER_COMMAND_DOCUMENTATION_VERSION}.`,
  }),
  adminCommand({
    id: 'paper.entityList',
    family: 'paper-admin',
    route: ['paper', 'entity', 'list'],
    aliases: [],
    title: 'Ticking-entity listing',
    fields: [
      { id: 'filter', type: 'entity-type-wildcard', required: false, default: '*', control: 'entity-filter-builder', rawRegex: false, allowedSyntax: ['*', '?', 'minecraft:<entity_type>'] },
      { id: 'world', type: 'runtime-world-choice', required: false, control: 'runtime-world-picker', noFreeText: true },
    ],
    ui: { control: 'command-action-with-entity-filter-and-runtime-world-picker', richHelp: 'Lists ticking entities using Paper\'s documented wildcard-style entity filter and an optional runtime world selection.' },
    safety: { class: 'read-only-diagnostics', consequence: 'Reads entity counts and type information.' },
    availability: { state: 'documented', requestable: false, reason: 'Optional field ordering and runtime world/entity registries require a verified runtime command tree before dispatch.' },
    prerequisites: ['verified runtime command tree', 'runtime world and entity registries'],
    source: PAPER_COMMANDS_SOURCE_URL,
    versionCaveat: `Paper commands reference ${PAPER_COMMAND_DOCUMENTATION_VERSION}.`,
  }),
  adminCommand({
    id: 'paper.fixlight',
    family: 'paper-admin',
    route: ['paper', 'fixlight'],
    aliases: [],
    title: 'Recalculate loaded-chunk lighting',
    fields: [],
    ui: { control: 'danger-command-action', richHelp: 'Triggers full light-map recalculation for all currently loaded chunks.' },
    safety: { class: 'world-maintenance', consequence: 'Triggers recalculation work for loaded chunks.' },
    availability: { state: 'documented', requestable: true },
    prerequisites: ['explicit maintenance acknowledgement', 'authorized runtime command adapter when a request is dispatched'],
    source: PAPER_COMMANDS_SOURCE_URL,
    versionCaveat: `Paper commands reference ${PAPER_COMMAND_DOCUMENTATION_VERSION}.`,
  }),
  adminCommand({
    id: 'paper.heap',
    family: 'paper-admin',
    route: ['paper', 'heap'],
    aliases: [],
    title: 'JVM heap dump',
    fields: [],
    ui: { control: 'danger-command-action', richHelp: 'Writes a JVM heap dump to an .hprof file. Paper warns that the file can be large and recommends checking free disk space.' },
    safety: { class: 'diagnostic-file-write', consequence: 'Writes a potentially large heap dump containing in-process data.' },
    availability: { state: 'documented', requestable: true },
    prerequisites: ['free-space review', 'sensitive-diagnostic-data review', 'explicit file-write acknowledgement', 'authorized runtime command adapter when a request is dispatched'],
    source: PAPER_COMMANDS_SOURCE_URL,
    versionCaveat: `Paper commands reference ${PAPER_COMMAND_DOCUMENTATION_VERSION}.`,
  }),
  adminCommand({
    id: 'paper.holderInfo',
    family: 'paper-admin',
    route: ['paper', 'holderinfo'],
    aliases: [],
    title: 'Chunk-holder information',
    fields: [{ id: 'world', type: 'runtime-world-choice-or-all', required: false, control: 'runtime-world-picker-with-all', noFreeText: true }],
    ui: { control: 'command-action-with-runtime-world-picker', richHelp: 'Shows in-memory chunk-holder counts for a selected runtime world or all worlds.' },
    safety: { class: 'read-only-diagnostics', consequence: 'Reads in-memory chunk-holder state.' },
    availability: { state: 'documented', requestable: true },
    prerequisites: ['authorized runtime command adapter when a request is dispatched', 'runtime world list for a specific-world selection'],
    source: PAPER_COMMANDS_SOURCE_URL,
    versionCaveat: `Paper commands reference ${PAPER_COMMAND_DOCUMENTATION_VERSION}.`,
  }),
  adminCommand({
    id: 'paper.mobCaps',
    family: 'paper-admin',
    route: ['paper', 'mobcaps'],
    aliases: [],
    title: 'Global mob caps',
    fields: [{ id: 'world', type: 'runtime-world-choice', required: false, control: 'runtime-world-picker', noFreeText: true }],
    ui: { control: 'command-action-with-runtime-world-picker', richHelp: 'Shows global mob caps and relevant spawnable chunks for a runtime world.' },
    safety: { class: 'read-only-diagnostics', consequence: 'Reads mob-cap state.' },
    availability: { state: 'documented', requestable: true },
    prerequisites: ['authorized runtime command adapter when a request is dispatched', 'runtime world list for a specific-world selection'],
    source: PAPER_COMMANDS_SOURCE_URL,
    versionCaveat: `Paper commands reference ${PAPER_COMMAND_DOCUMENTATION_VERSION}.`,
  }),
  adminCommand({
    id: 'paper.playerMobCaps',
    family: 'paper-admin',
    route: ['paper', 'playermobcaps'],
    aliases: [],
    title: 'Player-local mob caps',
    fields: [{ id: 'player', type: 'runtime-player-choice', required: false, control: 'runtime-player-picker', noFreeText: true }],
    ui: { control: 'command-action-with-runtime-player-picker', richHelp: 'Shows local mob caps for a selected runtime player or, where valid, the command executor.' },
    safety: { class: 'read-only-diagnostics', consequence: 'Reads player-local mob-cap state.' },
    availability: { state: 'documented', requestable: true },
    prerequisites: ['authorized runtime command adapter when a request is dispatched', 'runtime player list for a selected-player request'],
    source: PAPER_COMMANDS_SOURCE_URL,
    versionCaveat: `Paper commands reference ${PAPER_COMMAND_DOCUMENTATION_VERSION}.`,
  }),
  adminCommand({
    id: 'paper.reload',
    family: 'paper-admin',
    route: ['paper', 'reload'],
    aliases: [],
    title: 'Unsupported Paper config reload',
    fields: [],
    ui: { control: 'unavailable-command-card', richHelp: 'Visible for awareness only. Paper calls this runtime configuration reload unsupported and says it does not reload non-Paper configuration such as spigot.yml.' },
    safety: { class: 'unsupported-runtime-reload', consequence: 'Unsupported runtime configuration mutation.' },
    availability: { state: 'unsupported-unavailable', requestable: false },
    prerequisites: ['none; use a fresh-start reproduction or planned restart workflow instead'],
    source: PAPER_COMMANDS_SOURCE_URL,
    versionCaveat: `Paper commands reference ${PAPER_COMMAND_DOCUMENTATION_VERSION}.`,
  }),
  adminCommand({
    id: 'paper.syncLoadInfo',
    family: 'paper-admin',
    route: ['paper', 'syncloadinfo'],
    aliases: [],
    title: 'Sync-load debug information',
    fields: [{ id: 'action', type: 'enum', values: ['show', 'clear'], required: false, default: 'show', control: 'segmented-select' }],
    ui: { control: 'unavailable-command-card', richHelp: 'Paper documents that this requires -Dpaper.debug-sync-loads=true and that its mechanism is currently unused, so the static catalog keeps it unavailable.' },
    safety: { class: 'developer-only-diagnostics', consequence: 'Developer diagnostic with a JVM-property prerequisite.' },
    availability: { state: 'developer-only-unavailable', requestable: false },
    prerequisites: ['verified -Dpaper.debug-sync-loads=true JVM property', 'verified runtime support'],
    source: PAPER_COMMANDS_SOURCE_URL,
    versionCaveat: `Paper commands reference ${PAPER_COMMAND_DOCUMENTATION_VERSION}; the documented mechanism is currently unused.`,
  }),
  adminCommand({
    id: 'paper.version',
    family: 'paper-admin',
    route: ['paper', 'version'],
    aliases: ['version'],
    title: 'Paper version alias',
    fields: [],
    ui: { control: 'command-action', richHelp: 'Paper documents this as an alias to the standard version command.' },
    safety: { class: 'read-only-diagnostics', consequence: 'Reads version information.' },
    availability: { state: 'documented', requestable: true },
    prerequisites: ['authorized runtime command adapter when a request is dispatched'],
    source: PAPER_COMMANDS_SOURCE_URL,
    versionCaveat: `Paper commands reference ${PAPER_COMMAND_DOCUMENTATION_VERSION}.`,
  }),
]);

const VANILLA_COMMAND_CATALOG = deepFreeze([
  {
    id: 'vanilla.teleport',
    route: ['teleport'],
    syntax: '/teleport [target player] <destination>',
    controls: ['runtime-target-picker', 'coordinate-triple-editor'],
    safety: { class: 'world-position-mutation', consequence: 'Moves one or more selected targets.' },
  },
  {
    id: 'vanilla.give',
    route: ['give'],
    syntax: '/give <player> <item> [amount]',
    controls: ['runtime-player-picker', 'runtime-item-picker', 'bounded-amount-input'],
    safety: { class: 'inventory-mutation', consequence: 'Adds an item to a selected player inventory.' },
  },
  {
    id: 'vanilla.weather',
    route: ['weather'],
    syntax: '/weather <clear|rain|thunder>',
    controls: ['segmented-select'],
    staticChoices: ['clear', 'rain', 'thunder'],
    safety: { class: 'world-state-mutation', consequence: 'Changes weather.' },
  },
  {
    id: 'vanilla.time',
    route: ['time', 'set'],
    syntax: '/time set <time>',
    controls: ['segmented-time-select-or-tick-input'],
    staticChoices: ['day', 'night', 'noon', 'midnight'],
    safety: { class: 'world-state-mutation', consequence: 'Changes time of day.' },
  },
  {
    id: 'vanilla.summon',
    route: ['summon'],
    syntax: '/summon <entity> [x] [y] [z]',
    controls: ['runtime-entity-type-picker', 'coordinate-triple-editor'],
    safety: { class: 'world-entity-mutation', consequence: 'Creates an entity.' },
  },
  {
    id: 'vanilla.kill',
    route: ['kill'],
    syntax: '/kill [player]',
    controls: ['runtime-player-picker'],
    safety: { class: 'player-state-mutation', consequence: 'Kills the command target or executor.' },
  },
  {
    id: 'vanilla.setworldspawn',
    route: ['setworldspawn'],
    syntax: '/setworldspawn [x] [y] [z]',
    controls: ['coordinate-triple-editor'],
    safety: { class: 'world-state-mutation', consequence: 'Changes world spawn.' },
  },
  {
    id: 'vanilla.locate',
    route: ['locate'],
    syntax: '/locate <category> <thing>',
    controls: ['structure-or-biome-category-select', 'runtime-registry-picker'],
    staticChoices: ['structure', 'biome'],
    safety: { class: 'read-only-world-query', consequence: 'Queries nearest structure or biome location.' },
  },
  {
    id: 'vanilla.op',
    route: ['op'],
    syntax: '/op <playername>',
    controls: ['runtime-player-picker'],
    safety: { class: 'privilege-escalation', consequence: 'Grants server operator status to a selected player.' },
  },
  {
    id: 'vanilla.kick',
    route: ['kick'],
    syntax: '/kick <playername>',
    controls: ['runtime-player-picker'],
    safety: { class: 'player-session-mutation', consequence: 'Removes a selected player from the server.' },
  },
  {
    id: 'vanilla.ban',
    route: ['ban'],
    syntax: '/ban <playername>',
    controls: ['runtime-player-picker'],
    safety: { class: 'access-control-mutation', consequence: 'Bans a selected player from the server.' },
  },
].map((command) => ({
  ...command,
  family: 'vanilla-versioned',
  source: VANILLA_COMMANDS_SOURCE_URL,
  availability: { state: 'runtime-metadata-required', requestable: false },
  emission: {
    kind: 'runtime-command-tree-boundary',
    acceptsRawCommandText: false,
    acceptsRawShellTokens: false,
    dispatchesToServer: false,
  },
  versionCaveat: 'The cited official Minecraft article is a useful bounded guide, not a complete server-version grammar. Bind a future action only after runtime command-tree and permission discovery.',
}))); 

const ADMIN_COMMANDS_BY_ID = deepFreeze(Object.fromEntries(
  ADMIN_COMMAND_CATALOG.map((command) => [command.id, command]),
));

function validateRuntimeReference(value, field) {
  if (!isPlainRecord(value) || Object.keys(value).length !== 2 || value.source !== 'runtime' || typeof value.id !== 'string') {
    return { error: catalogError('invalid_runtime_reference', field, 'Value must be a runtime reference object with source: runtime and an opaque id.') };
  }

  if (value.id.length === 0 || value.id.length > COMMAND_REFERENCE_LIMITS.runtimeReferenceIdMaxLength || /[\s\u0000-\u001F\u007F]/.test(value.id)) {
    return { error: catalogError('invalid_runtime_reference_id', field, 'Runtime reference id must be a non-empty, whitespace-free opaque identifier within the catalog limit.') };
  }

  return { value: { source: 'runtime', id: value.id } };
}

function validateStructuredCommandField(field, value) {
  if (field.type === 'enum') {
    if (typeof value !== 'string' || !field.values.includes(value)) {
      return { error: catalogError('invalid_command_enum', field.id, `Value must be one of: ${field.values.join(', ')}.`) };
    }
    return { value };
  }

  if (field.type === 'positive-integer') {
    if (!Number.isSafeInteger(value) || value < field.minimum || value > field.maximum) {
      return { error: catalogError('invalid_command_integer', field.id, `Value must be an integer from ${field.minimum} through ${field.maximum}.`) };
    }
    return { value };
  }

  if (field.type === 'runtime-plugin-choice' || field.type === 'runtime-world-choice' || field.type === 'runtime-player-choice') {
    return validateRuntimeReference(value, field.id);
  }

  return { error: catalogError('runtime_field_required', field.id, `The ${field.type} field requires verified runtime metadata and is not accepted by the static request builder.`) };
}

function validateAdminCommandRequest(commandId, input = {}) {
  const command = ADMIN_COMMANDS_BY_ID[commandId];
  if (!command) {
    return deepFreeze({ ok: false, errors: [catalogError('unknown_command', 'commandId', 'Unknown administrative command id.')], value: null });
  }

  if (!command.availability.requestable) {
    return deepFreeze({ ok: false, errors: [catalogError('command_unavailable', commandId, `This catalog intentionally does not create a request for ${command.availability.state}.`)], value: null });
  }

  if (!isPlainRecord(input)) {
    return deepFreeze({ ok: false, errors: [catalogError('invalid_command_input', commandId, 'Input must be a plain typed object; raw command text and raw token arrays are not accepted.')], value: null });
  }

  const allowedFields = new Set(command.fields.map((field) => field.id));
  const errors = [];
  for (const key of Object.keys(input)) {
    if (!allowedFields.has(key)) {
      errors.push(catalogError('unknown_command_field', key, 'Unknown field. Raw command, argv, shell, and token fields are not accepted.'));
    }
  }

  const normalizedFields = {};
  if (errors.length === 0) {
    for (const field of command.fields) {
      if (!hasOwn(input, field.id)) {
        if (field.required) {
          errors.push(catalogError('missing_command_field', field.id, 'This typed field is required.'));
        } else if (hasOwn(field, 'default')) {
          normalizedFields[field.id] = field.default;
        }
        continue;
      }

      const result = validateStructuredCommandField(field, input[field.id]);
      if (result.error) {
        errors.push(result.error);
      } else {
        normalizedFields[field.id] = result.value;
      }
    }
  }

  return deepFreeze({
    ok: errors.length === 0,
    errors,
    value: errors.length === 0
      ? {
        commandId: command.id,
        route: [...command.route],
        fields: normalizedFields,
        dispatchesToServer: false,
      }
      : null,
  });
}

function createAdminCommandRequest(commandId, input = {}) {
  const validation = validateAdminCommandRequest(commandId, input);
  if (!validation.ok) {
    throw new CatalogValidationError(validation.errors);
  }
  return deepFreeze(validation.value);
}

module.exports = deepFreeze({
  CATALOG_SCHEMA_VERSION,
  CATALOG_CONTRACT,
  PAPER_CLI_CATEGORIES,
  PAPER_CLI_OPTIONS,
  PAPER_CLI_OPTIONS_BY_ID,
  SELECTION_MUTEX_GROUPS,
  SELECTION_COMPOSITION_WARNINGS,
  JVM_ARGUMENT_CATALOG,
  JVM_ARGUMENTS_BY_ID,
  SPIGOT_UNAVAILABLE_OPTIONS,
  CatalogValidationError,
  validatePaperCliSelection,
  emitPaperCliArgv,
  validateManagedJvmSelection,
  emitManagedJvmArgv,
  emitSpigotCompatibleArgv,
  COMMAND_CATALOG_SCHEMA_VERSION,
  COMMAND_RUNTIME_BOUNDARY,
  COMMAND_FAMILIES,
  ADMIN_COMMAND_PERMISSION_METADATA,
  ADMIN_COMMAND_CATALOG,
  ADMIN_COMMANDS_BY_ID,
  VANILLA_COMMAND_CATALOG,
  validateAdminCommandRequest,
  createAdminCommandRequest,
});
