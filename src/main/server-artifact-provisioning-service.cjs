'use strict';

/**
 * Planning-only foundation for server artifact provisioning.
 *
 * This module deliberately does not make HTTP requests, access the filesystem,
 * spawn a process, or execute a shell. A later privileged main-process executor
 * must consume these bounded plans and enforce their preflight contracts.
 */

const { randomUUID } = require('node:crypto');
const path = require('node:path');

const WINDOWS_PATH = path.win32;

const PAPER_API_ORIGIN = 'https://fill.papermc.io';
const PAPER_DOWNLOAD_ORIGIN = 'https://fill-data.papermc.io';
const PAPER_DOCUMENTATION_URL = 'https://docs.papermc.io/misc/downloads-service/';
const SPIGOT_BUILDTOOLS_DOCUMENTATION_URL = 'https://www.spigotmc.org/wiki/buildtools/';
const APPLICATION_CONTACT_URL = 'https://github.com/Ding-Ding-Projects/minecraft-server-command-center';

const PAPER_METADATA_TIMEOUT_MS = 15_000;
const PAPER_ARTIFACT_TIMEOUT_MS = 120_000;
const PAPER_MAX_METADATA_BYTES = 1 * 1024 * 1024;
const DEFAULT_ARTIFACT_LIMIT_BYTES = 512 * 1024 * 1024;
const MAX_ARTIFACT_LIMIT_BYTES = 2 * 1024 * 1024 * 1024;
const MIN_ARTIFACT_LIMIT_BYTES = 16 * 1024 * 1024;
const MAX_WINDOWS_PATH_LENGTH = 240;
const MAX_BUILD_NUMBER = 2_147_483_647;

const PAPER_BUILD_CHANNEL = 'STABLE';
const PAPER_DOWNLOAD_KEY = 'server:default';
const PAPER_VERSION_PATTERN = /^\d{1,4}(?:\.\d{1,4}){1,3}(?:-(?:pre|rc)\d{1,4})?$/;
const APPLICATION_VERSION_PATTERN = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;
const SHA256_PATTERN = /^[a-fA-F0-9]{64}$/;
const FILL_OBJECT_PATH_PATTERN = /^\/v1\/objects\/([a-f0-9]{64})\/([^/]+)$/i;
const TRANSACTION_ID_PATTERN = /^[a-z0-9][a-z0-9-]{7,63}$/;
const BUILDTOOLS_FILE_PATTERN = /^buildtools(?:[-._][a-z0-9._-]+)?\.jar$/i;

function planError(code, message) {
  const error = new Error(message);
  error.name = 'ProvisioningPlanError';
  error.code = code;
  return error;
}

function abortError() {
  const error = new Error('The provisioning request was cancelled before it could be planned.');
  error.name = 'AbortError';
  error.code = 'ABORT_ERR';
  return error;
}

function isPlainRecord(value) {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function requirePlainRecord(value, fieldName) {
  if (!isPlainRecord(value)) {
    throw planError('INVALID_RECORD', `${fieldName} must be a plain object.`);
  }

  return value;
}

function requireString(value, fieldName) {
  if (typeof value !== 'string' || value.length === 0) {
    throw planError('INVALID_STRING', `${fieldName} must be a non-empty string.`);
  }

  if (value !== value.trim()) {
    throw planError('UNTRIMMED_STRING', `${fieldName} must not include leading or trailing whitespace.`);
  }

  if (value.includes('\0')) {
    throw planError('NUL_CHARACTER', `${fieldName} must not contain a NUL character.`);
  }

  return value;
}

function normalizeApplicationVersion(value) {
  const version = requireString(value, 'applicationVersion');
  if (!APPLICATION_VERSION_PATTERN.test(version) || version.length > 64) {
    throw planError(
      'INVALID_APPLICATION_VERSION',
      'applicationVersion must be a bounded semantic version used to identify this application to PaperMC.'
    );
  }

  return version;
}

function normalizeMinecraftVersion(value) {
  const version = requireString(value, 'minecraftVersion');
  if (!PAPER_VERSION_PATTERN.test(version) || version.length > 32) {
    throw planError(
      'INVALID_MINECRAFT_VERSION',
      'minecraftVersion must be a supported numeric Minecraft release or pre-release identifier.'
    );
  }

  return version;
}

function normalizeBuildNumber(value) {
  if (!Number.isSafeInteger(value) || value < 1 || value > MAX_BUILD_NUMBER) {
    throw planError(
      'INVALID_BUILD_NUMBER',
      `build must be a positive safe integer no larger than ${MAX_BUILD_NUMBER}.`
    );
  }

  return value;
}

function normalizeByteLimit(value) {
  if (value === undefined) {
    return DEFAULT_ARTIFACT_LIMIT_BYTES;
  }

  if (
    !Number.isSafeInteger(value) ||
    value < MIN_ARTIFACT_LIMIT_BYTES ||
    value > MAX_ARTIFACT_LIMIT_BYTES
  ) {
    throw planError(
      'INVALID_ARTIFACT_LIMIT',
      `maxArtifactBytes must be an integer between ${MIN_ARTIFACT_LIMIT_BYTES} and ${MAX_ARTIFACT_LIMIT_BYTES}.`
    );
  }

  return value;
}

function normalizeOptionalByteCount(value, fieldName) {
  if (value === undefined || value === null) {
    return null;
  }

  if (!Number.isSafeInteger(value) || value < 1 || value > MAX_ARTIFACT_LIMIT_BYTES) {
    throw planError(
      'INVALID_BYTE_COUNT',
      `${fieldName} must be a positive safe integer no larger than ${MAX_ARTIFACT_LIMIT_BYTES}.`
    );
  }

  return value;
}

function normalizeSha256(value, fieldName) {
  const checksum = requireString(value, fieldName);
  if (!SHA256_PATTERN.test(checksum)) {
    throw planError('INVALID_SHA256', `${fieldName} must be a 64-character hexadecimal SHA-256 digest.`);
  }

  return checksum.toLowerCase();
}

function normalizeOptionalSha256(value, fieldName) {
  if (value === undefined || value === null) {
    return null;
  }

  return normalizeSha256(value, fieldName);
}

function validateOptionalAbortSignal(signal) {
  if (signal === undefined || signal === null) {
    return null;
  }

  if (
    typeof signal !== 'object' ||
    typeof signal.aborted !== 'boolean' ||
    typeof signal.addEventListener !== 'function'
  ) {
    throw planError('INVALID_ABORT_SIGNAL', 'signal must be an AbortSignal when it is supplied.');
  }

  if (signal.aborted) {
    throw abortError();
  }

  return signal;
}

function throwIfAborted(signal) {
  validateOptionalAbortSignal(signal);
}

function createPaperUserAgent(applicationVersion) {
  const version = normalizeApplicationVersion(applicationVersion);
  return `Minecraft Server Command Center/${version} (${APPLICATION_CONTACT_URL})`;
}

function createOfficialPaperApiUrl(pathname) {
  const url = new URL(PAPER_API_ORIGIN);
  url.pathname = pathname;
  assertAllowedPaperUrl(url, PAPER_API_ORIGIN, 'Paper metadata endpoint');
  return url;
}

function assertAllowedPaperUrl(urlValue, expectedOrigin, fieldName) {
  const url = urlValue instanceof URL ? urlValue : new URL(urlValue);
  if (
    url.protocol !== 'https:' ||
    url.origin !== expectedOrigin ||
    url.username !== '' ||
    url.password !== '' ||
    url.port !== ''
  ) {
    throw planError('UNTRUSTED_ORIGIN', `${fieldName} must use the allowlisted ${expectedOrigin} HTTPS origin.`);
  }

  return url;
}

function createPaperMetadataRequest(url, applicationVersion) {
  assertAllowedPaperUrl(url, PAPER_API_ORIGIN, 'Paper metadata endpoint');
  return Object.freeze({
    method: 'GET',
    url: url.toString(),
    headers: Object.freeze({
      accept: 'application/json',
      'user-agent': createPaperUserAgent(applicationVersion),
    }),
    redirect: 'error',
    credentials: 'omit',
    timeoutMs: PAPER_METADATA_TIMEOUT_MS,
    maxResponseBytes: PAPER_MAX_METADATA_BYTES,
    allowedOrigin: PAPER_API_ORIGIN,
  });
}

/**
 * Creates a metadata-only plan for Paper version choices. No request is made.
 */
function createPaperVersionChoicesPlan({ applicationVersion, signal } = {}) {
  throwIfAborted(signal);
  const url = createOfficialPaperApiUrl('/v3/projects/paper');
  return Object.freeze({
    kind: 'paper-version-choices',
    provider: 'PaperMC Fill v3',
    documentationUrl: PAPER_DOCUMENTATION_URL,
    request: createPaperMetadataRequest(url, applicationVersion),
    cancellation: Object.freeze({
      acceptsAbortSignal: true,
      onAbort: 'Abort the request and retain no response payload.',
    }),
  });
}

/**
 * Creates a metadata-only plan for the builds available for one Paper version.
 * The later executor must filter its response to stable builds before a build can
 * be selected.
 */
function createPaperBuildChoicesPlan({ applicationVersion, minecraftVersion, signal } = {}) {
  throwIfAborted(signal);
  const version = normalizeMinecraftVersion(minecraftVersion);
  const url = createOfficialPaperApiUrl(
    `/v3/projects/paper/versions/${encodeURIComponent(version)}/builds`
  );

  return Object.freeze({
    kind: 'paper-build-choices',
    provider: 'PaperMC Fill v3',
    documentationUrl: PAPER_DOCUMENTATION_URL,
    minecraftVersion: version,
    stableChannel: PAPER_BUILD_CHANNEL,
    request: createPaperMetadataRequest(url, applicationVersion),
    cancellation: Object.freeze({
      acceptsAbortSignal: true,
      onAbort: 'Abort the request and retain no response payload.',
    }),
  });
}

function normalizePaperArtifactName(name, minecraftVersion, build) {
  const fileName = requireString(name, 'Paper download name');
  const expected = `paper-${minecraftVersion}-${build}.jar`;
  if (fileName !== expected) {
    throw planError(
      'UNEXPECTED_PAPER_FILENAME',
      `Paper metadata must name the selected artifact exactly ${expected}.`
    );
  }

  return fileName;
}

function normalizePaperDownloadUrl(value, expectedFileName, expectedSha256) {
  const urlValue = requireString(value, 'Paper download URL');
  let url;
  try {
    url = new URL(urlValue);
  } catch {
    throw planError('INVALID_PAPER_DOWNLOAD_URL', 'Paper download URL must be a valid URL.');
  }

  assertAllowedPaperUrl(url, PAPER_DOWNLOAD_ORIGIN, 'Paper download URL');
  if (url.search !== '' || url.hash !== '') {
    throw planError('UNEXPECTED_PAPER_DOWNLOAD_COMPONENT', 'Paper download URL must not contain a query string or fragment.');
  }

  const pathMatch = FILL_OBJECT_PATH_PATTERN.exec(url.pathname);
  if (!pathMatch || decodeURIComponent(pathMatch[2]) !== expectedFileName) {
    throw planError(
      'UNEXPECTED_PAPER_DOWNLOAD_PATH',
      'Paper download URL must be the official Fill object path for the expected server jar name.'
    );
  }

  const objectDigest = pathMatch[1].toLowerCase();
  if (expectedSha256 !== null && objectDigest !== expectedSha256) {
    throw planError(
      'PAPER_DIGEST_MISMATCH',
      'Paper download URL object digest must agree with the SHA-256 digest in official metadata.'
    );
  }

  return url.toString();
}

function normalizePaperDownloadRecord(downloadRecord, minecraftVersion, build) {
  const record = requirePlainRecord(downloadRecord, 'Paper server download metadata');
  const expectedFileName = normalizePaperArtifactName(record.name, minecraftVersion, build);
  const checksums = record.checksums === undefined ? null : requirePlainRecord(record.checksums, 'Paper checksums');
  const sha256 = normalizeOptionalSha256(checksums === null ? undefined : checksums.sha256, 'Paper SHA-256');
  const size = normalizeOptionalByteCount(record.size, 'Paper artifact size');
  const url = normalizePaperDownloadUrl(record.url, expectedFileName, sha256);

  return Object.freeze({
    name: expectedFileName,
    url,
    sha256,
    size,
  });
}

/**
 * Extracts one stable Paper build from a Fill v3 REST builds response. The
 * response stays untrusted until this function validates the selected record.
 */
function selectPaperStableBuild({ minecraftVersion, build, builds } = {}) {
  const version = normalizeMinecraftVersion(minecraftVersion);
  const selectedBuild = normalizeBuildNumber(build);
  if (!Array.isArray(builds)) {
    throw planError('INVALID_PAPER_BUILD_LIST', 'builds must be the array returned by the official Paper build-choices request.');
  }

  const matchingRecord = builds.find((candidate) => {
    return isPlainRecord(candidate) && candidate.id === selectedBuild;
  });

  if (!matchingRecord) {
    throw planError('PAPER_BUILD_NOT_FOUND', `Paper build ${selectedBuild} was not present in the supplied build choices.`);
  }

  if (matchingRecord.channel !== PAPER_BUILD_CHANNEL) {
    throw planError(
      'NON_STABLE_PAPER_BUILD',
      `Paper build ${selectedBuild} is not a ${PAPER_BUILD_CHANNEL} build and is rejected by this provisioning policy.`
    );
  }

  const downloads = requirePlainRecord(matchingRecord.downloads, 'Paper build downloads');
  const serverDownload = normalizePaperDownloadRecord(downloads[PAPER_DOWNLOAD_KEY], version, selectedBuild);

  return Object.freeze({
    minecraftVersion: version,
    build: selectedBuild,
    channel: PAPER_BUILD_CHANNEL,
    download: serverDownload,
  });
}

function normalizeNativePickerSelection(value, fieldName, expectedSource) {
  const selection = requirePlainRecord(value, fieldName);
  if (selection.source !== expectedSource) {
    throw planError(
      'UNTRUSTED_PATH_SOURCE',
      `${fieldName}.source must be ${expectedSource}; raw text paths are not accepted by this planner.`
    );
  }

  return requireString(selection.path, `${fieldName}.path`);
}

function normalizeLocalWindowsPath(value, fieldName) {
  const candidate = requireString(value, fieldName);
  if (candidate.length > MAX_WINDOWS_PATH_LENGTH) {
    throw planError('WINDOWS_PATH_TOO_LONG', `${fieldName} must not exceed ${MAX_WINDOWS_PATH_LENGTH} characters.`);
  }

  if (/^\\\\[?.]/.test(candidate) || candidate.startsWith('\\\\')) {
    throw planError('UNSUPPORTED_WINDOWS_PATH', `${fieldName} must be a local drive path, not a device or UNC path.`);
  }

  if (!WINDOWS_PATH.isAbsolute(candidate) || !/^[A-Za-z]:\\/.test(candidate)) {
    throw planError('NON_ABSOLUTE_WINDOWS_PATH', `${fieldName} must be an absolute local Windows drive path.`);
  }

  const normalized = WINDOWS_PATH.normalize(candidate);
  const root = WINDOWS_PATH.parse(normalized).root;
  const withoutTrailingSeparator =
    normalized.length > root.length && normalized.endsWith('\\') ? normalized.slice(0, -1) : normalized;

  if (withoutTrailingSeparator.toLowerCase() === root.toLowerCase()) {
    throw planError('WINDOWS_ROOT_FORBIDDEN', `${fieldName} must not be a drive root.`);
  }

  if (withoutTrailingSeparator.slice(3).includes(':')) {
    throw planError('WINDOWS_ADS_FORBIDDEN', `${fieldName} must not contain an alternate data stream separator.`);
  }

  return withoutTrailingSeparator;
}

function normalizeFolderPicker(value, fieldName) {
  return normalizeLocalWindowsPath(
    normalizeNativePickerSelection(value, fieldName, 'native-folder-picker'),
    `${fieldName}.path`
  );
}

function normalizeFilePicker(value, fieldName) {
  return normalizeLocalWindowsPath(
    normalizeNativePickerSelection(value, fieldName, 'native-file-picker'),
    `${fieldName}.path`
  );
}

function normalizeTransactionId(value) {
  const transactionId = value === undefined ? randomUUID() : requireString(value, 'transactionId');
  if (!TRANSACTION_ID_PATTERN.test(transactionId)) {
    throw planError(
      'INVALID_TRANSACTION_ID',
      'transactionId must be a lowercase UUID-like token used only to own a temporary artifact file.'
    );
  }

  return transactionId;
}

function normalizePaperSelection(value) {
  const selection = requirePlainRecord(value, 'Paper selection');
  const minecraftVersion = normalizeMinecraftVersion(selection.minecraftVersion);
  const build = normalizeBuildNumber(selection.build);
  if (selection.channel !== PAPER_BUILD_CHANNEL) {
    throw planError('NON_STABLE_PAPER_BUILD', 'Paper provisioning only accepts a selected STABLE build.');
  }

  return Object.freeze({
    minecraftVersion,
    build,
    channel: PAPER_BUILD_CHANNEL,
    download: normalizePaperDownloadRecord(selection.download, minecraftVersion, build),
  });
}

/**
 * Creates a bounded, non-overwriting Paper artifact plan after official
 * metadata has already been fetched and validated with selectPaperStableBuild.
 * This function performs no I/O.
 */
function createPaperArtifactDownloadPlan({
  applicationVersion,
  selection,
  serverRoot,
  maxArtifactBytes,
  transactionId,
  signal,
} = {}) {
  throwIfAborted(signal);
  const normalizedSelection = normalizePaperSelection(selection);
  const root = normalizeFolderPicker(serverRoot, 'serverRoot');
  const byteLimit = normalizeByteLimit(maxArtifactBytes);
  const plannedTransactionId = normalizeTransactionId(transactionId);
  const { download } = normalizedSelection;

  if (download.size !== null && download.size > byteLimit) {
    throw planError(
      'PAPER_ARTIFACT_EXCEEDS_LIMIT',
      `Paper artifact size ${download.size} exceeds the selected ${byteLimit}-byte transfer limit.`
    );
  }

  const finalPath = WINDOWS_PATH.resolve(root, download.name);
  if (WINDOWS_PATH.dirname(finalPath).toLowerCase() !== root.toLowerCase()) {
    throw planError('PAPER_DESTINATION_ESCAPE', 'The Paper destination must remain directly inside the selected server root.');
  }

  const temporaryFileName = `.${download.name}.${plannedTransactionId}.part`;
  const temporaryPath = WINDOWS_PATH.resolve(root, temporaryFileName);
  if (WINDOWS_PATH.dirname(temporaryPath).toLowerCase() !== root.toLowerCase()) {
    throw planError('PAPER_TEMPORARY_ESCAPE', 'The Paper temporary artifact must remain directly inside the selected server root.');
  }

  return Object.freeze({
    kind: 'paper-artifact-download',
    provider: 'PaperMC Fill v3',
    documentationUrl: PAPER_DOCUMENTATION_URL,
    selection: normalizedSelection,
    request: Object.freeze({
      method: 'GET',
      url: download.url,
      headers: Object.freeze({
        accept: 'application/java-archive, application/octet-stream',
        'user-agent': createPaperUserAgent(applicationVersion),
      }),
      redirect: 'error',
      credentials: 'omit',
      timeoutMs: PAPER_ARTIFACT_TIMEOUT_MS,
      maxResponseBytes: byteLimit,
      allowedOrigin: PAPER_DOWNLOAD_ORIGIN,
    }),
    destination: Object.freeze({
      serverRoot: root,
      fileName: download.name,
      finalPath,
      temporaryPath,
      temporaryFileName,
      noOverwrite: true,
      staging: Object.freeze({
        openFlags: 'wx',
        sameDirectoryAsFinal: true,
        promotion: 'Create a hard link from the verified temporary file to finalPath, fail on EEXIST, then remove only the owned temporary file.',
      }),
    }),
    integrity: Object.freeze({
      expectedFileName: download.name,
      expectedContentLengthBytes: download.size,
      expectedSha256: download.sha256,
      maximumContentLengthBytes: byteLimit,
    }),
    cancellation: Object.freeze({
      acceptsAbortSignal: true,
      onAbort: 'Abort the HTTP request and stream, close the owned temporary file, and remove only that temporary file. Never remove finalPath.',
    }),
    executionPreflight: Object.freeze([
      'Revalidate the selected server root with lstat; it must be an existing local directory and not a reparse point.',
      'Reject an existing finalPath, temporaryPath, or destination reparse point before opening the temporary file.',
      'Open temporaryPath exclusively with wx in the selected server root.',
      'Reject every redirect, every final response URL different from request.url, and every origin other than the allowlisted Paper artifact origin.',
      'Stream with byte accounting; reject a Content-Length or streamed byte count that exceeds the maximum or differs from official metadata when metadata supplied a size.',
      'Compute SHA-256 while streaming and compare it to the official metadata value when supplied before promotion.',
      'Promote with the no-overwrite hard-link procedure in destination.staging; fail closed if the filesystem cannot provide it.',
    ]),
  });
}

function assertExactPaperResponseUrl(plan, responseUrl) {
  const artifactPlan = requirePlainRecord(plan, 'Paper artifact plan');
  const request = requirePlainRecord(artifactPlan.request, 'Paper artifact plan request');
  const expected = requireString(request.url, 'Paper artifact plan request.url');
  const observed = requireString(responseUrl, 'Paper response URL');
  if (observed !== expected) {
    throw planError('PAPER_REDIRECT_OR_URL_CHANGE', 'Paper artifact response URL must exactly match the planned allowlisted URL.');
  }
}

/**
 * Pure result validation for a future download executor. It validates its
 * already-computed facts and never reads a file or calls the network.
 */
function verifyPaperArtifactResult({ plan, responseUrl, fileName, contentLengthBytes, sha256 } = {}) {
  const artifactPlan = requirePlainRecord(plan, 'Paper artifact plan');
  if (artifactPlan.kind !== 'paper-artifact-download') {
    throw planError('INVALID_PAPER_ARTIFACT_PLAN', 'plan must be a Paper artifact download plan.');
  }

  assertExactPaperResponseUrl(artifactPlan, responseUrl);
  const integrity = requirePlainRecord(artifactPlan.integrity, 'Paper artifact integrity');
  const expectedName = requireString(integrity.expectedFileName, 'Paper expected file name');
  const observedName = requireString(fileName, 'Downloaded Paper file name');
  if (observedName !== expectedName) {
    throw planError('PAPER_RESULT_FILENAME_MISMATCH', 'Downloaded Paper file name differs from the official planned file name.');
  }

  const byteLimit = normalizeByteLimit(integrity.maximumContentLengthBytes);
  const observedLength = normalizeOptionalByteCount(contentLengthBytes, 'Downloaded Paper byte count');
  if (observedLength === null) {
    throw planError('MISSING_PAPER_RESULT_LENGTH', 'Downloaded Paper byte count is required for verification.');
  }
  if (observedLength > byteLimit) {
    throw planError('PAPER_RESULT_TOO_LARGE', 'Downloaded Paper byte count exceeds the planned transfer limit.');
  }

  const expectedLength = normalizeOptionalByteCount(integrity.expectedContentLengthBytes, 'Planned Paper byte count');
  if (expectedLength !== null && observedLength !== expectedLength) {
    throw planError('PAPER_RESULT_LENGTH_MISMATCH', 'Downloaded Paper byte count differs from official metadata.');
  }

  const expectedSha256 = normalizeOptionalSha256(integrity.expectedSha256, 'Planned Paper SHA-256');
  const observedSha256 = normalizeOptionalSha256(sha256, 'Downloaded Paper SHA-256');
  if (expectedSha256 !== null && observedSha256 !== expectedSha256) {
    throw planError('PAPER_RESULT_SHA256_MISMATCH', 'Downloaded Paper SHA-256 differs from official metadata.');
  }

  return Object.freeze({
    fileName: observedName,
    contentLengthBytes: observedLength,
    sha256: observedSha256,
    verifiedAgainstMetadata: Object.freeze({
      fileName: true,
      contentLength: expectedLength !== null,
      sha256: expectedSha256 !== null,
    }),
  });
}

function pathsOverlap(left, right) {
  const normalizedLeft = WINDOWS_PATH.normalize(left).toLowerCase();
  const normalizedRight = WINDOWS_PATH.normalize(right).toLowerCase();
  if (normalizedLeft === normalizedRight) {
    return true;
  }

  const relative = WINDOWS_PATH.relative(normalizedLeft, normalizedRight);
  return relative !== '' && !relative.startsWith('..\\') && relative !== '..' && !WINDOWS_PATH.isAbsolute(relative);
}

function normalizeBuildToolsJar(value) {
  const jarPath = normalizeFilePicker(value, 'buildToolsJar');
  const fileName = WINDOWS_PATH.basename(jarPath);
  if (!BUILDTOOLS_FILE_PATTERN.test(fileName)) {
    throw planError(
      'INVALID_BUILDTOOLS_JAR',
      'buildToolsJar must be selected from a local BuildTools.jar file, not typed as a command or arbitrary program.'
    );
  }

  return jarPath;
}

function normalizeJavaExecutable(value) {
  const javaPath = normalizeFilePicker(value, 'javaExecutable');
  if (WINDOWS_PATH.basename(javaPath).toLowerCase() !== 'java.exe') {
    throw planError('INVALID_JAVA_EXECUTABLE', 'javaExecutable must be the user-selected java.exe executable.');
  }

  return javaPath;
}

/**
 * Creates a non-shell plan for building a Spigot server with a user-selected,
 * local BuildTools jar. It does not download BuildTools or claim a direct
 * official Spigot server-JAR endpoint exists.
 */
function createSpigotBuildToolsPlan({
  minecraftVersion,
  buildToolsJar,
  javaExecutable,
  workspace,
  outputDirectory,
  signal,
} = {}) {
  throwIfAborted(signal);
  const version = normalizeMinecraftVersion(minecraftVersion);
  const jarPath = normalizeBuildToolsJar(buildToolsJar);
  const javaPath = normalizeJavaExecutable(javaExecutable);
  const workspacePath = normalizeFolderPicker(workspace, 'workspace');
  const outputPath = normalizeFolderPicker(outputDirectory, 'outputDirectory');

  if (pathsOverlap(workspacePath, outputPath) || pathsOverlap(outputPath, workspacePath)) {
    throw planError(
      'OVERLAPPING_BUILDTOOLS_DIRECTORIES',
      'workspace and outputDirectory must be separate local folders to keep BuildTools state away from the server artifact.'
    );
  }

  const finalName = `spigot-${version}.jar`;
  const finalPath = WINDOWS_PATH.resolve(outputPath, finalName);
  if (WINDOWS_PATH.dirname(finalPath).toLowerCase() !== outputPath.toLowerCase()) {
    throw planError('SPIGOT_DESTINATION_ESCAPE', 'Spigot output must remain directly inside the selected output directory.');
  }

  return Object.freeze({
    kind: 'spigot-buildtools-local',
    provider: 'Spigot BuildTools',
    documentationUrl: SPIGOT_BUILDTOOLS_DOCUMENTATION_URL,
    minecraftVersion: version,
    source: Object.freeze({
      mode: 'user-selected-local-buildtools-jar',
      buildToolsJar: jarPath,
      directServerJarUrl: null,
      directServerJarPolicy: 'No direct official Spigot server-JAR endpoint is assumed or requested. BuildTools is the supported setup path in this planner.',
    }),
    process: Object.freeze({
      executable: javaPath,
      args: Object.freeze([
        '-jar',
        jarPath,
        '--rev',
        version,
        '--output-dir',
        outputPath,
        '--final-name',
        finalName,
      ]),
      cwd: workspacePath,
      shell: false,
      windowsHide: true,
      detached: false,
    }),
    destination: Object.freeze({
      workspace: workspacePath,
      outputDirectory: outputPath,
      fileName: finalName,
      finalPath,
      noOverwrite: true,
    }),
    cancellation: Object.freeze({
      acceptsAbortSignal: true,
      onAbort: 'Request graceful process termination through the owning executor and retain the existing output. Do not delete workspace content automatically.',
    }),
    executionPreflight: Object.freeze([
      'Revalidate buildToolsJar and javaExecutable with lstat; both must be local regular files and not reparse points.',
      'Verify buildToolsJar has a ZIP/JAR signature before launch; the plan does not make any claim about the jar beyond its selected local path.',
      'Revalidate workspace and outputDirectory with lstat; both must be existing local directories, not reparse points, and remain separate.',
      'Reject an existing finalPath before launch. The user must choose a new output directory rather than overwrite a server jar.',
      'Launch only process.executable with process.args and shell:false. Never concatenate or evaluate user-provided command text.',
      'BuildTools itself may access its upstream build inputs when a future user explicitly starts this plan; that network activity is not a direct Spigot server-JAR download by this application.',
    ]),
  });
}

module.exports = Object.freeze({
  APPLICATION_CONTACT_URL,
  DEFAULT_ARTIFACT_LIMIT_BYTES,
  MAX_ARTIFACT_LIMIT_BYTES,
  PAPER_API_ORIGIN,
  PAPER_BUILD_CHANNEL,
  PAPER_DOCUMENTATION_URL,
  PAPER_DOWNLOAD_KEY,
  PAPER_DOWNLOAD_ORIGIN,
  SPIGOT_BUILDTOOLS_DOCUMENTATION_URL,
  createPaperArtifactDownloadPlan,
  createPaperBuildChoicesPlan,
  createPaperUserAgent,
  createPaperVersionChoicesPlan,
  createSpigotBuildToolsPlan,
  selectPaperStableBuild,
  throwIfAborted,
  verifyPaperArtifactResult,
});
