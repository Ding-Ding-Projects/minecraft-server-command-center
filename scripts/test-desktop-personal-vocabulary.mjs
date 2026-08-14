import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  clearPersonalVocabulary,
  loadPersonalVocabulary,
  PERSONAL_VOCABULARY_CACHE_FILENAME,
  replacePersonalVocabulary,
} from "../src/main/personal-vocabulary-store.ts";
import { PERSONAL_VOCABULARY_LIMITS } from "../src/shared/universal-contracts.ts";

const repositoryRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const readText = async (path) => (await readFile(join(repositoryRoot, path), "utf8")).replace(/\r\n/g, "\n");

const requiredMarkers = [
  ["src/main/personal-vocabulary-store.ts", "export async function loadPersonalVocabulary("],
  ["src/main/personal-vocabulary-store.ts", "export async function replacePersonalVocabulary("],
  ["src/main/personal-vocabulary-store.ts", "export async function clearPersonalVocabulary("],
  ["src/main/personal-vocabulary-store.ts", "await rename(temporary, target);"],
  ["src/main/personal-vocabulary-store.ts", "PERSONAL_VOCABULARY_LIMITS.maxBytes + 1"],
  ["src/main/personal-vocabulary-store.ts", "removeMalformedCache?: (filePath: string, expected?: CacheSnapshot) => Promise<void>"],
  ["src/main/personal-vocabulary-store.ts", "return {\n            ...EMPTY_STATE,\n            recovery: \"malformed-cache-removal-failed\",\n          };"],
  ["src/main/personal-vocabulary-store.ts", "class VocabularyReadError extends Error"],
  ["src/main/personal-vocabulary-store.ts", "error.kind === \"unavailable\""],
  ["src/main/personal-vocabulary-store.ts", "if (error.kind === \"unavailable\") {\n        throw new Error(\"The local vocabulary cache could not be read; the previous valid cache remains active."],
  ["src/main/personal-vocabulary-store.ts", "The vocabulary cache is not valid UTF-8."],
  ["src/shared/versioned-debounced-save.ts", "export function createVersionedDebouncedSave<T>("],
  ["src/shared/personal-vocabulary-recovery.ts", "export function projectPersonalVocabularyRecovery("],
  ["src/shared/desktop-api.ts", "readonly personalVocabulary: {"],
  ["src/shared/desktop-api.ts", "readonly recovery?: \"malformed-cache-removal-failed\";"],
  ["src/shared/desktop-api.ts", "choose(languageMode?: UniversalLanguageMode)"],
  ["src/preload/index.ts", "personalVocabulary: {"],
  ["src/preload/index.ts", "load: () => ipcRenderer.invoke(\"personal-vocabulary:load\")"],
  ["src/preload/index.ts", "ipcRenderer.invoke(\"personal-vocabulary:choose\", languageMode)"],
  ["src/preload/index.ts", "clear: () => ipcRenderer.invoke(\"personal-vocabulary:clear\")"],
  ["src/main/index.ts", "ipcMain.handle(\"personal-vocabulary:load\", () => loadPersonalVocabulary(app.getPath(\"userData\"))"],
  ["src/main/index.ts", "ipcMain.handle(\"personal-vocabulary:choose\""],
  ["src/main/index.ts", "const persistedSettings = await loadUniversalSettings(app.getPath(\"userData\"));"],
  ["src/main/index.ts", "funnyLevelEnglish: persistedSettings.funnyLevelEnglish,"],
  ["src/main/index.ts", "funnyLevelCantonese: persistedSettings.funnyLevelCantonese,"],
  ["src/main/index.ts", "ipcMain.handle(\"personal-vocabulary:clear\", () => clearPersonalVocabulary(app.getPath(\"userData\"))"],
  ["src/main/index.ts", "presentDesktopCopy(\"settings.personalVocabulary.picker.title\""],
  ["package.json", "\"test:desktop-personal-vocabulary\": \"node --experimental-strip-types scripts/test-desktop-personal-vocabulary.mjs\""],
  ["src/renderer/main.ts", "async function restorePersonalVocabulary(announceSuccess = false): Promise<void> {"],
  ["src/renderer/main.ts", "const universalSettingsSave = createVersionedDebouncedSave<UniversalSettingsV1>("],
  ["src/renderer/main.ts", "function retryPersonalVocabulary(): Promise<void> {"],
  ["src/renderer/main.ts", "await window.commandCenter.personalVocabulary.load();"],
  ["src/renderer/main.ts", "if (state.recovery === \"malformed-cache-removal-failed\") {"],
  ["src/renderer/main.ts", "showSnackbar(presentDesktopCopy(\"settings.personalVocabulary.notice.cacheRemovalFailed\", effectivePresentationSettings()), \"warning\");"],
  ["src/renderer/main.ts", "await window.commandCenter.personalVocabulary.clear();"],
  ["src/renderer/main.ts", "await restorePersonalVocabulary();"],
  ["src/renderer/main.ts", "applyPersonalVocabularyReplacements(text, activePersonalVocabularyEntries(), { boundary: \"ui\" })"],
  ["src/renderer/main.ts", "function renderPersonalVocabularyControl(): void {"],
  ["src/renderer/main.ts", "function effectivePresentationSettings(): UniversalSettingsV1 {"],
  ["src/renderer/main.ts", "current.getAttribute(\"aria-disabled\") === \"true\""],
  ["src/renderer/main.ts", "if (current.hasAttribute(\"inert\") || current.hasAttribute(\"disabled\")) return false;"],
  ["src/renderer/main.ts", "return style.display !== \"none\" && style.visibility !== \"hidden\" && style.visibility !== \"collapse\";"],
  ["src/renderer/main.ts", "if (!commandPaletteCommandAvailable(command)) {\n      openCommandPalette();"],
  ["src/renderer/main.ts", "document.documentElement.lang = settings.languageMode === \"cantonese\""],
  ["src/renderer/main.ts", "english.lang = \"en\";"],
  ["src/renderer/main.ts", "cantonese.lang = \"zh-Hant-HK\";"],
  ["src/renderer/main.ts", "bindOfflineDocumentation(userCopy);"],
  ["src/renderer/offline-documentation.ts", "const PROTECTED_TAGS = new Set([\"code\", \"pre\", \"kbd\", \"samp\", \"output\", \"script\", \"style\"]);"],
  ["src/renderer/offline-documentation.ts", "function applyRenderedCopy(root: HTMLElement, copy: CopyText): void {"],
  ["src/renderer/main.ts", "return universalSettings.schoolModeEnabled ? [] : personalVocabularyEntries;"],
  ["src/renderer/main.ts", "function commandPaletteCommandAvailable(command: CommandPaletteCommand): boolean {"],
  ["src/renderer/main.ts", "const previous = universalSettings.personalVocabulary;"],
  ["src/renderer/main.ts", "const languageMode = universalSettings.schoolModeEnabled ? \"english\" : universalSettings.languageMode;"],
  ["src/renderer/main.ts", "detail: userCopy(decorateDialogMessage(message, effectivePresentationSettings())),"],
  ["src/renderer/index.html", "data-settings-label=\"Personal vocabulary\""],
  ["src/renderer/index.html", "id=\"choose-personal-vocabulary\""],
  ["src/renderer/index.html", "id=\"clear-personal-vocabulary\""],
  ["src/renderer/index.html", "id=\"retry-personal-vocabulary\""],
  ["src/renderer/index.html", "data-presentation-key=\"palette.title\""],
  ["src/renderer/index.html", "data-presentation-key=\"palette.regex.dialogLabel\""],
  ["src/renderer/index.html", "data-presentation-key=\"notifications.regex.dialogLabel\""],
  ["src/renderer/index.html", "aria-keyshortcuts=\"Control+Shift+F\""],
  ["src/shared/desktop-presentation.ts", "\"settings.personalVocabulary.notice.rejected\": {"],
  ["src/shared/desktop-presentation.ts", "\"settings.personalVocabulary.notice.cacheRemovalFailed\": {"],
  ["src/shared/desktop-presentation.ts", "return `English: ${parts.english} · Cantonese: ${parts.cantonese}`;"],
  ["site/app/page.tsx", "function readLocalStorageValue(key: string):"],
  ["site/app/page.tsx", "if (!writeLocalStorageValue(PERSONAL_VOCABULARY_CACHE_KEY, serialized)) {"],
  ["site/app/page.tsx", "const [personalVocabularyRecoveryPending, setPersonalVocabularyRecoveryPending] = useState(false);"],
  ["site/app/page.tsx", "const retryPersonalVocabulary = () => {"],
  ["site/app/page.tsx", "function companionLanguageMode(settings: UniversalSettingsV1): UniversalLanguageMode {"],
  ["site/app/page.tsx", "function CompanionBilingualText("],
  ["site/app/page.tsx", "schoolSuppressed: true,"],
  ["site/app/page.tsx", "data-personal-vocabulary-boundary=\"ui\""],
  ["site/app/personal-vocabulary-boundary.tsx", "const declaredBoundary = props[\"data-personal-vocabulary-boundary\"] ?? \"ui\";"],
];

const sources = new Map();
for (const [path] of requiredMarkers) sources.set(path, await readText(path));

function assertSourceContract(currentSources) {
  for (const [path, marker] of requiredMarkers) {
    const source = currentSources.get(path) ?? "";
    assert.equal(countExactMarker(source, marker), 1, `desktop personal-vocabulary marker must have one exact boundary: ${path} :: ${marker}`);
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function exactMarkerPattern(marker, flags = "") {
  const leading = /^[A-Za-z0-9_$]/.test(marker) ? "(?<![A-Za-z0-9_$])" : "";
  const trailing = /[A-Za-z0-9_$]$/.test(marker) ? "(?![A-Za-z0-9_$])" : "";
  return new RegExp(`${leading}${escapeRegExp(marker)}${trailing}`, flags);
}

function countExactMarker(source, marker) {
  return source.match(exactMarkerPattern(marker, "g"))?.length ?? 0;
}

function removeExactMarker(source, marker) {
  const pattern = exactMarkerPattern(marker);
  const match = pattern.exec(source);
  assert.ok(match && match.index !== undefined, `cannot remove missing exact marker: ${marker}`);
  return source.slice(0, match.index) + source.slice(match.index + match[0].length);
}

assertSourceContract(sources);
for (const [path, marker] of requiredMarkers) {
  const removed = new Map(sources);
  removed.set(path, removeExactMarker(removed.get(path), marker));
  assert.throws(
    () => assertSourceContract(removed),
    /desktop personal-vocabulary marker/,
    `negative regression stayed green after removing ${path} :: ${marker}`,
  );
}

const rendererSource = sources.get("src/renderer/main.ts");
const desktopCacheRemovalFailureBoundary = `    applyPersonalVocabularyState(state);
    if (state.recovery === "malformed-cache-removal-failed") {
      scheduleUniversalSettingsSave();
      showSnackbar(presentDesktopCopy("settings.personalVocabulary.notice.cacheRemovalFailed", effectivePresentationSettings()), "warning");
      return;
    }`;
function assertDesktopCacheRemovalFailureBoundary(source) {
  assert.equal(
    countExactMarker(source, desktopCacheRemovalFailureBoundary),
    1,
    "desktop restore must clear and persist empty vocabulary state when malformed-cache removal fails",
  );
}
assertDesktopCacheRemovalFailureBoundary(rendererSource);
const disabledRendererBoundary = removeExactMarker(rendererSource, desktopCacheRemovalFailureBoundary);
assert.throws(
  () => assertDesktopCacheRemovalFailureBoundary(disabledRendererBoundary),
  /desktop restore must clear and persist empty vocabulary state/,
  "negative regression stayed green after disabling the renderer's malformed-cache recovery branch",
);
assertDesktopCacheRemovalFailureBoundary(rendererSource);

const settingsMarkup = sources.get("src/renderer/index.html");
const schoolSuppressibleMarker = "data-school-suppressible=\"true\"";
assert.equal(countExactMarker(settingsMarkup, schoolSuppressibleMarker), 5, "every language, tone, emoji, and vocabulary card must declare the School-mode suppression boundary");
const suppressionRemoved = new Map(sources);
suppressionRemoved.set("src/renderer/index.html", removeExactMarker(settingsMarkup, schoolSuppressibleMarker));
assert.throws(
  () => assert.equal(countExactMarker(suppressionRemoved.get("src/renderer/index.html"), schoolSuppressibleMarker), 5, "every language, tone, emoji, and vocabulary card must declare the School-mode suppression boundary"),
  /must declare the School-mode suppression boundary/,
  "negative regression stayed green after removing one exact School-mode suppression declaration",
);

assert.doesNotMatch(sources.get("src/main/personal-vocabulary-store.ts"), /fetch\s*\(/, "the desktop cache must not add network access");
for (const path of [
  "src/main/index.ts",
  "src/preload/index.ts",
  "src/renderer/main.ts",
  "src/shared/personal-vocabulary.ts",
  "site/app/page.tsx",
  "site/app/personal-vocabulary-boundary.tsx",
]) {
  assert.doesNotMatch(await readText(path), /\bfetch\s*\(|\bXMLHttpRequest\b|\bnavigator\.sendBeacon\b/, `${path} must keep the vocabulary path local-only`);
}

const fixture = {
  schemaVersion: 1,
  entries: [
    { source: "source label", replacement: "replacement label" },
    { source: "another source", replacement: "another replacement" },
  ],
};
const replacementFixture = {
  schemaVersion: 1,
  entries: [{ source: "second source", replacement: "second replacement" }],
};

const temporaryRoot = await mkdtemp(join(tmpdir(), "desktop-personal-vocabulary-"));
const userDataDirectory = join(temporaryRoot, "user-data");
const validPath = join(temporaryRoot, "valid.json");
const invalidPath = join(temporaryRoot, "invalid.json");
const oversizedPath = join(temporaryRoot, "oversized.json");
const cachePath = join(userDataDirectory, PERSONAL_VOCABULARY_CACHE_FILENAME);
const invalidUtf8Path = join(temporaryRoot, "invalid-utf8.json");

try {
  assert.deepEqual(await loadPersonalVocabulary(userDataDirectory), { status: "empty", entryCount: 0, entries: [] });

  await writeFile(validPath, JSON.stringify(fixture), "utf8");
  const loaded = await replacePersonalVocabulary(userDataDirectory, validPath);
  assert.equal(loaded.status, "loaded");
  assert.equal(loaded.entryCount, 2);
  assert.equal(loaded.entries[0]?.source, "source label");
  const persisted = JSON.parse(await readFile(cachePath, "utf8"));
  assert.deepEqual(Object.keys(persisted).sort(), ["entries", "schemaVersion"], "cache must not persist source-path metadata");
  assert.deepEqual(await loadPersonalVocabulary(userDataDirectory), loaded);

  await writeFile(validPath, JSON.stringify(replacementFixture), "utf8");
  const replaced = await replacePersonalVocabulary(userDataDirectory, validPath);
  assert.deepEqual(replaced.entries, replacementFixture.entries, "valid replacement must become the active cache");
  assert.deepEqual(await loadPersonalVocabulary(userDataDirectory), replaced);

  await writeFile(invalidPath, JSON.stringify({
    schemaVersion: 1,
    entries: [...replacementFixture.entries, { source: "partial source", replacement: "partial replacement", extra: true }],
  }), "utf8");
  await assert.rejects(() => replacePersonalVocabulary(userDataDirectory, invalidPath), /rejected/);
  assert.deepEqual(await loadPersonalVocabulary(userDataDirectory), replaced, "invalid replacement must preserve the previous cache");

  await writeFile(oversizedPath, "x".repeat(PERSONAL_VOCABULARY_LIMITS.maxBytes + 1), "utf8");
  await assert.rejects(() => replacePersonalVocabulary(userDataDirectory, oversizedPath), /rejected/);
  assert.deepEqual(await loadPersonalVocabulary(userDataDirectory), replaced, "oversized replacement must preserve the previous cache");

  await writeFile(invalidUtf8Path, Buffer.from([0xc3, 0x28]));
  await assert.rejects(() => replacePersonalVocabulary(userDataDirectory, invalidUtf8Path), /rejected/);
  assert.deepEqual(await loadPersonalVocabulary(userDataDirectory), replaced, "invalid UTF-8 replacement must preserve the previous cache");

  await rm(cachePath);
  await mkdir(cachePath);
  await assert.rejects(
    () => loadPersonalVocabulary(userDataDirectory),
    /previous valid cache remains active/,
    "transient cache I/O must be distinguishable from corruption and preserve the previous valid state",
  );
  await rm(cachePath, { recursive: true, force: true });
  await replacePersonalVocabulary(userDataDirectory, validPath);

  await writeFile(cachePath, "{malformed", "utf8");
  assert.deepEqual(await loadPersonalVocabulary(userDataDirectory), { status: "empty", entryCount: 0, entries: [] }, "corrupt cache must fail closed");
  await assert.rejects(() => readFile(cachePath), "corrupt cache should be removed after fail-closed load");

  await writeFile(cachePath, Buffer.from([0xc3, 0x28]));
  assert.deepEqual(await loadPersonalVocabulary(userDataDirectory), { status: "empty", entryCount: 0, entries: [] }, "invalid UTF-8 cache must fail closed as corruption");
  await assert.rejects(() => readFile(cachePath), "invalid UTF-8 cache should be removed after fail-closed load");

  await writeFile(cachePath, "x".repeat(PERSONAL_VOCABULARY_LIMITS.maxBytes + 1), "utf8");
  assert.deepEqual(await loadPersonalVocabulary(userDataDirectory), { status: "empty", entryCount: 0, entries: [] }, "oversized cache must fail closed as corruption");
  await assert.rejects(() => readFile(cachePath), "oversized cache should be removed after fail-closed load");

  await replacePersonalVocabulary(userDataDirectory, validPath);
  await writeFile(cachePath, "{malformed", "utf8");
  const removalFailure = await loadPersonalVocabulary(userDataDirectory, {
    removeMalformedCache: async () => {
      throw new Error("simulated malformed-cache removal failure");
    },
  });
  assert.deepEqual(
    removalFailure,
    { status: "empty", entryCount: 0, entries: [], recovery: "malformed-cache-removal-failed" },
    "malformed-cache removal failure must fail closed with an explicit recovery state",
  );
  assert.equal(await readFile(cachePath, "utf8"), "{malformed", "the regression must exercise a failed removal rather than a successful deletion");
  await rm(cachePath, { force: true });

  await writeFile(cachePath, "{malformed", "utf8");
  const replacementDuringRemoval = await loadPersonalVocabulary(userDataDirectory, {
    removeMalformedCache: async () => {
      await writeFile(cachePath, JSON.stringify({ schemaVersion: 1, entries: replacementFixture.entries }), "utf8");
    },
  });
  assert.deepEqual(
    replacementDuringRemoval.entries,
    replacementFixture.entries,
    "a valid cache replacement that arrives during malformed-cache cleanup must survive the recovery re-read",
  );
  await rm(cachePath, { force: true });

  await replacePersonalVocabulary(userDataDirectory, validPath);
  assert.deepEqual(await clearPersonalVocabulary(userDataDirectory), { status: "empty", entryCount: 0, entries: [] });
  assert.deepEqual(await loadPersonalVocabulary(userDataDirectory), { status: "empty", entryCount: 0, entries: [] }, "clear must restore the empty original-wording state");
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}

console.log(`PASS: desktop personal-vocabulary picker bridge, bounded atomic cache, replace/clear behavior, and ${requiredMarkers.length} exact negative regressions`);
