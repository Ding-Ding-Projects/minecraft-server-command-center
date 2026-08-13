'use strict';

/**
 * Bounded local configuration-file writer for a controlled Minecraft-server
 * workspace. This module deliberately accepts typed schema fields rather than
 * raw documents, arbitrary file paths, shell commands, or credentials.
 */

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const configurationSchema = require('../shared/server-configuration-schema.cjs');

const MAX_CONFIGURATION_DOCUMENT_BYTES = 512 * 1024;
const MAX_PATCHES_PER_PLAN = 64;
const MAX_PREPARED_PLAN_AGE_MS = 10 * 60 * 1000;
const MAX_RETAINED_BACKUPS = 64;

const MANAGED_DOCUMENT_IDS = Object.freeze({
  SERVER_PROPERTIES: 'server-properties',
  BUKKIT: 'bukkit',
  SPIGOT: 'spigot',
  PAPER_GLOBAL: 'paper-global',
  PAPER_WORLD_DEFAULTS: 'paper-world-defaults',
  PAPER_WORLD_OVERRIDE: 'paper-world-override',
});

const MANAGED_DOCUMENTS = Object.freeze({
  [MANAGED_DOCUMENT_IDS.SERVER_PROPERTIES]: Object.freeze({
    format: 'properties',
    families: Object.freeze(['paper', 'spigot']),
    relativeSegments: Object.freeze(['server.properties']),
    allowCreate: false,
  }),
  [MANAGED_DOCUMENT_IDS.BUKKIT]: Object.freeze({
    format: 'yaml-like',
    families: Object.freeze(['paper', 'spigot']),
    relativeSegments: Object.freeze(['bukkit.yml']),
    allowCreate: false,
  }),
  [MANAGED_DOCUMENT_IDS.SPIGOT]: Object.freeze({
    format: 'yaml-like',
    families: Object.freeze(['paper', 'spigot']),
    relativeSegments: Object.freeze(['spigot.yml']),
    allowCreate: false,
  }),
  [MANAGED_DOCUMENT_IDS.PAPER_GLOBAL]: Object.freeze({
    format: 'yaml-like',
    families: Object.freeze(['paper']),
    relativeSegments: Object.freeze(['config', 'paper-global.yml']),
    allowCreate: false,
  }),
  [MANAGED_DOCUMENT_IDS.PAPER_WORLD_DEFAULTS]: Object.freeze({
    format: 'yaml-like',
    families: Object.freeze(['paper']),
    relativeSegments: Object.freeze(['config', 'paper-world-defaults.yml']),
    allowCreate: false,
  }),
  [MANAGED_DOCUMENT_IDS.PAPER_WORLD_OVERRIDE]: Object.freeze({
    format: 'yaml-like',
    families: Object.freeze(['paper']),
    relativeSegments: null,
    allowCreate: true,
  }),
});

const SERVER_PROPERTY_FIELD_IDS = Object.freeze([
  'server-properties.motd',
  'server-properties.gamemode',
  'server-properties.difficulty',
  'server-properties.max-players',
  'server-properties.player-idle-timeout',
  'server-properties.online-mode',
  'server-properties.white-list',
  'server-properties.enforce-whitelist',
  'server-properties.server-ip',
  'server-properties.server-port',
  'server-properties.enable-status',
  'server-properties.enable-query',
  'server-properties.query-port',
  'server-properties.level-name',
  'server-properties.level-seed',
  'server-properties.level-type',
  'server-properties.view-distance',
  'server-properties.simulation-distance',
  'server-properties.entity-broadcast-range-percentage',
  'server-properties.resource-pack',
  'server-properties.resource-pack-id',
  'server-properties.resource-pack-sha1',
  'server-properties.op-permission-level',
  'server-properties.function-permission-level',
  'server-properties.max-tick-time',
]);

const YAML_FIELD_MAPPINGS = Object.freeze({
  'bukkit.settings.allow-end': ['bukkit', 'settings.allow-end'],
  'bukkit.settings.warn-on-overload': ['bukkit', 'settings.warn-on-overload'],
  'bukkit.settings.connection-throttle': ['bukkit', 'settings.connection-throttle'],
  'bukkit.settings.query-plugins': ['bukkit', 'settings.query-plugins'],
  'bukkit.settings.deprecated-verbose': ['bukkit', 'settings.deprecated-verbose'],
  'bukkit.settings.shutdown-message': ['bukkit', 'settings.shutdown-message'],
  'spigot.settings.debug': ['spigot', 'settings.debug'],
  'spigot.settings.timeout-time': ['spigot', 'settings.timeout-time'],
  'spigot.settings.restart-on-crash': ['spigot', 'settings.restart-on-crash'],
  'spigot.settings.bungeecord': ['spigot', 'settings.bungeecord'],
  'spigot.players.disable-saving': ['spigot', 'players.disable-saving'],
  'spigot.stats.disable-saving': ['spigot', 'stats.disable-saving'],
  'spigot.commands.tab-complete': ['spigot', 'commands.tab-complete'],
  'spigot.commands.log': ['spigot', 'commands.log'],
  'paper-global.console.enable-brigadier-completions': ['paper-global', 'console.enable-brigadier-completions'],
  'paper-global.console.enable-brigadier-highlighting': ['paper-global', 'console.enable-brigadier-highlighting'],
  'paper-global.chunk-system.io-threads': ['paper-global', 'chunk-system.io-threads'],
  'paper-global.chunk-system.worker-threads': ['paper-global', 'chunk-system.worker-threads'],
  'paper-global.packet-limiter.all-packets.action': ['paper-global', 'packet-limiter.all-packets.action'],
  'paper-global.packet-limiter.all-packets.interval': ['paper-global', 'packet-limiter.all-packets.interval'],
  'paper-global.packet-limiter.all-packets.max-packet-rate': ['paper-global', 'packet-limiter.all-packets.max-packet-rate'],
  'paper-global.proxies.bungee-cord.online-mode': ['paper-global', 'proxies.bungee-cord.online-mode'],
  'paper-global.proxies.bungee-cord.proxy-protocol': ['paper-global', 'proxies.bungee-cord.proxy-protocol'],
  'paper-global.proxies.velocity.enabled': ['paper-global', 'proxies.velocity.enabled'],
  'paper-global.proxies.velocity.online-mode': ['paper-global', 'proxies.velocity.online-mode'],
  'paper-global.player-auto-save.max-per-tick': ['paper-global', 'player-auto-save.max-per-tick'],
  'paper-global.player-auto-save.rate': ['paper-global', 'player-auto-save.rate'],
  'paper-global.spark.enabled': ['paper-global', 'spark.enabled'],
  'paper-global.update-checker.enabled': ['paper-global', 'update-checker.enabled'],
  'paper-global.watchdog.early-warning-delay': ['paper-global', 'watchdog.early-warning-delay'],
  'paper-global.watchdog.early-warning-every': ['paper-global', 'watchdog.early-warning-every'],
  'paper-global.unsupported-settings.allow-piston-duplication': ['paper-global', 'unsupported-settings.allow-piston-duplication'],
  'paper-global.unsupported-settings.allow-permanent-block-break-exploits': ['paper-global', 'unsupported-settings.allow-permanent-block-break-exploits'],
});

const PAPER_WORLD_FIELD_IDS = Object.freeze([
  'paper-world.anticheat.anti-xray.enabled',
  'paper-world.anticheat.anti-xray.engine-mode',
  'paper-world.chunks.delay-chunk-unloads-by',
  'paper-world.chunks.flush-regions-on-save',
  'paper-world.entities.spawning.per-player-mob-spawns',
  'paper-world.hopper.cooldown-when-full',
  'paper-world.hopper.disable-move-event',
  'paper-world.misc.redstone-implementation',
  'paper-world.misc.disable-end-credits',
  'paper-world.misc.update-pathfinding-on-block-update',
  'paper-world.unsupported-settings.disable-world-ticking-when-empty',
]);

const SPIGOT_WORLD_FIELD_IDS = Object.freeze([
  'spigot.world-settings.default.view-distance',
  'spigot.world-settings.default.simulation-distance',
  'spigot.world-settings.default.verbose',
]);

const PREPARED_PLANS = new Map();
const RETAINED_BACKUPS = new Map();

class ConfigurationWriteError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'ConfigurationWriteError';
    this.code = code;
    this.details = Object.freeze({ ...details });
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function safeFieldId(value) {
  return typeof value === 'string' && /^[a-z0-9][a-z0-9.-]{0,191}$/i.test(value)
    ? value
    : null;
}

function createOpaqueId(prefix) {
  return `${prefix}_${crypto.randomBytes(18).toString('hex')}`;
}

function hashText(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

function isWithinRoot(rootPath, candidatePath) {
  const relative = path.relative(rootPath, candidatePath);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function safeError(code, message, details) {
  return new ConfigurationWriteError(code, message, details);
}

function lstatOrNull(filePath) {
  try {
    return fs.lstatSync(filePath);
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return null;
    }
    throw safeError('filesystem-unavailable', 'The controlled configuration workspace is unavailable.');
  }
}

function realpathNative(filePath) {
  try {
    return typeof fs.realpathSync.native === 'function'
      ? fs.realpathSync.native(filePath)
      : fs.realpathSync(filePath);
  } catch {
    throw safeError('workspace-unavailable', 'The controlled configuration workspace is unavailable.');
  }
}

function assertDirectoryNotLink(directoryPath, role) {
  const stats = lstatOrNull(directoryPath);
  if (!stats || !stats.isDirectory()) {
    throw safeError('directory-required', `The controlled ${role} directory is unavailable.`);
  }
  if (stats.isSymbolicLink()) {
    throw safeError('link-not-allowed', `The controlled ${role} directory cannot be a symbolic link or reparse-point path.`);
  }
}

function assertSafeExistingChain(rootPath, candidatePath) {
  if (!isWithinRoot(rootPath, candidatePath)) {
    throw safeError('outside-controlled-root', 'A requested configuration destination is outside the controlled server root.');
  }

  const relative = path.relative(rootPath, candidatePath);
  let currentPath = rootPath;
  assertDirectoryNotLink(currentPath, 'server root');

  if (relative === '') {
    return;
  }

  for (const segment of relative.split(path.sep)) {
    currentPath = path.join(currentPath, segment);
    const stats = lstatOrNull(currentPath);
    if (!stats) {
      break;
    }
    if (stats.isSymbolicLink()) {
      throw safeError('link-not-allowed', 'A managed configuration destination cannot traverse a symbolic link or reparse point.');
    }
  }
}

function assertSafeExistingDirectory(rootPath, directoryPath, role) {
  assertSafeExistingChain(rootPath, directoryPath);
  assertDirectoryNotLink(directoryPath, role);
  const canonicalRoot = realpathNative(rootPath);
  const canonicalDirectory = realpathNative(directoryPath);
  if (!isWithinRoot(canonicalRoot, canonicalDirectory)) {
    throw safeError('directory-escaped-root', 'The controlled configuration directory resolves outside the server root.');
  }
  return canonicalDirectory;
}

function normalizeWorkspaceId(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(value)) {
    throw safeError('workspace-id-invalid', 'Choose a controlled workspace identifier containing only letters, numbers, hyphens, or underscores.');
  }
  return value;
}

function normalizeWorldId(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(value)) {
    throw safeError('world-id-invalid', 'Choose a discovered world identifier.');
  }
  return value;
}

function normalizeRelativeDirectorySegments(value) {
  if (!Array.isArray(value) || value.length === 0 || value.length > 12) {
    throw safeError('world-directory-invalid', 'A discovered world mapping is unavailable.');
  }
  return value.map((segment) => {
    if (typeof segment !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(segment) || segment === '.' || segment === '..') {
      throw safeError('world-directory-invalid', 'A discovered world mapping is unavailable.');
    }
    return segment;
  });
}

function normalizeDiscoveredWorlds(value, workspacePath) {
  if (value === undefined) {
    return new Map();
  }
  if (!Array.isArray(value) || value.length > 128) {
    throw safeError('world-registry-invalid', 'The discovered world registry is invalid.');
  }

  const worlds = new Map();
  for (const entry of value) {
    if (!isPlainObject(entry)) {
      throw safeError('world-registry-invalid', 'The discovered world registry is invalid.');
    }
    const id = normalizeWorldId(entry.id);
    if (worlds.has(id)) {
      throw safeError('world-registry-invalid', 'The discovered world registry contains duplicate identifiers.');
    }
    const directorySegments = normalizeRelativeDirectorySegments(entry.directorySegments);
    const directoryPath = path.resolve(workspacePath, ...directorySegments);
    if (!isWithinRoot(workspacePath, directoryPath)) {
      throw safeError('world-directory-invalid', 'A discovered world mapping is outside the controlled workspace.');
    }
    assertSafeExistingDirectory(workspacePath, directoryPath, 'world');
    worlds.set(id, Object.freeze({ id, directorySegments: Object.freeze(directorySegments) }));
  }
  return worlds;
}

function normalizeRuntime(input) {
  const runtime = configurationSchema.normalizeRuntime(input);
  if (!runtime.serverFamily || !runtime.minecraftVersion || !runtime.catalogRevision) {
    throw safeError('runtime-context-required', 'Select a complete server family, Minecraft version, build, and catalog revision before preparing configuration changes.');
  }
  if ((runtime.serverFamily === 'paper' && !runtime.paperBuild) || (runtime.serverFamily === 'spigot' && !runtime.spigotBuild)) {
    throw safeError('runtime-build-required', 'Select the build associated with the configuration catalog before preparing changes.');
  }
  return runtime;
}

function resolveConfigurationWorkspaceInternal(input = {}) {
  if (!isPlainObject(input)) {
    throw safeError('workspace-request-invalid', 'The configuration workspace request is invalid.');
  }
  if (input.schemaRevision !== configurationSchema.CONFIGURATION_SCHEMA_REVISION) {
    throw safeError('schema-revision-mismatch', 'The selected configuration schema revision does not match this writer.');
  }
  if (typeof input.controlledServerRoot !== 'string' || !path.isAbsolute(input.controlledServerRoot)) {
    throw safeError('controlled-root-required', 'A controlled absolute server root is required.');
  }

  const selectedRoot = path.resolve(input.controlledServerRoot);
  assertDirectoryNotLink(selectedRoot, 'server root');
  const rootPath = realpathNative(selectedRoot);
  assertDirectoryNotLink(rootPath, 'server root');

  const workspaceId = normalizeWorkspaceId(input.workspaceId);
  const selectedWorkspace = path.resolve(rootPath, workspaceId);
  if (!isWithinRoot(rootPath, selectedWorkspace)) {
    throw safeError('workspace-outside-root', 'The selected workspace is outside the controlled server root.');
  }
  const workspacePath = assertSafeExistingDirectory(rootPath, selectedWorkspace, 'workspace');
  const runtime = normalizeRuntime(input.runtime);
  const discoveredWorlds = normalizeDiscoveredWorlds(input.discoveredWorlds, workspacePath);

  return Object.freeze({
    rootPath,
    workspacePath,
    workspaceId,
    schemaRevision: input.schemaRevision,
    runtime,
    discoveredWorlds,
    fingerprint: hashText(`${rootPath}\u0000${workspacePath}\u0000${runtime.serverFamily}\u0000${input.schemaRevision}`),
  });
}

function publicWorkspaceView(workspace) {
  return Object.freeze({
    status: 'available',
    workspaceId: workspace.workspaceId,
    serverFamily: workspace.runtime.serverFamily,
    minecraftVersion: workspace.runtime.minecraftVersion,
    catalogRevision: workspace.runtime.catalogRevision,
    schemaRevision: workspace.schemaRevision,
    discoveredWorldIds: Object.freeze([...workspace.discoveredWorlds.keys()].sort()),
  });
}

function resolveConfigurationWorkspace(input = {}) {
  return publicWorkspaceView(resolveConfigurationWorkspaceInternal(input));
}

function splitTextLines(text) {
  if (typeof text !== 'string' || text.includes('\u0000')) {
    throw safeError('document-text-invalid', 'The managed configuration document is malformed.');
  }

  const hasCarriageReturn = text.includes('\r');
  const hasLineFeed = text.includes('\n');
  const hasCrLf = text.includes('\r\n');
  const strippedCrLf = text.replace(/\r\n/g, '');
  if ((hasCrLf && /\r|\n/.test(strippedCrLf)) || (!hasCrLf && hasCarriageReturn && hasLineFeed)) {
    throw safeError('mixed-line-endings', 'The managed configuration document uses unsupported mixed line endings.');
  }

  const eol = hasCrLf ? '\r\n' : (hasLineFeed ? '\n' : (hasCarriageReturn ? '\r' : '\n'));
  const hasFinalEol = text.endsWith(eol);
  const normalized = eol === '\r\n'
    ? text.replace(/\r\n/g, '\n')
    : (eol === '\r' ? text.replace(/\r/g, '\n') : text);
  const lines = normalized.split('\n');
  if (hasFinalEol) {
    lines.pop();
  }
  return Object.freeze({ lines, eol, hasFinalEol });
}

function joinTextLines({ lines, eol, hasFinalEol }) {
  const text = lines.join(eol);
  return hasFinalEol ? `${text}${eol}` : text;
}

function readManagedDocument(workspace, target) {
  const document = MANAGED_DOCUMENTS[target.documentId];
  if (!document) {
    throw safeError('managed-document-unknown', 'The selected configuration document is not managed by this writer.');
  }

  if (!document.families.includes(workspace.runtime.serverFamily)) {
    throw safeError('managed-document-not-applicable', 'The selected configuration document does not apply to this server family.');
  }

  const filePath = target.filePath;
  const parentPath = path.dirname(filePath);
  if (!isWithinRoot(workspace.workspacePath, parentPath) || !isWithinRoot(workspace.workspacePath, filePath)) {
    throw safeError('document-outside-workspace', 'The selected configuration destination is outside the controlled workspace.');
  }
  assertSafeExistingDirectory(workspace.workspacePath, parentPath, 'managed configuration parent');

  const stats = lstatOrNull(filePath);
  if (!stats) {
    if (!document.allowCreate || !target.allowCreate) {
      throw safeError('managed-document-missing', 'The selected managed configuration document does not exist yet.');
    }
    return Object.freeze({
      exists: false,
      filePath,
      text: '',
      digest: null,
      size: 0,
    });
  }
  if (stats.isSymbolicLink() || !stats.isFile()) {
    throw safeError('managed-document-unsafe', 'The selected managed configuration document must be a regular non-link file.');
  }
  if (stats.size > MAX_CONFIGURATION_DOCUMENT_BYTES) {
    throw safeError('managed-document-too-large', 'The selected managed configuration document exceeds the supported safety bound.');
  }

  const text = fs.readFileSync(filePath, 'utf8');
  if (Buffer.byteLength(text, 'utf8') > MAX_CONFIGURATION_DOCUMENT_BYTES) {
    throw safeError('managed-document-too-large', 'The selected managed configuration document exceeds the supported safety bound.');
  }
  return Object.freeze({
    exists: true,
    filePath,
    text,
    digest: hashText(text),
    size: Buffer.byteLength(text, 'utf8'),
  });
}

function splitPropertiesInlineComment(value) {
  let escaped = false;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (character === '\\') {
      escaped = true;
      continue;
    }
    if ((character === '#' || character === '!') && index > 0 && /\s/.test(value[index - 1])) {
      return Object.freeze({ value: value.slice(0, index).trimEnd(), comment: value.slice(index) });
    }
  }
  return Object.freeze({ value: value.trimEnd(), comment: '' });
}

function serializePropertiesScalar(value) {
  const source = String(value);
  return source
    .replace(/\\/g, '\\\\')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/=/g, '\\=')
    .replace(/:/g, '\\:');
}

function deserializePropertiesScalar(value) {
  let output = '';
  let escaped = false;
  for (const character of value) {
    if (!escaped) {
      if (character === '\\') {
        escaped = true;
      } else {
        output += character;
      }
      continue;
    }
    escaped = false;
    if (character === 'n') {
      output += '\n';
    } else if (character === 'r') {
      output += '\r';
    } else {
      output += character;
    }
  }
  if (escaped) {
    throw safeError('properties-escape-invalid', 'The managed configuration document contains an unsupported property escape.');
  }
  return output;
}

function parsePropertiesLine(line, index) {
  if (/^\s*(?:[#!]|$)/.test(line)) {
    return null;
  }
  const match = /^([ \t]*)([^\s#!:=][^:=]*?)([=:])([ \t]*)(.*)$/.exec(line);
  if (!match) {
    return null;
  }
  const [, indent, key, separator, whitespace, rawValue] = match;
  if (/\s/.test(key)) {
    return null;
  }
  const split = splitPropertiesInlineComment(rawValue);
  return Object.freeze({ index, key, separator, whitespace, prefix: `${indent}${key}${separator}`, value: split.value, comment: split.comment });
}

function analyzeProperties(lines) {
  const entries = [];
  lines.forEach((line, index) => {
    const parsed = parsePropertiesLine(line, index);
    if (parsed) {
      entries.push(parsed);
    }
  });
  return Object.freeze(entries);
}

function updatePropertiesScalar(documentText, key, value) {
  const lineSet = splitTextLines(documentText);
  const entries = analyzeProperties(lineSet.lines).filter((entry) => entry.key === key);
  if (entries.length > 1) {
    throw safeError('duplicate-managed-key', 'The managed properties key occurs more than once and cannot be safely rewritten.');
  }
  const serialized = serializePropertiesScalar(value);
  if (entries.length === 1) {
    const entry = entries[0];
    const current = deserializePropertiesScalar(entry.value);
    if (current === String(value)) {
      return Object.freeze({ text: documentText, changed: false });
    }
    const nextLines = [...lineSet.lines];
    nextLines[entry.index] = `${entry.prefix}${entry.whitespace}${serialized}${entry.comment}`;
    return Object.freeze({ text: joinTextLines({ ...lineSet, lines: nextLines }), changed: true });
  }

  const nextLines = [...lineSet.lines];
  nextLines.push(`${key}=${serialized}`);
  return Object.freeze({ text: joinTextLines({ ...lineSet, lines: nextLines }), changed: true });
}

function parseYamlMappingLine(line, index) {
  if (/^\s*(?:#|$)/.test(line)) {
    return null;
  }
  const match = /^( *)([A-Za-z0-9_-]+):(?:[ \t]*(.*))?$/.exec(line);
  if (!match) {
    return null;
  }
  const [, indentText, key, rawRest = ''] = match;
  const rest = rawRest.trimEnd();
  const trimmed = rest.trimStart();
  const isContainer = trimmed === '' || trimmed.startsWith('#');
  const unsupported = !isContainer && /^(?:[|>&*!\[{\-])/.test(trimmed);
  const inlineCommentIndex = findYamlInlineComment(rest);
  const scalar = inlineCommentIndex === -1 ? rest.trim() : rest.slice(0, inlineCommentIndex).trimEnd();
  const comment = inlineCommentIndex === -1 ? '' : rest.slice(inlineCommentIndex);
  return Object.freeze({
    index,
    indent: indentText.length,
    key,
    isContainer,
    unsupported,
    scalar,
    comment,
  });
}

function findYamlInlineComment(value) {
  let singleQuoted = false;
  let doubleQuoted = false;
  let escaped = false;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (doubleQuoted && escaped) {
      escaped = false;
      continue;
    }
    if (doubleQuoted && character === '\\') {
      escaped = true;
      continue;
    }
    if (!doubleQuoted && character === "'") {
      if (singleQuoted && value[index + 1] === "'") {
        index += 1;
        continue;
      }
      singleQuoted = !singleQuoted;
      continue;
    }
    if (!singleQuoted && character === '"') {
      doubleQuoted = !doubleQuoted;
      continue;
    }
    if (!singleQuoted && !doubleQuoted && character === '#' && (index === 0 || /\s/.test(value[index - 1]))) {
      return index;
    }
  }
  return -1;
}

function analyzeYamlLike(lines) {
  const entries = [];
  const stack = [];
  lines.forEach((line, index) => {
    const entry = parseYamlMappingLine(line, index);
    if (!entry) {
      return;
    }
    while (stack.length > 0 && stack[stack.length - 1].indent >= entry.indent) {
      stack.pop();
    }
    const segments = Object.freeze([...stack.map((ancestor) => ancestor.key), entry.key]);
    const complete = Object.freeze({ ...entry, segments, signature: segments.join('.') });
    entries.push(complete);
    if (entry.isContainer) {
      stack.push(entry);
    }
  });
  return Object.freeze(entries);
}

function serializeYamlScalar(value) {
  if (typeof value === 'boolean' || typeof value === 'number') {
    return String(value);
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

function deserializeYamlScalar(value) {
  const trimmed = value.trim();
  if (trimmed === 'true') {
    return true;
  }
  if (trimmed === 'false') {
    return false;
  }
  if (/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/.test(trimmed)) {
    return Number(trimmed);
  }
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1).replace(/''/g, "'");
  }
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      throw safeError('yaml-scalar-invalid', 'The managed YAML-like scalar is malformed.');
    }
  }
  if (/^[A-Za-z0-9_.:/@+-]+$/.test(trimmed)) {
    return trimmed;
  }
  throw safeError('yaml-scalar-invalid', 'The managed YAML-like scalar uses an unsupported representation.');
}

function yamlPathSignature(segments) {
  return segments.join('.');
}

function yamlEntriesForPath(entries, segments) {
  const signature = yamlPathSignature(segments);
  return entries.filter((entry) => entry.signature === signature);
}

function yamlHasChild(entries, segments) {
  const signature = `${yamlPathSignature(segments)}.`;
  return entries.some((entry) => entry.signature.startsWith(signature));
}

function yamlInsertionIndex(lines, entries, parent) {
  for (let index = parent.index + 1; index < lines.length; index += 1) {
    const candidate = parseYamlMappingLine(lines[index], index);
    if (candidate && candidate.indent <= parent.indent) {
      return index;
    }
  }
  return lines.length;
}

function setYamlScalar(documentText, segments, value, options = {}) {
  const lineSet = splitTextLines(documentText);
  const entries = analyzeYamlLike(lineSet.lines);
  const targetEntries = yamlEntriesForPath(entries, segments);
  if (targetEntries.length > 1) {
    throw safeError('duplicate-managed-yaml-path', 'The managed YAML-like path occurs more than once and cannot be safely rewritten.');
  }

  const serialized = serializeYamlScalar(value);
  if (targetEntries.length === 1) {
    const target = targetEntries[0];
    if (target.unsupported || (target.isContainer && yamlHasChild(entries, segments))) {
      throw safeError('managed-yaml-construct-unsupported', 'The requested YAML-like value is not a writable scalar leaf.');
    }
    if (!target.isContainer && deserializeYamlScalar(target.scalar) === value) {
      return Object.freeze({ text: documentText, changed: false });
    }
    const nextLines = [...lineSet.lines];
    const prefix = `${' '.repeat(target.indent)}${target.key}:`;
    const comment = target.comment ? ` ${target.comment}` : '';
    nextLines[target.index] = `${prefix} ${serialized}${comment}`;
    return Object.freeze({ text: joinTextLines({ ...lineSet, lines: nextLines }), changed: true });
  }

  let parent = null;
  for (let length = segments.length - 1; length > 0; length -= 1) {
    const candidates = yamlEntriesForPath(entries, segments.slice(0, length));
    if (candidates.length > 1) {
      throw safeError('duplicate-managed-yaml-path', 'The managed YAML-like path occurs more than once and cannot be safely extended.');
    }
    if (candidates.length === 1) {
      if (!candidates[0].isContainer || candidates[0].unsupported) {
        throw safeError('managed-yaml-construct-unsupported', 'The requested YAML-like path cannot be extended from its current value.');
      }
      parent = candidates[0];
      break;
    }
  }

  const start = parent ? parent.segments.length : 0;
  const baseIndent = parent ? parent.indent + 2 : 0;
  const generated = [];
  for (let index = start; index < segments.length; index += 1) {
    const indentation = ' '.repeat(baseIndent + ((index - start) * 2));
    const isLeaf = index === segments.length - 1;
    generated.push(isLeaf ? `${indentation}${segments[index]}: ${serialized}` : `${indentation}${segments[index]}:`);
  }

  const nextLines = [...lineSet.lines];
  if (parent) {
    nextLines.splice(yamlInsertionIndex(nextLines, entries, parent), 0, ...generated);
  } else {
    if (nextLines.length > 0 && nextLines[nextLines.length - 1].trim() !== '') {
      nextLines.push('');
    }
    nextLines.push(...generated);
  }
  return Object.freeze({ text: joinTextLines({ ...lineSet, lines: nextLines }), changed: true });
}

function assertScalarValue(value) {
  if (typeof value === 'string') {
    if (value.length > 4_096 || /[\u0000\r\n]/.test(value)) {
      throw safeError('scalar-value-invalid', 'The selected scalar value is malformed or exceeds the supported bound.');
    }
    return value;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  throw safeError('scalar-value-required', 'The selected configuration value must be a supported scalar.');
}

function publicSelection(index, fieldId, documentId, targetKind, status, code) {
  const selection = { index, fieldId, documentId, targetKind, status };
  if (code) {
    selection.code = code;
  }
  return Object.freeze(selection);
}

function resolveStaticDocumentTarget(workspace, documentId, yamlPath = null) {
  const document = MANAGED_DOCUMENTS[documentId];
  const filePath = path.resolve(workspace.workspacePath, ...document.relativeSegments);
  if (!isWithinRoot(workspace.workspacePath, filePath)) {
    throw safeError('document-outside-workspace', 'The selected configuration destination is outside the controlled workspace.');
  }
  return Object.freeze({
    documentId,
    targetKind: documentId,
    yamlPath: yamlPath ? Object.freeze([...yamlPath]) : null,
    propertyKey: null,
    filePath,
    allowCreate: false,
    targetId: null,
  });
}

function resolvePaperWorldTarget(workspace, patch, definition) {
  const target = patch.target;
  if (!isPlainObject(target) || typeof target.kind !== 'string') {
    throw safeError('paper-world-target-required', 'Choose either the Paper world defaults or one discovered Paper world.');
  }

  if (target.kind === 'paper-world-defaults') {
    const resolved = resolveStaticDocumentTarget(workspace, MANAGED_DOCUMENT_IDS.PAPER_WORLD_DEFAULTS, definition.path.split('.'));
    return Object.freeze({ ...resolved, targetKind: 'paper-world-defaults' });
  }
  if (target.kind !== 'paper-world-override') {
    throw safeError('paper-world-target-invalid', 'Choose either the Paper world defaults or one discovered Paper world.');
  }
  const worldId = normalizeWorldId(target.worldId);
  const world = workspace.discoveredWorlds.get(worldId);
  if (!world) {
    throw safeError('paper-world-not-discovered', 'Choose a world from the discovered world registry.');
  }
  const filePath = path.resolve(workspace.workspacePath, ...world.directorySegments, 'paper-world.yml');
  if (!isWithinRoot(workspace.workspacePath, filePath)) {
    throw safeError('paper-world-outside-workspace', 'The selected discovered world mapping is outside the controlled workspace.');
  }
  return Object.freeze({
    documentId: MANAGED_DOCUMENT_IDS.PAPER_WORLD_OVERRIDE,
    targetKind: 'paper-world-override',
    targetId: worldId,
    yamlPath: Object.freeze(definition.path.split('.')),
    propertyKey: null,
    filePath,
    allowCreate: true,
  });
}

function resolveSpigotWorldTarget(workspace, patch, definition) {
  const target = patch.target;
  if (!isPlainObject(target) || typeof target.kind !== 'string') {
    throw safeError('spigot-world-target-required', 'Choose Spigot defaults or one discovered world.');
  }
  const leafSegments = definition.path.split('.').slice(2);
  if (target.kind === 'spigot-world-default') {
    return Object.freeze({
      ...resolveStaticDocumentTarget(workspace, MANAGED_DOCUMENT_IDS.SPIGOT, ['world-settings', 'default', ...leafSegments]),
      targetKind: 'spigot-world-default',
    });
  }
  if (target.kind !== 'spigot-world-override') {
    throw safeError('spigot-world-target-invalid', 'Choose Spigot defaults or one discovered world.');
  }
  const worldId = normalizeWorldId(target.worldId);
  if (!workspace.discoveredWorlds.has(worldId)) {
    throw safeError('spigot-world-not-discovered', 'Choose a world from the discovered world registry.');
  }
  return Object.freeze({
    ...resolveStaticDocumentTarget(workspace, MANAGED_DOCUMENT_IDS.SPIGOT, ['world-settings', worldId, ...leafSegments]),
    targetKind: 'spigot-world-override',
    targetId: worldId,
  });
}

function resolvePatchTarget(workspace, patch, definition) {
  if (SERVER_PROPERTY_FIELD_IDS.includes(definition.id)) {
    if (patch.target !== undefined) {
      throw safeError('target-not-allowed', 'This configuration field has one fixed managed document target.');
    }
    const target = resolveStaticDocumentTarget(workspace, MANAGED_DOCUMENT_IDS.SERVER_PROPERTIES);
    return Object.freeze({ ...target, propertyKey: definition.path });
  }

  const yamlMapping = YAML_FIELD_MAPPINGS[definition.id];
  if (yamlMapping) {
    if (patch.target !== undefined) {
      throw safeError('target-not-allowed', 'This configuration field has one fixed managed document target.');
    }
    const [documentAlias, yamlPath] = yamlMapping;
    const documentId = documentAlias === 'bukkit'
      ? MANAGED_DOCUMENT_IDS.BUKKIT
      : (documentAlias === 'spigot' ? MANAGED_DOCUMENT_IDS.SPIGOT : MANAGED_DOCUMENT_IDS.PAPER_GLOBAL);
    return resolveStaticDocumentTarget(workspace, documentId, yamlPath.split('.'));
  }

  if (PAPER_WORLD_FIELD_IDS.includes(definition.id)) {
    return resolvePaperWorldTarget(workspace, patch, definition);
  }
  if (SPIGOT_WORLD_FIELD_IDS.includes(definition.id)) {
    return resolveSpigotWorldTarget(workspace, patch, definition);
  }
  throw safeError('field-write-unavailable', 'The selected field is not writable through this bounded configuration foundation.');
}

function assertOnlyKeys(record, allowedKeys, code, message) {
  for (const key of Object.keys(record)) {
    if (!allowedKeys.includes(key)) {
      throw safeError(code, message);
    }
  }
}

function validatePatchTargetShape(target) {
  if (target === undefined) {
    return;
  }
  if (!isPlainObject(target)) {
    throw safeError('target-invalid', 'The requested configuration target is invalid.');
  }
  assertOnlyKeys(target, ['kind', 'worldId'], 'target-invalid', 'The requested configuration target is invalid.');
}

function resolvePatch(workspace, patch, index) {
  if (!isPlainObject(patch)) {
    throw safeError('patch-invalid', 'Each configuration change must be a typed patch.');
  }
  assertOnlyKeys(patch, ['fieldId', 'value', 'target', 'acknowledgedRisk'], 'patch-invalid', 'Each configuration change must use only typed patch fields.');
  const fieldId = safeFieldId(patch.fieldId);
  if (!fieldId) {
    throw safeError('field-id-invalid', 'Choose a configuration field from the selected schema.');
  }
  validatePatchTargetShape(patch.target);

  const definition = configurationSchema.getField(fieldId);
  if (!definition) {
    throw safeError('field-unknown', 'Choose a configuration field from the selected schema.');
  }
  if (definition.safety === configurationSchema.SAFETY_CLASSIFICATIONS.SECRET || definition.valueType === 'vault-reference') {
    throw safeError('credential-write-unavailable', 'Credential-bearing configuration values are excluded from ordinary configuration writes.');
  }
  const availability = configurationSchema.fieldAvailability(definition, workspace.runtime);
  if (availability.state !== 'available') {
    throw safeError('field-not-available', 'The selected configuration field is not available for the selected server context.');
  }
  if (definition.acknowledgement && patch.acknowledgedRisk !== true) {
    throw safeError('risk-acknowledgement-required', 'A factual acknowledgement is required before preparing this risk-marked configuration change.');
  }
  const validation = configurationSchema.validateConfigurationValue(fieldId, patch.value);
  if (!validation.valid) {
    throw safeError('field-value-invalid', 'The selected value is not valid for this configuration field.');
  }
  const value = assertScalarValue(validation.normalizedValue);
  const target = resolvePatchTarget(workspace, patch, definition);
  return Object.freeze({
    index,
    fieldId,
    definition,
    value,
    target,
    documentKey: `${target.documentId}\u0000${target.filePath}`,
  });
}

function selectionFromResolvedPatch(resolved, status, code) {
  return publicSelection(
    resolved.index,
    resolved.fieldId,
    resolved.target.documentId,
    resolved.target.targetKind,
    status,
    code,
  );
}

function selectionFromUnresolvedPatch(patch, index, code) {
  return Object.freeze({
    index,
    fieldId: safeFieldId(isPlainObject(patch) ? patch.fieldId : null),
    status: 'rejected',
    code,
  });
}

function patchIdentity(resolved) {
  return `${resolved.fieldId}\u0000${resolved.target.documentId}\u0000${resolved.target.targetKind}\u0000${resolved.target.targetId || ''}`;
}

function applyPatchToDocumentText(documentText, resolved) {
  const document = MANAGED_DOCUMENTS[resolved.target.documentId];
  if (document.format === 'properties') {
    return updatePropertiesScalar(documentText, resolved.target.propertyKey, resolved.value);
  }
  return setYamlScalar(documentText, resolved.target.yamlPath, resolved.value, { allowCreate: resolved.target.allowCreate });
}

function verifyPropertiesScalar(documentText, resolved) {
  const lineSet = splitTextLines(documentText);
  const entries = analyzeProperties(lineSet.lines).filter((entry) => entry.key === resolved.target.propertyKey);
  if (entries.length !== 1 || deserializePropertiesScalar(entries[0].value) !== String(resolved.value)) {
    throw safeError('postwrite-validation-failed', 'The managed properties write could not be revalidated.');
  }
}

function verifyYamlScalar(documentText, resolved) {
  const lineSet = splitTextLines(documentText);
  const entries = yamlEntriesForPath(analyzeYamlLike(lineSet.lines), resolved.target.yamlPath);
  if (entries.length !== 1 || entries[0].isContainer || entries[0].unsupported || deserializeYamlScalar(entries[0].scalar) !== resolved.value) {
    throw safeError('postwrite-validation-failed', 'The managed YAML-like write could not be revalidated.');
  }
}

function verifyDocumentWrites(documentText, resolvedPatches) {
  for (const resolved of resolvedPatches) {
    if (MANAGED_DOCUMENTS[resolved.target.documentId].format === 'properties') {
      verifyPropertiesScalar(documentText, resolved);
    } else {
      verifyYamlScalar(documentText, resolved);
    }
  }
}

function pruneExpiredState(now = Date.now()) {
  for (const [token, plan] of PREPARED_PLANS.entries()) {
    if (plan.preparedAt + MAX_PREPARED_PLAN_AGE_MS < now) {
      PREPARED_PLANS.delete(token);
    }
  }
  while (RETAINED_BACKUPS.size > MAX_RETAINED_BACKUPS) {
    const oldest = RETAINED_BACKUPS.keys().next().value;
    if (!oldest) {
      break;
    }
    const record = RETAINED_BACKUPS.get(oldest);
    RETAINED_BACKUPS.delete(oldest);
    try {
      if (record && record.backupPath && fs.existsSync(record.backupPath)) {
        fs.unlinkSync(record.backupPath);
      }
    } catch {
      // Retention cleanup never changes a configuration-write result.
    }
  }
}

function publicPreparedPlan(plan) {
  return Object.freeze({
    status: 'ready',
    reviewToken: plan.reviewToken,
    selections: Object.freeze([...plan.selections]),
    plannedWrites: Object.freeze([...plan.changedSelections]),
    skipped: Object.freeze([...plan.skippedSelections]),
  });
}

function publicRejectedPlan(selections) {
  return Object.freeze({
    status: 'rejected',
    reviewToken: null,
    selections: Object.freeze([...selections]),
    plannedWrites: Object.freeze([]),
    skipped: Object.freeze([]),
  });
}

function prepareConfigurationPatch(input = {}) {
  pruneExpiredState();
  let workspace;
  try {
    workspace = resolveConfigurationWorkspaceInternal(input);
  } catch (error) {
    if (error instanceof ConfigurationWriteError) {
      return publicRejectedPlan([Object.freeze({ index: null, fieldId: null, status: 'rejected', code: error.code })]);
    }
    throw error;
  }

  if (!Array.isArray(input.patches) || input.patches.length === 0 || input.patches.length > MAX_PATCHES_PER_PLAN) {
    return publicRejectedPlan([Object.freeze({ index: null, fieldId: null, status: 'rejected', code: 'patches-required' })]);
  }

  const resolved = [];
  const selections = [];
  const identities = new Set();
  for (const [index, patch] of input.patches.entries()) {
    try {
      const candidate = resolvePatch(workspace, patch, index);
      const identity = patchIdentity(candidate);
      if (identities.has(identity)) {
        throw safeError('duplicate-patch', 'A configuration field may appear only once for the same managed target.');
      }
      identities.add(identity);
      resolved.push(candidate);
      selections.push(selectionFromResolvedPatch(candidate, 'ready'));
    } catch (error) {
      if (error instanceof ConfigurationWriteError) {
        selections.push(selectionFromUnresolvedPatch(patch, index, error.code));
      } else {
        throw error;
      }
    }
  }

  if (selections.some((selection) => selection.status === 'rejected')) {
    return publicRejectedPlan(selections);
  }

  const documents = new Map();
  try {
    for (const candidate of resolved) {
      let documentPlan = documents.get(candidate.documentKey);
      if (!documentPlan) {
        const state = readManagedDocument(workspace, candidate.target);
        documentPlan = {
          documentId: candidate.target.documentId,
          filePath: candidate.target.filePath,
          representativeTarget: candidate.target,
          workspace,
          beforeExists: state.exists,
          beforeText: state.text,
          beforeDigest: state.digest,
          afterText: state.text,
          resolvedPatches: [],
        };
        documents.set(candidate.documentKey, documentPlan);
      }
      const update = applyPatchToDocumentText(documentPlan.afterText, candidate);
      documentPlan.afterText = update.text;
      if (update.changed) {
        documentPlan.resolvedPatches.push(candidate);
      }
    }
  } catch (error) {
    if (error instanceof ConfigurationWriteError) {
      return publicRejectedPlan(resolved.map((candidate) => selectionFromResolvedPatch(candidate, 'rejected', error.code)));
    }
    throw error;
  }

  const changedSelections = [];
  const skippedSelections = [];
  for (const candidate of resolved) {
    const documentPlan = documents.get(candidate.documentKey);
    const changed = documentPlan.resolvedPatches.includes(candidate);
    if (changed) {
      changedSelections.push(selectionFromResolvedPatch(candidate, 'ready'));
    } else {
      skippedSelections.push(selectionFromResolvedPatch(candidate, 'skipped', 'already-current'));
    }
  }

  const reviewToken = createOpaqueId('review');
  const plan = Object.freeze({
    reviewToken,
    preparedAt: Date.now(),
    workspace,
    selections: Object.freeze([...selections]),
    changedSelections: Object.freeze(changedSelections),
    skippedSelections: Object.freeze(skippedSelections),
    documents: Object.freeze([...documents.values()].filter((documentPlan) => documentPlan.resolvedPatches.length > 0).map((documentPlan) => Object.freeze({
      ...documentPlan,
      resolvedPatches: Object.freeze([...documentPlan.resolvedPatches]),
    }))),
  });
  PREPARED_PLANS.set(reviewToken, plan);
  return publicPreparedPlan(plan);
}

function selectionWithStatus(selection, status, code) {
  return publicSelection(selection.index, selection.fieldId, selection.documentId, selection.targetKind, status, code);
}

function publicApplyResult(status, applied, skipped, rejected, rollbackIds = []) {
  return Object.freeze({
    status,
    applied: Object.freeze([...applied]),
    skipped: Object.freeze([...skipped]),
    rejected: Object.freeze([...rejected]),
    rollbackIds: Object.freeze([...rollbackIds]),
  });
}

function matchesReviewConfirmation(request, reviewToken) {
  return isPlainObject(request)
    && request.reviewToken === reviewToken
    && isPlainObject(request.confirmation)
    && request.confirmation.kind === 'reviewed-configuration-patch'
    && request.confirmation.token === reviewToken;
}

function sameDocumentState(expected, actual) {
  return expected.beforeExists === actual.exists
    && expected.beforeDigest === actual.digest;
}

function writeTemporaryDocument(documentPlan) {
  if (Buffer.byteLength(documentPlan.afterText, 'utf8') > MAX_CONFIGURATION_DOCUMENT_BYTES) {
    throw safeError('managed-document-too-large', 'The managed configuration result exceeds the supported safety bound.');
  }
  const directoryPath = path.dirname(documentPlan.filePath);
  const temporaryPath = path.join(directoryPath, `.${createOpaqueId('mcc-write')}.tmp`);
  let descriptor;
  try {
    descriptor = fs.openSync(temporaryPath, 'wx', 0o600);
    fs.writeFileSync(descriptor, documentPlan.afterText, 'utf8');
    fs.fsyncSync(descriptor);
  } catch (error) {
    try {
      if (descriptor !== undefined) {
        fs.closeSync(descriptor);
      }
      if (fs.existsSync(temporaryPath)) {
        fs.unlinkSync(temporaryPath);
      }
    } catch {
      // The original write error remains authoritative.
    }
    throw safeError('temporary-write-failed', 'A managed configuration replacement could not be prepared safely.');
  }
  fs.closeSync(descriptor);
  return temporaryPath;
}

function createBackupRecord(documentPlan) {
  const backupId = createOpaqueId('backup');
  let backupPath = null;
  if (documentPlan.beforeExists) {
    backupPath = path.join(path.dirname(documentPlan.filePath), `.${backupId}.bak`);
    try {
      fs.copyFileSync(documentPlan.filePath, backupPath, fs.constants.COPYFILE_EXCL);
    } catch {
      throw safeError('backup-create-failed', 'A managed configuration backup could not be created safely.');
    }
  }
  return {
    backupId,
    backupPath,
    documentPlan,
    replaced: false,
    afterDigest: null,
  };
}

function removeTemporaryFiles(temporaryPaths) {
  for (const temporaryPath of temporaryPaths) {
    try {
      if (temporaryPath && fs.existsSync(temporaryPath)) {
        fs.unlinkSync(temporaryPath);
      }
    } catch {
      // Do not mask the write failure with cleanup status.
    }
  }
}

function discardFailedBackupRecords(records) {
  for (const record of records) {
    try {
      if (record.backupPath && fs.existsSync(record.backupPath)) {
        fs.unlinkSync(record.backupPath);
      }
    } catch {
      // A retained backup is safer than masking a failed operation.
    }
  }
}

function replaceTargetFromTemporary(record, temporaryPath) {
  try {
    fs.renameSync(temporaryPath, record.documentPlan.filePath);
    record.replaced = true;
  } catch {
    throw safeError('atomic-replace-failed', 'The managed configuration replacement could not be committed safely.');
  }
}

function restoreRecord(record) {
  const { documentPlan } = record;
  const target = documentPlan.representativeTarget;
  const workspace = documentPlan.workspace;
  const current = readManagedDocument(workspace, target);
  if (!current.exists || !record.afterDigest || current.digest !== record.afterDigest) {
    throw safeError('rollback-state-changed', 'The managed configuration document changed before its rollback could be applied.');
  }
  if (record.backupPath) {
    if (!fs.existsSync(record.backupPath)) {
      throw safeError('backup-unavailable', 'The retained managed configuration backup is unavailable.');
    }
    const backupText = fs.readFileSync(record.backupPath, 'utf8');
    const temporaryPath = writeTemporaryDocument({ ...documentPlan, afterText: backupText });
    try {
      fs.renameSync(temporaryPath, documentPlan.filePath);
    } catch {
      removeTemporaryFiles([temporaryPath]);
      throw safeError('rollback-replace-failed', 'The managed configuration backup could not be restored safely.');
    }
    const restored = readManagedDocument(workspace, target);
    if (!documentPlan.beforeExists || restored.digest !== documentPlan.beforeDigest) {
      throw safeError('rollback-validation-failed', 'The managed configuration rollback could not be revalidated.');
    }
    return;
  }

  try {
    fs.unlinkSync(documentPlan.filePath);
  } catch {
    throw safeError('rollback-remove-failed', 'The newly created managed configuration document could not be removed safely.');
  }
}

function restoreWrittenRecords(records) {
  const failures = [];
  for (const record of [...records].reverse()) {
    if (!record.replaced) {
      continue;
    }
    try {
      restoreRecord(record);
    } catch (error) {
      failures.push(error instanceof ConfigurationWriteError ? error.code : 'rollback-failed');
    }
  }
  return failures;
}

function applyConfigurationPatch(request = {}) {
  pruneExpiredState();
  const reviewToken = isPlainObject(request) && typeof request.reviewToken === 'string' ? request.reviewToken : null;
  const plan = reviewToken ? PREPARED_PLANS.get(reviewToken) : null;
  if (!plan) {
    return publicApplyResult('rejected', [], [], [Object.freeze({ index: null, fieldId: null, status: 'rejected', code: 'review-token-unavailable' })]);
  }
  if (!matchesReviewConfirmation(request, reviewToken)) {
    return publicApplyResult(
      'rejected',
      [],
      plan.skippedSelections,
      plan.changedSelections.map((selection) => selectionWithStatus(selection, 'rejected', 'review-confirmation-required')),
    );
  }

  const staleCodes = new Map();
  try {
    for (const documentPlan of plan.documents) {
      const current = readManagedDocument(plan.workspace, documentPlan.representativeTarget);
      if (!sameDocumentState(documentPlan, current)) {
        documentPlan.resolvedPatches.forEach((candidate) => staleCodes.set(candidate.index, 'document-state-changed'));
      }
    }
  } catch (error) {
    const code = error instanceof ConfigurationWriteError ? error.code : 'document-state-unavailable';
    for (const documentPlan of plan.documents) {
      documentPlan.resolvedPatches.forEach((candidate) => staleCodes.set(candidate.index, code));
    }
  }
  if (staleCodes.size > 0) {
    return publicApplyResult(
      'rejected',
      [],
      plan.skippedSelections,
      plan.changedSelections.map((selection) => selectionWithStatus(
        selection,
        'rejected',
        staleCodes.get(selection.index) || 'transaction-not-applied',
      )),
    );
  }

  if (plan.documents.length === 0) {
    PREPARED_PLANS.delete(reviewToken);
    return publicApplyResult('applied', [], plan.skippedSelections, []);
  }

  const temporaryPaths = [];
  const records = [];
  try {
    for (const documentPlan of plan.documents) {
      temporaryPaths.push(writeTemporaryDocument(documentPlan));
    }
    for (const documentPlan of plan.documents) {
      records.push(createBackupRecord(documentPlan));
    }
    for (const documentPlan of plan.documents) {
      const current = readManagedDocument(plan.workspace, documentPlan.representativeTarget);
      if (!sameDocumentState(documentPlan, current)) {
        throw safeError('document-state-changed', 'A managed configuration document changed before the reviewed write was committed.');
      }
    }
    for (const [index, record] of records.entries()) {
      replaceTargetFromTemporary(record, temporaryPaths[index]);
      temporaryPaths[index] = null;
      const current = readManagedDocument(plan.workspace, record.documentPlan.representativeTarget);
      record.afterDigest = current.digest;
      verifyDocumentWrites(current.text, record.documentPlan.resolvedPatches);
    }
  } catch (error) {
    removeTemporaryFiles(temporaryPaths);
    const rollbackFailures = restoreWrittenRecords(records);
    if (rollbackFailures.length === 0) {
      discardFailedBackupRecords(records);
    }
    const code = error instanceof ConfigurationWriteError ? error.code : 'configuration-write-failed';
    const rejected = plan.changedSelections.map((selection) => selectionWithStatus(selection, 'rejected', code));
    const recoveryIds = rollbackFailures.length > 0 ? records.filter((record) => record.replaced).map((record) => record.backupId) : [];
    for (const record of records) {
      if (recoveryIds.includes(record.backupId)) {
        RETAINED_BACKUPS.set(record.backupId, Object.freeze({
          ...record,
          workspace: plan.workspace,
          createdAt: Date.now(),
        }));
      }
    }
    return publicApplyResult('failed', [], plan.skippedSelections, rejected, recoveryIds);
  }

  PREPARED_PLANS.delete(reviewToken);
  const rollbackIds = [];
  for (const record of records) {
    RETAINED_BACKUPS.set(record.backupId, Object.freeze({
      ...record,
      workspace: plan.workspace,
      createdAt: Date.now(),
    }));
    rollbackIds.push(record.backupId);
  }
  pruneExpiredState();
  return publicApplyResult(
    'applied',
    plan.changedSelections.map((selection) => selectionWithStatus(selection, 'applied')),
    plan.skippedSelections,
    [],
    rollbackIds,
  );
}

function matchesRollbackConfirmation(request, backupId) {
  return isPlainObject(request)
    && request.backupId === backupId
    && isPlainObject(request.confirmation)
    && request.confirmation.kind === 'reviewed-configuration-rollback'
    && request.confirmation.backupId === backupId;
}

function rollbackConfigurationPatch(request = {}) {
  pruneExpiredState();
  const backupId = isPlainObject(request) && typeof request.backupId === 'string' ? request.backupId : null;
  const record = backupId ? RETAINED_BACKUPS.get(backupId) : null;
  if (!record) {
    return Object.freeze({ status: 'rejected', backupId: null, code: 'rollback-record-unavailable' });
  }
  if (!matchesRollbackConfirmation(request, backupId)) {
    return Object.freeze({ status: 'rejected', backupId, code: 'rollback-confirmation-required' });
  }
  try {
    restoreRecord(record);
    RETAINED_BACKUPS.delete(backupId);
    try {
      if (record.backupPath && fs.existsSync(record.backupPath)) {
        fs.unlinkSync(record.backupPath);
      }
    } catch {
      // The configuration was restored; stale backup cleanup is best effort.
    }
    return Object.freeze({ status: 'rolled-back', backupId });
  } catch (error) {
    return Object.freeze({
      status: 'failed',
      backupId,
      code: error instanceof ConfigurationWriteError ? error.code : 'rollback-failed',
    });
  }
}

module.exports = Object.freeze({
  ConfigurationWriteError,
  MANAGED_DOCUMENT_IDS,
  MAX_CONFIGURATION_DOCUMENT_BYTES,
  applyConfigurationPatch,
  prepareConfigurationPatch,
  resolveConfigurationWorkspace,
  rollbackConfigurationPatch,
});
