export const UNIVERSAL_SETTINGS_SCHEMA_VERSION = 1 as const;
export const PERSONAL_VOCABULARY_SCHEMA_VERSION = 1 as const;

export const UNIVERSAL_LANGUAGE_MODES = ["english", "cantonese", "bilingual"] as const;
export const UNIVERSAL_THEME_MODES = ["dark", "light"] as const;
export const UNIVERSAL_DENSITY_MODES = ["comfortable", "compact"] as const;
export const TAB_DOCK_POSITIONS = ["left", "right", "top", "bottom"] as const;
export const LOGO_PRESETS = ["default", "paper", "pixel"] as const;

export type UniversalLanguageMode = (typeof UNIVERSAL_LANGUAGE_MODES)[number];
export type UniversalThemeMode = (typeof UNIVERSAL_THEME_MODES)[number];
export type UniversalDensityMode = (typeof UNIVERSAL_DENSITY_MODES)[number];
export type TabDockPosition = (typeof TAB_DOCK_POSITIONS)[number];
export type LogoPreset = (typeof LOGO_PRESETS)[number];

export interface PersonalVocabularyStatus {
  readonly status: "empty" | "loaded";
  readonly entryCount: number;
}

export interface UniversalSettingsV1 {
  readonly schemaVersion: typeof UNIVERSAL_SETTINGS_SCHEMA_VERSION;
  readonly languageMode: UniversalLanguageMode;
  readonly funnyLevelEnglish: number;
  readonly funnyLevelCantonese: number;
  readonly showEmojisInDialogs: boolean;
  readonly schoolModeEnabled: boolean;
  readonly schoolModeName: string;
  readonly appDisplayName: string;
  readonly theme: UniversalThemeMode;
  readonly density: UniversalDensityMode;
  readonly seedColor: string;
  readonly logoPreset: LogoPreset;
  readonly customLogoStatus: "empty" | "loaded";
  readonly tabDock: TabDockPosition;
  readonly personalVocabulary: PersonalVocabularyStatus;
}

export const DEFAULT_UNIVERSAL_SETTINGS: UniversalSettingsV1 = {
  schemaVersion: UNIVERSAL_SETTINGS_SCHEMA_VERSION,
  languageMode: "english",
  funnyLevelEnglish: 2,
  funnyLevelCantonese: 3,
  showEmojisInDialogs: true,
  schoolModeEnabled: false,
  schoolModeName: "School mode",
  appDisplayName: "Minecraft Server Command Center",
  theme: "dark",
  density: "comfortable",
  seedColor: "#72F6B5",
  logoPreset: "default",
  customLogoStatus: "empty",
  tabDock: "left",
  personalVocabulary: { status: "empty", entryCount: 0 },
};

export const PERSONAL_VOCABULARY_LIMITS = {
  maxBytes: 64 * 1024,
  maxEntries: 128,
  maxStringLength: 160,
  maxNestingDepth: 4,
} as const;

const UNIVERSAL_SETTINGS_KEYS = [
  "schemaVersion",
  "languageMode",
  "funnyLevelEnglish",
  "funnyLevelCantonese",
  "showEmojisInDialogs",
  "schoolModeEnabled",
  "schoolModeName",
  "appDisplayName",
  "theme",
  "density",
  "seedColor",
  "logoPreset",
  "customLogoStatus",
  "tabDock",
  "personalVocabulary",
] as const;

const PERSONAL_VOCABULARY_STATUS_KEYS = ["status", "entryCount"] as const;

export interface PersonalVocabularyEntryV1 {
  readonly source: string;
  readonly replacement: string;
}

export interface PersonalVocabularyV1 {
  readonly schemaVersion: typeof PERSONAL_VOCABULARY_SCHEMA_VERSION;
  readonly entries: readonly PersonalVocabularyEntryV1[];
}

export type ValidationResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly reason: string };

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasUnsafeKey(value: string): boolean {
  return value === "__proto__" || value === "prototype" || value === "constructor";
}

function hasOnlyKeys(value: UnknownRecord, expected: readonly string[]): boolean {
  const allowed = new Set(expected);
  return Object.keys(value).every((key) => allowed.has(key) && !hasUnsafeKey(key));
}

function boundedText(value: unknown, fallback: string, maximum: number): string {
  if (typeof value !== "string") return fallback;
  return value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, maximum);
}

function enumValue<T extends readonly string[]>(value: unknown, values: T, fallback: T[number]): T[number] {
  return typeof value === "string" && values.includes(value as T[number]) ? value as T[number] : fallback;
}

function integerValue(value: unknown, fallback: number, minimum: number, maximum: number): number {
  const candidate = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(candidate)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.trunc(candidate)));
}

function booleanValue(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function isSafeColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}

export function normalizeUniversalSettings(value: unknown): UniversalSettingsV1 {
  const input = isRecord(value) ? value : {};
  const vocabulary = isRecord(input.personalVocabulary) ? input.personalVocabulary : {};
  const vocabularyStatus = vocabulary.status === "loaded" ? "loaded" : "empty";
  return {
    schemaVersion: UNIVERSAL_SETTINGS_SCHEMA_VERSION,
    languageMode: enumValue(input.languageMode, UNIVERSAL_LANGUAGE_MODES, DEFAULT_UNIVERSAL_SETTINGS.languageMode),
    funnyLevelEnglish: integerValue(input.funnyLevelEnglish, DEFAULT_UNIVERSAL_SETTINGS.funnyLevelEnglish, 1, 5),
    funnyLevelCantonese: integerValue(input.funnyLevelCantonese, DEFAULT_UNIVERSAL_SETTINGS.funnyLevelCantonese, 1, 5),
    showEmojisInDialogs: booleanValue(input.showEmojisInDialogs, DEFAULT_UNIVERSAL_SETTINGS.showEmojisInDialogs),
    schoolModeEnabled: booleanValue(input.schoolModeEnabled, DEFAULT_UNIVERSAL_SETTINGS.schoolModeEnabled),
    schoolModeName: boundedText(input.schoolModeName, DEFAULT_UNIVERSAL_SETTINGS.schoolModeName, 80) || DEFAULT_UNIVERSAL_SETTINGS.schoolModeName,
    appDisplayName: boundedText(input.appDisplayName, DEFAULT_UNIVERSAL_SETTINGS.appDisplayName, 100) || DEFAULT_UNIVERSAL_SETTINGS.appDisplayName,
    theme: enumValue(input.theme, UNIVERSAL_THEME_MODES, DEFAULT_UNIVERSAL_SETTINGS.theme),
    density: enumValue(input.density, UNIVERSAL_DENSITY_MODES, DEFAULT_UNIVERSAL_SETTINGS.density),
    seedColor: isSafeColor(input.seedColor) ? input.seedColor.toUpperCase() : DEFAULT_UNIVERSAL_SETTINGS.seedColor,
    logoPreset: enumValue(input.logoPreset, LOGO_PRESETS, DEFAULT_UNIVERSAL_SETTINGS.logoPreset),
    customLogoStatus: input.customLogoStatus === "loaded" ? "loaded" : "empty",
    tabDock: enumValue(input.tabDock, TAB_DOCK_POSITIONS, DEFAULT_UNIVERSAL_SETTINGS.tabDock),
    personalVocabulary: {
      status: vocabularyStatus,
      entryCount: integerValue(vocabulary.entryCount, 0, 0, PERSONAL_VOCABULARY_LIMITS.maxEntries),
    },
  };
}

export function parseUniversalSettings(value: unknown): ValidationResult<UniversalSettingsV1> {
  if (!isRecord(value) || value.schemaVersion !== UNIVERSAL_SETTINGS_SCHEMA_VERSION) {
    return { ok: false, reason: "The universal settings schema version is unsupported." };
  }
  if (!hasOnlyKeys(value, UNIVERSAL_SETTINGS_KEYS)) {
    return { ok: false, reason: "Universal settings contain an unexpected or unsafe field." };
  }
  if (value.personalVocabulary !== undefined
    && (!isRecord(value.personalVocabulary) || !hasOnlyKeys(value.personalVocabulary, PERSONAL_VOCABULARY_STATUS_KEYS))) {
    return { ok: false, reason: "Universal personal-vocabulary status contains an unexpected or unsafe field." };
  }
  return { ok: true, value: normalizeUniversalSettings(value) };
}

export function isUniversalSettings(value: unknown): value is UniversalSettingsV1 {
  return parseUniversalSettings(value).ok;
}

function skipWhitespace(text: string, start: number): number {
  let index = start;
  while (index < text.length && /\s/.test(text[index] ?? "")) index += 1;
  return index;
}

function scanString(text: string, start: number): number {
  if (text[start] !== '"') throw new Error("A JSON object key or string is malformed.");
  let index = start + 1;
  while (index < text.length) {
    const character = text[index];
    if (character === "\\") {
      index += 2;
      continue;
    }
    if (character === '"') return index + 1;
    index += 1;
  }
  throw new Error("A JSON string is unterminated.");
}

function scanValue(text: string, start: number, depth: number): number {
  if (depth > PERSONAL_VOCABULARY_LIMITS.maxNestingDepth) {
    throw new Error("The JSON nesting limit was exceeded.");
  }
  const index = skipWhitespace(text, start);
  const character = text[index];
  if (character === '"') return scanString(text, index);
  if (character === "{") {
    const keys = new Set<string>();
    let cursor = skipWhitespace(text, index + 1);
    if (text[cursor] === "}") return cursor + 1;
    while (cursor < text.length) {
      cursor = skipWhitespace(text, cursor);
      const keyStart = cursor;
      cursor = scanString(text, cursor);
      const key = JSON.parse(text.slice(keyStart, cursor)) as unknown;
      if (typeof key !== "string" || hasUnsafeKey(key)) throw new Error("An unsafe JSON object key was rejected.");
      if (keys.has(key)) throw new Error("Duplicate JSON object keys are not accepted.");
      keys.add(key);
      cursor = skipWhitespace(text, cursor);
      if (text[cursor] !== ":") throw new Error("A JSON object key is missing its colon.");
      cursor = scanValue(text, cursor + 1, depth + 1);
      cursor = skipWhitespace(text, cursor);
      if (text[cursor] === "}") return cursor + 1;
      if (text[cursor] !== ",") throw new Error("A JSON object is missing a comma.");
      cursor += 1;
    }
    throw new Error("A JSON object is unterminated.");
  }
  if (character === "[") {
    let cursor = skipWhitespace(text, index + 1);
    if (text[cursor] === "]") return cursor + 1;
    while (cursor < text.length) {
      cursor = scanValue(text, cursor, depth + 1);
      cursor = skipWhitespace(text, cursor);
      if (text[cursor] === "]") return cursor + 1;
      if (text[cursor] !== ",") throw new Error("A JSON array is missing a comma.");
      cursor += 1;
    }
    throw new Error("A JSON array is unterminated.");
  }
  const literalMatch = text.slice(index).match(/^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/);
  if (!literalMatch) throw new Error("A JSON value is malformed.");
  return index + literalMatch[0].length;
}

function assertNoDuplicateKeys(text: string): void {
  const end = scanValue(text, 0, 0);
  if (skipWhitespace(text, end) !== text.length) throw new Error("Trailing JSON content is not accepted.");
}

function validateVocabularyValue(value: unknown, requireNonEmpty: boolean): value is string {
  return typeof value === "string"
    && (!requireNonEmpty || value.length > 0)
    && value.length <= PERSONAL_VOCABULARY_LIMITS.maxStringLength
    && !/[\u0000-\u001f\u007f]/.test(value);
}

export function parsePersonalVocabularyJson(text: string): ValidationResult<PersonalVocabularyV1> {
  const bytes = new TextEncoder().encode(text).byteLength;
  if (bytes <= 0 || bytes > PERSONAL_VOCABULARY_LIMITS.maxBytes) {
    return { ok: false, reason: "The vocabulary file is empty or exceeds the 64 KiB limit." };
  }
  try {
    assertNoDuplicateKeys(text);
    const parsed = JSON.parse(text) as unknown;
    if (!isRecord(parsed) || !hasOnlyKeys(parsed, ["schemaVersion", "entries"])) {
      throw new Error("The vocabulary file must contain only schemaVersion and entries.");
    }
    if (parsed.schemaVersion !== PERSONAL_VOCABULARY_SCHEMA_VERSION) {
      throw new Error("The vocabulary schema version is unsupported.");
    }
    if (!Array.isArray(parsed.entries) || parsed.entries.length > PERSONAL_VOCABULARY_LIMITS.maxEntries) {
      throw new Error("The vocabulary entry count exceeds the bounded limit.");
    }
    const sourceKeys = new Set<string>();
    const entries = parsed.entries.map((entry) => {
      if (!isRecord(entry) || !hasOnlyKeys(entry, ["source", "replacement"])) {
        throw new Error("Each vocabulary entry must contain only source and replacement.");
      }
      if (!validateVocabularyValue(entry.source, true) || !validateVocabularyValue(entry.replacement, false)) {
        throw new Error("Vocabulary source must be non-empty and replacement must be a bounded string.");
      }
      if (sourceKeys.has(entry.source)) throw new Error("Vocabulary source values must be unique.");
      sourceKeys.add(entry.source);
      return { source: entry.source, replacement: entry.replacement };
    });
    return { ok: true, value: { schemaVersion: PERSONAL_VOCABULARY_SCHEMA_VERSION, entries } };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : "The vocabulary file could not be validated." };
  }
}

export function testBoundedPattern(pattern: string, flags: string, text: string): ValidationResult<boolean> {
  if (pattern.length > 160 || flags.length > 8) return { ok: false, reason: "The pattern or flags exceed the local bound." };
  try {
    return { ok: true, value: new RegExp(pattern, flags.replace(/[^im]/g, "")).test(text) };
  } catch {
    return { ok: false, reason: "The regular expression is invalid for the local JavaScript engine." };
  }
}
