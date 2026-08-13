'use strict';

/**
 * Unsigned Squirrel.Windows update-planning foundation.
 *
 * This module has no ambient network, filesystem, process, installer, restart,
 * or renderer capability. A future main-process integration may inject a very
 * small transport and native-update adapter. The renderer must receive only
 * getSnapshot() data and call intent methods that accept no URLs, commands, or
 * package paths.
 */

const { EventEmitter } = require('node:events');
const { TextDecoder } = require('node:util');

const RELEASE_FEED_POLICY_SCHEMA_VERSION = 1;
const RELEASE_MANIFEST_SCHEMA_VERSION = 1;
const UPDATE_STAGE_PLAN_SCHEMA_VERSION = 1;

const UPDATE_STATES = Object.freeze([
  'idle',
  'checking',
  'up-to-date',
  'available',
  'downloading',
  'cancelled',
  'ready-to-restart',
  'failed',
]);

const DEFAULT_RELEASE_LIMITS = Object.freeze({
  fetchTimeoutMs: 10_000,
  maxManifestBytes: 256 * 1024,
  maxManifestEntries: 1_024,
  maxManifestLines: 1_280,
  maxLineBytes: 1_024,
  maxPackageBytes: 8 * 1024 * 1024 * 1024,
  maxPackageFileNameCharacters: 180,
  maxRedirectDirectories: 8,
});

const ABSOLUTE_RELEASE_LIMITS = Object.freeze({
  fetchTimeoutMs: 60_000,
  maxManifestBytes: 2 * 1024 * 1024,
  maxManifestEntries: 8_192,
  maxManifestLines: 10_240,
  maxLineBytes: 8_192,
  maxPackageBytes: 128 * 1024 * 1024 * 1024,
  maxPackageFileNameCharacters: 240,
  maxRedirectDirectories: 16,
});

const UNSIGNED_ARTIFACT_WARNING =
  'This update package is unsigned. Windows may show an unknown-publisher or SmartScreen warning.';

const FULL_PACKAGE_SUFFIX = '-full.nupkg';
const DELTA_PACKAGE_SUFFIX = '-delta.nupkg';
const RELEASE_LINE_PATTERN = /^([A-Fa-f0-9]{40}) ([A-Za-z0-9][A-Za-z0-9._-]*) ([1-9][0-9]*)$/;
const SAFE_PACKAGE_PREFIX_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,95}$/;
const SAFE_PACKAGE_FILE_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*\.nupkg$/;
const SQUIRREL_VERSION_PATTERN = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
const MAX_VERSION_COMPONENT = 2_147_483_647;

const feedPolicyBrands = new WeakSet();
const manifestBrands = new WeakSet();
const selectionBrands = new WeakSet();
const stagePlanBrands = new WeakSet();

class UpdateValidationError extends Error {
  /**
   * @param {string} code
   * @param {string} message
   */
  constructor(code, message) {
    super(message);
    this.name = 'UpdateValidationError';
    this.code = code;
  }
}

class UpdateStateError extends Error {
  /**
   * @param {string} state
   * @param {string} message
   */
  constructor(state, message) {
    super(message);
    this.name = 'UpdateStateError';
    this.code = 'invalid-update-state';
    this.state = state;
  }
}

function isPlainRecord(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function deepFreeze(value, seen = new WeakSet()) {
  if (!value || typeof value !== 'object' || seen.has(value)) {
    return value;
  }
  seen.add(value);
  for (const child of Object.values(value)) {
    deepFreeze(child, seen);
  }
  return Object.freeze(value);
}

function assertPlainRecord(value, field) {
  if (!isPlainRecord(value)) {
    throw new UpdateValidationError('object-required', `${field} must be a plain object.`);
  }
  return value;
}

function assertAllowedFields(value, field, allowedFields) {
  for (const key of Object.keys(value)) {
    if (!allowedFields.has(key)) {
      throw new UpdateValidationError('unknown-field', `${field}.${key} is not supported.`);
    }
  }
}

function boundedInteger(value, field, fallback, minimum, maximum) {
  if (value === undefined) {
    return fallback;
  }
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new UpdateValidationError(
      'integer-out-of-range',
      `${field} must be an integer from ${minimum} through ${maximum}.`,
    );
  }
  return value;
}

function normalizeReleaseLimits(value) {
  if (value === undefined) {
    return deepFreeze({ ...DEFAULT_RELEASE_LIMITS });
  }
  assertPlainRecord(value, 'limits');
  assertAllowedFields(value, 'limits', new Set(Object.keys(DEFAULT_RELEASE_LIMITS)));

  const normalized = {};
  for (const [key, fallback] of Object.entries(DEFAULT_RELEASE_LIMITS)) {
    const minimum = key === 'maxPackageBytes' ? 1 : 1;
    normalized[key] = boundedInteger(value[key], `limits.${key}`, fallback, minimum, ABSOLUTE_RELEASE_LIMITS[key]);
  }

  if (normalized.maxManifestLines < normalized.maxManifestEntries) {
    throw new UpdateValidationError(
      'manifest-line-limit-too-small',
      'limits.maxManifestLines must allow at least limits.maxManifestEntries lines.',
    );
  }
  if (normalized.maxLineBytes > normalized.maxManifestBytes) {
    throw new UpdateValidationError(
      'manifest-line-limit-too-large',
      'limits.maxLineBytes cannot exceed limits.maxManifestBytes.',
    );
  }

  return deepFreeze(normalized);
}

function requireNonEmptyString(value, field, maximumLength) {
  if (typeof value !== 'string' || value.length === 0 || value.length > maximumLength || value.trim() !== value) {
    throw new UpdateValidationError('string-required', `${field} must be a trimmed string with at most ${maximumLength} characters.`);
  }
  return value;
}

function normalizeReleaseDirectoryUrl(value, field) {
  const raw = requireNonEmptyString(value, field, 2_048);
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new UpdateValidationError('invalid-release-directory-url', `${field} must be an absolute HTTPS URL.`);
  }

  if (url.protocol !== 'https:') {
    throw new UpdateValidationError('https-required', `${field} must use HTTPS.`);
  }
  if (url.username || url.password) {
    throw new UpdateValidationError('url-credentials-forbidden', `${field} must not include URL credentials.`);
  }
  if (url.search || url.hash) {
    throw new UpdateValidationError('url-query-or-fragment-forbidden', `${field} must not include a query or fragment.`);
  }
  if (!url.pathname.endsWith('/')) {
    throw new UpdateValidationError('release-directory-trailing-slash-required', `${field} must name one directory and end with a slash.`);
  }
  if (url.pathname.includes('%') || raw.includes('\\')) {
    throw new UpdateValidationError('encoded-or-backslash-path-forbidden', `${field} must not use encoded or backslash path segments.`);
  }
  if (/(?:^|\/)\.{1,2}(?=\/|$)/.test(raw)) {
    throw new UpdateValidationError('release-directory-traversal-forbidden', `${field} must not contain path traversal segments.`);
  }

  const segments = url.pathname.split('/').filter(Boolean);
  if (segments.some((segment) => segment === '.' || segment === '..' || segment.toLowerCase() === 'latest')) {
    throw new UpdateValidationError('mutable-or-traversal-release-directory', `${field} must be a pinned directory without latest or traversal segments.`);
  }

  return url.href;
}

function appendSafeFileName(directoryUrl, fileName) {
  const url = new URL(directoryUrl);
  url.pathname = `${url.pathname}${fileName}`;
  url.search = '';
  url.hash = '';
  return url.href;
}

function normalizePackagePrefix(value) {
  const prefix = requireNonEmptyString(value, 'packageNamePrefix', 96);
  if (!SAFE_PACKAGE_PREFIX_PATTERN.test(prefix) || prefix.includes('..')) {
    throw new UpdateValidationError('invalid-package-prefix', 'packageNamePrefix must use a safe package-name grammar.');
  }
  return prefix;
}

function createReleaseFeedPolicy(input) {
  assertPlainRecord(input, 'release feed policy');
  assertAllowedFields(input, 'release feed policy', new Set([
    'releaseDirectoryUrl',
    'packageNamePrefix',
    'approvedRedirectReleaseDirectories',
    'limits',
  ]));

  const releaseDirectoryUrl = normalizeReleaseDirectoryUrl(input.releaseDirectoryUrl, 'releaseDirectoryUrl');
  const packageNamePrefix = normalizePackagePrefix(input.packageNamePrefix);
  const limits = normalizeReleaseLimits(input.limits);

  const rawRedirectDirectories = input.approvedRedirectReleaseDirectories === undefined
    ? []
    : input.approvedRedirectReleaseDirectories;
  if (!Array.isArray(rawRedirectDirectories) || rawRedirectDirectories.length > limits.maxRedirectDirectories) {
    throw new UpdateValidationError(
      'invalid-redirect-directory-list',
      `approvedRedirectReleaseDirectories must contain at most ${limits.maxRedirectDirectories} entries.`,
    );
  }

  const approvedReleaseDirectories = [releaseDirectoryUrl];
  for (const [index, candidate] of rawRedirectDirectories.entries()) {
    const directory = normalizeReleaseDirectoryUrl(candidate, `approvedRedirectReleaseDirectories[${index}]`);
    if (!approvedReleaseDirectories.includes(directory)) {
      approvedReleaseDirectories.push(directory);
    }
  }

  const policy = deepFreeze({
    schemaVersion: RELEASE_FEED_POLICY_SCHEMA_VERSION,
    releaseDirectoryUrl,
    releasesUrl: appendSafeFileName(releaseDirectoryUrl, 'RELEASES'),
    approvedReleaseDirectories,
    approvedReleasesUrls: approvedReleaseDirectories.map((directory) => appendSafeFileName(directory, 'RELEASES')),
    packageNamePrefix,
    limits,
  });
  feedPolicyBrands.add(policy);
  return policy;
}

function assertReleaseFeedPolicy(policy) {
  if (!feedPolicyBrands.has(policy)) {
    throw new UpdateValidationError('trusted-release-feed-policy-required', 'Use createReleaseFeedPolicy() for this operation.');
  }
  return policy;
}

function normalizeSquirrelVersion(value, field = 'version') {
  const raw = requireNonEmptyString(value, field, 160);
  const match = SQUIRREL_VERSION_PATTERN.exec(raw);
  if (!match) {
    throw new UpdateValidationError('invalid-squirrel-version', `${field} must use a complete Squirrel-compatible semantic version.`);
  }

  const numericParts = [match[1], match[2], match[3]].map((part) => Number(part));
  if (numericParts.some((part) => !Number.isSafeInteger(part) || part > MAX_VERSION_COMPONENT)) {
    throw new UpdateValidationError('squirrel-version-component-out-of-range', `${field} has a numeric component outside the supported range.`);
  }

  const prerelease = match[4]
    ? match[4].split('.').map((identifier) => {
      if (/^[0-9]+$/.test(identifier) && identifier.length > 1 && identifier.startsWith('0')) {
        throw new UpdateValidationError('squirrel-prerelease-leading-zero', `${field} contains a numeric prerelease identifier with a leading zero.`);
      }
      return identifier;
    })
    : [];

  const normalized = `${numericParts.join('.')}${prerelease.length > 0 ? `-${prerelease.join('.')}` : ''}`;
  return deepFreeze({
    raw,
    normalized,
    major: numericParts[0],
    minor: numericParts[1],
    patch: numericParts[2],
    prerelease,
  });
}

function compareNormalizedSquirrelVersions(left, right) {
  for (const component of ['major', 'minor', 'patch']) {
    if (left[component] !== right[component]) {
      return left[component] > right[component] ? 1 : -1;
    }
  }

  if (left.prerelease.length === 0 || right.prerelease.length === 0) {
    if (left.prerelease.length === right.prerelease.length) {
      return 0;
    }
    return left.prerelease.length === 0 ? 1 : -1;
  }

  const count = Math.max(left.prerelease.length, right.prerelease.length);
  for (let index = 0; index < count; index += 1) {
    const leftIdentifier = left.prerelease[index];
    const rightIdentifier = right.prerelease[index];
    if (leftIdentifier === undefined) {
      return -1;
    }
    if (rightIdentifier === undefined) {
      return 1;
    }
    if (leftIdentifier === rightIdentifier) {
      continue;
    }
    const leftNumeric = /^[0-9]+$/.test(leftIdentifier);
    const rightNumeric = /^[0-9]+$/.test(rightIdentifier);
    if (leftNumeric && rightNumeric) {
      const leftNumber = Number(leftIdentifier);
      const rightNumber = Number(rightIdentifier);
      return leftNumber > rightNumber ? 1 : -1;
    }
    if (leftNumeric !== rightNumeric) {
      return leftNumeric ? -1 : 1;
    }
    return leftIdentifier > rightIdentifier ? 1 : -1;
  }

  return 0;
}

function compareSquirrelVersions(left, right) {
  return compareNormalizedSquirrelVersions(
    normalizeSquirrelVersion(left, 'left version'),
    normalizeSquirrelVersion(right, 'right version'),
  );
}

function assertSafePackageFileName(value, policy, field = 'package filename') {
  const fileName = requireNonEmptyString(value, field, policy.limits.maxPackageFileNameCharacters);
  if (!SAFE_PACKAGE_FILE_NAME_PATTERN.test(fileName)
    || fileName.includes('..')
    || fileName.includes('/')
    || fileName.includes('\\')
    || fileName.includes('%')
    || fileName.includes('?')
    || fileName.includes('#')) {
    throw new UpdateValidationError('unsafe-package-filename', `${field} must be a safe .nupkg basename.`);
  }
  return fileName;
}

function classifySquirrelPackageFileName(fileName, policy) {
  const safeFileName = assertSafePackageFileName(fileName, policy);
  const expectedPrefix = `${policy.packageNamePrefix}-`;

  if (safeFileName.endsWith(FULL_PACKAGE_SUFFIX) && safeFileName.startsWith(expectedPrefix)) {
    const versionText = safeFileName.slice(expectedPrefix.length, -FULL_PACKAGE_SUFFIX.length);
    return deepFreeze({
      kind: 'compatible-full',
      fileName: safeFileName,
      version: normalizeSquirrelVersion(versionText, 'package version'),
    });
  }

  if (safeFileName.endsWith(DELTA_PACKAGE_SUFFIX)) {
    return deepFreeze({ kind: 'delta', fileName: safeFileName, version: null });
  }
  if (safeFileName.endsWith(FULL_PACKAGE_SUFFIX)) {
    return deepFreeze({ kind: 'foreign-full', fileName: safeFileName, version: null });
  }
  return deepFreeze({ kind: 'other-nupkg', fileName: safeFileName, version: null });
}

function asBoundedByteBuffer(value, maximumBytes, field) {
  let bytes;
  if (Buffer.isBuffer(value)) {
    bytes = value;
  } else if (value instanceof Uint8Array) {
    bytes = Buffer.from(value.buffer, value.byteOffset, value.byteLength);
  } else {
    throw new UpdateValidationError('binary-response-required', `${field} must be a Buffer or Uint8Array.`);
  }
  if (bytes.byteLength > maximumBytes) {
    throw new UpdateValidationError('response-too-large', `${field} exceeds its configured byte limit.`);
  }
  return bytes;
}

function decodeUtf8Manifest(bytes) {
  try {
    return new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(bytes);
  } catch {
    throw new UpdateValidationError('invalid-manifest-utf8', 'RELEASES must be valid UTF-8.');
  }
}

function parseReleasesManifest(body, policy) {
  assertReleaseFeedPolicy(policy);
  const bytes = asBoundedByteBuffer(body, policy.limits.maxManifestBytes, 'RELEASES response');
  const text = decodeUtf8Manifest(bytes);
  if (/\r(?!\n)/.test(text)) {
    throw new UpdateValidationError('invalid-manifest-line-ending', 'RELEASES may use LF or CRLF line endings, not bare CR.');
  }

  const rawLines = text.split(/\r\n|\n/);
  if (rawLines.length > policy.limits.maxManifestLines) {
    throw new UpdateValidationError('manifest-too-many-lines', 'RELEASES exceeded its configured line limit.');
  }

  const entries = [];
  const seenFileNames = new Set();
  const seenCompatibleVersions = new Set();

  for (const [lineIndex, line] of rawLines.entries()) {
    if (line === '') {
      continue;
    }
    if (Buffer.byteLength(line, 'utf8') > policy.limits.maxLineBytes) {
      throw new UpdateValidationError('manifest-line-too-large', `RELEASES line ${lineIndex + 1} exceeds its configured size limit.`);
    }
    const match = RELEASE_LINE_PATTERN.exec(line);
    if (!match) {
      throw new UpdateValidationError('invalid-manifest-line', `RELEASES line ${lineIndex + 1} is not a canonical package entry.`);
    }

    const [, sha1Text, fileNameText, sizeText] = match;
    const fileName = assertSafePackageFileName(fileNameText, policy, `RELEASES line ${lineIndex + 1} filename`);
    if (seenFileNames.has(fileName)) {
      throw new UpdateValidationError('duplicate-manifest-filename', `RELEASES lists ${fileName} more than once.`);
    }
    seenFileNames.add(fileName);

    const expectedLengthBytes = Number(sizeText);
    if (!Number.isSafeInteger(expectedLengthBytes)
      || expectedLengthBytes <= 0
      || expectedLengthBytes > policy.limits.maxPackageBytes) {
      throw new UpdateValidationError('invalid-package-length', `RELEASES line ${lineIndex + 1} contains an unsupported package length.`);
    }

    const packageInfo = classifySquirrelPackageFileName(fileName, policy);
    if (packageInfo.kind === 'compatible-full') {
      if (seenCompatibleVersions.has(packageInfo.version.normalized)) {
        throw new UpdateValidationError('duplicate-compatible-package-version', `RELEASES lists version ${packageInfo.version.normalized} more than once.`);
      }
      seenCompatibleVersions.add(packageInfo.version.normalized);
    }

    entries.push(deepFreeze({
      sha1: sha1Text.toLowerCase(),
      fileName,
      expectedLengthBytes,
      packageKind: packageInfo.kind,
      version: packageInfo.version,
    }));

    if (entries.length > policy.limits.maxManifestEntries) {
      throw new UpdateValidationError('manifest-too-many-entries', 'RELEASES exceeded its configured package-entry limit.');
    }
  }

  const compatibleFullPackages = entries.filter((entry) => entry.packageKind === 'compatible-full');
  const parsed = deepFreeze({
    schemaVersion: RELEASE_MANIFEST_SCHEMA_VERSION,
    packageNamePrefix: policy.packageNamePrefix,
    entries,
    compatibleFullPackages,
  });
  manifestBrands.add(parsed);
  return parsed;
}

function assertParsedManifest(manifest, policy) {
  if (!manifestBrands.has(manifest) || manifest.packageNamePrefix !== policy.packageNamePrefix) {
    throw new UpdateValidationError('parsed-manifest-required', 'Use parseReleasesManifest() with the same trusted release-feed policy.');
  }
  return manifest;
}

function selectNewestFullPackage(currentVersion, manifest, policy) {
  assertReleaseFeedPolicy(policy);
  assertParsedManifest(manifest, policy);
  const current = normalizeSquirrelVersion(currentVersion, 'current version');
  const newerPackages = manifest.compatibleFullPackages.filter(
    (entry) => compareNormalizedSquirrelVersions(entry.version, current) > 0,
  );

  const candidate = newerPackages.reduce((newest, entry) => {
    if (!newest || compareNormalizedSquirrelVersions(entry.version, newest.version) > 0) {
      return entry;
    }
    return newest;
  }, null);

  const selection = deepFreeze({
    kind: candidate ? 'update-available' : 'up-to-date',
    currentVersion: current,
    candidate,
    downgradeAllowed: false,
    fullPackagesOnly: true,
  });
  selectionBrands.add(selection);
  return selection;
}

function assertSelection(selection, policy) {
  if (!selectionBrands.has(selection)) {
    throw new UpdateValidationError('update-selection-required', 'Use selectNewestFullPackage() for this operation.');
  }
  if (selection.candidate) {
    assertSafePackageFileName(selection.candidate.fileName, policy);
  }
  return selection;
}

function normalizeObservedSha1(value) {
  if (typeof value !== 'string' || !/^[A-Fa-f0-9]{40}$/.test(value)) {
    return null;
  }
  return value.toLowerCase();
}

function verifyPackageMetadata(candidate, observed) {
  if (!candidate || typeof candidate !== 'object') {
    throw new UpdateValidationError('package-candidate-required', 'A selected full package is required for metadata verification.');
  }
  if (!isPlainRecord(observed)) {
    return deepFreeze({ ok: false, code: 'observed-metadata-required' });
  }
  if (typeof candidate.sha1 !== 'string' || !/^[a-f0-9]{40}$/.test(candidate.sha1)
    || !Number.isSafeInteger(candidate.expectedLengthBytes) || candidate.expectedLengthBytes <= 0) {
    return deepFreeze({ ok: false, code: 'expected-metadata-unavailable' });
  }

  const observedSha1 = normalizeObservedSha1(observed.sha1);
  if (!Number.isSafeInteger(observed.lengthBytes) || observed.lengthBytes < 0 || !observedSha1) {
    return deepFreeze({ ok: false, code: 'observed-metadata-invalid' });
  }
  if (observed.lengthBytes !== candidate.expectedLengthBytes) {
    return deepFreeze({ ok: false, code: 'package-length-mismatch' });
  }
  if (observedSha1 !== candidate.sha1) {
    return deepFreeze({ ok: false, code: 'package-hash-mismatch' });
  }
  return deepFreeze({ ok: true, code: 'package-metadata-matched' });
}

function normalizeManifestFetchResponse(response, policy) {
  assertPlainRecord(response, 'manifest fetch response');
  assertAllowedFields(response, 'manifest fetch response', new Set([
    'status',
    'finalUrl',
    'body',
    'reportedLengthBytes',
  ]));
  if (response.status !== 200) {
    throw new UpdateValidationError('release-manifest-http-status', 'The release manifest did not return HTTP 200.');
  }
  const finalUrl = requireNonEmptyString(response.finalUrl, 'manifest fetch response.finalUrl', 2_048);
  if (!policy.approvedReleasesUrls.includes(finalUrl)) {
    throw new UpdateValidationError('unapproved-release-manifest-url', 'The release manifest final URL is not an approved pinned RELEASES location.');
  }

  const body = asBoundedByteBuffer(response.body, policy.limits.maxManifestBytes, 'manifest fetch response.body');
  if (response.reportedLengthBytes !== undefined) {
    if (!Number.isSafeInteger(response.reportedLengthBytes)
      || response.reportedLengthBytes < 0
      || response.reportedLengthBytes > policy.limits.maxManifestBytes
      || response.reportedLengthBytes !== body.byteLength) {
      throw new UpdateValidationError('release-manifest-length-mismatch', 'The release manifest reported length did not match the bounded response body.');
    }
  }

  const pinnedDirectoryIndex = policy.approvedReleasesUrls.indexOf(finalUrl);
  return Object.freeze({
    body,
    pinnedReleaseDirectoryUrl: policy.approvedReleaseDirectories[pinnedDirectoryIndex],
  });
}

function createUpdateStagePlan(selection, policy, pinnedReleaseDirectoryUrl) {
  assertReleaseFeedPolicy(policy);
  assertSelection(selection, policy);
  if (selection.kind !== 'update-available' || !selection.candidate) {
    throw new UpdateValidationError('available-update-required', 'A newer full package must be selected before staging.');
  }
  if (!policy.approvedReleaseDirectories.includes(pinnedReleaseDirectoryUrl)) {
    throw new UpdateValidationError('approved-pinned-directory-required', 'The selected package must use an approved pinned release directory.');
  }

  const plan = deepFreeze({
    schemaVersion: UPDATE_STAGE_PLAN_SCHEMA_VERSION,
    packageType: 'full-nupkg',
    allowDowngrade: false,
    currentVersion: selection.currentVersion.normalized,
    targetVersion: selection.candidate.version.normalized,
    packageFileName: selection.candidate.fileName,
    packageUrl: appendSafeFileName(pinnedReleaseDirectoryUrl, selection.candidate.fileName),
    expectedMetadata: deepFreeze({
      sha1: selection.candidate.sha1,
      lengthBytes: selection.candidate.expectedLengthBytes,
    }),
    unsigned: true,
  });
  stagePlanBrands.add(plan);
  return plan;
}

function sanitizeFailureCode(error, fallback = 'update-operation-failed') {
  if (error instanceof UpdateValidationError || error instanceof UpdateStateError) {
    return error.code;
  }
  if (error && typeof error === 'object' && error.name === 'AbortError') {
    return 'operation-cancelled';
  }
  return fallback;
}

function normalizeNativeUpdaterAdapter(value) {
  if (value === undefined || value === null) {
    return null;
  }
  assertPlainRecord(value, 'native updater adapter');
  assertAllowedFields(value, 'native updater adapter', new Set(['stageUpdate', 'restartAndInstall']));
  for (const method of ['stageUpdate', 'restartAndInstall']) {
    if (value[method] !== undefined && typeof value[method] !== 'function') {
      throw new UpdateValidationError('native-adapter-method-required', `native updater adapter.${method} must be a function.`);
    }
  }
  return Object.freeze({
    stageUpdate: value.stageUpdate || null,
    restartAndInstall: value.restartAndInstall || null,
  });
}

function normalizeStagedUpdateResult(result, plan) {
  assertPlainRecord(result, 'native updater result');
  assertAllowedFields(result, 'native updater result', new Set([
    'status',
    'targetVersion',
    'packageFileName',
    'observedMetadata',
  ]));
  if (result.status !== 'staged'
    || result.targetVersion !== plan.targetVersion
    || result.packageFileName !== plan.packageFileName) {
    throw new UpdateValidationError('native-stage-result-invalid', 'The native updater did not confirm the requested package as staged.');
  }
  const metadata = verifyPackageMetadata({
    sha1: plan.expectedMetadata.sha1,
    expectedLengthBytes: plan.expectedMetadata.lengthBytes,
  }, result.observedMetadata);
  if (!metadata.ok) {
    throw new UpdateValidationError(metadata.code, 'The native updater did not provide matching expected package metadata.');
  }
  return deepFreeze({ status: 'staged' });
}

function normalizeRestartResult(result) {
  assertPlainRecord(result, 'native restart result');
  assertAllowedFields(result, 'native restart result', new Set(['status']));
  if (result.status !== 'restart-requested') {
    throw new UpdateValidationError('native-restart-result-invalid', 'The native updater did not accept a restart request.');
  }
  return deepFreeze({ status: 'restart-requested' });
}

/**
 * Main-process-only update state machine. The constructor receives trusted
 * installed-version and release-feed configuration. No method accepts a URL,
 * command, package filename, token, credential, or renderer request options.
 */
class UnsignedSquirrelUpdateController extends EventEmitter {
  /**
   * @param {{
   *   feedPolicy: ReturnType<typeof createReleaseFeedPolicy>,
   *   currentVersion: string,
   *   fetchReleaseManifest?: (request: { url: string, signal: AbortSignal, timeoutMs: number, maxBytes: number }) => Promise<{ status: number, finalUrl: string, body: Buffer | Uint8Array, reportedLengthBytes?: number }>,
   *   nativeUpdater?: { stageUpdate?: Function, restartAndInstall?: Function },
   * }} options
   */
  constructor(options) {
    super();
    assertPlainRecord(options, 'update controller options');
    assertAllowedFields(options, 'update controller options', new Set([
      'feedPolicy',
      'currentVersion',
      'fetchReleaseManifest',
      'nativeUpdater',
    ]));
    this._feedPolicy = assertReleaseFeedPolicy(options.feedPolicy);
    this._currentVersion = normalizeSquirrelVersion(options.currentVersion, 'current version');
    if (options.fetchReleaseManifest !== undefined && typeof options.fetchReleaseManifest !== 'function') {
      throw new UpdateValidationError('manifest-fetch-adapter-required', 'fetchReleaseManifest must be a function when supplied.');
    }
    this._fetchReleaseManifest = options.fetchReleaseManifest || null;
    this._nativeUpdater = normalizeNativeUpdaterAdapter(options.nativeUpdater);
    this._state = 'idle';
    this._selection = null;
    this._pinnedReleaseDirectoryUrl = null;
    this._stagePlan = null;
    this._activeOperation = null;
    this._lastFailureCode = null;
    this._restartRequested = false;
    this._downloadProgress = null;
  }

  getSnapshot() {
    const candidate = this._selection && this._selection.candidate;
    const canCheck = ['idle', 'up-to-date', 'available', 'cancelled', 'failed'].includes(this._state);
    const canRetry = ['cancelled', 'failed'].includes(this._state);
    const canCancel = ['checking', 'downloading'].includes(this._state);
    const canDownload = this._state === 'available' && Boolean(this._nativeUpdater && this._nativeUpdater.stageUpdate);
    const canRestart = this._state === 'ready-to-restart'
      && Boolean(this._nativeUpdater && this._nativeUpdater.restartAndInstall);
    return deepFreeze({
      state: this._state,
      currentVersion: this._currentVersion.normalized,
      availableVersion: candidate ? candidate.version.normalized : null,
      selectedPackage: candidate ? deepFreeze({
        fileName: candidate.fileName,
        expectedLengthBytes: candidate.expectedLengthBytes,
        fullPackageOnly: true,
        unsigned: true,
      }) : null,
      unsignedArtifactWarning: UNSIGNED_ARTIFACT_WARNING,
      lastFailureCode: this._lastFailureCode,
      restartRequested: this._restartRequested,
      downloadProgress: this._downloadProgress ? { ...this._downloadProgress } : null,
      intents: deepFreeze({
        check: canCheck,
        retry: canRetry,
        cancel: canCancel,
        download: canDownload,
        restartToInstall: canRestart,
      }),
    });
  }

  async checkForUpdates() {
    this._assertAllowedState(['idle', 'up-to-date', 'available', 'cancelled', 'failed'], 'check for updates');
    if (!this._fetchReleaseManifest) {
      this._fail('manifest-fetch-adapter-unavailable');
      return this.getSnapshot();
    }

    this._selection = null;
    this._pinnedReleaseDirectoryUrl = null;
    this._stagePlan = null;
    this._restartRequested = false;
    this._downloadProgress = null;
    const operation = this._beginOperation('checking');
    try {
      const response = await this._fetchReleaseManifest(Object.freeze({
        url: this._feedPolicy.releasesUrl,
        signal: operation.abortController.signal,
        timeoutMs: this._feedPolicy.limits.fetchTimeoutMs,
        maxBytes: this._feedPolicy.limits.maxManifestBytes,
      }));
      if (!this._isCurrentOperation(operation)) {
        return this.getSnapshot();
      }

      const normalizedResponse = normalizeManifestFetchResponse(response, this._feedPolicy);
      const manifest = parseReleasesManifest(normalizedResponse.body, this._feedPolicy);
      const selection = selectNewestFullPackage(this._currentVersion.normalized, manifest, this._feedPolicy);
      this._selection = selection;
      this._pinnedReleaseDirectoryUrl = normalizedResponse.pinnedReleaseDirectoryUrl;
      this._activeOperation = null;
      this._lastFailureCode = null;
      this._transition(selection.kind === 'update-available' ? 'available' : 'up-to-date');
      return this.getSnapshot();
    } catch (error) {
      if (!this._isCurrentOperation(operation)) {
        return this.getSnapshot();
      }
      this._activeOperation = null;
      if (operation.cancelled) {
        this._transition('cancelled');
      } else {
        this._fail(sanitizeFailureCode(error, 'release-manifest-check-failed'));
      }
      return this.getSnapshot();
    }
  }

  async retry() {
    this._assertAllowedState(['cancelled', 'failed'], 'retry an update operation');
    return this.checkForUpdates();
  }

  cancel() {
    this._assertAllowedState(['checking', 'downloading'], 'cancel an update operation');
    const operation = this._activeOperation;
    if (operation) {
      operation.cancelled = true;
      operation.abortController.abort();
      this._activeOperation = null;
    }
    this._downloadProgress = null;
    this._transition('cancelled');
    return this.getSnapshot();
  }

  async downloadSelectedUpdate() {
    this._assertAllowedState(['available'], 'download an update');
    if (!this._nativeUpdater || !this._nativeUpdater.stageUpdate) {
      this._fail('native-stage-adapter-unavailable');
      return this.getSnapshot();
    }
    const plan = createUpdateStagePlan(this._selection, this._feedPolicy, this._pinnedReleaseDirectoryUrl);
    this._stagePlan = plan;
    this._restartRequested = false;
    this._downloadProgress = null;
    const operation = this._beginOperation('downloading');
    try {
      const result = await this._nativeUpdater.stageUpdate(Object.freeze({
        plan,
        signal: operation.abortController.signal,
        onProgress: (progress) => this._recordProgress(operation, progress),
      }));
      if (!this._isCurrentOperation(operation)) {
        return this.getSnapshot();
      }
      normalizeStagedUpdateResult(result, plan);
      this._activeOperation = null;
      this._lastFailureCode = null;
      this._downloadProgress = null;
      this._transition('ready-to-restart');
      return this.getSnapshot();
    } catch (error) {
      if (!this._isCurrentOperation(operation)) {
        return this.getSnapshot();
      }
      this._activeOperation = null;
      this._downloadProgress = null;
      if (operation.cancelled) {
        this._transition('cancelled');
      } else {
        this._fail(sanitizeFailureCode(error, 'native-stage-failed'));
      }
      return this.getSnapshot();
    }
  }

  async restartToInstall() {
    this._assertAllowedState(['ready-to-restart'], 'restart to install an update');
    if (!this._nativeUpdater || !this._nativeUpdater.restartAndInstall || !stagePlanBrands.has(this._stagePlan)) {
      this._fail('native-restart-adapter-unavailable');
      return this.getSnapshot();
    }
    try {
      const result = await this._nativeUpdater.restartAndInstall(Object.freeze({ plan: this._stagePlan }));
      normalizeRestartResult(result);
      this._restartRequested = true;
      this._lastFailureCode = null;
      // Deliberately retain ready-to-restart: accepting a native restart request
      // is not evidence that the replacement application installed successfully.
      this._emitSnapshot();
      return this.getSnapshot();
    } catch (error) {
      this._fail(sanitizeFailureCode(error, 'native-restart-failed'));
      return this.getSnapshot();
    }
  }

  _beginOperation(nextState) {
    const abortController = new AbortController();
    const operation = { abortController, cancelled: false, state: nextState };
    this._activeOperation = operation;
    this._lastFailureCode = null;
    this._transition(nextState);
    return operation;
  }

  _isCurrentOperation(operation) {
    return this._activeOperation === operation;
  }

  _recordProgress(operation, progress) {
    if (!this._isCurrentOperation(operation) || !isPlainRecord(progress)) {
      return;
    }
    const receivedBytes = progress.receivedBytes;
    const totalBytes = progress.totalBytes;
    const expectedLengthBytes = this._selection && this._selection.candidate
      ? this._selection.candidate.expectedLengthBytes
      : null;
    if (!Number.isSafeInteger(receivedBytes) || receivedBytes < 0
      || !Number.isSafeInteger(totalBytes) || totalBytes <= 0
      || receivedBytes > totalBytes
      || !Number.isSafeInteger(expectedLengthBytes)
      || totalBytes !== expectedLengthBytes) {
      return;
    }
    this._downloadProgress = deepFreeze({ receivedBytes, totalBytes });
    this._emitSnapshot();
  }

  _assertAllowedState(states, action) {
    if (!states.includes(this._state)) {
      throw new UpdateStateError(this._state, `Cannot ${action} while update state is ${this._state}.`);
    }
  }

  _fail(code) {
    this._activeOperation = null;
    this._downloadProgress = null;
    this._lastFailureCode = code;
    this._transition('failed');
  }

  _transition(nextState) {
    if (!UPDATE_STATES.includes(nextState)) {
      throw new UpdateStateError(this._state, 'An unsupported update state was requested.');
    }
    this._state = nextState;
    this._emitSnapshot();
  }

  _emitSnapshot() {
    this.emit('state', this.getSnapshot());
  }
}

module.exports = {
  ABSOLUTE_RELEASE_LIMITS,
  DEFAULT_RELEASE_LIMITS,
  RELEASE_FEED_POLICY_SCHEMA_VERSION,
  RELEASE_MANIFEST_SCHEMA_VERSION,
  UNSIGNED_ARTIFACT_WARNING,
  UPDATE_STAGE_PLAN_SCHEMA_VERSION,
  UPDATE_STATES,
  UnsignedSquirrelUpdateController,
  UpdateStateError,
  UpdateValidationError,
  compareSquirrelVersions,
  createReleaseFeedPolicy,
  normalizeSquirrelVersion,
  parseReleasesManifest,
  selectNewestFullPackage,
  verifyPackageMetadata,
};
