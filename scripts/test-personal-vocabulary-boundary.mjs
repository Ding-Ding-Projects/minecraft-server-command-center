import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parsePersonalVocabularyJson } from "../src/shared/universal-contracts.ts";
import { applyPersonalVocabularyReplacements } from "../src/shared/personal-vocabulary.ts";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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

const parsed = parsePersonalVocabularyJson(JSON.stringify({
  schemaVersion: 1,
  entries: [
    { source: "Overview", replacement: "Personal landing" },
    { source: "Release", replacement: "Build" },
    { source: "server", replacement: "private" },
    { source: "A", replacement: "B" },
    { source: "B", replacement: "C" },
  ],
}));
assert.equal(parsed.ok, true, "the fixture vocabulary must use the validated schema");
if (!parsed.ok) throw new Error(parsed.reason);

assert.equal(
  applyPersonalVocabularyReplacements(
    "Open Overview at https://example.test/Overview?label=Overview#Overview; edit server.properties; \"/Users/Example Folder/Overview\"; \"C:\\Program Files\\Example Folder\\Overview\"; `Overview server`;\n$ java -jar server.jar Overview; settings.Overview; v0.1.33; Release\nRelease",
    parsed.value.entries,
  ),
  "Open Personal landing at https://example.test/Overview?label=Overview#Overview; edit server.properties; \"/Users/Example Folder/Overview\"; \"C:\\Program Files\\Example Folder\\Overview\"; `Overview server`;\n$ java -jar server.jar Overview; settings.Overview; v0.1.33; Release\nBuild",
  "ordinary UI copy should be replaced while spaced paths, URLs, commands, identifiers, code, versions, and factual records stay exact",
);

assert.equal(
  applyPersonalVocabularyReplacements("A B", parsed.value.entries),
  "B C",
  "replacement output must not cascade through another source entry",
);

assert.equal(
  applyPersonalVocabularyReplacements("Open C:\\Program Files\\Example Folder\\Overview; Overview", parsed.value.entries),
  "Open C:\\Program Files\\Example Folder\\Overview; Personal landing",
  "unquoted paths with spaces must remain intact while adjacent UI copy remains replaceable",
);

assert.equal(
  applyPersonalVocabularyReplacements("Open C:\\Program Files\\My,Folder;part\\Overview; Overview", parsed.value.entries),
  "Open C:\\Program Files\\My,Folder;part\\Overview; Personal landing",
  "unquoted paths with comma and semicolon characters must remain intact while adjacent UI copy remains replaceable",
);

for (const boundary of ["code", "command", "url", "identifier", "path", "external"]) {
  assert.equal(
    applyPersonalVocabularyReplacements("Overview server.properties", parsed.value.entries, { boundary }),
    "Overview server.properties",
    `${boundary} text must remain unchanged`,
  );
}

const original = "Overview Release";
assert.equal(
  applyPersonalVocabularyReplacements(original, [], {}),
  original,
  "an empty vocabulary is the clear/reset state and must restore shipped wording",
);
assert.equal(
  applyPersonalVocabularyReplacements(original, [
    { source: "Overview", replacement: "Private landing" },
    { source: "", replacement: "partial" },
  ]),
  original,
  "one malformed entry must invalidate the complete set instead of partially applying it",
);
const inheritedEntry = Object.create({ source: "Overview", replacement: "Private landing" });
assert.equal(
  applyPersonalVocabularyReplacements(original, [inheritedEntry]),
  original,
  "entries with inherited fields must fail closed instead of using prototype data",
);

const pageSource = fs.readFileSync(path.join(repoRoot, "site", "app", "page.tsx"), "utf8").replace(/\r\n/g, "\n");
const boundarySource = fs.readFileSync(path.join(repoRoot, "site", "app", "personal-vocabulary-boundary.tsx"), "utf8").replace(/\r\n/g, "\n");
const companionMarkers = [
  "PersonalVocabularyBoundary entries={universalSettings.schoolModeEnabled ? [] : personalVocabularyEntries}",
  "setPersonalVocabularyEntries([]);\n    setPersonalVocabularyRecoveryPending(false);\n    setUniversalSettings(DEFAULT_UNIVERSAL_SETTINGS);",
  "setPersonalVocabularyEntries([]);\n      setPersonalVocabularyRecoveryPending(false);\n      updateUniversalSettings(\"personalVocabulary\", { status: \"empty\", entryCount: 0 });",
  "parsePersonalVocabularyJson(cachedVocabulary)",
  "function readLocalStorageValue(key: string):",
  "function writeLocalStorageValue(key: string, value: string): boolean {",
  "function removeLocalStorageValue(key: string): boolean {",
  "The persisted vocabulary status and previous active wording remain unchanged.",
  "if (!writeLocalStorageValue(PERSONAL_VOCABULARY_CACHE_KEY, serialized)) {",
  "throw new Error(\"The local vocabulary cache could not be written. The previous vocabulary remains active.\");",
  "function companionLanguageMode(settings: UniversalSettingsV1): UniversalLanguageMode {",
  "function CompanionBilingualText(",
  "schoolSuppressed: true,",
  "data-personal-vocabulary-boundary=\"ui\"",
  "const declaredBoundary = props[\"data-personal-vocabulary-boundary\"] ?? \"ui\";",
  "English presentation is active. Unlock this setting to restore your saved preferences.",
];
const companionSources = new Map([["site/app/page.tsx", pageSource], ["site/app/personal-vocabulary-boundary.tsx", boundarySource]]);
for (const marker of companionMarkers) {
  const source = marker.includes("declaredBoundary") ? boundarySource : pageSource;
  assert.equal(countExactMarker(source, marker), 1, `companion vocabulary marker must have one exact boundary: ${marker}`);
}
for (const marker of companionMarkers) {
  const sourcePath = marker.includes("declaredBoundary") ? "site/app/personal-vocabulary-boundary.tsx" : "site/app/page.tsx";
  const removed = new Map(companionSources);
  removed.set(sourcePath, removeExactMarker(removed.get(sourcePath), marker));
  assert.throws(
    () => {
      for (const required of companionMarkers) {
        const requiredPath = required.includes("declaredBoundary") ? "site/app/personal-vocabulary-boundary.tsx" : "site/app/page.tsx";
        const requiredSource = removed.get(requiredPath);
        assert.equal(countExactMarker(requiredSource, required), 1, `companion vocabulary marker must have one exact boundary: ${required}`);
      }
    },
    /companion vocabulary marker/,
    `negative regression stayed green after removing ${sourcePath} :: ${marker}`,
  );
}

const companionMalformedCacheFailureBoundary = `          } catch {
            const recovery = projectPersonalVocabularyRecovery({ status: "empty", entryCount: 0, recovery: "malformed-cache-removal-failed" });
            setPersonalVocabularyRecoveryPending(recovery.retryAvailable);
            setPersonalVocabularyEntries([]);
            setUniversalSettings((current) => ({
              ...current,
              personalVocabulary: { status: recovery.status, entryCount: recovery.entryCount },
            }));
            publishNotice({ tone: "warning", title: "Personal vocabulary cache could not be cleared", detail: "The cached data was malformed, but the browser could not remove it. Original shipped wording is active; use Retry cache cleanup to try again." });
          }`;
function assertCompanionMalformedCacheFailureBoundary(source) {
  assert.equal(
    countExactMarker(source, companionMalformedCacheFailureBoundary),
    1,
    "companion cache restoration must clear in-memory and persisted vocabulary state when malformed-cache removal fails",
  );
}
assertCompanionMalformedCacheFailureBoundary(pageSource);
const disabledCompanionBoundary = removeExactMarker(pageSource, companionMalformedCacheFailureBoundary);
assert.throws(
  () => assertCompanionMalformedCacheFailureBoundary(disabledCompanionBoundary),
  /companion cache restoration must clear in-memory and persisted vocabulary state/,
  "negative regression stayed green after disabling the companion malformed-cache recovery branch",
);
assertCompanionMalformedCacheFailureBoundary(pageSource);

assert.doesNotMatch(pageSource, /if \(!vocabularyCacheAvailable\) \{\s*setPersonalVocabularyEntries\(\[\]\);/, "a transient browser-storage read failure must not clear in-memory vocabulary");
assert.equal(countExactMarker(boundarySource, "const PROTECTED_TAGS = new Set([\"code\", \"pre\", \"kbd\", \"samp\", \"output\", \"script\", \"style\"]);"), 1, "code-like elements must be protected");
assert.equal(countExactMarker(boundarySource, "const TRANSLATABLE_ATTRIBUTES = [\"aria-label\", \"aria-description\", \"alt\", \"placeholder\", \"title\"] as const;"), 1, "accessible user-facing attributes must share the boundary");
assert.equal(countExactMarker(boundarySource, "props[\"data-personal-vocabulary\"] === \"preserve\""), 1, "explicit factual text boundaries must be preservable by the companion renderer");
assert.doesNotMatch(pageSource, /English is forced and Cantonese, bilingual, funny-level, emoji, and private-vocabulary controls are omitted/, "School mode must not expose suppressed feature names in its active message");
assert.doesNotMatch(pageSource, /fetch\s*\(/, "the companion boundary must not add network access");
assert.doesNotMatch(boundarySource, /fetch\s*\(/, "the companion boundary must not add network access");

console.log("PASS: personal-vocabulary private text boundary and negative regressions");
