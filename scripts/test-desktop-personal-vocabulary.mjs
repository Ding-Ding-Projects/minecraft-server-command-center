import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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
  ["src/shared/desktop-api.ts", "readonly personalVocabulary: {"],
  ["src/preload/index.ts", "personalVocabulary: {"],
  ["src/main/index.ts", "ipcMain.handle(\"personal-vocabulary:choose\""],
  ["package.json", "\"test:desktop-personal-vocabulary\": \"node --experimental-strip-types scripts/test-desktop-personal-vocabulary.mjs\""],
  ["src/renderer/main.ts", "function restorePersonalVocabulary(): Promise<void> {"],
  ["src/renderer/main.ts", "await restorePersonalVocabulary();"],
  ["src/renderer/main.ts", "applyPersonalVocabularyReplacements(text, personalVocabularyEntries"],
  ["src/renderer/main.ts", "function renderPersonalVocabularyControl(): void {"],
  ["src/renderer/index.html", "data-settings-label=\"Personal vocabulary\""],
  ["src/renderer/index.html", "id=\"choose-personal-vocabulary\""],
  ["src/renderer/index.html", "id=\"clear-personal-vocabulary\""],
  ["src/shared/desktop-presentation.ts", "\"settings.personalVocabulary.notice.rejected\": {"],
];

const sources = new Map();
for (const [path] of requiredMarkers) sources.set(path, await readText(path));

function assertSourceContract(currentSources) {
  for (const [path, marker] of requiredMarkers) {
    assert.ok(currentSources.get(path)?.includes(marker), `missing desktop personal-vocabulary marker: ${path} :: ${marker}`);
  }
}

assertSourceContract(sources);
for (const [path, marker] of requiredMarkers) {
  const removed = new Map(sources);
  removed.set(path, removed.get(path).replace(marker, ""));
  assert.throws(
    () => assertSourceContract(removed),
    /missing desktop personal-vocabulary marker/,
    `negative regression stayed green after removing ${path} :: ${marker}`,
  );
}

assert.doesNotMatch(sources.get("src/main/personal-vocabulary-store.ts"), /fetch\s*\(/, "the desktop cache must not add network access");

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

  await writeFile(cachePath, "{malformed", "utf8");
  assert.deepEqual(await loadPersonalVocabulary(userDataDirectory), { status: "empty", entryCount: 0, entries: [] }, "corrupt cache must fail closed");
  await assert.rejects(() => readFile(cachePath), "corrupt cache should be removed after fail-closed load");

  await replacePersonalVocabulary(userDataDirectory, validPath);
  assert.deepEqual(await clearPersonalVocabulary(userDataDirectory), { status: "empty", entryCount: 0, entries: [] });
  assert.deepEqual(await loadPersonalVocabulary(userDataDirectory), { status: "empty", entryCount: 0, entries: [] }, "clear must restore the empty original-wording state");
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}

console.log(`PASS: desktop personal-vocabulary picker bridge, bounded atomic cache, replace/clear behavior, and ${requiredMarkers.length} exact negative regressions`);
