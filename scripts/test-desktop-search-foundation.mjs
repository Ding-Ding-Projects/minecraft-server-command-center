import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  REGEX_SEARCH_LIMITS,
  boundedResultLimit,
  createBoundedSearchMatcher,
} from "../src/shared/regex-search.ts";

const repositoryRoot = resolve(process.cwd());
const readText = async (path) => (await readFile(resolve(repositoryRoot, path), "utf8")).replace(/\r\n/g, "\n");

const requiredMarkers = [
  ["src/shared/regex-search.ts", "export function createBoundedSearchMatcher("] ,
  ["src/renderer/regex-builder.ts", "export function bindAnchoredRegexBuilder("] ,
  ["src/renderer/main.ts", "bindAnchoredRegexBuilder({\n    id: \"settings\","] ,
  ["src/renderer/offline-documentation.ts", "bindAnchoredRegexBuilder({\n    id: \"offline-docs\","] ,
  ["src/renderer/main.ts", "bindAnchoredRegexBuilder({\n    id: \"command-palette\","] ,
  ["src/renderer/main.ts", "if (event.ctrlKey && event.shiftKey && event.key.toLocaleUpperCase() === \"F\") {"] ,
  ["src/renderer/main.ts", "function executeCommandPaletteCommand(command: CommandPaletteCommand): void {"] ,
  ["src/renderer/main.ts", "function commandPaletteCommandAvailable(command: CommandPaletteCommand): boolean {"] ,
  ["src/renderer/main.ts", "for (let current: HTMLElement | null = target; current; current = current.parentElement) {"] ,
  ["src/renderer/main.ts", "current.getAttribute(\"aria-disabled\") === \"true\""],
  ["src/renderer/main.ts", "current.hasAttribute(\"inert\") || current.hasAttribute(\"disabled\")"],
  ["src/renderer/main.ts", "const style = window.getComputedStyle(target);"],
  ["src/renderer/main.ts", "return style.display !== \"none\" && style.visibility !== \"hidden\" && style.visibility !== \"collapse\";"],
  ["src/renderer/main.ts", "if (!commandPaletteCommandAvailable(command)) {\n      openCommandPalette();"],
  ["src/renderer/index.html", "data-regex-builder-surface=\"offline-docs\""] ,
  ["src/renderer/index.html", "data-regex-builder-surface=\"settings\""] ,
  ["src/renderer/index.html", "data-regex-builder-surface=\"command-palette\""] ,
  ["src/renderer/index.html", "aria-keyshortcuts=\"Control+Shift+F\""] ,
];

const sources = new Map();
for (const [path] of requiredMarkers) {
  if (!sources.has(path)) sources.set(path, await readText(path));
}

function assertSourceContract(currentSources) {
  for (const [path, marker] of requiredMarkers) {
    assert.equal(countExactMarker(currentSources.get(path) ?? "", marker), 1, `missing desktop search foundation marker at its exact boundary: ${path} :: ${marker}`);
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
    /desktop search foundation marker/,
    `negative regression stayed green after removing ${path} :: ${marker}`,
  );
}

const plain = createBoundedSearchMatcher({ mode: "plain", query: "runtime" });
assert.equal(plain.ok, true);
if (plain.ok) {
  assert.equal(plain.value("Java runtime setup"), true);
  assert.equal(plain.value("Paper setup"), false);
}

const regex = createBoundedSearchMatcher({ mode: "regex", query: "", pattern: "^Runtime", flags: "i" });
assert.equal(regex.ok, true);
if (regex.ok) assert.equal(regex.value("Runtime guidance"), true);

assert.equal(createBoundedSearchMatcher({ mode: "regex", query: "", pattern: "[", flags: "i" }).ok, false);
assert.equal(createBoundedSearchMatcher({ mode: "regex", query: "", pattern: "x".repeat(REGEX_SEARCH_LIMITS.maxPatternCharacters + 1), flags: "i" }).ok, false);
assert.equal(createBoundedSearchMatcher({ mode: "plain", query: "x".repeat(REGEX_SEARCH_LIMITS.maxQueryCharacters + 1) }).ok, false);
assert.equal(createBoundedSearchMatcher({ mode: "regex", query: "", pattern: "runtime", flags: "g" }).ok, false);

const bounded = createBoundedSearchMatcher({ mode: "plain", query: "needle" });
assert.equal(bounded.ok, true);
if (bounded.ok) {
  assert.equal(bounded.value(`${"x".repeat(REGEX_SEARCH_LIMITS.maxCandidateCharacters)}needle`), false);
  assert.equal(bounded.value(`${"x".repeat(REGEX_SEARCH_LIMITS.maxCandidateCharacters - 6)}needle`), true);
}

assert.equal(boundedResultLimit(999), REGEX_SEARCH_LIMITS.maxResults);
assert.equal(boundedResultLimit(0), 1);

console.log(`PASS: desktop search foundation, ${requiredMarkers.length} exact negative regressions, shared regex bounds, and palette route`);
