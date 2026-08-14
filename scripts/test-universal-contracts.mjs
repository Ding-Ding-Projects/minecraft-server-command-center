import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  DEFAULT_UNIVERSAL_SETTINGS,
  normalizeUniversalSettings,
  parseUniversalSettings,
  parsePersonalVocabularyJson,
  testBoundedPattern,
} from "../src/shared/universal-contracts.ts";

const sourcePath = resolve(process.cwd(), "src/shared/universal-contracts.ts");
const source = await readFile(sourcePath, "utf8");

const requiredSourceMarkers = [
  "export const PERSONAL_VOCABULARY_LIMITS",
  "function assertNoDuplicateKeys",
  "function hasUnsafeKey",
  "export function parseUniversalSettings",
  "export function parsePersonalVocabularyJson",
  "export function testBoundedPattern",
];

function assertSourceContract(value) {
  for (const marker of requiredSourceMarkers) {
    assert.ok(value.includes(marker), `missing universal contract marker: ${marker}`);
  }
}

assertSourceContract(source);
for (const marker of requiredSourceMarkers) {
  const removed = source.replace(marker, "");
  assert.throws(() => assertSourceContract(removed), `negative regression stayed green after removing ${marker}`);
}

const valid = JSON.stringify({
  schemaVersion: 1,
  entries: [
    { source: "source label", replacement: "replacement label" },
    { source: "another source", replacement: "another replacement" },
  ],
});
const validResult = parsePersonalVocabularyJson(valid);
assert.equal(validResult.ok, true);
if (validResult.ok) assert.equal(validResult.value.entries.length, 2);
assert.equal(parsePersonalVocabularyJson(JSON.stringify({ schemaVersion: 1, entries: [{ source: "removable label", replacement: "" }] })).ok, true);

const rejectedInputs = [
  JSON.stringify({ schemaVersion: 1, entries: [{ source: "source label", replacement: "replacement label", extra: true }] }),
  JSON.stringify({ schemaVersion: 2, entries: [] }),
  '{"schemaVersion":1,"entries":[],"entries":[]}',
  '{"schemaVersion":1,"entries":[{"__proto__":"replacement label","source":"source label","replacement":"replacement label"}]}',
  JSON.stringify({ schemaVersion: 1, entries: [{ source: "source label", replacement: "replacement label" }], unexpected: true }),
  "{" + "x".repeat(70_000) + "}",
];
for (const input of rejectedInputs) assert.equal(parsePersonalVocabularyJson(input).ok, false);

const normalized = normalizeUniversalSettings({
  languageMode: "not-supported",
  funnyLevelEnglish: 99,
  funnyLevelCantonese: 0,
  theme: "light",
  density: "compact",
  seedColor: "#aabbcc",
  personalVocabulary: { status: "loaded", entryCount: 999 },
});
assert.equal(normalized.languageMode, DEFAULT_UNIVERSAL_SETTINGS.languageMode);
assert.equal(normalized.funnyLevelEnglish, 5);
assert.equal(normalized.funnyLevelCantonese, 1);
assert.equal(normalized.personalVocabulary.entryCount, 128);
assert.equal(normalized.seedColor, "#AABBCC");

assert.equal(parseUniversalSettings({ schemaVersion: 2 }).ok, false);
assert.equal(parseUniversalSettings({ schemaVersion: 1, unexpected: true }).ok, false);
assert.equal(parseUniversalSettings({ schemaVersion: 1, personalVocabulary: { status: "empty", entryCount: 0, extra: true } }).ok, false);
assert.equal(parseUniversalSettings(normalized).ok, true);

assert.equal(testBoundedPattern("^server", "i", "Server setup").ok, true);
assert.equal(testBoundedPattern("[", "i", "Server setup").ok, false);
assert.equal(testBoundedPattern("x".repeat(161), "i", "x").ok, false);

console.log("PASS: universal settings and personal vocabulary contract");
