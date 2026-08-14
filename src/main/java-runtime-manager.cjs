'use strict';

/**
 * Java runtime discovery and review-only setup planning for Minecraft servers.
 *
 * This module deliberately has no installation or server-launch capability. It
 * accepts a path supplied by a native file/folder picker, discovers only a
 * bounded set of conventional locations, validates a chosen executable through
 * `java -version` without a shell, and produces a plan for a later explicit
 * user-confirmation flow. Callers must never convert the plan into an install
 * merely because it was generated.
 */

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');

const fsp = fs.promises;

const PAPER_RUNTIME_REQUIREMENT_SOURCE = Object.freeze({
  title: 'Paper getting started: Java requirements',
  url: 'https://docs.papermc.io/paper/getting-started/',
  retrievedFrom: 'official-paper-documentation',
  terminology: 'recommended Java version',
});

const PAPER_RUNTIME_TARGET_CATALOG_SCHEMA_VERSION = 1;
const PAPER_RUNTIME_TARGET_CATALOG_LIMITS = Object.freeze({
  maxGroups: 32,
  maxVersionsPerGroup: 24,
  maxVersions: 96,
  maxGroupLength: 16,
  maxVersionLength: 32,
});

/**
 * This is a checked-in snapshot of the numeric version-key projection of the
 * official Paper Downloads Service project catalog. It is deliberately not a
 * build catalog: it contains no build numbers, download URLs, or install
 * instructions. The adapter below validates the envelope before any version
 * is handed to the Paper requirement resolver.
 */
const PAPER_RUNTIME_TARGET_CATALOG_SOURCE = Object.freeze({
  schemaVersion: PAPER_RUNTIME_TARGET_CATALOG_SCHEMA_VERSION,
  source: Object.freeze({
    kind: 'official-paper-downloads-service-v3-project',
    title: 'Paper Downloads Service project catalog',
    url: 'https://fill.papermc.io/v3/projects/paper',
    snapshotDate: '2026-08-13',
    selection: 'numeric-version-keys-only',
  }),
  project: Object.freeze({
    id: 'paper',
    name: 'Paper',
  }),
  versions: Object.freeze({
    '26.2': Object.freeze(['26.2']),
    '26.1': Object.freeze(['26.1.2', '26.1.1']),
    '1.21': Object.freeze([
      '1.21.11',
      '1.21.10',
      '1.21.9',
      '1.21.8',
      '1.21.7',
      '1.21.6',
      '1.21.5',
      '1.21.4',
      '1.21.3',
      '1.21.1',
      '1.21',
    ]),
    '1.20': Object.freeze(['1.20.6', '1.20.5', '1.20.4', '1.20.2', '1.20.1', '1.20']),
    '1.19': Object.freeze(['1.19.4', '1.19.3', '1.19.2', '1.19.1', '1.19']),
    '1.18': Object.freeze(['1.18.2', '1.18.1', '1.18']),
    '1.17': Object.freeze(['1.17.1', '1.17']),
    '1.16': Object.freeze(['1.16.5', '1.16.4', '1.16.3', '1.16.2', '1.16.1']),
    '1.15': Object.freeze(['1.15.2', '1.15.1', '1.15']),
    '1.14': Object.freeze(['1.14.4', '1.14.3', '1.14.2', '1.14.1', '1.14']),
    '1.13': Object.freeze(['1.13.2', '1.13.1', '1.13']),
    '1.12': Object.freeze(['1.12.2', '1.12.1', '1.12']),
    '1.11': Object.freeze(['1.11.2']),
    '1.10': Object.freeze(['1.10.2']),
    '1.9': Object.freeze(['1.9.4']),
    '1.8': Object.freeze(['1.8.8']),
    '1.7': Object.freeze(['1.7.10']),
  }),
});

const PAPER_RUNTIME_TARGET_CATALOG_DIAGNOSTICS = Object.freeze({
  'catalog-source-must-be-a-record': 'The bundled Paper target catalog is not a record.',
  'catalog-source-has-unknown-fields': 'The bundled Paper target catalog has unknown fields.',
  'catalog-schema-version-unsupported': 'The bundled Paper target catalog uses an unsupported schema version.',
  'catalog-source-metadata-invalid': 'The bundled Paper target catalog has invalid source metadata.',
  'catalog-project-identity-invalid': 'The bundled Paper target catalog is not for the Paper project.',
  'catalog-version-groups-invalid': 'The bundled Paper target catalog has invalid version groups.',
  'catalog-version-group-limit-exceeded': 'The bundled Paper target catalog exceeds its version-group limit.',
  'catalog-version-group-key-invalid': 'The bundled Paper target catalog has an invalid version-group key.',
  'catalog-version-list-invalid': 'The bundled Paper target catalog has an invalid version list.',
  'catalog-version-list-limit-exceeded': 'The bundled Paper target catalog exceeds its per-group version limit.',
  'catalog-version-entry-invalid': 'The bundled Paper target catalog has an invalid version entry.',
  'catalog-version-entry-limit-exceeded': 'The bundled Paper target catalog exceeds its total version limit.',
  'catalog-version-group-mismatch': 'The bundled Paper target catalog has a version in the wrong group.',
  'catalog-version-duplicate': 'The bundled Paper target catalog contains a duplicate version.',
  'catalog-empty': 'The bundled Paper target catalog contains no verified numeric versions.',
  'catalog-source-read-failed': 'The bundled Paper target catalog could not be read safely.',
});

const PAPER_JAVA_INSTALL_GUIDE =
  'https://docs.papermc.io/misc/java-install/';

const DEFAULT_DISCOVERY_LIMITS = Object.freeze({
  maxRoots: 18,
  maxChildrenPerRoot: 24,
  maxCandidates: 64,
});

const DEFAULT_PROBE_LIMITS = Object.freeze({
  timeoutMs: 8_000,
  maxOutputBytes: 16 * 1024,
});

const PAPER_JAVA_RULES = Object.freeze([
  Object.freeze({
    id: 'paper-1.7.10-to-1.11',
    from: Object.freeze([1, 7, 10]),
    before: Object.freeze([1, 12, 0]),
    requiredJavaMajor: 8,
  }),
  Object.freeze({
    id: 'paper-1.12-to-1.16.4',
    from: Object.freeze([1, 12, 0]),
    before: Object.freeze([1, 16, 5]),
    requiredJavaMajor: 11,
  }),
  Object.freeze({
    id: 'paper-1.16.5',
    exact: Object.freeze([1, 16, 5]),
    requiredJavaMajor: 16,
  }),
  Object.freeze({
    id: 'paper-1.17-to-1.19',
    from: Object.freeze([1, 17, 0]),
    before: Object.freeze([1, 20, 0]),
    requiredJavaMajor: 17,
  }),
  Object.freeze({
    id: 'paper-1.20-to-1.21.11',
    from: Object.freeze([1, 20, 0]),
    through: Object.freeze([1, 21, 11]),
    requiredJavaMajor: 21,
  }),
  Object.freeze({
    id: 'paper-26.1-and-newer',
    from: Object.freeze([26, 1, 0]),
    requiredJavaMajor: 25,
  }),
]);

function executableNameForPlatform(platform = process.platform) {
  return platform === 'win32' ? 'java.exe' : 'java';
}

function pathApiForPlatform(platform = process.platform) {
  return platform === 'win32' ? path.win32 : path.posix;
}

function isAbsolutePathForPlatform(value, platform = process.platform) {
  return typeof value === 'string' && pathApiForPlatform(platform).isAbsolute(value);
}

function normalizedLimits(input = {}) {
  return {
    maxRoots: boundedWholeNumber(
      input.maxRoots,
      DEFAULT_DISCOVERY_LIMITS.maxRoots,
      1,
      64,
    ),
    maxChildrenPerRoot: boundedWholeNumber(
      input.maxChildrenPerRoot,
      DEFAULT_DISCOVERY_LIMITS.maxChildrenPerRoot,
      1,
      128,
    ),
    maxCandidates: boundedWholeNumber(
      input.maxCandidates,
      DEFAULT_DISCOVERY_LIMITS.maxCandidates,
      1,
      256,
    ),
  };
}

function normalizedProbeLimits(input = {}) {
  return {
    timeoutMs: boundedWholeNumber(
      input.timeoutMs,
      DEFAULT_PROBE_LIMITS.timeoutMs,
      500,
      30_000,
    ),
    maxOutputBytes: boundedWholeNumber(
      input.maxOutputBytes,
      DEFAULT_PROBE_LIMITS.maxOutputBytes,
      1_024,
      128 * 1024,
    ),
  };
}

function boundedWholeNumber(value, fallback, min, max) {
  if (!Number.isInteger(value)) {
    return fallback;
  }

  return Math.min(Math.max(value, min), max);
}

function environmentPath(env, name) {
  const value = env && env[name];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function normalizedFilesystemPath(value) {
  return path.normalize(path.resolve(value));
}

function candidateKey(executablePath, platform) {
  const resolved = normalizedFilesystemPath(executablePath);
  return platform === 'win32' ? resolved.toLowerCase() : resolved;
}

function candidatePathsFromSelection(selectedPath, platform) {
  if (!isAbsolutePathForPlatform(selectedPath, platform)) {
    return [];
  }

  const pathApi = pathApiForPlatform(platform);
  const normalized = normalizedFilesystemPath(selectedPath);
  const executable = executableNameForPlatform(platform);
  const leaf = pathApi.basename(normalized).toLowerCase();
  const binName = 'bin';

  if (leaf === executable.toLowerCase()) {
    return [normalized];
  }

  if (leaf === binName) {
    return [path.join(normalized, executable)];
  }

  return [path.join(normalized, 'bin', executable)];
}

/**
 * Returns a fixed, shallow list of Java home roots. It intentionally avoids
 * scanning PATH, drives, the registry, or arbitrary user folders.
 */
function knownJavaRoots({ platform = process.platform, env = process.env, homeDir = os.homedir() } = {}) {
  const roots = [];
  const add = (rootPath, source, childSegments = ['bin']) => {
    if (typeof rootPath === 'string' && rootPath.trim()) {
      roots.push({ rootPath: rootPath.trim(), source, childSegments });
    }
  };

  if (platform === 'win32') {
    const localAppData = environmentPath(env, 'LOCALAPPDATA');
    const programDirectories = [
      environmentPath(env, 'ProgramW6432'),
      environmentPath(env, 'ProgramFiles'),
      environmentPath(env, 'ProgramFiles(x86)'),
    ].filter(Boolean);

    if (localAppData) {
      for (const vendor of ['Java', 'Eclipse Adoptium', 'Amazon Corretto', 'Microsoft', 'Zulu', 'BellSoft']) {
        add(path.join(localAppData, 'Programs', vendor), 'current-user-known-location');
      }
    }

    add(path.join(homeDir, '.jdks'), 'current-user-known-location');

    for (const programDirectory of programDirectories) {
      for (const vendor of ['Java', 'Eclipse Adoptium', 'Amazon Corretto', 'Microsoft', 'Zulu', 'BellSoft']) {
        add(path.join(programDirectory, vendor), 'system-known-location');
      }
    }
  } else if (platform === 'darwin') {
    add(path.join(homeDir, '.jdks'), 'current-user-known-location');
    add(path.join(homeDir, 'Library', 'Java', 'JavaVirtualMachines'), 'current-user-known-location', [
      'Contents',
      'Home',
      'bin',
    ]);
    add('/Library/Java/JavaVirtualMachines', 'system-known-location', [
      'Contents',
      'Home',
      'bin',
    ]);
  } else {
    add(path.join(homeDir, '.jdks'), 'current-user-known-location');
    add(path.join(homeDir, '.local', 'share', 'jdks'), 'current-user-known-location');
    add('/usr/lib/jvm', 'system-known-location');
    add('/opt/java', 'system-known-location');
  }

  return roots;
}

const MAX_RUNTIME_METADATA_NAME_LENGTH = 96;
const MAX_RUNTIME_METADATA_SIZE = 4 * 1024 * 1024 * 1024;

function boundedRuntimeMetadataName(value) {
  if (typeof value !== 'string' || !value || value.length > MAX_RUNTIME_METADATA_NAME_LENGTH) {
    return null;
  }
  if (/[/\\\u0000-\u001f\u007f]/.test(value)) {
    return null;
  }
  return value;
}

function runtimeMetadataForExecutable(executablePath, stat, platform) {
  const pathApi = pathApiForPlatform(platform);
  const executableName = boundedRuntimeMetadataName(pathApi.basename(executablePath));
  const executableParent = pathApi.dirname(executablePath);
  const parentName = pathApi.basename(executableParent);
  const runtimeHomeName = boundedRuntimeMetadataName(
    parentName.toLowerCase() === 'bin'
      ? pathApi.basename(pathApi.dirname(executableParent))
      : parentName,
  );
  const fileSizeBytes = Number.isSafeInteger(stat.size)
    && stat.size >= 0
    && stat.size <= MAX_RUNTIME_METADATA_SIZE
    ? stat.size
    : null;
  const modifiedAt = Number.isFinite(stat.mtimeMs)
    ? new Date(stat.mtimeMs).toISOString()
    : null;

  return Object.freeze({
    executableName,
    runtimeHomeName,
    fileSizeBytes,
    modifiedAt,
  });
}

async function inspectExecutable(executablePath, platform) {
  try {
    const stat = await fsp.stat(executablePath);
    if (!stat.isFile()) {
      return null;
    }

    // Windows executable permission bits are not meaningful. On POSIX, avoid
    // presenting an ordinary data file as a selectable Java executable.
    if (platform !== 'win32' && (stat.mode & 0o111) === 0) {
      return null;
    }

    return {
      stat,
      metadata: runtimeMetadataForExecutable(executablePath, stat, platform),
    };
  } catch {
    return null;
  }
}

async function regularExecutable(executablePath, platform) {
  return Boolean(await inspectExecutable(executablePath, platform));
}

async function immediateChildJavaPaths(root, platform, maxChildren) {
  const executable = executableNameForPlatform(platform);
  const results = [];

  try {
    const children = await fsp.readdir(root.rootPath, { withFileTypes: true });
    for (const child of children
      .filter((entry) => entry.isDirectory())
      .sort((left, right) => left.name.localeCompare(right.name))
      .slice(0, maxChildren)) {
      results.push(path.join(root.rootPath, child.name, ...root.childSegments, executable));
    }
  } catch {
    // An unavailable system directory is a normal discovery outcome. It is not
    // surfaced as an operating-system error or used as a reason to broaden the
    // search to an unbounded location.
  }

  return results;
}

function addCandidatePath(registry, executablePath, source, priority, platform, maxCandidates) {
  if (registry.size >= maxCandidates || typeof executablePath !== 'string') {
    return;
  }

  const key = candidateKey(executablePath, platform);
  if (!registry.has(key)) {
    registry.set(key, {
      executablePath: normalizedFilesystemPath(executablePath),
      source,
      priority,
    });
  }
}

/**
 * Discover Java executables without recursion. `selectedPath` is expected to
 * originate from a native file/folder chooser; a relative path is rejected so
 * the host PATH cannot silently change what will be validated.
 */
async function discoverJavaCandidates(options = {}) {
  const platform = options.platform || process.platform;
  const env = options.env || process.env;
  const homeDir = options.homeDir || os.homedir();
  const limits = normalizedLimits(options.limits);
  const executable = executableNameForPlatform(platform);
  const pending = new Map();
  const diagnostics = [];
  const selectedPath = options.selectedPath;

  if (typeof selectedPath === 'string' && selectedPath.trim()) {
    if (!isAbsolutePathForPlatform(selectedPath.trim(), platform)) {
      diagnostics.push({
        code: 'selected-path-must-be-absolute',
        source: 'user-selected',
      });
    } else {
      for (const candidate of candidatePathsFromSelection(selectedPath.trim(), platform)) {
        addCandidatePath(pending, candidate, 'user-selected', 0, platform, limits.maxCandidates);
      }
    }
  }

  for (const [environmentVariable, priority] of [
    ['JAVA_HOME', 1],
    ['JDK_HOME', 2],
  ]) {
    const home = environmentPath(env, environmentVariable);
    if (home) {
      addCandidatePath(
        pending,
        path.join(home, 'bin', executable),
        environmentVariable,
        priority,
        platform,
        limits.maxCandidates,
      );
    }
  }

  const roots = knownJavaRoots({ platform, env, homeDir }).slice(0, limits.maxRoots);
  for (let rootIndex = 0; rootIndex < roots.length && pending.size < limits.maxCandidates; rootIndex += 1) {
    const root = roots[rootIndex];
    const priority = 10 + rootIndex;
    addCandidatePath(
      pending,
      path.join(root.rootPath, ...root.childSegments, executable),
      root.source,
      priority,
      platform,
      limits.maxCandidates,
    );

    const childPaths = await immediateChildJavaPaths(root, platform, limits.maxChildrenPerRoot);
    for (const childPath of childPaths) {
      addCandidatePath(pending, childPath, root.source, priority, platform, limits.maxCandidates);
    }
  }

  const discovered = [];
  for (const candidate of pending.values()) {
    const inspection = await inspectExecutable(candidate.executablePath, platform);
    if (inspection) {
      discovered.push({
        ...candidate,
        metadata: inspection.metadata,
      });
    }
  }

  discovered.sort((left, right) => {
    if (left.priority !== right.priority) {
      return left.priority - right.priority;
    }
    return left.executablePath.localeCompare(right.executablePath);
  });

  const candidates = discovered.map((candidate, index) => ({
    id: `java-candidate-${index + 1}`,
    executablePath: candidate.executablePath,
    source: candidate.source,
    selectedByUser: candidate.source === 'user-selected',
    metadata: candidate.metadata,
  }));

  if (typeof selectedPath === 'string' && selectedPath.trim() && !candidates.some((candidate) => candidate.selectedByUser)) {
    diagnostics.push({
      code: 'selected-java-not-found-or-not-executable',
      source: 'user-selected',
    });
  }

  return {
    candidates,
    diagnostics,
    limits,
    searchedLocations: {
      javaHome: Boolean(environmentPath(env, 'JAVA_HOME')),
      jdkHome: Boolean(environmentPath(env, 'JDK_HOME')),
      knownRootCount: roots.length,
      pathSearchUsed: false,
      recursiveSearchUsed: false,
    },
  };
}

/**
 * Select only a candidate that this discovery result created. This lets the UI
 * bind a rich candidate picker to stable IDs rather than an arbitrary command
 * text field.
 */
function selectDiscoveredJavaCandidate(discovery, candidateId) {
  if (!discovery || !Array.isArray(discovery.candidates) || typeof candidateId !== 'string') {
    return null;
  }

  const candidate = discovery.candidates.find((entry) => entry.id === candidateId);
  return candidate ? { ...candidate } : null;
}

function normalizeNumericVersion(input, { maxComponents = 3 } = {}) {
  if (typeof input !== 'string' && typeof input !== 'number') {
    return null;
  }

  const componentLimit = boundedWholeNumber(maxComponents, 3, 1, 4);
  const raw = String(input).trim();
  const matcher = new RegExp(`^(\\d+)(?:\\.(\\d+)){0,${componentLimit - 1}}$`);
  if (!matcher.test(raw)) {
    return null;
  }

  const fragments = raw.split('.');
  if (fragments.length > componentLimit) {
    return null;
  }

  const components = fragments.map((fragment) => Number.parseInt(fragment, 10));
  if (components.some((component) => !Number.isSafeInteger(component) || component < 0)) {
    return null;
  }

  while (components.length < componentLimit) {
    components.push(0);
  }

  return {
    raw,
    components,
    normalized: components.join('.'),
  };
}

function isCanonicalNumericVersionText(value, maxComponents = 3) {
  if (typeof value !== 'string') {
    return false;
  }

  const fragments = value.split('.');
  if (fragments.length < 1 || fragments.length > maxComponents) {
    return false;
  }

  return fragments.every((fragment) => /^\d+$/.test(fragment)
    && (fragment === '0' || !fragment.startsWith('0')));
}

function isPlainRecord(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  try {
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  } catch {
    return false;
  }
}

function hasExactKeys(record, expectedKeys) {
  if (!isPlainRecord(record)) {
    return false;
  }

  const actualKeys = Object.keys(record);
  return actualKeys.length === expectedKeys.length
    && expectedKeys.every((key) => actualKeys.includes(key));
}

function boundedCatalogText(value, maxLength) {
  return typeof value === 'string'
    && value.length > 0
    && value.length <= maxLength
    && value.trim() === value
    && !/[\u0000-\u001f\u007f]/.test(value);
}

function invalidPaperRuntimeTargetCatalog(diagnosticCode) {
  return Object.freeze({
    status: 'invalid',
    schemaVersion: null,
    source: null,
    versions: Object.freeze([]),
    versionCount: 0,
    diagnosticCode,
    diagnosticMessage: PAPER_RUNTIME_TARGET_CATALOG_DIAGNOSTICS[diagnosticCode]
      || 'The bundled Paper target catalog was rejected before it could be used.',
  });
}

/**
 * Validate the checked-in Paper Downloads Service project-version snapshot.
 * This accepts only the deliberately reduced source shape used by this
 * source-only foundation: the official project identity and numeric version
 * keys grouped by their official version-group key. Any malformed or unknown
 * entry invalidates the complete catalog instead of being silently skipped.
 */
function normalizePaperRuntimeTargetCatalog(source = PAPER_RUNTIME_TARGET_CATALOG_SOURCE) {
  try {
    if (!isPlainRecord(source)) {
      return invalidPaperRuntimeTargetCatalog('catalog-source-must-be-a-record');
    }

    if (!hasExactKeys(source, ['schemaVersion', 'source', 'project', 'versions'])) {
      return invalidPaperRuntimeTargetCatalog('catalog-source-has-unknown-fields');
    }

    if (source.schemaVersion !== PAPER_RUNTIME_TARGET_CATALOG_SCHEMA_VERSION) {
      return invalidPaperRuntimeTargetCatalog('catalog-schema-version-unsupported');
    }

    const metadata = source.source;
    if (!hasExactKeys(metadata, ['kind', 'title', 'url', 'snapshotDate', 'selection'])
      || metadata.kind !== 'official-paper-downloads-service-v3-project'
      || metadata.title !== 'Paper Downloads Service project catalog'
      || metadata.url !== 'https://fill.papermc.io/v3/projects/paper'
      || !/^\d{4}-\d{2}-\d{2}$/.test(metadata.snapshotDate)
      || metadata.selection !== 'numeric-version-keys-only'
      || !Object.values(metadata).every((value) => boundedCatalogText(value, 240))) {
      return invalidPaperRuntimeTargetCatalog('catalog-source-metadata-invalid');
    }

    if (!hasExactKeys(source.project, ['id', 'name'])
      || source.project.id !== 'paper'
      || source.project.name !== 'Paper') {
      return invalidPaperRuntimeTargetCatalog('catalog-project-identity-invalid');
    }

    if (!isPlainRecord(source.versions)) {
      return invalidPaperRuntimeTargetCatalog('catalog-version-groups-invalid');
    }

    const groupKeys = Object.keys(source.versions);
    if (groupKeys.length === 0) {
      return invalidPaperRuntimeTargetCatalog('catalog-empty');
    }
    if (groupKeys.length > PAPER_RUNTIME_TARGET_CATALOG_LIMITS.maxGroups) {
      return invalidPaperRuntimeTargetCatalog('catalog-version-group-limit-exceeded');
    }

    const versions = [];
    const seenVersions = new Set();
    for (const groupKey of groupKeys) {
      if (!boundedCatalogText(groupKey, PAPER_RUNTIME_TARGET_CATALOG_LIMITS.maxGroupLength)) {
        return invalidPaperRuntimeTargetCatalog('catalog-version-group-key-invalid');
      }

      const group = normalizeNumericVersion(groupKey, { maxComponents: 2 });
      if (!group || group.raw !== groupKey || group.normalized !== groupKey || group.components[0] < 1) {
        return invalidPaperRuntimeTargetCatalog('catalog-version-group-key-invalid');
      }

      const groupEntries = source.versions[groupKey];
      if (!Array.isArray(groupEntries) || groupEntries.length === 0) {
        return invalidPaperRuntimeTargetCatalog('catalog-version-list-invalid');
      }
      if (groupEntries.length > PAPER_RUNTIME_TARGET_CATALOG_LIMITS.maxVersionsPerGroup) {
        return invalidPaperRuntimeTargetCatalog('catalog-version-list-limit-exceeded');
      }
      if (versions.length + groupEntries.length > PAPER_RUNTIME_TARGET_CATALOG_LIMITS.maxVersions) {
        return invalidPaperRuntimeTargetCatalog('catalog-version-entry-limit-exceeded');
      }

      for (const entry of groupEntries) {
        if (!boundedCatalogText(entry, PAPER_RUNTIME_TARGET_CATALOG_LIMITS.maxVersionLength)) {
          return invalidPaperRuntimeTargetCatalog('catalog-version-entry-invalid');
        }

        const normalized = normalizeNumericVersion(entry, { maxComponents: 3 });
        const prefix = normalized && normalized.components.slice(0, group.components.length);
        if (!normalized
          || normalized.raw !== entry
          || !isCanonicalNumericVersionText(entry, 3)
          || normalized.components[0] < 1
          || !prefix
          || compareVersionComponents(prefix, group.components) !== 0) {
          return invalidPaperRuntimeTargetCatalog('catalog-version-group-mismatch');
        }

        if (seenVersions.has(entry)) {
          return invalidPaperRuntimeTargetCatalog('catalog-version-duplicate');
        }

        seenVersions.add(entry);
        versions.push(entry);
      }
    }

    versions.sort((left, right) => {
      const leftVersion = normalizeNumericVersion(left);
      const rightVersion = normalizeNumericVersion(right);
      return compareVersionComponents(rightVersion.components, leftVersion.components);
    });

    return Object.freeze({
      status: 'available',
      schemaVersion: PAPER_RUNTIME_TARGET_CATALOG_SCHEMA_VERSION,
      source: Object.freeze({
        title: metadata.title,
        url: metadata.url,
        snapshotDate: metadata.snapshotDate,
        selection: metadata.selection,
      }),
      versions: Object.freeze(versions),
      versionCount: versions.length,
      diagnosticCode: null,
      diagnosticMessage: null,
    });
  } catch {
    return invalidPaperRuntimeTargetCatalog('catalog-source-read-failed');
  }
}

function getPaperRuntimeTargetCatalog() {
  return normalizePaperRuntimeTargetCatalog();
}

function compareVersionComponents(left, right) {
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const difference = (left[index] || 0) - (right[index] || 0);
    if (difference !== 0) {
      return difference;
    }
  }
  return 0;
}

/**
 * Normalizes Java feature releases such as `1.8.0_432`, `17.0.12+7-LTS`, and
 * `25`. The returned `major` is Java's feature release, so legacy `1.8` is 8.
 */
function normalizeJavaVersion(versionText) {
  if (typeof versionText !== 'string') {
    return null;
  }

  const raw = versionText.trim();
  const match = raw.match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:\.(\d+))?(?:[_+.-].*)?$/);
  if (!match) {
    return null;
  }

  const components = [match[1], match[2], match[3], match[4]]
    .filter((value) => value !== undefined)
    .map((value) => Number.parseInt(value, 10));

  if (components.some((component) => !Number.isSafeInteger(component) || component < 0)) {
    return null;
  }

  const major = components[0] === 1 && components.length > 1 ? components[1] : components[0];
  if (major < 1) {
    return null;
  }

  return {
    raw,
    major,
    components,
    normalized: components.join('.'),
    legacyOnePrefix: components[0] === 1 && components.length > 1,
  };
}

function parseJavaVersionOutput(output) {
  if (typeof output !== 'string') {
    return null;
  }

  const match = output.match(
    /\b(?:openjdk|java)\s+(?:runtime\s+environment\s+)?(?:version\s+)?["']?(\d+(?:\.\d+){0,3}(?:[_+.-][0-9A-Za-z._+-]+)?)["']?/i,
  ) || output.match(/\bversion\s+["']?(\d+(?:\.\d+){0,3}(?:[_+.-][0-9A-Za-z._+-]+)?)["']?/i);

  return match ? normalizeJavaVersion(match[1]) : null;
}

function candidateExecutablePath(candidate) {
  if (typeof candidate === 'string') {
    return candidate;
  }

  return candidate && typeof candidate.executablePath === 'string'
    ? candidate.executablePath
    : null;
}

function validJavaExecutablePath(executablePath, platform) {
  if (!isAbsolutePathForPlatform(executablePath, platform)) {
    return false;
  }

  const pathApi = pathApiForPlatform(platform);
  return pathApi.basename(executablePath).toLowerCase() === executableNameForPlatform(platform).toLowerCase();
}

function terminateProcess(child) {
  try {
    child.kill('SIGTERM');
  } catch {
    // There is no safe recovery action here. The bounded probe result will be
    // reported as incomplete rather than claimed as a valid Java runtime.
  }
}

/**
 * Validate one already-selected Java executable with the fixed argv
 * `["-version"]`. This never opens a shell, captures at most the configured
 * byte limit in memory, and deliberately discards raw process output after
 * extracting a version so it cannot leak into logs or exports.
 */
async function probeJavaExecutable(candidate, options = {}) {
  const platform = options.platform || process.platform;
  const limits = normalizedProbeLimits(options.limits);
  const executablePath = candidateExecutablePath(candidate);

  if (!validJavaExecutablePath(executablePath, platform)) {
    return {
      status: 'invalid-executable-path',
      diagnosticCode: 'java-executable-must-be-an-absolute-java-binary',
    };
  }

  if (!(await regularExecutable(executablePath, platform))) {
    return {
      status: 'missing',
      executablePath,
      diagnosticCode: 'java-executable-not-found-or-not-executable',
    };
  }

  return new Promise((resolve) => {
    let finished = false;
    let outputBytes = 0;
    let exceededOutputLimit = false;
    let timedOut = false;
    const outputChunks = [];
    let timer = null;
    let child;

    const finish = (result) => {
      if (finished) {
        return;
      }
      finished = true;
      if (timer) {
        clearTimeout(timer);
      }
      resolve(result);
    };

    const collectOutput = (chunk) => {
      if (finished || exceededOutputLimit || !Buffer.isBuffer(chunk)) {
        return;
      }

      if (outputBytes + chunk.length > limits.maxOutputBytes) {
        exceededOutputLimit = true;
        terminateProcess(child);
        finish({
          status: 'output-limit-exceeded',
          executablePath,
          diagnosticCode: 'java-version-output-exceeded-byte-limit',
          maxOutputBytes: limits.maxOutputBytes,
        });
        return;
      }

      outputBytes += chunk.length;
      outputChunks.push(chunk);
    };

    try {
      child = spawn(executablePath, ['-version'], {
        shell: false,
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch {
      return finish({
        status: 'launch-failed',
        executablePath,
        diagnosticCode: 'java-version-process-could-not-start',
      });
    }

    child.stdout.on('data', collectOutput);
    child.stderr.on('data', collectOutput);
    child.once('error', () => {
      finish({
        status: 'launch-failed',
        executablePath,
        diagnosticCode: 'java-version-process-could-not-start',
      });
    });
    child.once('close', (exitCode, signal) => {
      if (finished) {
        return;
      }

      if (timedOut) {
        return finish({
          status: 'timeout',
          executablePath,
          diagnosticCode: 'java-version-process-timed-out',
          timeoutMs: limits.timeoutMs,
        });
      }

      if (exceededOutputLimit) {
        return finish({
          status: 'output-limit-exceeded',
          executablePath,
          diagnosticCode: 'java-version-output-exceeded-byte-limit',
          maxOutputBytes: limits.maxOutputBytes,
        });
      }

      if (exitCode !== 0) {
        return finish({
          status: 'nonzero-exit',
          executablePath,
          exitCode,
          signal: signal || null,
          diagnosticCode: 'java-version-process-returned-nonzero',
        });
      }

      const version = parseJavaVersionOutput(Buffer.concat(outputChunks, outputBytes).toString('utf8'));
      if (!version) {
        return finish({
          status: 'unrecognized-version',
          executablePath,
          diagnosticCode: 'java-version-output-did-not-contain-a-recognized-version',
        });
      }

      return finish({
        status: 'valid',
        executablePath,
        version,
        outputBytes,
      });
    });

    timer = setTimeout(() => {
      timedOut = true;
      terminateProcess(child);
      finish({
        status: 'timeout',
        executablePath,
        diagnosticCode: 'java-version-process-timed-out',
        timeoutMs: limits.timeoutMs,
      });
    }, limits.timeoutMs);
    timer.unref?.();
  });
}

function catalogVersionString(entry) {
  if (typeof entry === 'string' || typeof entry === 'number') {
    return String(entry);
  }

  if (entry && typeof entry === 'object') {
    for (const field of ['key', 'version', 'minecraftVersion']) {
      if (typeof entry[field] === 'string' || typeof entry[field] === 'number') {
        return String(entry[field]);
      }
    }
  }

  return null;
}

function catalogMatchForVersion(target, officialCatalogVersions) {
  if (!Array.isArray(officialCatalogVersions)) {
    return null;
  }

  for (const entry of officialCatalogVersions) {
    const version = catalogVersionString(entry);
    const normalized = normalizeNumericVersion(version);
    if (normalized && compareVersionComponents(normalized.components, target.components) === 0) {
      return {
        version,
        normalized,
      };
    }
  }

  return null;
}

function ruleForPaperVersion(components) {
  for (const rule of PAPER_JAVA_RULES) {
    if (rule.exact && compareVersionComponents(components, rule.exact) === 0) {
      return rule;
    }

    if (rule.from && compareVersionComponents(components, rule.from) >= 0) {
      if (rule.before && compareVersionComponents(components, rule.before) >= 0) {
        continue;
      }
      if (rule.through && compareVersionComponents(components, rule.through) > 0) {
        continue;
      }
      return rule;
    }
  }

  return null;
}

/**
 * Resolve a Paper runtime requirement only after the selected target is found
 * in the official Paper catalog that the caller already fetched. The Paper
 * documentation labels its historic matrix as "Recommended Java Version", so
 * this result preserves that wording rather than misrepresenting it as a
 * cross-version universal hard minimum.
 */
function resolvePaperJavaRequirement({ serverKind, targetVersion, officialCatalogVersions } = {}) {
  const normalizedServerKind = typeof serverKind === 'string' ? serverKind.trim().toLowerCase() : '';
  if (normalizedServerKind !== 'paper') {
    return {
      status: 'unverified',
      reason: normalizedServerKind === 'spigot'
        ? 'spigot-java-requirement-not-sourced-by-paper-documentation'
        : 'paper-server-kind-required',
      source: PAPER_RUNTIME_REQUIREMENT_SOURCE,
    };
  }

  const target = normalizeNumericVersion(targetVersion);
  if (!target) {
    return {
      status: 'unverified',
      reason: 'invalid-paper-target-version',
      source: PAPER_RUNTIME_REQUIREMENT_SOURCE,
    };
  }

  const catalogMatch = catalogMatchForVersion(target, officialCatalogVersions);
  if (!catalogMatch) {
    return {
      status: 'unverified',
      reason: 'target-not-present-in-official-paper-catalog',
      requestedTargetVersion: target.raw,
      normalizedTargetVersion: target.normalized,
      source: PAPER_RUNTIME_REQUIREMENT_SOURCE,
    };
  }

  const rule = ruleForPaperVersion(target.components);
  if (!rule) {
    return {
      status: 'unverified',
      reason: 'target-outside-documented-paper-java-matrix',
      targetVersion: catalogMatch.version,
      normalizedTargetVersion: target.normalized,
      source: PAPER_RUNTIME_REQUIREMENT_SOURCE,
    };
  }

  return {
    status: 'resolved',
    targetVersion: catalogMatch.version,
    normalizedTargetVersion: target.normalized,
    requiredJavaMajor: rule.requiredJavaMajor,
    ruleId: rule.id,
    recommendationKind: 'official-paper-recommended-java-version',
    source: PAPER_RUNTIME_REQUIREMENT_SOURCE,
  };
}

/**
 * Produce an honest compatibility status. A newer major is deliberately a
 * review state, not an automatic success: the Paper FAQ cautions that
 * unsupported, early-access, and internal Java releases can be problematic.
 */
function assessJavaCompatibility(requirement, probe) {
  if (!requirement || requirement.status !== 'resolved') {
    return {
      status: 'unverified',
      reason: 'paper-runtime-requirement-is-not-resolved',
      requiredJavaMajor: null,
      selectedJavaMajor: probe && probe.version ? probe.version.major : null,
    };
  }

  if (!probe) {
    return {
      status: 'missing',
      reason: 'no-java-runtime-has-been-selected-and-validated',
      requiredJavaMajor: requirement.requiredJavaMajor,
      selectedJavaMajor: null,
    };
  }

  if (probe.status !== 'valid' || !probe.version) {
    return {
      status: probe.status === 'missing' ? 'missing' : 'unverified',
      reason: 'selected-java-runtime-could-not-be-validated',
      requiredJavaMajor: requirement.requiredJavaMajor,
      selectedJavaMajor: null,
      probeStatus: probe.status,
    };
  }

  if (probe.version.major === requirement.requiredJavaMajor) {
    return {
      status: 'compatible',
      reason: 'selected-java-major-matches-the-paper-recommendation',
      requiredJavaMajor: requirement.requiredJavaMajor,
      selectedJavaMajor: probe.version.major,
      executablePath: probe.executablePath,
    };
  }

  if (probe.version.major < requirement.requiredJavaMajor) {
    return {
      status: 'mismatch',
      reason: 'selected-java-major-is-older-than-the-paper-recommendation',
      requiredJavaMajor: requirement.requiredJavaMajor,
      selectedJavaMajor: probe.version.major,
      executablePath: probe.executablePath,
    };
  }

  return {
    status: 'needs-review',
    reason: 'selected-java-major-is-newer-than-the-paper-recommendation',
    requiredJavaMajor: requirement.requiredJavaMajor,
    selectedJavaMajor: probe.version.major,
    executablePath: probe.executablePath,
  };
}

function installationRoutes(requiredJavaMajor, platform) {
  const shared = {
    requiredJavaMajor,
    distribution: 'Amazon Corretto',
    fullRuntimePreferred: true,
    headlessVariantRecommended: false,
    guideUrl: PAPER_JAVA_INSTALL_GUIDE,
    executionState: 'not-executed',
    requiresExplicitUserIntent: true,
  };

  if (platform === 'win32') {
    return [
      {
        ...shared,
        id: 'windows-package-manager',
        label: 'Windows Package Manager',
        availability: 'must-be-verified-after-user-confirmation',
        packageSearch: `Amazon Corretto JDK ${requiredJavaMajor}`,
      },
      {
        ...shared,
        id: 'official-runtime-guide',
        label: 'Official runtime installation guide',
        availability: 'available-for-user-review',
      },
    ];
  }

  return [
    {
      ...shared,
      id: 'official-runtime-guide',
      label: 'Official runtime installation guide',
      availability: 'available-for-user-review',
    },
  ];
}

/**
 * Return only review data. This function has no child-process, shell, network,
 * registry, environment, filesystem-write, credential, or installer side
 * effects. An integration layer must collect a separate explicit user action
 * before it attempts any route described here.
 */
function createJavaSetupPlan({ requirement, compatibility, platform = process.platform } = {}) {
  if (!requirement || requirement.status !== 'resolved') {
    return {
      status: 'blocked',
      executionState: 'not-executed',
      mutationState: 'no-system-state-changed',
      requiresExplicitUserIntent: true,
      reason: 'paper-target-must-be-verified-before-a-java-setup-plan-is-offered',
      routes: [],
    };
  }

  if (compatibility && compatibility.status === 'compatible') {
    return {
      status: 'not-needed',
      executionState: 'not-executed',
      mutationState: 'no-system-state-changed',
      requiresExplicitUserIntent: false,
      reason: 'selected-java-runtime-matches-the-paper-recommendation',
      requiredJavaMajor: requirement.requiredJavaMajor,
      routes: [],
    };
  }

  return {
    status: 'review-required',
    executionState: 'not-executed',
    mutationState: 'no-system-state-changed',
    requiresExplicitUserIntent: true,
    installationMayRunAutomatically: false,
    requiredJavaMajor: requirement.requiredJavaMajor,
    targetVersion: requirement.targetVersion,
    compatibilityStatus: compatibility ? compatibility.status : 'missing',
    source: PAPER_RUNTIME_REQUIREMENT_SOURCE,
    routes: installationRoutes(requirement.requiredJavaMajor, platform),
    nextUserFacingAction: 'Show a rich route selector and a separate explicit confirmation control.',
  };
}

/**
 * Convenience composition for an integration layer: it probes only the
 * already-selected candidate and then returns a review-only plan. It never
 * chooses a candidate, installs a runtime, or starts a server.
 */
async function assessSelectedJavaRuntime({
  serverKind,
  targetVersion,
  officialCatalogVersions,
  selectedCandidate,
  platform = process.platform,
  probeLimits,
} = {}) {
  const requirement = resolvePaperJavaRequirement({
    serverKind,
    targetVersion,
    officialCatalogVersions,
  });
  const probe = selectedCandidate
    ? await probeJavaExecutable(selectedCandidate, { platform, limits: probeLimits })
    : null;
  const compatibility = assessJavaCompatibility(requirement, probe);

  return {
    requirement,
    probe,
    compatibility,
    setupPlan: createJavaSetupPlan({ requirement, compatibility, platform }),
  };
}

module.exports = {
  DEFAULT_DISCOVERY_LIMITS,
  DEFAULT_PROBE_LIMITS,
  PAPER_JAVA_INSTALL_GUIDE,
  PAPER_JAVA_RULES,
  PAPER_RUNTIME_REQUIREMENT_SOURCE,
  PAPER_RUNTIME_TARGET_CATALOG_LIMITS,
  PAPER_RUNTIME_TARGET_CATALOG_SCHEMA_VERSION,
  PAPER_RUNTIME_TARGET_CATALOG_SOURCE,
  assessJavaCompatibility,
  assessSelectedJavaRuntime,
  candidatePathsFromSelection,
  compareVersionComponents,
  createJavaSetupPlan,
  discoverJavaCandidates,
  executableNameForPlatform,
  getPaperRuntimeTargetCatalog,
  knownJavaRoots,
  normalizeJavaVersion,
  normalizeNumericVersion,
  normalizePaperRuntimeTargetCatalog,
  parseJavaVersionOutput,
  probeJavaExecutable,
  resolvePaperJavaRequirement,
  selectDiscoveredJavaCandidate,
};
