'use strict';

/**
 * Local Minecraft server lifecycle foundation.
 *
 * This module deliberately starts only an explicitly selected local Java runtime
 * with an explicitly selected server JAR. It does not download software, parse
 * a shell command, discover Java from PATH, write server configuration, or
 * expose secrets through its event history.
 */

const { spawn: defaultSpawn } = require('node:child_process');
const { EventEmitter } = require('node:events');
const fs = require('node:fs');
const path = require('node:path');

const SERVER_KINDS = Object.freeze(['paper', 'spigot']);
const SERVER_STATES = Object.freeze([
  'stopped',
  'starting',
  'running',
  'stopping',
  'force-stopping',
  'failed',
]);

const DEFAULT_MAX_CONSOLE_EVENTS = 300;
const DEFAULT_MAX_CONSOLE_LINE_CHARACTERS = 4_096;
const DEFAULT_MAX_COMMAND_CHARACTERS = 512;
const DEFAULT_STOP_TIMEOUT_MS = 30_000;
const MIN_MEMORY_MIB = 256;
const MAX_MEMORY_MIB = 262_144;

/**
 * @typedef {'paper' | 'spigot'} ServerKind
 * @typedef {'stopped' | 'starting' | 'running' | 'stopping' | 'force-stopping' | 'failed'} ServerState
 * @typedef {object} ServerProfile
 * @property {string} id Stable UI/profile identifier.
 * @property {ServerKind} serverKind The server distribution family.
 * @property {string} javaExecutable Absolute, locally approved Java executable path.
 * @property {string} workspaceId One safe directory name beneath the configured workspace root.
 * @property {string} jarFileName One safe .jar file name beneath the profile workspace.
 * @property {number} minimumMemoryMiB Initial Java heap size in MiB.
 * @property {number} maximumMemoryMiB Maximum Java heap size in MiB.
 * @property {boolean} eulaAccepted Explicit acknowledgement required before start.
 */

class LifecycleValidationError extends Error {
  /**
   * @param {string} message
   * @param {Array<{code: string, field: string, message: string}>} issues
   */
  constructor(message, issues) {
    super(message);
    this.name = 'LifecycleValidationError';
    this.code = 'SERVER_LIFECYCLE_VALIDATION_FAILED';
    this.issues = Object.freeze(Array.isArray(issues) ? [...issues] : []);
  }
}

class LifecycleStateError extends Error {
  /**
   * @param {string} message
   * @param {ServerState} state
   */
  constructor(message, state) {
    super(message);
    this.name = 'LifecycleStateError';
    this.code = 'SERVER_LIFECYCLE_INVALID_STATE';
    this.state = state;
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function validationIssue(code, field, message) {
  return Object.freeze({ code, field, message });
}

function throwIfIssues(issues, message = 'The server profile is invalid.') {
  if (issues.length > 0) {
    throw new LifecycleValidationError(message, issues);
  }
}

function requireAbsolutePath(value, field, issues) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    issues.push(validationIssue('required', field, `${field} is required.`));
    return null;
  }

  const resolved = path.resolve(value.trim());
  if (!path.isAbsolute(value.trim())) {
    issues.push(validationIssue('absolute-path-required', field, `${field} must be an absolute path.`));
    return null;
  }

  return resolved;
}

function isWithinRoot(rootPath, candidatePath) {
  const relative = path.relative(rootPath, candidatePath);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function resolveContainedPath(rootPath, ...segments) {
  const candidate = path.resolve(rootPath, ...segments);
  if (!isWithinRoot(rootPath, candidate)) {
    throw new LifecycleValidationError('A server path escaped the configured workspace root.', [
      validationIssue('outside-workspace-root', 'workspace', 'The requested path must stay inside the configured workspace root.'),
    ]);
  }
  return candidate;
}

function canonicalPathIfPresent(filePath) {
  try {
    if (typeof fs.realpathSync.native === 'function') {
      return fs.realpathSync.native(filePath);
    }
    return fs.realpathSync(filePath);
  } catch {
    return path.resolve(filePath);
  }
}

function readExistingDirectory(directoryPath, field) {
  try {
    const stats = fs.statSync(directoryPath);
    if (!stats.isDirectory()) {
      throw new LifecycleValidationError('A required workspace path is not a directory.', [
        validationIssue('directory-required', field, `${field} must be a directory.`),
      ]);
    }
  } catch (error) {
    if (error instanceof LifecycleValidationError) {
      throw error;
    }
    throw new LifecycleValidationError('A required workspace directory is unavailable.', [
      validationIssue('directory-unavailable', field, `${field} must exist before the server can start.`),
    ]);
  }

  return canonicalPathIfPresent(directoryPath);
}

function readExistingFile(filePath, field) {
  try {
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      throw new LifecycleValidationError('A required server file is not a regular file.', [
        validationIssue('regular-file-required', field, `${field} must be a regular file.`),
      ]);
    }
  } catch (error) {
    if (error instanceof LifecycleValidationError) {
      throw error;
    }
    throw new LifecycleValidationError('A required server file is unavailable.', [
      validationIssue('file-unavailable', field, `${field} must exist before the server can start.`),
    ]);
  }

  return canonicalPathIfPresent(filePath);
}

function normalizeWorkspaceRoot(workspaceRoot) {
  const issues = [];
  const normalized = requireAbsolutePath(workspaceRoot, 'workspaceRoot', issues);
  throwIfIssues(issues, 'A controlled workspace root is required.');
  return normalized;
}

function normalizeApprovedJavaExecutables(approvedJavaExecutables) {
  if (!Array.isArray(approvedJavaExecutables)) {
    throw new LifecycleValidationError('The approved Java executable list is invalid.', [
      validationIssue('array-required', 'approvedJavaExecutables', 'approvedJavaExecutables must be an array of absolute paths.'),
    ]);
  }

  const issues = [];
  const approved = new Set();

  for (const [index, candidate] of approvedJavaExecutables.entries()) {
    const normalized = requireAbsolutePath(candidate, `approvedJavaExecutables[${index}]`, issues);
    if (normalized) {
      approved.add(canonicalPathIfPresent(normalized));
    }
  }

  throwIfIssues(issues, 'The approved Java executable list is invalid.');
  return approved;
}

function validateIdentifier(value, field, issues) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(value)) {
    issues.push(validationIssue(
      'safe-identifier-required',
      field,
      `${field} must use 1–64 letters, numbers, hyphens, or underscores and start with a letter or number.`,
    ));
    return null;
  }
  return value;
}

function validateJarFileName(value, issues) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}\.jar$/i.test(value) || value.includes('..')) {
    issues.push(validationIssue(
      'safe-jar-file-required',
      'jarFileName',
      'jarFileName must be one .jar file name without path separators or traversal segments.',
    ));
    return null;
  }
  return value;
}

function validateMemory(value, field, issues) {
  if (!Number.isInteger(value) || value < MIN_MEMORY_MIB || value > MAX_MEMORY_MIB) {
    issues.push(validationIssue(
      'memory-out-of-range',
      field,
      `${field} must be an integer between ${MIN_MEMORY_MIB} and ${MAX_MEMORY_MIB} MiB.`,
    ));
    return null;
  }
  return value;
}

function expectedJavaBasenames(platform) {
  return platform === 'win32'
    ? new Set(['java.exe'])
    : new Set(['java']);
}

function validateApprovedJavaExecutable(javaExecutable, approvedJavaExecutables, platform, issues) {
  const absoluteJava = requireAbsolutePath(javaExecutable, 'javaExecutable', issues);
  if (!absoluteJava) {
    return null;
  }

  const basename = path.basename(absoluteJava).toLowerCase();
  if (!expectedJavaBasenames(platform).has(basename)) {
    issues.push(validationIssue(
      'java-executable-name-required',
      'javaExecutable',
      `javaExecutable must name the Java console launcher (${[...expectedJavaBasenames(platform)].join(', ')}).`,
    ));
    return null;
  }

  const canonicalJava = canonicalPathIfPresent(absoluteJava);
  if (!approvedJavaExecutables.has(canonicalJava)) {
    issues.push(validationIssue(
      'java-executable-not-approved',
      'javaExecutable',
      'javaExecutable must be selected from the explicitly approved local Java executables.',
    ));
    return null;
  }

  return canonicalJava;
}

/**
 * Validate and normalize only the safe profile fields used by lifecycle launch.
 * Unknown fields are intentionally omitted from the returned profile.
 *
 * @param {unknown} profile
 * @param {{ workspaceRoot: string, approvedJavaExecutables: string[], platform?: NodeJS.Platform }} options
 * @returns {Readonly<ServerProfile>}
 */
function validateServerProfile(profile, options) {
  if (!isPlainObject(options)) {
    throw new LifecycleValidationError('Lifecycle validation requires explicit options.', [
      validationIssue('options-required', 'options', 'workspaceRoot and approvedJavaExecutables must be supplied explicitly.'),
    ]);
  }

  const workspaceRoot = normalizeWorkspaceRoot(options.workspaceRoot);
  const approvedJavaExecutables = normalizeApprovedJavaExecutables(options.approvedJavaExecutables);
  const platform = options.platform || process.platform;
  const issues = [];

  if (!isPlainObject(profile)) {
    throw new LifecycleValidationError('The server profile must be an object.', [
      validationIssue('object-required', 'profile', 'The server profile must be an object.'),
    ]);
  }

  const id = validateIdentifier(profile.id, 'id', issues);
  const workspaceId = validateIdentifier(profile.workspaceId, 'workspaceId', issues);
  const jarFileName = validateJarFileName(profile.jarFileName, issues);
  const minimumMemoryMiB = validateMemory(profile.minimumMemoryMiB, 'minimumMemoryMiB', issues);
  const maximumMemoryMiB = validateMemory(profile.maximumMemoryMiB, 'maximumMemoryMiB', issues);
  const javaExecutable = validateApprovedJavaExecutable(
    profile.javaExecutable,
    approvedJavaExecutables,
    platform,
    issues,
  );

  if (!SERVER_KINDS.includes(profile.serverKind)) {
    issues.push(validationIssue(
      'supported-server-kind-required',
      'serverKind',
      `serverKind must be one of: ${SERVER_KINDS.join(', ')}.`,
    ));
  }

  if (profile.eulaAccepted !== true) {
    issues.push(validationIssue(
      'eula-acceptance-required',
      'eulaAccepted',
      'eulaAccepted must be true before a server can start.',
    ));
  }

  if (minimumMemoryMiB !== null && maximumMemoryMiB !== null && minimumMemoryMiB > maximumMemoryMiB) {
    issues.push(validationIssue(
      'memory-order-invalid',
      'maximumMemoryMiB',
      'maximumMemoryMiB must be greater than or equal to minimumMemoryMiB.',
    ));
  }

  throwIfIssues(issues, 'The server profile is invalid.');

  // Resolve now to exercise containment even when a workspace has not been created yet.
  resolveContainedPath(workspaceRoot, workspaceId);

  return Object.freeze({
    id,
    serverKind: profile.serverKind,
    javaExecutable,
    workspaceId,
    jarFileName,
    minimumMemoryMiB,
    maximumMemoryMiB,
    eulaAccepted: true,
  });
}

/**
 * Resolve the only workspace a profile may use. The profile cannot supply an
 * arbitrary working directory: workspaceId is one safe child segment beneath
 * the root selected by the app user.
 *
 * @param {string} workspaceRoot
 * @param {string} workspaceId
 * @param {{ requireExisting?: boolean }} [options]
 */
function resolveProfileWorkspace(workspaceRoot, workspaceId, options = {}) {
  const normalizedRoot = normalizeWorkspaceRoot(workspaceRoot);
  const root = options.requireExisting ? readExistingDirectory(normalizedRoot, 'workspaceRoot') : normalizedRoot;
  const workspacePath = resolveContainedPath(root, workspaceId);

  if (!options.requireExisting) {
    return workspacePath;
  }

  const canonicalWorkspace = readExistingDirectory(workspacePath, 'profile workspace');
  if (!isWithinRoot(root, canonicalWorkspace)) {
    throw new LifecycleValidationError('The profile workspace resolves outside the configured root.', [
      validationIssue('workspace-symlink-escape', 'workspaceId', 'The profile workspace must resolve inside workspaceRoot.'),
    ]);
  }
  return canonicalWorkspace;
}

function resolveProfileJar(workspacePath, jarFileName, options = {}) {
  const jarPath = resolveContainedPath(workspacePath, jarFileName);
  if (!options.requireExisting) {
    return jarPath;
  }

  const canonicalJar = readExistingFile(jarPath, 'jarFileName');
  if (!isWithinRoot(workspacePath, canonicalJar)) {
    throw new LifecycleValidationError('The server JAR resolves outside the profile workspace.', [
      validationIssue('jar-symlink-escape', 'jarFileName', 'The server JAR must resolve inside the profile workspace.'),
    ]);
  }
  return canonicalJar;
}

function assertRunnableJava(javaExecutable, platform) {
  const issues = [];
  const canonicalJava = canonicalPathIfPresent(javaExecutable);

  try {
    const stats = fs.statSync(canonicalJava);
    if (!stats.isFile()) {
      issues.push(validationIssue('java-regular-file-required', 'javaExecutable', 'javaExecutable must be a regular file.'));
    }
  } catch {
    issues.push(validationIssue('java-unavailable', 'javaExecutable', 'The selected Java executable is unavailable.'));
  }

  if (!expectedJavaBasenames(platform).has(path.basename(canonicalJava).toLowerCase())) {
    issues.push(validationIssue('java-executable-name-required', 'javaExecutable', 'The selected file is not the Java console launcher.'));
  }

  if (platform !== 'win32') {
    try {
      fs.accessSync(canonicalJava, fs.constants.X_OK);
    } catch {
      issues.push(validationIssue('java-not-executable', 'javaExecutable', 'The selected Java executable is not executable.'));
    }
  }

  throwIfIssues(issues, 'The selected Java executable cannot be started.');
  return canonicalJava;
}

function safeChildEnvironment(parentEnvironment, platform) {
  const allowedKeys = platform === 'win32'
    ? new Set([
      'APPDATA', 'COMSPEC', 'HOMEDRIVE', 'HOMEPATH', 'LOCALAPPDATA', 'PATH', 'PATHEXT',
      'SYSTEMDRIVE', 'SYSTEMROOT', 'TEMP', 'TMP', 'USERPROFILE', 'WINDIR',
    ])
    : new Set(['HOME', 'LANG', 'LC_ALL', 'PATH', 'TMPDIR', 'TZ']);

  const environment = {};
  for (const [key, value] of Object.entries(parentEnvironment || {})) {
    if (typeof value !== 'string') {
      continue;
    }
    const normalizedKey = platform === 'win32' ? key.toUpperCase() : key;
    if (allowedKeys.has(normalizedKey)) {
      environment[key] = value;
    }
  }
  return Object.freeze(environment);
}

/**
 * Produce a direct Java argv plan. The returned values are suitable for
 * child_process.spawn only; this module never joins them into a shell string.
 *
 * @param {unknown} profile
 * @param {{
 *   workspaceRoot: string,
 *   approvedJavaExecutables: string[],
 *   platform?: NodeJS.Platform,
 *   requireExistingWorkspace?: boolean,
 *   requireExistingJar?: boolean,
 *   verifyJavaExecutable?: boolean,
 * }} options
 */
function buildServerLaunchPlan(profile, options) {
  const normalized = validateServerProfile(profile, options);
  const platform = options.platform || process.platform;
  const requireExistingWorkspace = options.requireExistingWorkspace === true;
  const requireExistingJar = options.requireExistingJar === true;
  const verifyJavaExecutable = options.verifyJavaExecutable === true;
  const workspacePath = resolveProfileWorkspace(options.workspaceRoot, normalized.workspaceId, {
    requireExisting: requireExistingWorkspace,
  });
  const jarPath = resolveProfileJar(workspacePath, normalized.jarFileName, {
    requireExisting: requireExistingJar,
  });
  const javaExecutable = verifyJavaExecutable
    ? assertRunnableJava(normalized.javaExecutable, platform)
    : normalized.javaExecutable;

  return Object.freeze({
    profile: normalized,
    command: javaExecutable,
    args: Object.freeze([
      `-Xms${normalized.minimumMemoryMiB}M`,
      `-Xmx${normalized.maximumMemoryMiB}M`,
      '-jar',
      jarPath,
      'nogui',
    ]),
    cwd: workspacePath,
    shell: false,
  });
}

function boundedInteger(value, fallback, minimum, maximum, field) {
  const selected = value === undefined ? fallback : value;
  if (!Number.isInteger(selected) || selected < minimum || selected > maximum) {
    throw new LifecycleValidationError('A lifecycle service option is outside its permitted range.', [
      validationIssue('option-out-of-range', field, `${field} must be an integer between ${minimum} and ${maximum}.`),
    ]);
  }
  return selected;
}

function stripControlCharacters(value) {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
}

function redactSensitiveAssignments(value) {
  return value
    .replace(/\b(rcon[._-]?password|password|passphrase|token|secret|authorization)\b(\s*[:=]\s*)([^\s]+)/gi, '$1$2[REDACTED]')
    .replace(/\b(authorization\s+(?:bearer|basic)\s+)([^\s]+)/gi, '$1[REDACTED]')
    .replace(/\b(ghp_[A-Za-z0-9]{8,}|github_pat_[A-Za-z0-9_]{8,})\b/gi, '[REDACTED]');
}

/**
 * Redact likely credentials and cap renderer-facing console text. The raw text
 * is never retained by this service.
 *
 * @param {unknown} value
 * @param {number} [maxCharacters]
 */
function sanitizeConsoleText(value, maxCharacters = DEFAULT_MAX_CONSOLE_LINE_CHARACTERS) {
  const safeMaximum = boundedInteger(
    maxCharacters,
    DEFAULT_MAX_CONSOLE_LINE_CHARACTERS,
    64,
    65_536,
    'maxCharacters',
  );
  const normalized = redactSensitiveAssignments(
    stripControlCharacters(String(value ?? '')).replace(/\r\n?/g, '\n'),
  );

  if (normalized.length <= safeMaximum) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(0, safeMaximum - 14))}[truncated]`;
}

function validateConsoleCommand(value, maximumCharacters) {
  if (typeof value !== 'string') {
    throw new LifecycleValidationError('A console command must be text.', [
      validationIssue('command-text-required', 'command', 'Enter one Minecraft server console command as text.'),
    ]);
  }

  if (value.includes('\r') || value.includes('\n') || value.includes('\0')) {
    throw new LifecycleValidationError('Only one console command line is allowed.', [
      validationIssue('single-line-command-required', 'command', 'Console commands cannot contain line breaks or NUL characters.'),
    ]);
  }

  const command = value.trim();
  if (command.length === 0 || command.length > maximumCharacters) {
    throw new LifecycleValidationError('The console command length is invalid.', [
      validationIssue(
        'command-length-invalid',
        'command',
        `Console commands must contain 1–${maximumCharacters} characters.`,
      ),
    ]);
  }

  if (/^(?:\/|stop(?:\s|$))/i.test(command)) {
    throw new LifecycleValidationError('Use the lifecycle controls for stopping a server.', [
      validationIssue(
        'lifecycle-command-reserved',
        'command',
        'Do not send / or stop through the console input; use the dedicated Stop control.',
      ),
    ]);
  }

  if (/[;&`<>]|&&|\|\||\$[({]/.test(command)) {
    throw new LifecycleValidationError('Shell syntax is not accepted as a console command.', [
      validationIssue(
        'shell-syntax-rejected',
        'command',
        'Console input is one Minecraft server command, not shell syntax or command chaining.',
      ),
    ]);
  }

  return command;
}

function getProcessStdin(child) {
  if (!child || !child.stdin || typeof child.stdin.write !== 'function' || child.stdin.writable === false) {
    throw new LifecycleStateError('The managed server process does not accept console input.', 'failed');
  }
  return child.stdin;
}

/**
 * Manage at most one local Java server process for one application lifecycle
 * service. It intentionally exposes no shell, network, download, or arbitrary
 * executable surfaces.
 */
class ServerLifecycleService extends EventEmitter {
  /**
   * @param {{
   *   workspaceRoot: string,
   *   approvedJavaExecutables?: string[],
   *   processFactory?: typeof defaultSpawn,
   *   platform?: NodeJS.Platform,
   *   environment?: NodeJS.ProcessEnv,
   *   maxConsoleEvents?: number,
   *   maxConsoleLineCharacters?: number,
   *   maxCommandCharacters?: number,
   *   stopTimeoutMs?: number,
   * }} options
   */
  constructor(options) {
    super();
    if (!isPlainObject(options)) {
      throw new LifecycleValidationError('ServerLifecycleService requires explicit options.', [
        validationIssue('options-required', 'options', 'workspaceRoot must be supplied explicitly.'),
      ]);
    }

    this._platform = options.platform || process.platform;
    this._workspaceRoot = normalizeWorkspaceRoot(options.workspaceRoot);
    this._approvedJavaExecutables = normalizeApprovedJavaExecutables(options.approvedJavaExecutables || []);
    this._processFactory = options.processFactory || defaultSpawn;
    if (typeof this._processFactory !== 'function') {
      throw new LifecycleValidationError('processFactory must be callable.', [
        validationIssue('function-required', 'processFactory', 'processFactory must be a child-process spawn-compatible function.'),
      ]);
    }

    this._maxConsoleEvents = boundedInteger(
      options.maxConsoleEvents,
      DEFAULT_MAX_CONSOLE_EVENTS,
      10,
      5_000,
      'maxConsoleEvents',
    );
    this._maxConsoleLineCharacters = boundedInteger(
      options.maxConsoleLineCharacters,
      DEFAULT_MAX_CONSOLE_LINE_CHARACTERS,
      64,
      65_536,
      'maxConsoleLineCharacters',
    );
    this._maxCommandCharacters = boundedInteger(
      options.maxCommandCharacters,
      DEFAULT_MAX_COMMAND_CHARACTERS,
      1,
      4_096,
      'maxCommandCharacters',
    );
    this._stopTimeoutMs = boundedInteger(
      options.stopTimeoutMs,
      DEFAULT_STOP_TIMEOUT_MS,
      1_000,
      300_000,
      'stopTimeoutMs',
    );
    this._environment = safeChildEnvironment(options.environment || process.env, this._platform);
    this._consoleEvents = [];
    this._state = 'stopped';
    this._activeChild = null;
    this._activeProfile = null;
    this._activeLaunchPlan = null;
    this._stopTimeout = null;
    this._startedAt = null;
  }

  /** @returns {ServerState} */
  get state() {
    return this._state;
  }

  get workspaceRoot() {
    return this._workspaceRoot;
  }

  get approvedJavaExecutables() {
    return Object.freeze([...this._approvedJavaExecutables]);
  }

  setApprovedJavaExecutables(approvedJavaExecutables) {
    if (this._activeChild) {
      throw new LifecycleStateError('Java selection cannot change while a server process is active.', this._state);
    }
    this._approvedJavaExecutables = normalizeApprovedJavaExecutables(approvedJavaExecutables);
    this._recordConsoleEvent('system', 'Approved Java executable selections were updated.');
  }

  /**
   * Create exactly one controlled profile workspace below the explicitly
   * supplied root. It never creates files outside that root.
   *
   * @param {unknown} profile
   */
  ensureWorkspace(profile) {
    const normalized = this.validateProfile(profile);
    fs.mkdirSync(this._workspaceRoot, { recursive: true });
    const root = readExistingDirectory(this._workspaceRoot, 'workspaceRoot');
    const workspacePath = resolveContainedPath(root, normalized.workspaceId);
    fs.mkdirSync(workspacePath, { recursive: true });
    const canonicalWorkspace = readExistingDirectory(workspacePath, 'profile workspace');
    if (!isWithinRoot(root, canonicalWorkspace)) {
      throw new LifecycleValidationError('The prepared workspace resolves outside the configured root.', [
        validationIssue('workspace-symlink-escape', 'workspaceId', 'The profile workspace must resolve inside workspaceRoot.'),
      ]);
    }
    return canonicalWorkspace;
  }

  /**
   * @param {unknown} profile
   * @returns {Readonly<ServerProfile>}
   */
  validateProfile(profile) {
    return validateServerProfile(profile, {
      workspaceRoot: this._workspaceRoot,
      approvedJavaExecutables: [...this._approvedJavaExecutables],
      platform: this._platform,
    });
  }

  /**
   * Return the exact argv plan without invoking a process. A preview may point
   * at a not-yet-created workspace/JAR; start() performs the stricter checks.
   *
   * @param {unknown} profile
   */
  getLaunchPreview(profile) {
    return buildServerLaunchPlan(profile, {
      workspaceRoot: this._workspaceRoot,
      approvedJavaExecutables: [...this._approvedJavaExecutables],
      platform: this._platform,
      requireExistingWorkspace: false,
      requireExistingJar: false,
      verifyJavaExecutable: false,
    });
  }

  /**
   * Start one explicitly configured local Java server. There is no shell path,
   * no arbitrary executable field, and no second concurrent launch.
   *
   * @param {unknown} profile
   */
  start(profile) {
    if (!['stopped', 'failed'].includes(this._state) || this._activeChild) {
      throw new LifecycleStateError('A server can start only when this lifecycle service is stopped.', this._state);
    }

    const launchPlan = buildServerLaunchPlan(profile, {
      workspaceRoot: this._workspaceRoot,
      approvedJavaExecutables: [...this._approvedJavaExecutables],
      platform: this._platform,
      requireExistingWorkspace: true,
      requireExistingJar: true,
      verifyJavaExecutable: true,
    });

    this._setState('starting', 'start-requested');
    this._activeProfile = launchPlan.profile;
    this._activeLaunchPlan = launchPlan;
    this._startedAt = new Date().toISOString();
    this._recordConsoleEvent('system', `Starting ${launchPlan.profile.serverKind} server profile ${launchPlan.profile.id}.`);

    let child;
    try {
      child = this._processFactory(launchPlan.command, [...launchPlan.args], {
        cwd: launchPlan.cwd,
        env: this._environment,
        shell: false,
        windowsHide: true,
        detached: false,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch (error) {
      this._handleProcessError(error);
      throw error;
    }

    if (!child || typeof child.once !== 'function' || typeof child.on !== 'function') {
      const error = new LifecycleValidationError('processFactory returned an invalid child process.', [
        validationIssue('child-process-required', 'processFactory', 'processFactory must return a ChildProcess-compatible object.'),
      ]);
      this._handleProcessError(error);
      throw error;
    }

    this._activeChild = child;
    this._attachProcessHandlers(child);
    return this.getSnapshot();
  }

  stop() {
    if (!this._activeChild || !['starting', 'running'].includes(this._state)) {
      throw new LifecycleStateError('A graceful stop requires an active starting or running server.', this._state);
    }

    const stdin = getProcessStdin(this._activeChild);
    this._setState('stopping', 'graceful-stop-requested');
    stdin.write('stop\n');
    this._recordConsoleEvent('command', 'stop');
    this._scheduleStopTimeout();
    return this.getSnapshot();
  }

  forceStop() {
    if (!this._activeChild || !['starting', 'running', 'stopping'].includes(this._state)) {
      throw new LifecycleStateError('A force stop requires an active server process.', this._state);
    }

    this._setState('force-stopping', 'force-stop-requested');
    this._clearStopTimeout();
    this._recordConsoleEvent('system', 'Force stop requested for the managed server process.');
    const accepted = this._activeChild.kill('SIGKILL');
    if (!accepted) {
      this._recordConsoleEvent('system', 'The managed server process did not accept the force-stop signal.');
    }
    return this.getSnapshot();
  }

  /**
   * Send one bounded Minecraft server console command directly to stdin. It is
   * never interpreted by a local shell and does not support command chaining.
   *
   * @param {unknown} command
   */
  sendConsoleCommand(command) {
    if (!this._activeChild || this._state !== 'running') {
      throw new LifecycleStateError('Console input requires a running server.', this._state);
    }
    const normalized = validateConsoleCommand(command, this._maxCommandCharacters);
    const stdin = getProcessStdin(this._activeChild);
    stdin.write(`${normalized}\n`);
    return this._recordConsoleEvent('command', normalized);
  }

  getConsoleHistory() {
    return Object.freeze(this._consoleEvents.map((event) => Object.freeze({ ...event })));
  }

  getSnapshot() {
    const activeProcess = this._activeChild;
    return Object.freeze({
      state: this._state,
      profileId: this._activeProfile ? this._activeProfile.id : null,
      serverKind: this._activeProfile ? this._activeProfile.serverKind : null,
      workspacePath: this._activeLaunchPlan ? this._activeLaunchPlan.cwd : null,
      pid: activeProcess && Number.isInteger(activeProcess.pid) ? activeProcess.pid : null,
      startedAt: this._startedAt,
      consoleEventCount: this._consoleEvents.length,
    });
  }

  _attachProcessHandlers(child) {
    child.once('spawn', () => {
      if (this._activeChild !== child) {
        return;
      }
      this._setState('running', 'process-spawned');
      this._recordConsoleEvent('system', 'Managed server process started.');
    });

    if (child.stdout && typeof child.stdout.on === 'function') {
      child.stdout.on('data', (chunk) => this._recordOutput('stdout', chunk));
    }
    if (child.stderr && typeof child.stderr.on === 'function') {
      child.stderr.on('data', (chunk) => this._recordOutput('stderr', chunk));
    }

    child.once('error', (error) => {
      if (this._activeChild === child) {
        this._handleProcessError(error);
      }
    });

    child.once('exit', (code, signal) => {
      if (this._activeChild !== child) {
        return;
      }
      const exitDescription = signal
        ? `Managed server process exited after signal ${sanitizeConsoleText(signal, 64)}.`
        : `Managed server process exited with code ${Number.isInteger(code) ? code : 'unknown'}.`;
      this._recordConsoleEvent('system', exitDescription);
      this._finishProcess('process-exited');
    });
  }

  _recordOutput(stream, chunk) {
    const text = sanitizeConsoleText(chunk, this._maxConsoleLineCharacters);
    for (const line of text.split('\n')) {
      if (line.length > 0) {
        this._recordConsoleEvent(stream, line);
      }
    }
  }

  _recordConsoleEvent(stream, text) {
    const event = Object.freeze({
      at: new Date().toISOString(),
      stream,
      text: sanitizeConsoleText(text, this._maxConsoleLineCharacters),
    });
    this._consoleEvents.push(event);
    if (this._consoleEvents.length > this._maxConsoleEvents) {
      this._consoleEvents.splice(0, this._consoleEvents.length - this._maxConsoleEvents);
    }
    this.emit('console-event', event);
    return event;
  }

  _setState(nextState, reason) {
    if (!SERVER_STATES.includes(nextState)) {
      throw new LifecycleStateError('An unsupported lifecycle state was requested.', this._state);
    }
    this._state = nextState;
    this.emit('state', Object.freeze({ ...this.getSnapshot(), reason }));
  }

  _scheduleStopTimeout() {
    this._clearStopTimeout();
    this._stopTimeout = setTimeout(() => {
      if (this._state !== 'stopping' || !this._activeChild) {
        return;
      }
      this._recordConsoleEvent(
        'system',
        `Graceful stop is still pending after ${this._stopTimeoutMs} ms; use Force stop only if the server will not exit.`,
      );
      this.emit('stop-timeout', this.getSnapshot());
    }, this._stopTimeoutMs);
    this._stopTimeout.unref?.();
  }

  _clearStopTimeout() {
    if (this._stopTimeout) {
      clearTimeout(this._stopTimeout);
      this._stopTimeout = null;
    }
  }

  _handleProcessError(error) {
    this._recordConsoleEvent('system', `Managed server process failed: ${sanitizeConsoleText(error && error.message, 512)}`);
    this._clearStopTimeout();
    this._activeChild = null;
    this._activeProfile = null;
    this._activeLaunchPlan = null;
    this._startedAt = null;
    this._setState('failed', 'process-error');
  }

  _finishProcess(reason) {
    this._clearStopTimeout();
    this._activeChild = null;
    this._activeProfile = null;
    this._activeLaunchPlan = null;
    this._startedAt = null;
    this._setState('stopped', reason);
  }
}

module.exports = {
  DEFAULT_MAX_COMMAND_CHARACTERS,
  DEFAULT_MAX_CONSOLE_EVENTS,
  DEFAULT_MAX_CONSOLE_LINE_CHARACTERS,
  DEFAULT_STOP_TIMEOUT_MS,
  LifecycleStateError,
  LifecycleValidationError,
  MAX_MEMORY_MIB,
  MIN_MEMORY_MIB,
  SERVER_KINDS,
  SERVER_STATES,
  ServerLifecycleService,
  buildServerLaunchPlan,
  resolveProfileWorkspace,
  sanitizeConsoleText,
  validateServerProfile,
};
