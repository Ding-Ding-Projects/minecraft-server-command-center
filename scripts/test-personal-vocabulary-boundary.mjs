import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parsePersonalVocabularyJson } from "../src/shared/universal-contracts.ts";
import { applyPersonalVocabularyReplacements } from "../src/shared/personal-vocabulary.ts";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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
    "Open Overview at https://example.test/Overview; edit server.properties; C:\\Projects\\Overview; v0.1.33; Release",
    parsed.value.entries,
  ),
  "Open Personal landing at https://example.test/Overview; edit server.properties; C:\\Projects\\Overview; v0.1.33; Build",
  "only ordinary UI copy should be replaced",
);

assert.equal(
  applyPersonalVocabularyReplacements("A B", parsed.value.entries),
  "B C",
  "replacement output must not cascade through another source entry",
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

const pageSource = fs.readFileSync(path.join(repoRoot, "site", "app", "page.tsx"), "utf8");
const boundarySource = fs.readFileSync(path.join(repoRoot, "site", "app", "personal-vocabulary-boundary.tsx"), "utf8");
assert.match(pageSource, /PersonalVocabularyBoundary entries=\{personalVocabularyEntries\}/, "Home must register the private text boundary");
assert.match(pageSource, /setPersonalVocabularyEntries\(\[\]\)/, "clear/reset must remove active replacements in memory");
assert.match(pageSource, /parsePersonalVocabularyJson\(cachedVocabulary\)/, "cache restore must revalidate before application");
assert.match(pageSource, /const serialized = JSON\.stringify\(result\.value\);\s+window\.localStorage\.setItem\(PERSONAL_VOCABULARY_CACHE_KEY, serialized\);\s+setPersonalVocabularyEntries\(result\.value\.entries\);/, "cache must be written before the new entry set becomes active");
assert.match(pageSource, /The previous vocabulary remains active\./, "a read or cache failure must preserve the previous valid entry set");
assert.match(boundarySource, /PROTECTED_TAGS = new Set\(\["code", "pre", "kbd"/, "code-like elements must be protected");
assert.match(boundarySource, /aria-label.*aria-description.*alt.*placeholder.*title/, "accessible user-facing attributes must share the boundary");
assert.doesNotMatch(pageSource, /fetch\s*\(/, "the companion boundary must not add network access");

console.log("PASS: personal-vocabulary private text boundary and negative regressions");
