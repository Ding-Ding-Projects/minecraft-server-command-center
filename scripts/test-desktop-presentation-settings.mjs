import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  decorateDialogMessage,
  presentDesktopCopy,
  presentDesktopCopyParts,
  presentDialogCopy,
} from "../src/shared/desktop-presentation.ts";
import { DEFAULT_UNIVERSAL_SETTINGS, normalizeUniversalSettings } from "../src/shared/universal-contracts.ts";

const repositoryRoot = resolve(process.cwd());
const readText = async (path) => (await readFile(resolve(repositoryRoot, path), "utf8")).replace(/\r\n/g, "\n");

const requiredMarkers = [
  ["src/shared/desktop-presentation.ts", "export function presentDesktopCopy("],
  ["src/shared/desktop-presentation.ts", "export function presentDesktopCopyParts("],
  ["src/shared/desktop-presentation.ts", "export function presentDialogCopy("],
  ["src/shared/desktop-presentation.ts", "export function decorateDialogMessage("],
  ["src/renderer/main.ts", "function applyDesktopPresentation(): void {"],
  ["src/renderer/main.ts", "applyDesktopPresentation();"],
  ["src/renderer/main.ts", "writeUniversalSettingsStatus(\"settings.status.pending\");"],
  ["src/renderer/main.ts", "title: presentUserCopy(\"notification.title\"),"],
  ["src/renderer/main.ts", "plainStatus: presentUserCopy(\"palette.regex.plainStatus\")"],
  ["src/renderer/main.ts", "function effectivePresentationSettings(): UniversalSettingsV1 {"],
  ["src/renderer/main.ts", "document.documentElement.lang = settings.languageMode === \"cantonese\""],
  ["src/renderer/main.ts", "english.lang = \"en\";"],
  ["src/renderer/main.ts", "cantonese.lang = \"zh-Hant-HK\";"],
  ["src/renderer/main.ts", "bindOfflineDocumentation(userCopy);"],
  ["src/renderer/offline-documentation.ts", "function applyRenderedCopy(root: HTMLElement, copy: CopyText): void {"],
  ["src/renderer/main.ts", "detail: userCopy(decorateDialogMessage(message, effectivePresentationSettings())),"],
  ["src/renderer/index.html", "<h3 data-presentation-key=\"settings.language.title\">"],
  ["src/renderer/index.html", "data-presentation-key=\"settings.language.option.english\""],
  ["src/renderer/index.html", "data-presentation-key=\"settings.language.option.cantonese\""],
  ["src/renderer/index.html", "data-presentation-key=\"settings.language.option.bilingual\""],
  ["src/renderer/index.html", "data-universal-setting=\"funnyLevelEnglish\""],
  ["src/renderer/index.html", "data-universal-setting=\"funnyLevelCantonese\""],
  ["src/renderer/index.html", "data-universal-setting=\"showEmojisInDialogs\""],
  ["src/renderer/index.html", "data-presentation-key=\"settings.emoji.toggle\""],
  ["src/renderer/index.html", "data-presentation-key=\"palette.title\""],
  ["src/renderer/index.html", "data-presentation-key=\"palette.regex.dialogLabel\""],
  ["src/renderer/index.html", "data-presentation-key=\"notifications.regex.dialogLabel\""],
  ["src/main/universal-settings-store.ts", "export async function saveUniversalSettings("],
  ["src/main/universal-settings-store.ts", "const parsed = parseUniversalSettings(value);"],
  ["src/main/universal-settings-store.ts", "await writeFile(temporary, JSON.stringify(normalized, null, 2) + \"\\n\", { encoding: \"utf8\", mode: 0o600 });"],
  ["src/main/index.ts", "const persistedSettings = await loadUniversalSettings(app.getPath(\"userData\"));"],
  ["src/main/index.ts", "funnyLevelEnglish: persistedSettings.funnyLevelEnglish,"],
  ["src/main/index.ts", "funnyLevelCantonese: persistedSettings.funnyLevelCantonese,"],
];

const sources = new Map();
for (const [path] of requiredMarkers) sources.set(path, await readText(path));

function assertSourceContract(currentSources) {
  for (const [path, marker] of requiredMarkers) {
    const source = currentSources.get(path) ?? "";
    assert.equal(countExactMarker(source, marker), 1, `desktop presentation marker must have one exact boundary: ${path} :: ${marker}`);
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
    /desktop presentation marker/,
    `negative regression stayed green after removing ${path} :: ${marker}`,
  );
}

const rendererMarkup = sources.get("src/renderer/index.html");
const schoolSuppressibleMarker = "data-school-suppressible=\"true\"";
assert.equal(countExactMarker(rendererMarkup, schoolSuppressibleMarker), 5, "presentation settings must mark every suppressible School-mode card");
const suppressionRemoved = new Map(sources);
suppressionRemoved.set("src/renderer/index.html", removeExactMarker(rendererMarkup, schoolSuppressibleMarker));
assert.throws(
  () => assert.equal(countExactMarker(suppressionRemoved.get("src/renderer/index.html"), schoolSuppressibleMarker), 5, "presentation settings must mark every suppressible School-mode card"),
  /presentation settings must mark every suppressible School-mode card/,
  "negative regression stayed green after removing one exact School-mode card declaration",
);

const englishSerious = normalizeUniversalSettings({
  ...DEFAULT_UNIVERSAL_SETTINGS,
  languageMode: "english",
  funnyLevelEnglish: 1,
  funnyLevelCantonese: 5,
});
const englishPlayful = normalizeUniversalSettings({
  ...englishSerious,
  funnyLevelEnglish: 5,
});
const cantoneseSerious = normalizeUniversalSettings({
  ...DEFAULT_UNIVERSAL_SETTINGS,
  languageMode: "cantonese",
  funnyLevelEnglish: 5,
  funnyLevelCantonese: 1,
});
const cantonesePlayful = normalizeUniversalSettings({
  ...cantoneseSerious,
  funnyLevelCantonese: 5,
});
const bilingual = normalizeUniversalSettings({
  ...DEFAULT_UNIVERSAL_SETTINGS,
  languageMode: "bilingual",
  funnyLevelEnglish: 5,
  funnyLevelCantonese: 1,
});

assert.notEqual(
  presentDesktopCopy("settings.englishFunny.description", englishSerious),
  presentDesktopCopy("settings.englishFunny.description", englishPlayful),
  "English funny level must change English copy",
);
assert.notEqual(
  presentDesktopCopy("settings.cantoneseFunny.description", cantoneseSerious),
  presentDesktopCopy("settings.cantoneseFunny.description", cantonesePlayful),
  "Cantonese funny level must change Cantonese copy",
);
assert.match(presentDesktopCopy("settings.language.description", bilingual), /English:/);
assert.match(presentDesktopCopy("settings.language.description", bilingual), /Cantonese:/);
assert.match(presentDesktopCopy("settings.language.description", bilingual), /選擇英文|選英文/);
assert.match(presentDesktopCopy("settings.language.option.cantonese", cantonesePlayful), /廣東話/);
const bilingualParts = presentDesktopCopyParts("settings.language.description", bilingual);
assert.equal(bilingualParts.languageMode, "bilingual");
assert.notEqual(bilingualParts.english, bilingualParts.cantonese, "bilingual semantic parts must retain distinct language strings");

const emojiOn = normalizeUniversalSettings({ ...DEFAULT_UNIVERSAL_SETTINGS, showEmojisInDialogs: true });
const emojiOff = normalizeUniversalSettings({ ...DEFAULT_UNIVERSAL_SETTINGS, showEmojisInDialogs: false });
assert.match(presentDialogCopy("settings.status.saved", emojiOn), /^✅ /);
assert.doesNotMatch(presentDialogCopy("settings.status.saved", emojiOff), /✅/);
assert.match(decorateDialogMessage("A factual message.", emojiOn), /^💬 /);
assert.equal(decorateDialogMessage("A factual message.", emojiOff), "A factual message.");

const independent = normalizeUniversalSettings({
  ...DEFAULT_UNIVERSAL_SETTINGS,
  languageMode: "bilingual",
  funnyLevelEnglish: 1,
  funnyLevelCantonese: 5,
  showEmojisInDialogs: false,
});
const independentCopy = presentDesktopCopy("settings.cantoneseFunny.description", independent);
assert.match(independentCopy, /facts and recovery choices stay clear|笑位可以出場/);
assert.doesNotMatch(independentCopy, /tiny settings clerk/);

console.log(`PASS: desktop presentation settings, persistence registrations, three language modes, independent funny levels, dialog emoji policy, and ${requiredMarkers.length} exact negative regressions`);
