import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  decorateDialogMessage,
  presentDesktopCopy,
  presentDialogCopy,
} from "../src/shared/desktop-presentation.ts";
import { DEFAULT_UNIVERSAL_SETTINGS, normalizeUniversalSettings } from "../src/shared/universal-contracts.ts";

const repositoryRoot = resolve(process.cwd());
const readText = async (path) => (await readFile(resolve(repositoryRoot, path), "utf8")).replace(/\r\n/g, "\n");

const requiredMarkers = [
  ["src/shared/desktop-presentation.ts", "export function presentDesktopCopy("],
  ["src/shared/desktop-presentation.ts", "export function presentDialogCopy("],
  ["src/shared/desktop-presentation.ts", "export function decorateDialogMessage("],
  ["src/renderer/main.ts", "function applyDesktopPresentation(): void {"],
  ["src/renderer/main.ts", "applyDesktopPresentation();"],
  ["src/renderer/main.ts", "writeUniversalSettingsStatus(\"settings.status.pending\");"],
  ["src/renderer/main.ts", "title: presentUserCopy(\"notification.title\"),"],
  ["src/renderer/main.ts", "plainStatus: presentUserCopy(\"palette.regex.plainStatus\")"],
  ["src/renderer/main.ts", "function effectivePresentationSettings(): UniversalSettingsV1 {"],
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
];

const sources = new Map();
for (const [path] of requiredMarkers) sources.set(path, await readText(path));

function assertSourceContract(currentSources) {
  for (const [path, marker] of requiredMarkers) {
    const source = currentSources.get(path) ?? "";
    assert.equal(source.split(marker).length - 1, 1, `desktop presentation marker must have one exact boundary: ${path} :: ${marker}`);
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
    /desktop presentation marker/,
    `negative regression stayed green after removing ${path} :: ${marker}`,
  );
}

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
