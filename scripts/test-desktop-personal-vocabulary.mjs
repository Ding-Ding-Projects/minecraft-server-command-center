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
  ["src/main/personal-vocabulary-store.ts", "class VocabularyReadError extends Error"],
  ["src/main/personal-vocabulary-store.ts", "error.kind === \"unavailable\""],
  ["src/main/personal-vocabulary-store.ts", "if (error.kind === \"unavailable\") {\n      throw new Error(\"The local vocabulary cache could not be read; the previous valid cache remains active."],
  ["src/main/personal-vocabulary-store.ts", "The vocabulary cache is not valid UTF-8."],
  ["src/shared/desktop-api.ts", "readonly personalVocabulary: {"],
  ["src/shared/desktop-api.ts", "choose(languageMode?: UniversalLanguageMode)"],
  ["src/preload/index.ts", "personalVocabulary: {"],
  ["src/preload/index.ts", "load: () => ipcRenderer.invoke(\"personal-vocabulary:load\")"],
  ["src/preload/index.ts", "ipcRenderer.invoke(\"personal-vocabulary:choose\", languageMode)"],
  ["src/preload/index.ts", "clear: () => ipcRenderer.invoke(\"personal-vocabulary:clear\")"],
  ["src/main/index.ts", "ipcMain.handle(\"personal-vocabulary:load\", () => loadPersonalVocabulary(app.getPath(\"userData\"))"],
  ["src/main/index.ts", "ipcMain.handle(\"personal-vocabulary:choose\""],
  ["src/main/index.ts", "ipcMain.handle(\"personal-vocabulary:clear\", () => clearPersonalVocabulary(app.getPath(\"userData\"))"],
  ["src/main/index.ts", "presentDesktopCopy(\"settings.personalVocabulary.picker.title\""],
  ["package.json", "\"test:desktop-personal-vocabulary\": \"node --experimental-strip-types scripts/test-desktop-personal-vocabulary.mjs\""],
  ["src/renderer/main.ts", "function restorePersonalVocabulary(): Promise<void> {"],
  ["src/renderer/main.ts", "await window.commandCenter.personalVocabulary.load();"],
  ["src/renderer/main.ts", "await window.commandCenter.personalVocabulary.clear();"],
  ["src/renderer/main.ts", "await restorePersonalVocabulary();"],
  ["src/renderer/main.ts", "applyPersonalVocabularyReplacements(text, activePersonalVocabularyEntries(), { boundary: \"ui\" })"],
  ["src/renderer/main.ts", "function renderPersonalVocabularyControl(): void {"],
  ["src/renderer/main.ts", "function effectivePresentationSettings(): UniversalSettingsV1 {"],
  ["src/renderer/main.ts", "return universalSettings.schoolModeEnabled ? [] : personalVocabularyEntries;"],
  ["src/renderer/main.ts", "function commandPaletteCommandAvailable(command: CommandPaletteCommand): boolean {"],
  ["src/renderer/main.ts", "const previous = universalSettings.personalVocabulary;"],
  ["src/renderer/main.ts", "const languageMode = universalSettings.schoolModeEnabled ? \"english\" : universalSettings.languageMode;"],
  ["src/renderer/main.ts", "detail: userCopy(decorateDialogMessage(message, effectivePresentationSettings())),"],
  ["src/renderer/index.html", "data-settings-label=\"Personal vocabulary\""],
  ["src/renderer/index.html", "id=\"choose-personal-vocabulary\""],
  ["src/renderer/index.html", "id=\"clear-personal-vocabulary\""],
  ["src/renderer/index.html", "data-presentation-key=\"palette.title\""],
  ["src/renderer/index.html", "data-presentation-key=\"palette.regex.dialogLabel\""],
  ["src/renderer/index.html", "data-presentation-key=\"notifications.regex.dialogLabel\""],
  ["src/renderer/index.html", "aria-keyshortcuts=\"Control+Shift+F\""],
  ["src/shared/desktop-presentation.ts", "\"settings.personalVocabulary.notice.rejected\": {"],
  ["src/shared/desktop-presentation.ts", "English: ${english} · Cantonese: ${cantonese}"],
];

const sources = new Map();
for (const [path] of requiredMarkers) sources.set(path, await readText(path));

function assertSourceContract(currentSources) {
  for (const [path, marker] of requiredMarkers) {
    const source = currentSources.get(path) ?? "";
    assert.equal(source.split(marker).length - 1, 1, `desktop personal-vocabulary marker must have one exact boundary: ${path} :: ${marker}`);
  }
}

assertSourceContract(sources);
for (const [path, marker] of requiredMarkers) {
  const removed = new Map(sources);
  const source = removed.get(path);
  const index = source.indexOf(marker);
  removed.set(path, source.slice(0, index) + source.slice(index + marker.length));
  assert.throws(
    () => assertSourceContract(removed),
    /desktop personal-vocabulary marker/,
    `negative regression stayed green after removing ${path} :: ${marker}`,
  );
}

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
  assert.deepEqual(await clearPersonalVocabulary(userDataDirectory), { status: "empty", entryCount: 0, entries: [] });
  assert.deepEqual(await loadPersonalVocabulary(userDataDirectory), { status: "empty", entryCount: 0, entries: [] }, "clear must restore the empty original-wording state");
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}

console.log(`PASS: desktop personal-vocabulary picker bridge, bounded atomic cache, replace/clear behavior, and ${requiredMarkers.length} exact negative regressions`);
