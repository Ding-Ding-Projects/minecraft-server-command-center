"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type CSSProperties, type ReactNode } from "react";
import {
  PLANNER_HANDOFF_FILENAME,
  PLANNER_HANDOFF_MAX_BYTES,
  createPlannerHandoff,
  isPlannerHandoffName,
  parsePlannerHandoffJson,
  previewPlannerHandoff,
  type PlannerHandoffV1
} from "../../src/shared/planner-handoff";
import {
  DEFAULT_UNIVERSAL_SETTINGS,
  LOGO_PRESETS,
  PERSONAL_VOCABULARY_LIMITS,
  TAB_DOCK_POSITIONS,
  parseUniversalSettings,
  parsePersonalVocabularyJson,
  type PersonalVocabularyEntryV1,
  type LogoPreset,
  type UniversalLanguageMode,
  type UniversalSettingsV1
} from "../../src/shared/universal-contracts";
import { PersonalVocabularyBoundary, usePersonalVocabularyEntries } from "./personal-vocabulary-boundary";
import {
  appendNotificationRecord,
  bulkDismissNotificationRecords,
  createNotificationRecord,
  dismissNotificationRecord,
  EMPTY_NOTIFICATION_CENTER,
  invertNotificationSelection,
  NOTIFICATION_STORAGE_KEY,
  parseNotificationCenter,
  serializeNotificationCenter,
  type NotificationRecord,
  type NotificationSelectScope,
  type NotificationView,
} from "./notification-center";
import { CHANGELOG_RELEASES, type ChangelogRelease } from "./changelog-data";

// The planner has no server data; emit its root route as static HTML.
export const dynamic = "force-static";

type ServerKind = "paper" | "spigot";
type GameVersion = "1.21.4" | "1.20.6" | "1.20.4";
type JavaVersion = "21" | "17";
type WorldPreset = "world" | "creative-lab" | "adventure-hub";
type PluginDirectory = "plugins" | "server-plugins" | "managed-plugins";
type ThemeMode = "dark" | "light";
type PageId =
  | "overview"
  | "configure"
  | "paper-cli"
  | "spigot-setup"
  | "runtime"
  | "safety"
  | "docs"
  | "release-status"
  | "changelog"
  | "notifications"
  | "settings";

type PlannerDraft = {
  serverName: string;
  kind: ServerKind;
  version: GameVersion;
  javaVersion: JavaVersion;
  memoryGiB: number;
  port: number;
  world: WorldPreset;
  eulaAccepted: boolean;
  onlineMode: boolean;
  rconEnabled: boolean;
  rconPort: number;
  pluginDirectory: PluginDirectory;
  theme: ThemeMode;
  seed: string;
};

type SearchState = {
  query: string;
  pattern: string;
  flags: string;
  regexMode: boolean;
  builderOpen: boolean;
};

type ChangelogPreset = "all" | "latest" | "last-30-days" | "current-year" | "custom";

type ChangelogDateValidation = {
  state: "empty" | "partial" | "invalid" | "valid";
  normalized?: string;
  message: string;
};

type Notice = Pick<NotificationRecord, "tone" | "title" | "detail">;

type HandoffStatus = {
  tone: "neutral" | "warning" | "success" | "info";
  message: string;
};

type VerifiedInstallerManifest = {
  releaseTag: string;
  sourceCommit: string;
  releaseUrl: string;
  assetName: string;
  assetUrl: string;
  assetSizeBytes: number;
  releasePublishedAt: string;
  unsigned: true;
};

const STORAGE_KEY = "minecraft-server-command-center.site.planner.v1";
const UNIVERSAL_STORAGE_KEY = "minecraft-server-command-center.site.universal.v1";
const PERSONAL_VOCABULARY_CACHE_KEY = "minecraft-server-command-center.site.personal-vocabulary.v1";
const SCHOOL_UNLOCK_KEY = "minecraft-server-command-center.site.school-unlock.sha256";
const CUSTOM_LOGO_CACHE_KEY = "minecraft-server-command-center.site.custom-logo.v1";
const MAX_CUSTOM_LOGO_BYTES = 512 * 1024;
const SEARCH_DEFAULT: SearchState = {
  query: "",
  pattern: "",
  flags: "i",
  regexMode: false,
  builderOpen: false,
};
const DEFAULT_DRAFT: PlannerDraft = {
  serverName: "My Minecraft Server",
  kind: "paper",
  version: "1.21.4",
  javaVersion: "21",
  memoryGiB: 4,
  port: 25565,
  world: "world",
  eulaAccepted: false,
  onlineMode: true,
  rconEnabled: false,
  rconPort: 25575,
  pluginDirectory: "plugins",
  theme: "dark",
  seed: "#72F6B5",
};

// This record is deliberately embedded. The site never asks GitHub which
// release is current, starts a transfer, or observes a download result.
const VERIFIED_INSTALLER: VerifiedInstallerManifest = {
  releaseTag: "v0.1.44",
  sourceCommit: "0888fa23289bbb58fd88c5455131a0eb1911da45",
  releaseUrl: "https://github.com/Ding-Ding-Projects/minecraft-server-command-center/releases/tag/v0.1.44",
  assetName: "Setup.exe",
  assetUrl:
    "https://github.com/Ding-Ding-Projects/minecraft-server-command-center/releases/download/v0.1.44/Setup.exe",
  assetSizeBytes: 140399616,
  releasePublishedAt: "2026-08-14T11:27:44Z",
  unsigned: true,
};

const PAGE_DEFINITIONS: Array<{
  id: PageId;
  label: string;
  eyebrow: string;
  description: string;
}> = [
  {
    id: "overview",
    label: "Overview",
    eyebrow: "Planner workspace",
    description: "A local-first plan for a guided Minecraft server setup.",
  },
  {
    id: "configure",
    label: "Configure",
    eyebrow: "Guided choices",
    description: "Set the safe, non-secret values that shape the desktop launch plan.",
  },
  {
    id: "paper-cli",
    label: "Paper CLI",
    eyebrow: "Read-only argv",
    description: "Review the typed Paper startup arguments; there is no editable command box.",
  },
  {
    id: "spigot-setup",
    label: "Spigot setup",
    eyebrow: "Guided desktop flow",
    description: "Understand how a Spigot plan transfers to the installed desktop application.",
  },
  {
    id: "runtime",
    label: "Runtime",
    eyebrow: "Java & memory",
    description: "See the runtime decisions and the exact compatibility checks behind them.",
  },
  {
    id: "safety",
    label: "Safety",
    eyebrow: "Before launch",
    description: "Review EULA, network exposure, RCON, and local-only boundaries.",
  },
  {
    id: "docs",
    label: "Docs",
    eyebrow: "Local guide",
    description: "Browse the source companion’s guide without reaching for a web search.",
  },
  {
    id: "release-status",
    label: "Release status",
    eyebrow: "Version-pinned installer handoff",
    description: "Review the embedded release record and open its exact Windows installer asset.",
  },
  {
    id: "changelog",
    label: "Changelog",
    eyebrow: "Factual release history",
    description: "Search, filter, copy, and export every released version recorded for this companion.",
  },
  {
    id: "notifications",
    label: "Notification centre",
    eyebrow: "Local notice history",
    description: "Review, dismiss, and bulk-manage non-blocking notices saved in this browser.",
  },
  {
    id: "settings",
    label: "Universal settings",
    eyebrow: "Local preferences",
    description: "Set language, tone, emoji, appearance, app display name, logo, tabs, and private local-data controls.",
  },
];

const VERSION_DETAILS: Record<GameVersion, { java: JavaVersion; note: string }> = {
  "1.21.4": { java: "21", note: "Java 21 is the compatible runtime for this preset." },
  "1.20.6": { java: "21", note: "Java 21 is the compatible runtime for this preset." },
  "1.20.4": { java: "17", note: "Java 17 is the compatible runtime for this preset." },
};

const WORLD_OPTIONS: Array<{ id: WorldPreset; label: string; detail: string }> = [
  { id: "world", label: "Standard world", detail: "The default survival-style world folder." },
  { id: "creative-lab", label: "Creative lab", detail: "A named local world preset for build experiments." },
  { id: "adventure-hub", label: "Adventure hub", detail: "A named local world preset for curated play." },
];

const PLUGIN_OPTIONS: Array<{
  id: PluginDirectory;
  label: string;
  detail: string;
}> = [
  { id: "plugins", label: "plugins/", detail: "Standard server-relative directory." },
  { id: "server-plugins", label: "server/plugins/", detail: "Nested project folder layout." },
  { id: "managed-plugins", label: "Managed plugins/", detail: "Desktop app-owned local directory." },
];

const SEED_PRESETS = ["#72F6B5", "#7CD5FF", "#F0D7A5", "#C7B7FF"];

const DOC_ITEMS = [
  {
    title: "Draft persistence",
    text: "This source stores only non-secret display choices and planner drafts in this browser. Clearing browser storage resets the draft.",
  },
  {
    title: "Desktop handoff",
    text: "The planner never starts a server. Copy its typed plan into the installed desktop application, where launch and protected configuration belong.",
  },
  {
    title: "Paper arguments",
    text: "Paper startup arguments are derived from guided version, Java, and memory choices. The command preview is intentionally read-only.",
  },
  {
    title: "Spigot setup",
    text: "Spigot preparation is represented as a desktop handoff plan. Build tooling, artifacts, and filesystem changes are not performed by this site.",
  },
  {
    title: "Network safety",
    text: "Port and online-mode choices are plans, not live network checks. RCON credentials are intentionally excluded from browser storage and this page.",
  },
  {
    title: "Installer handoff",
    text: "The release page embeds one verified version-pinned Setup.exe link. The browser does not look up releases, start a background transfer, or report installation completion.",
  },
];

function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}

function hexToRgb(value: string): string {
  if (!isHexColor(value)) return "RGB unavailable";
  const channels = [value.slice(1, 3), value.slice(3, 5), value.slice(5, 7)].map((channel) => Number.parseInt(channel, 16));
  return `rgb(${channels.join(", ")})`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function restoreDraft(value: string | null): PlannerDraft {
  if (!value) return DEFAULT_DRAFT;

  try {
    const saved = JSON.parse(value) as Partial<PlannerDraft>;
    const version: GameVersion = ["1.21.4", "1.20.6", "1.20.4"].includes(String(saved.version))
      ? (saved.version as GameVersion)
      : DEFAULT_DRAFT.version;
    return {
      serverName: isPlannerHandoffName(saved.serverName) ? saved.serverName : DEFAULT_DRAFT.serverName,
      kind: saved.kind === "spigot" ? "spigot" : "paper",
      version,
      javaVersion: saved.javaVersion === "17" ? "17" : "21",
      memoryGiB: clamp(Number(saved.memoryGiB) || DEFAULT_DRAFT.memoryGiB, 1, 32),
      port: clamp(Number(saved.port) || DEFAULT_DRAFT.port, 1, 65535),
      world: ["world", "creative-lab", "adventure-hub"].includes(String(saved.world))
        ? (saved.world as WorldPreset)
        : DEFAULT_DRAFT.world,
      eulaAccepted: Boolean(saved.eulaAccepted),
      onlineMode: saved.onlineMode !== false,
      rconEnabled: Boolean(saved.rconEnabled),
      rconPort: clamp(Number(saved.rconPort) || DEFAULT_DRAFT.rconPort, 1, 65535),
      pluginDirectory: ["plugins", "server-plugins", "managed-plugins"].includes(
        String(saved.pluginDirectory),
      )
        ? (saved.pluginDirectory as PluginDirectory)
        : DEFAULT_DRAFT.pluginDirectory,
      theme: saved.theme === "light" ? "light" : "dark",
      seed: isHexColor(saved.seed) ? saved.seed : DEFAULT_DRAFT.seed,
    };
  } catch {
    return DEFAULT_DRAFT;
  }
}

function makeArgv(draft: PlannerDraft, kind: ServerKind = draft.kind) {
  const launcher = kind === "paper" ? `paper-${draft.version}.jar` : `spigot-${draft.version}.jar`;
  return [
    "java",
    `-Xms${draft.memoryGiB}G`,
    `-Xmx${draft.memoryGiB}G`,
    "-jar",
    launcher,
    "--nogui",
  ];
}

function createBrowserPlannerHandoff(draft: PlannerDraft): PlannerHandoffV1 {
  return createPlannerHandoff({
    serverName: draft.serverName,
    serverKind: draft.kind,
    minecraftVersion: draft.version,
    javaRuntime: draft.javaVersion === "17" ? "java-17" : "java-21",
    memoryMiB: draft.memoryGiB * 1024,
    worldName: draft.world,
    eulaAcknowledged: draft.eulaAccepted,
    onlineMode: draft.onlineMode,
    port: draft.port,
    rconEnabled: draft.rconEnabled,
    rconPort: draft.rconPort,
  });
}

function applyPlannerHandoffToBrowserDraft(current: PlannerDraft, handoff: PlannerHandoffV1): PlannerDraft {
  const plan = handoff.plan;
  return {
    ...current,
    serverName: plan.serverName,
    kind: plan.serverKind,
    version: plan.minecraftVersion,
    javaVersion: plan.javaRuntime === "java-17" ? "17" : "21",
    memoryGiB: plan.memoryMiB / 1024,
    world: plan.worldName,
    eulaAccepted: plan.eulaAcknowledged,
    onlineMode: plan.onlineMode,
    port: plan.port,
    rconEnabled: plan.rconEnabled,
    rconPort: plan.rconPort,
  };
}

function testSearch(text: string, state: SearchState) {
  if (!state.regexMode) {
    return text.toLocaleLowerCase().includes(state.query.trim().toLocaleLowerCase());
  }

  if (!state.pattern) return true;
  try {
    return new RegExp(state.pattern, state.flags.replace(/[^im]/g, "")).test(text);
  } catch {
    return false;
  }
}

function validateChangelogDate(value: string): ChangelogDateValidation {
  const trimmed = value.trim();
  if (!trimmed) return { state: "empty", message: "No date entered." };

  let normalized = trimmed;
  const localeMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (localeMatch) {
    normalized = `${localeMatch[3]}-${localeMatch[1].padStart(2, "0")}-${localeMatch[2].padStart(2, "0")}`;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    const partial = /^(?:\d{0,4}(?:-\d{0,2}(?:-\d{0,2})?)?|\d{0,2}(?:\/\d{0,2}(?:\/\d{0,4})?)?)$/.test(trimmed);
    return {
      state: partial ? "partial" : "invalid",
      message: partial
        ? "Keep typing a date; filtering waits for a complete YYYY-MM-DD or MM/DD/YYYY value."
        : "Enter a date as YYYY-MM-DD or MM/DD/YYYY.",
    };
  }

  const [year, month, day] = normalized.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year
    || parsed.getUTCMonth() !== month - 1
    || parsed.getUTCDate() !== day
  ) {
    return { state: "invalid", message: "That date does not exist, so the filter was not applied." };
  }

  return { state: "valid", normalized, message: "Date accepted." };
}

function shiftChangelogDate(value: string, days: number) {
  const [year, month, day] = value.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day));
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return [
    String(shifted.getUTCFullYear()).padStart(4, "0"),
    String(shifted.getUTCMonth() + 1).padStart(2, "0"),
    String(shifted.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function formatChangelogDate(value: string) {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-CA", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  });
}

function renderChangelogMarkdown(entries: readonly ChangelogRelease[], filterSummary: string) {
  const lines = [
    "# Companion site changelog",
    "",
    `Filtered view: ${filterSummary}`,
    `Entries: ${entries.length}`,
    "",
  ];

  for (const release of entries) {
    lines.push(`## ${release.tag} · ${release.version}`, "", `Release date: ${release.releaseDate}`, `Source record: ${release.sourceRecord}`, "");
    for (const category of release.categories) {
      lines.push(`### ${category.label}`, "", ...category.items.map((item) => `- ${item}`), "");
    }
    lines.push("### Commit links", "", ...release.commits.map((commit) => `- [${commit.label}](${commit.url}) — ${commit.sha}`), "");
    lines.push("### Release records", "", ...release.links.map((link) => `- [${link.label}](${link.url})`), "");
  }

  return `${lines.join("\n")}\n`;
}

function matchesNotificationSearch(record: NotificationRecord, state: SearchState) {
  return testSearch(`${record.title} ${record.detail} ${record.tone}`, state);
}

async function sha256Text(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function tonePreview(language: UniversalLanguageMode, level: number): string {
  const english = level >= 4
    ? "The planner is wearing a tiny party hat, but the safety facts stay exactly where they belong."
    : level >= 2
      ? "The planner keeps the facts clear, with a small wink around the edges."
      : "The planner uses a direct, professional voice while preserving every safety fact.";
  const cantonese = level >= 4
    ? "個 planner 戴住細細頂派對帽，但安全資料一樣企得直直。"
    : level >= 2
      ? "個 planner 保持資料清楚，順手加少少笑位。"
      : "個 planner 用直接、專業嘅語氣，安全資料一字不漏。";
  if (language === "cantonese") return cantonese;
  if (language === "bilingual") return `${english} · ${cantonese}`;
  return english;
}

async function readCustomLogo(file: File): Promise<string> {
  if (file.size <= 0 || file.size > MAX_CUSTOM_LOGO_BYTES) {
    throw new Error("Choose a non-empty PNG or JPEG image no larger than 512 KiB.");
  }
  if (file.type !== "image/png" && file.type !== "image/jpeg") {
    throw new Error("Only PNG and JPEG custom logos are accepted in this local image boundary.");
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const png = bytes.length >= 8 && bytes.slice(0, 8).every((value, index) => value === [137, 80, 78, 71, 13, 10, 26, 10][index]);
  const jpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (!png && !jpeg) throw new Error("The selected file did not contain a recognised PNG or JPEG signature.");
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("The logo could not be read locally.")));
    reader.addEventListener("error", () => reject(new Error("The logo could not be read locally.")));
    reader.readAsDataURL(file);
  });
  await new Promise<void>((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => {
      if (image.naturalWidth <= 0 || image.naturalHeight <= 0 || image.naturalWidth > 4096 || image.naturalHeight > 4096) {
        reject(new Error("The logo dimensions must be between 1 and 4096 pixels on each axis."));
        return;
      }
      resolve();
    });
    image.addEventListener("error", () => reject(new Error("The selected image could not be decoded locally.")));
    image.src = dataUrl;
  });
  return dataUrl;
}

function regexError(state: SearchState) {
  if (!state.regexMode || !state.pattern) return "";
  try {
    new RegExp(state.pattern, state.flags.replace(/[^im]/g, ""));
    return "";
  } catch (error) {
    return error instanceof Error ? error.message : "This regular expression is not valid.";
  }
}

function RegexBuilder({
  id,
  state,
  onChange,
}: {
  id: string;
  state: SearchState;
  onChange: (next: SearchState) => void;
}) {
  const error = regexError(state);
  const entries = usePersonalVocabularyEntries();
  const addToken = (token: string) => {
    onChange({ ...state, regexMode: true, pattern: `${state.pattern}${token}`.slice(0, 160) });
  };

  return (
    <PersonalVocabularyBoundary entries={entries}>
      <div className="regex-builder" id={`${id}-builder`} aria-label="Regular expression builder">
      <div className="regex-builder__heading">
        <div>
          <p className="eyebrow">Local pattern builder</p>
          <strong>Build a bounded search pattern</strong>
        </div>
        <label className="switch-row switch-row--compact">
          <span>Use regex</span>
          <input
            type="checkbox"
            checked={state.regexMode}
            onChange={(event) => onChange({ ...state, regexMode: event.target.checked })}
          />
          <span className="switch-track" aria-hidden="true" />
        </label>
      </div>
      <label className="field-label" htmlFor={`${id}-pattern`}>
        Pattern
      </label>
      <input
        id={`${id}-pattern`}
        className="text-input code-input"
        value={state.pattern}
        maxLength={160}
        onChange={(event) => onChange({ ...state, pattern: event.target.value, regexMode: true })}
        placeholder="For example: ^Paper"
        spellCheck={false}
        aria-describedby={`${id}-regex-status`}
      />
      <div className="regex-builder__tokens" aria-label="Pattern shortcuts">
        {[
          ["^", "Start"],
          ["$", "End"],
          [".", "Any"],
          ["[A-Za-z]", "Letters"],
          ["()", "Group"],
          ["|", "Either"],
          ["+", "One or more"],
          ["*", "Zero or more"],
        ].map(([token, label]) => (
          <button key={token} type="button" className="token-button" onClick={() => addToken(token)}>
            <code>{token}</code>
            <span>{label}</span>
          </button>
        ))}
      </div>
      <div className="regex-builder__footer">
        <fieldset className="flag-group">
          <legend>Flags</legend>
          {[
            ["i", "Ignore case"],
            ["m", "Multiline"],
          ].map(([flag, label]) => {
            const checked = state.flags.includes(flag);
            return (
              <label key={flag} className="check-row">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    onChange({
                      ...state,
                      flags: checked
                        ? state.flags.replace(flag, "")
                        : `${state.flags}${flag}`.replace(/(.).*\1/g, "$1"),
                    })
                  }
                />
                {label}
              </label>
            );
          })}
        </fieldset>
        <p id={`${id}-regex-status`} className={error ? "field-error" : "field-help"} aria-live="polite">
          {error || "Patterns run only in this browser and are limited to 160 characters."}
        </p>
      </div>
      </div>
    </PersonalVocabularyBoundary>
  );
}

function SearchField({
  id,
  label,
  placeholder,
  state,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  state: SearchState;
  onChange: (next: SearchState) => void;
}) {
  const entries = usePersonalVocabularyEntries();
  return (
    <PersonalVocabularyBoundary entries={entries}>
      <div className="search-field">
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <div className="search-field__row">
        <input
          id={id}
          type="search"
          className="text-input"
          value={state.query}
          onChange={(event) => onChange({ ...state, query: event.target.value, regexMode: false })}
          placeholder={placeholder}
          autoComplete="off"
        />
        <button
          type="button"
          className="icon-button text-button"
          onClick={() => onChange({ ...state, builderOpen: !state.builderOpen })}
          aria-expanded={state.builderOpen}
          aria-controls={`${id}-builder`}
        >
          Regex
        </button>
      </div>
      {state.builderOpen ? <RegexBuilder id={id} state={state} onChange={onChange} /> : null}
      </div>
    </PersonalVocabularyBoundary>
  );
}

function NumberStepper({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  help,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  help: string;
}) {
  const entries = usePersonalVocabularyEntries();
  const setSafeValue = (nextValue: number) => onChange(clamp(nextValue, min, max));
  return (
    <PersonalVocabularyBoundary entries={entries}>
      <div className="field-group">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <div className="stepper">
        <button
          className="stepper__button"
          type="button"
          onClick={() => setSafeValue(value - step)}
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <input
          id={id}
          className="stepper__input"
          type="number"
          inputMode="numeric"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(event) => setSafeValue(Number(event.target.value))}
          aria-describedby={`${id}-help`}
        />
        {unit ? <span className="stepper__unit">{unit}</span> : null}
        <button
          className="stepper__button"
          type="button"
          onClick={() => setSafeValue(value + step)}
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
      <p className="field-help" id={`${id}-help`}>
        {help}
      </p>
      </div>
    </PersonalVocabularyBoundary>
  );
}

function ArgvPlan({ argv, caption }: { argv: string[]; caption: string }) {
  const entries = usePersonalVocabularyEntries();
  return (
    <PersonalVocabularyBoundary entries={entries}>
      <section className="argv-card" aria-label={caption}>
      <div className="argv-card__topline">
        <div>
          <p className="eyebrow">Typed launch plan</p>
          <h3>{caption}</h3>
        </div>
        <span className="status-chip status-chip--info">Read-only</span>
      </div>
      <ol className="argv-list">
        {argv.map((item, index) => (
          <li key={`${item}-${index}`}>
            <span className="argv-list__index">{index}</span>
            <code>{item}</code>
          </li>
        ))}
      </ol>
      <p className="field-help">
        This is generated from guided controls. Launching the plan belongs to the installed desktop application.
      </p>
      </section>
    </PersonalVocabularyBoundary>
  );
}

export default function Home() {
  const [draft, setDraft] = useState<PlannerDraft>(DEFAULT_DRAFT);
  const [universalSettings, setUniversalSettings] = useState<UniversalSettingsV1>(DEFAULT_UNIVERSAL_SETTINGS);
  const [personalVocabularyEntries, setPersonalVocabularyEntries] = useState<readonly PersonalVocabularyEntryV1[]>([]);
  const [activePage, setActivePage] = useState<PageId>("overview");
  const [navigationSearch, setNavigationSearch] = useState<SearchState>(SEARCH_DEFAULT);
  const [docsSearch, setDocsSearch] = useState<SearchState>(SEARCH_DEFAULT);
  const [paletteSearch, setPaletteSearch] = useState<SearchState>(SEARCH_DEFAULT);
  const [changelogSearch, setChangelogSearch] = useState<SearchState>(SEARCH_DEFAULT);
  const [changelogStartDate, setChangelogStartDate] = useState("");
  const [changelogEndDate, setChangelogEndDate] = useState("");
  const [changelogDatePreset, setChangelogDatePreset] = useState<ChangelogPreset>("all");
  const [changelogStatusMessage, setChangelogStatusMessage] = useState("");
  const [notificationSearch, setNotificationSearch] = useState<SearchState>(SEARCH_DEFAULT);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notice, setNotice] = useState<NotificationRecord | null>(null);
  const [notificationRecords, setNotificationRecords] = useState<NotificationRecord[]>(EMPTY_NOTIFICATION_CENTER.records);
  const [notificationView, setNotificationView] = useState<NotificationView>("active");
  const [notificationSelectScope, setNotificationSelectScope] = useState<NotificationSelectScope>("view");
  const [selectedNotificationIds, setSelectedNotificationIds] = useState<string[]>([]);
  const [notificationStatusMessage, setNotificationStatusMessage] = useState("");
  const [notificationPersistenceStatus, setNotificationPersistenceStatus] = useState<"checking" | "saved" | "unavailable">("checking");
  const [hydrated, setHydrated] = useState(false);
  const [universalHydrated, setUniversalHydrated] = useState(false);
  const [notificationHydrated, setNotificationHydrated] = useState(false);
  const [schoolUnlockConfigured, setSchoolUnlockConfigured] = useState(false);
  const [schoolUnlockInput, setSchoolUnlockInput] = useState("");
  const [customLogoPreview, setCustomLogoPreview] = useState<string | null>(null);
  const [pendingPlannerHandoff, setPendingPlannerHandoff] = useState<PlannerHandoffV1 | null>(null);
  const [handoffStatus, setHandoffStatus] = useState<HandoffStatus>({
    tone: "neutral",
    message: "No planner handoff is selected. JSON files stay local to this browser session until you save one locally.",
  });
  const plannerHandoffInput = useRef<HTMLInputElement>(null);
  const personalVocabularyInput = useRef<HTMLInputElement>(null);
  const customLogoInput = useRef<HTMLInputElement>(null);

  const publishNotice = (input: Notice) => {
    const record = createNotificationRecord(input);
    setNotificationRecords((current) => appendNotificationRecord(current, record));
    setNotice(record);
  };

  useEffect(() => {
    const restore = () => {
      setDraft(restoreDraft(window.localStorage.getItem(STORAGE_KEY)));
      setHydrated(true);
    };
    const timer = window.setTimeout(restore, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const restore = () => {
      try {
        const saved = window.localStorage.getItem(NOTIFICATION_STORAGE_KEY);
        if (!saved) {
          setNotificationRecords([]);
          setNotificationHydrated(true);
          return;
        }
        const result = parseNotificationCenter(JSON.parse(saved) as unknown);
        if (result.ok) {
          setNotificationRecords(result.value.records);
        } else {
          window.localStorage.removeItem(NOTIFICATION_STORAGE_KEY);
          setNotificationRecords([]);
        }
      } catch {
        setNotificationPersistenceStatus("unavailable");
        try {
          window.localStorage.removeItem(NOTIFICATION_STORAGE_KEY);
        } catch {
          // Storage can be unavailable or read-only; retain the in-memory empty state.
        }
        setNotificationRecords([]);
        setNotificationHydrated(true);
      }
      setNotificationHydrated(true);
    };
    const timer = window.setTimeout(restore, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const restore = () => {
      let saved: string | null = null;
      let settingsStorageAvailable = true;
      try {
        saved = window.localStorage.getItem(UNIVERSAL_STORAGE_KEY);
      } catch {
        settingsStorageAvailable = false;
        publishNotice({ tone: "warning", title: "Universal settings unavailable", detail: "The browser could not read the local settings record. Existing in-memory choices remain active." });
      }
      let parsed: unknown;
      try {
        parsed = saved ? JSON.parse(saved) as unknown : undefined;
      } catch {
        parsed = undefined;
      }
      const universalResult = parseUniversalSettings(parsed);
      const restoredSettings = universalResult.ok ? universalResult.value : DEFAULT_UNIVERSAL_SETTINGS;
      setUniversalSettings(restoredSettings);
      if (!universalResult.ok && settingsStorageAvailable) {
        try {
          window.localStorage.removeItem(UNIVERSAL_STORAGE_KEY);
        } catch {
          publishNotice({ tone: "warning", title: "Universal settings could not be reset", detail: "The invalid local settings record could not be removed; the in-memory bounded defaults remain active." });
        }
      }
      let unlockHash: string | null = null;
      try {
        unlockHash = window.localStorage.getItem(SCHOOL_UNLOCK_KEY);
      } catch {
        publishNotice({ tone: "warning", title: "School mode unlock unavailable", detail: "The browser could not read the local unlock record; the current mode remains unchanged." });
      }
      setSchoolUnlockConfigured(Boolean(unlockHash));
      let cachedVocabulary: string | null = null;
      let vocabularyCacheAvailable = true;
      try {
        cachedVocabulary = window.localStorage.getItem(PERSONAL_VOCABULARY_CACHE_KEY);
      } catch {
        vocabularyCacheAvailable = false;
        publishNotice({ tone: "warning", title: "Personal vocabulary cache unavailable", detail: "The browser could not read the local vocabulary cache. The persisted vocabulary status and previous active wording remain unchanged." });
      }
      if (!vocabularyCacheAvailable) {
        // Keep any already-active validated entries when storage is transiently unavailable.
        // The persisted status is intentionally not rewritten to an empty state.
      } else if (cachedVocabulary !== null) {
        const result = parsePersonalVocabularyJson(cachedVocabulary);
        if (result.ok) {
          setPersonalVocabularyEntries(result.value.entries);
          setUniversalSettings((current) => ({
            ...current,
            personalVocabulary: { status: "loaded", entryCount: result.value.entries.length },
          }));
        } else {
          try {
            window.localStorage.removeItem(PERSONAL_VOCABULARY_CACHE_KEY);
            setPersonalVocabularyEntries([]);
            setUniversalSettings((current) => ({
              ...current,
              personalVocabulary: { status: "empty", entryCount: 0 },
            }));
          } catch {
            publishNotice({ tone: "warning", title: "Personal vocabulary cache could not be cleared", detail: "The cached data was malformed, but the browser could not remove it. The persisted status remains unchanged." });
          }
        }
      } else {
        setPersonalVocabularyEntries([]);
        if (restoredSettings.personalVocabulary.status === "loaded") {
          setUniversalSettings((current) => ({
            ...current,
            personalVocabulary: { status: "empty", entryCount: 0 },
          }));
        }
      }
      const cachedLogo = window.localStorage.getItem(CUSTOM_LOGO_CACHE_KEY);
      if (cachedLogo?.startsWith("data:image/")) {
        setCustomLogoPreview(cachedLogo);
        setUniversalSettings((current) => ({ ...current, customLogoStatus: "loaded" }));
      }
      setUniversalHydrated(true);
    };
    const timer = window.setTimeout(restore, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draft, hydrated]);

  useEffect(() => {
    if (!universalHydrated) return;
    window.localStorage.setItem(UNIVERSAL_STORAGE_KEY, JSON.stringify(universalSettings));
    document.documentElement.dataset.theme = universalSettings.theme;
    document.documentElement.dataset.density = universalSettings.density;
  }, [universalSettings, universalHydrated]);

  useEffect(() => {
    if (!notificationHydrated) return;
    const save = () => {
      try {
        window.localStorage.setItem(
          NOTIFICATION_STORAGE_KEY,
          serializeNotificationCenter({ schemaVersion: 1, records: notificationRecords }),
        );
        setNotificationPersistenceStatus("saved");
      } catch {
        setNotificationPersistenceStatus("unavailable");
      }
    };
    const timer = window.setTimeout(save, 0);
    return () => window.clearTimeout(timer);
  }, [notificationHydrated, notificationRecords]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "f") {
        event.preventDefault();
        setPaletteOpen(true);
      }
      if (event.key === "Escape") setPaletteOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!notice || notice.tone === "warning" || notice.tone === "error") return;
    const timer = window.setTimeout(() => setNotice(null), 5200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const versionDetail = VERSION_DETAILS[draft.version];
  const activeArgv = useMemo(() => makeArgv(draft), [draft]);
  const paperArgv = useMemo(() => makeArgv(draft, "paper"), [draft]);
  const spigotArgv = useMemo(() => makeArgv(draft, "spigot"), [draft]);
  const validationNotices = useMemo<Notice[]>(() => {
    const notices: Notice[] = [];
    if (!draft.eulaAccepted) {
      notices.push({
        tone: "error",
        title: "EULA acknowledgement is still needed",
        detail: "The installed desktop application must not launch until you have reviewed and accepted the Minecraft EULA.",
      });
    }
    if (draft.javaVersion !== versionDetail.java) {
      notices.push({
        tone: "error",
        title: `Java ${versionDetail.java} is required by ${draft.version}`,
        detail: "Choose the compatible Java runtime before carrying this plan to the desktop application.",
      });
    }
    if (draft.memoryGiB < 2) {
      notices.push({
        tone: "warning",
        title: "Memory plan is unusually small",
        detail: "A 1 GiB plan may be unsuitable for plugins, player load, or world generation.",
      });
    }
    if (draft.memoryGiB > 16) {
      notices.push({
        tone: "warning",
        title: "Memory plan is unusually large",
        detail: "Confirm that the machine has enough memory left for the operating system and other applications.",
      });
    }
    if (draft.port < 1024) {
      notices.push({
        tone: "warning",
        title: "Low network port selected",
        detail: "Ports below 1024 may require elevated network permissions on the machine that hosts the server.",
      });
    }
    if (draft.rconEnabled && draft.rconPort === draft.port) {
      notices.push({
        tone: "error",
        title: "Game and RCON ports must differ",
        detail: "Choose a distinct RCON port so the desktop application can apply the configuration safely.",
      });
    }
    if (draft.rconEnabled) {
      notices.push({
        tone: "info",
        title: "RCON password remains outside this planner",
        detail: "Set an RCON password only in the installed desktop application’s protected configuration flow.",
      });
    }
    if (!draft.onlineMode) {
      notices.push({
        tone: "warning",
        title: "Online mode is disabled",
        detail: "This changes authentication behavior. Confirm that it matches the intended server policy before launch.",
      });
    }
    return notices;
  }, [draft, versionDetail.java]);

  const requiredBlockers = validationNotices.filter((item) => item.tone === "error");
  const changelogDateValidation = useMemo<ChangelogDateValidation | null>(() => {
    const start = validateChangelogDate(changelogStartDate);
    const end = validateChangelogDate(changelogEndDate);
    if (start.state === "partial" || start.state === "invalid") return start;
    if (end.state === "partial" || end.state === "invalid") return { ...end, message: `End date: ${end.message}` };
    if (start.normalized && end.normalized && start.normalized > end.normalized) {
      return { state: "invalid", message: "The start date must be on or before the end date." };
    }
    return null;
  }, [changelogEndDate, changelogStartDate]);
  const filteredChangelogReleases = useMemo(() => {
    if (changelogDateValidation) return [];
    const start = validateChangelogDate(changelogStartDate).normalized;
    const end = validateChangelogDate(changelogEndDate).normalized;
    return CHANGELOG_RELEASES.filter((release) => {
      const searchableText = [
        release.version,
        release.tag,
        release.releaseDate,
        release.sourceRecord,
        ...release.categories.flatMap((category) => [category.label, ...category.items]),
        ...release.commits.flatMap((commit) => [commit.label, commit.sha]),
      ].join(" ");
      const matchesDate = (!start || release.releaseDate >= start) && (!end || release.releaseDate <= end);
      return matchesDate && testSearch(searchableText, changelogSearch);
    });
  }, [changelogDateValidation, changelogEndDate, changelogSearch, changelogStartDate]);
  const changelogFilterSummary = useMemo(() => {
    const searchSummary = changelogSearch.regexMode
      ? `regex pattern ${changelogSearch.pattern || "(empty)"}`
      : changelogSearch.query.trim()
        ? `text search ${changelogSearch.query.trim()}`
        : "all release text";
    const start = validateChangelogDate(changelogStartDate).normalized;
    const end = validateChangelogDate(changelogEndDate).normalized;
    const dateSummary = start || end ? `${start || "earliest"} to ${end || "latest"}` : "all released dates";
    return `${searchSummary}; ${dateSummary}`;
  }, [changelogEndDate, changelogSearch, changelogStartDate]);
  const filteredNotificationRecords = useMemo(
    () => notificationRecords.filter((record) => {
      const matchesView = notificationView === "all"
        || (notificationView === "active" ? record.dismissedAt === null : record.dismissedAt !== null);
      return matchesView && matchesNotificationSearch(record, notificationSearch);
    }),
    [notificationRecords, notificationSearch, notificationView],
  );
  const allMatchingNotificationRecords = useMemo(
    () => notificationRecords.filter((record) => matchesNotificationSearch(record, notificationSearch)),
    [notificationRecords, notificationSearch],
  );
  const notificationSelectionTarget = notificationSelectScope === "view"
    ? filteredNotificationRecords
    : allMatchingNotificationRecords;
  const selectedNotificationSet = new Set(selectedNotificationIds);
  const selectedDismissibleCount = notificationRecords.filter(
    (record) => selectedNotificationSet.has(record.id) && record.dismissible && record.dismissedAt === null,
  ).length;
  const activeNotificationCount = notificationRecords.filter((record) => record.dismissedAt === null).length;
  const dismissedNotificationCount = notificationRecords.length - activeNotificationCount;
  const matchingPages = PAGE_DEFINITIONS.filter((page) =>
    testSearch(`${page.label} ${page.eyebrow} ${page.description}`, navigationSearch),
  );
  const paletteItems = [
    ...PAGE_DEFINITIONS.map((page) => ({
      id: `page-${page.id}`,
      label: page.label,
      detail: page.description,
      action: () => setActivePage(page.id),
    })),
    {
      id: "reset-draft",
      label: "Reset browser draft",
      detail: "Clear the non-secret draft saved in this browser and restore the planner defaults.",
      action: () => resetDraft(),
    },
    {
      id: "universal-settings",
      label: "Open universal settings",
      detail: "Edit the local language, tone, appearance, app-name, logo, tab-dock, and private-data controls.",
      action: () => setActivePage("settings"),
    },
  ].filter((item) => testSearch(`${item.label} ${item.detail}`, paletteSearch));

  const applyChangelogPreset = (preset: Exclude<ChangelogPreset, "custom">) => {
    const latestDate = CHANGELOG_RELEASES[0]?.releaseDate ?? "";
    const year = latestDate.slice(0, 4);
    if (preset === "latest") {
      setChangelogStartDate(latestDate);
      setChangelogEndDate(latestDate);
    } else if (preset === "last-30-days") {
      setChangelogStartDate(shiftChangelogDate(latestDate, -29));
      setChangelogEndDate(latestDate);
    } else if (preset === "current-year") {
      setChangelogStartDate(`${year}-01-01`);
      setChangelogEndDate(`${year}-12-31`);
    } else {
      setChangelogStartDate("");
      setChangelogEndDate("");
    }
    setChangelogDatePreset(preset);
    setChangelogStatusMessage(`${preset === "all" ? "All released dates" : preset === "latest" ? "Latest release" : preset === "last-30-days" ? "Last 30 days" : "Current year"} preset applied.`);
  };
  const updateChangelogDate = (which: "start" | "end", value: string) => {
    setChangelogDatePreset("custom");
    if (which === "start") setChangelogStartDate(value);
    else setChangelogEndDate(value);
  };
  const copyChangelog = async () => {
    if (filteredChangelogReleases.length === 0) {
      setChangelogStatusMessage("There are no matching release records to copy.");
      publishNotice({ tone: "warning", title: "Nothing to copy", detail: "Adjust the search or date range before copying the filtered changelog." });
      return;
    }
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard access is unavailable in this browser.");
      await navigator.clipboard.writeText(renderChangelogMarkdown(filteredChangelogReleases, changelogFilterSummary));
      setChangelogStatusMessage(`Copied ${filteredChangelogReleases.length} filtered release record(s) as Markdown.`);
      publishNotice({ tone: "success", title: "Filtered changelog copied", detail: "The clipboard text includes the active search, date range, categories, exact commit links, and release record links." });
    } catch (error) {
      setChangelogStatusMessage(error instanceof Error ? error.message : "Clipboard access failed; the filtered changelog was not copied.");
      publishNotice({ tone: "warning", title: "Changelog copy unavailable", detail: "The browser did not grant clipboard access. The export action remains available." });
    }
  };
  const exportChangelog = () => {
    if (filteredChangelogReleases.length === 0) {
      setChangelogStatusMessage("There are no matching release records to export.");
      publishNotice({ tone: "warning", title: "Nothing to export", detail: "Adjust the search or date range before exporting the filtered changelog." });
      return;
    }
    const content = renderChangelogMarkdown(filteredChangelogReleases, changelogFilterSummary);
    const objectUrl = URL.createObjectURL(new Blob([content], { type: "text/markdown;charset=utf-8" }));
    const download = document.createElement("a");
    download.href = objectUrl;
    download.download = "companion-changelog-filtered.md";
    document.body.appendChild(download);
    download.click();
    download.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
    setChangelogStatusMessage(`Prepared ${filteredChangelogReleases.length} filtered release record(s) as durable Markdown.`);
    publishNotice({ tone: "success", title: "Filtered changelog exported", detail: "The Markdown file records the active filter and keeps every exact commit and release link." });
  };
  const dismissNotification = (id: string) => {
    setNotificationRecords((current) => dismissNotificationRecord(current, id));
    setSelectedNotificationIds((current) => current.filter((selectedId) => selectedId !== id));
    setNotice((current) => current?.id === id ? null : current);
  };
  const toggleNotificationSelection = (id: string) => {
    setSelectedNotificationIds((current) => current.includes(id)
      ? current.filter((selectedId) => selectedId !== id)
      : [...current, id]);
  };
  const selectAllNotifications = () => {
    const targetIds = notificationSelectionTarget.map((record) => record.id);
    setSelectedNotificationIds((current) => Array.from(new Set([...current, ...targetIds])));
    setNotificationStatusMessage(
      `${targetIds.length} ${notificationSelectScope === "view" ? "record(s) in the current view" : "matching record(s) across every status"} selected.`,
    );
  };
  const invertNotifications = () => {
    const nextSelection = invertNotificationSelection(
      selectedNotificationIds,
      notificationSelectionTarget.map((record) => record.id),
    );
    setSelectedNotificationIds(nextSelection);
    setNotificationStatusMessage(`${nextSelection.length} notification record(s) selected after inverting the ${notificationSelectScope === "view" ? "current-view" : "every-match"} scope.`);
  };
  const dismissSelectedNotifications = () => {
    const result = bulkDismissNotificationRecords(notificationRecords, selectedNotificationIds);
    setNotificationRecords(result.records);
    setSelectedNotificationIds((current) => current.filter((id) => !result.dismissedIds.includes(id)));
    const skippedCount = selectedNotificationIds.length - result.dismissedIds.length;
    setNotificationStatusMessage(
      result.dismissedIds.length === 0
        ? "No selected active dismissible records changed. Dismissed records remain available for review."
        : `${result.dismissedIds.length} notification record(s) dismissed${skippedCount ? `; ${skippedCount} selected record(s) were already dismissed or not dismissible.` : "."}`,
    );
  };
  const clearNotificationSelection = () => {
    setSelectedNotificationIds([]);
    setNotificationStatusMessage("Notification selection cleared.");
  };
  const updateDraft = <Key extends keyof PlannerDraft>(key: Key, value: PlannerDraft[Key]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    if (key === "theme" && (value === "dark" || value === "light")) {
      setUniversalSettings((current) => ({ ...current, theme: value }));
    }
    if (key === "seed" && isHexColor(value)) {
      setUniversalSettings((current) => ({ ...current, seedColor: value.toUpperCase() }));
    }
  };
  const updateUniversalSettings = <Key extends keyof UniversalSettingsV1>(key: Key, value: UniversalSettingsV1[Key]) => {
    setUniversalSettings((current) => ({ ...current, [key]: value }));
  };
  const navigate = (page: PageId) => {
    setActivePage(page);
    setPaletteOpen(false);
    publishNotice({ tone: "info", title: `Opened ${PAGE_DEFINITIONS.find((item) => item.id === page)?.label}`, detail: "The planner stayed in this browser; no server action was started." });
  };
  const resetDraft = () => {
    setDraft(DEFAULT_DRAFT);
    setPendingPlannerHandoff(null);
    setHandoffStatus({ tone: "neutral", message: "Browser draft reset. No planner handoff is selected." });
    window.localStorage.removeItem(STORAGE_KEY);
    publishNotice({ tone: "success", title: "Browser draft reset", detail: "Only non-secret planner values were removed from this browser." });
  };
  const resetUniversalSettings = () => {
    window.localStorage.removeItem(PERSONAL_VOCABULARY_CACHE_KEY);
    setPersonalVocabularyEntries([]);
    setUniversalSettings(DEFAULT_UNIVERSAL_SETTINGS);
    setSchoolUnlockInput("");
    setCustomLogoPreview(null);
    window.localStorage.removeItem(UNIVERSAL_STORAGE_KEY);
    window.localStorage.removeItem(SCHOOL_UNLOCK_KEY);
    window.localStorage.removeItem(CUSTOM_LOGO_CACHE_KEY);
    setSchoolUnlockConfigured(false);
    publishNotice({ tone: "success", title: "Universal settings reset", detail: "Local preferences, the private vocabulary cache, the custom logo, and the toy unlock credential were cleared." });
  };
  const saveSchoolUnlock = async () => {
    if (schoolUnlockInput.length < 4 || schoolUnlockInput.length > 32) {
      publishNotice({ tone: "warning", title: "Unlock credential not saved", detail: "Use a locally entered value from 4 to 32 characters. It is never shown or exported." });
      return;
    }
    const digest = await sha256Text(schoolUnlockInput);
    window.localStorage.setItem(SCHOOL_UNLOCK_KEY, digest);
    setSchoolUnlockConfigured(true);
    setSchoolUnlockInput("");
    publishNotice({ tone: "success", title: "Local unlock credential saved", detail: "The credential is stored only as a local digest. This toy lock is not a security boundary." });
  };
  const disableSchoolMode = async () => {
    const stored = window.localStorage.getItem(SCHOOL_UNLOCK_KEY);
    if (!stored) {
      publishNotice({ tone: "warning", title: "Set an unlock credential first", detail: `Set a local credential before turning off ${universalSettings.schoolModeName}. Clearing this site's storage remains the documented recovery route.` });
      return;
    }
    if (!schoolUnlockInput) {
      publishNotice({ tone: "warning", title: "Unlock value required", detail: `Enter the local credential to turn off ${universalSettings.schoolModeName}.` });
      return;
    }
    const digest = await sha256Text(schoolUnlockInput);
    if (digest !== stored) {
      publishNotice({ tone: "warning", title: "Unlock value did not match", detail: `The local credential did not match. The ${universalSettings.schoolModeName} setting remains on.` });
      return;
    }
    setSchoolUnlockInput("");
    updateUniversalSettings("schoolModeEnabled", false);
    publishNotice({ tone: "success", title: `${universalSettings.schoolModeName} turned off`, detail: "The previous language and tone preferences are available again." });
  };
  const selectPersonalVocabulary = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.currentTarget.files?.item(0);
    event.currentTarget.value = "";
    if (!selected) return;
    if (selected.size > PERSONAL_VOCABULARY_LIMITS.maxBytes) {
      publishNotice({ tone: "warning", title: "Personal vocabulary rejected", detail: "Choose a JSON file no larger than 64 KiB." });
      return;
    }
    try {
      const result = parsePersonalVocabularyJson(await selected.text());
      if (!result.ok) {
        publishNotice({ tone: "warning", title: "Personal vocabulary rejected", detail: result.reason });
        return;
      }
      const serialized = JSON.stringify(result.value);
      window.localStorage.setItem(PERSONAL_VOCABULARY_CACHE_KEY, serialized);
      setPersonalVocabularyEntries(result.value.entries);
      updateUniversalSettings("personalVocabulary", { status: "loaded", entryCount: result.value.entries.length });
      publishNotice({ tone: "success", title: "Personal vocabulary validated locally", detail: `${result.value.entries.length} bounded entries are cached privately and now style user-facing copy. Protected commands, URLs, identifiers, paths, code, and factual records remain unchanged.` });
    } catch (error) {
      publishNotice({ tone: "warning", title: "Personal vocabulary was not applied", detail: error instanceof Error ? error.message : "The local file could not be read or cached. The previous vocabulary remains active." });
    }
  };
  const clearPersonalVocabulary = () => {
    try {
      window.localStorage.removeItem(PERSONAL_VOCABULARY_CACHE_KEY);
      setPersonalVocabularyEntries([]);
      updateUniversalSettings("personalVocabulary", { status: "empty", entryCount: 0 });
      publishNotice({ tone: "info", title: "Personal vocabulary cleared", detail: "The private cache was removed and original shipped wording is active again." });
    } catch (error) {
      publishNotice({ tone: "warning", title: "Personal vocabulary was not cleared", detail: error instanceof Error ? error.message : "The local cache could not be removed, so the active vocabulary remains unchanged." });
    }
  };
  const selectCustomLogo = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.currentTarget.files?.item(0);
    event.currentTarget.value = "";
    if (!selected) return;
    try {
      const dataUrl = await readCustomLogo(selected);
      window.localStorage.setItem(CUSTOM_LOGO_CACHE_KEY, dataUrl);
      setCustomLogoPreview(dataUrl);
      updateUniversalSettings("customLogoStatus", "loaded");
      publishNotice({ tone: "success", title: "Custom logo converted locally", detail: "The validated PNG or JPEG is cached only in this browser. Package identity and installer identity were not changed." });
    } catch (error) {
      publishNotice({ tone: "warning", title: "Custom logo rejected", detail: error instanceof Error ? error.message : "The local image could not be converted." });
    }
  };
  const clearCustomLogo = () => {
    window.localStorage.removeItem(CUSTOM_LOGO_CACHE_KEY);
    setCustomLogoPreview(null);
    updateUniversalSettings("customLogoStatus", "empty");
    updateUniversalSettings("logoPreset", "default");
    publishNotice({ tone: "info", title: "Custom logo cleared", detail: "The shipped default mark is active again." });
  };
  const exportPlannerHandoff = () => {
    try {
      const handoff = createBrowserPlannerHandoff(draft);
      const content = `${JSON.stringify(handoff, null, 2)}\n`;
      const objectUrl = URL.createObjectURL(new Blob([content], { type: "application/json" }));
      const download = document.createElement("a");
      download.href = objectUrl;
      download.download = PLANNER_HANDOFF_FILENAME;
      download.click();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
      setHandoffStatus({ tone: "success", message: "Structured planner handoff JSON was prepared for a user-triggered download. It contains only the displayed non-secret planning values." });
      publishNotice({ tone: "success", title: "Planner handoff exported", detail: "The JSON download contains no paths, URLs, credentials, or raw command text." });
    } catch {
      setHandoffStatus({ tone: "warning", message: "The current choices cannot be exported until every required handoff field is compatible and complete." });
      publishNotice({ tone: "warning", title: "Planner handoff was not exported", detail: "Review the version, Java, and port choices before trying again." });
    }
  };
  const selectPlannerHandoff = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.currentTarget.files?.item(0);
    event.currentTarget.value = "";
    if (!selected) return;
    if (selected.size <= 0 || selected.size > PLANNER_HANDOFF_MAX_BYTES) {
      setPendingPlannerHandoff(null);
      setHandoffStatus({ tone: "warning", message: "The selected JSON is empty or exceeds the v1 handoff size limit, so it was not imported." });
      return;
    }
    try {
      const handoff = parsePlannerHandoffJson(await selected.text());
      const preview = previewPlannerHandoff(handoff);
      setPendingPlannerHandoff(handoff);
      setHandoffStatus({ tone: "info", message: `${preview.serverName} is ready for review. Save it locally to replace only the normalized safe planner fields shown below.` });
      publishNotice({ tone: "info", title: "Planner handoff ready to review", detail: "No browser draft value changed until you explicitly save the imported plan locally." });
    } catch {
      setPendingPlannerHandoff(null);
      setHandoffStatus({ tone: "warning", message: "The selected JSON was rejected. A complete, bounded non-secret planner-handoff v1 is required." });
      publishNotice({ tone: "warning", title: "Planner handoff rejected", detail: "The browser draft was left unchanged." });
    }
  };
  const saveImportedPlannerHandoff = () => {
    if (!pendingPlannerHandoff) return;
    const preview = previewPlannerHandoff(pendingPlannerHandoff);
    setDraft((current) => applyPlannerHandoffToBrowserDraft(current, pendingPlannerHandoff));
    setPendingPlannerHandoff(null);
    setHandoffStatus({ tone: "success", message: `${preview.serverName} was saved to this browser-local draft. Appearance-only settings remained local.` });
    publishNotice({ tone: "success", title: "Imported planner handoff saved locally", detail: "Only the normalized non-secret planning fields were replaced. No server action was started." });
  };
  const discardImportedPlannerHandoff = () => {
    setPendingPlannerHandoff(null);
    setHandoffStatus({ tone: "neutral", message: "Imported planner handoff discarded. The browser-local draft was not changed." });
    publishNotice({ tone: "info", title: "Planner handoff discarded", detail: "No imported values were applied." });
  };
  const appStyle = { "--seed": universalSettings.seedColor } as CSSProperties;
  const selectedPage = PAGE_DEFINITIONS.find((page) => page.id === activePage) ?? PAGE_DEFINITIONS[0];
  const pendingPlannerHandoffPreview = pendingPlannerHandoff ? previewPlannerHandoff(pendingPlannerHandoff) : null;

  const configurePage = (
    <div className="page-stack">
      <PageHeading page={selectedPage} />
      <div className="planner-grid">
        <section className="surface-card surface-card--wide">
          <div className="section-heading">
            <div>
              <p className="eyebrow">1. Server base</p>
              <h2>Choose a guided server shape</h2>
            </div>
            <span className="status-chip status-chip--info">No raw CLI field</span>
          </div>
          <fieldset className="field-group">
            <legend className="field-label">Server kind</legend>
            <div className="segmented-control" role="radiogroup" aria-label="Server kind">
              {(["paper", "spigot"] as ServerKind[]).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  className={draft.kind === kind ? "segment is-selected" : "segment"}
                  role="radio"
                  aria-checked={draft.kind === kind}
                  onClick={() => updateDraft("kind", kind)}
                >
                  <strong>{kind === "paper" ? "Paper" : "Spigot"}</strong>
                  <span>{kind === "paper" ? "Plugin-ready performance server" : "Desktop-assisted setup plan"}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <div className="form-grid">
            <div className="field-group">
              <label className="field-label" htmlFor="server-name">
                Plan name
              </label>
              <input
                id="server-name"
                className="text-input"
                value={draft.serverName}
                maxLength={80}
                onChange={(event) => updateDraft("serverName", event.target.value)}
                aria-describedby="server-name-help"
                autoComplete="off"
              />
              <p className={isPlannerHandoffName(draft.serverName) ? "field-help" : "field-error"} id="server-name-help">
                {isPlannerHandoffName(draft.serverName) ? "A short plan label included in the structured handoff. It is not a host, path, or command." : "Use a non-empty plan label with letters, numbers, spaces, and basic punctuation only; dots, hosts, and URLs are not allowed."}
              </p>
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="version">
                Minecraft version preset
              </label>
              <select
                id="version"
                className="select-input"
                value={draft.version}
                onChange={(event) => updateDraft("version", event.target.value as GameVersion)}
              >
                <option value="1.21.4">1.21.4 — Java 21</option>
                <option value="1.20.6">1.20.6 — Java 21</option>
                <option value="1.20.4">1.20.4 — Java 17</option>
              </select>
              <p className="field-help">{versionDetail.note} The desktop catalog remains the source of executable availability.</p>
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="java-version">
                Java runtime
              </label>
              <select
                id="java-version"
                className="select-input"
                value={draft.javaVersion}
                onChange={(event) => updateDraft("javaVersion", event.target.value as JavaVersion)}
              >
                <option value="21">Java 21</option>
                <option value="17">Java 17</option>
              </select>
              <p className={draft.javaVersion === versionDetail.java ? "field-help" : "field-error"}>
                {draft.javaVersion === versionDetail.java
                  ? `Compatible with the ${draft.version} preset.`
                  : `This preset needs Java ${versionDetail.java}.`}
              </p>
            </div>
          </div>
        </section>

        <section className="surface-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">2. World & plugins</p>
              <h2>Choose local layout conventions</h2>
            </div>
          </div>
          <fieldset className="field-group">
            <legend className="field-label">World preset</legend>
            <div className="choice-stack">
              {WORLD_OPTIONS.map((world) => (
                <button
                  key={world.id}
                  type="button"
                  className={draft.world === world.id ? "choice-card is-selected" : "choice-card"}
                  onClick={() => updateDraft("world", world.id)}
                  aria-pressed={draft.world === world.id}
                >
                  <strong>{world.label}</strong>
                  <span>{world.detail}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <div className="field-group">
            <label className="field-label" htmlFor="plugin-directory">
              Plugin directory choice
            </label>
            <select
              id="plugin-directory"
              className="select-input"
              value={draft.pluginDirectory}
              onChange={(event) => updateDraft("pluginDirectory", event.target.value as PluginDirectory)}
            >
              {PLUGIN_OPTIONS.map((option) => (
                <option value={option.id} key={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="field-help">{PLUGIN_OPTIONS.find((item) => item.id === draft.pluginDirectory)?.detail}</p>
          </div>
        </section>

        <section className="surface-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">3. Runtime & network</p>
              <h2>Set bounded numeric values</h2>
            </div>
          </div>
          <NumberStepper
            id="memory"
            label="Memory allocation"
            value={draft.memoryGiB}
            onChange={(value) => updateDraft("memoryGiB", value)}
            min={1}
            max={32}
            unit="GiB"
            help="Bounded to 1–32 GiB. The desktop application makes the final host-capacity check."
          />
          <NumberStepper
            id="port"
            label="Game port"
            value={draft.port}
            onChange={(value) => updateDraft("port", value)}
            min={1}
            max={65535}
            help="25565 is the conventional default. This planner does not test local port availability."
          />
          <fieldset className="field-group">
            <legend className="field-label">Online mode</legend>
            <div className="segmented-control segmented-control--compact" role="radiogroup" aria-label="Online mode">
              <button
                type="button"
                className={draft.onlineMode ? "segment is-selected" : "segment"}
                role="radio"
                aria-checked={draft.onlineMode}
                onClick={() => updateDraft("onlineMode", true)}
              >
                Online authentication on
              </button>
              <button
                type="button"
                className={!draft.onlineMode ? "segment is-selected" : "segment"}
                role="radio"
                aria-checked={!draft.onlineMode}
                onClick={() => updateDraft("onlineMode", false)}
              >
                Offline mode
              </button>
            </div>
            <p className="field-help">This selection is a policy plan only. It does not change a live server.</p>
          </fieldset>
        </section>

        <section className="surface-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">4. Safety boundary</p>
              <h2>Plan RCON and consent safely</h2>
            </div>
          </div>
          <div className="switch-row">
            <span id="rcon-enabled-label">
              <strong>Enable RCON planning</strong>
              <small>Shows a non-secret management port choice only.</small>
            </span>
            <input
              id="rcon-enabled"
              type="checkbox"
              aria-labelledby="rcon-enabled-label"
              checked={draft.rconEnabled}
              onChange={(event) => updateDraft("rconEnabled", event.target.checked)}
            />
            <span className="switch-track" aria-hidden="true" />
          </div>
          {draft.rconEnabled ? (
            <NumberStepper
              id="rcon-port"
              label="RCON port"
              value={draft.rconPort}
              onChange={(value) => updateDraft("rconPort", value)}
              min={1}
              max={65535}
              help="Use a port distinct from the game port. Passwords are intentionally not requested or stored here."
            />
          ) : (
            <p className="field-help">RCON is off in this draft. The installed desktop application owns protected credentials if you later enable it.</p>
          )}
          <div className="switch-row switch-row--eula">
            <span id="eula-accepted-label">
              <strong>I have reviewed the Minecraft EULA</strong>
              <small>This is an acknowledgement for the handoff plan, not a substitute for reading the EULA.</small>
            </span>
            <input
              id="eula-accepted"
              type="checkbox"
              aria-labelledby="eula-accepted-label"
              checked={draft.eulaAccepted}
              onChange={(event) => updateDraft("eulaAccepted", event.target.checked)}
            />
            <span className="switch-track" aria-hidden="true" />
          </div>
          {!draft.eulaAccepted ? <p className="field-error">The desktop application should block launch until this acknowledgement is true.</p> : null}
        </section>

        <section className="surface-card surface-card--wide">
          <div className="section-heading">
            <div>
              <p className="eyebrow">5. Browser appearance</p>
              <h2>Adjust this local planner, not server settings</h2>
            </div>
            <span className="status-chip status-chip--neutral">Saved locally</span>
          </div>
          <div className="appearance-grid">
            <fieldset className="field-group">
              <legend className="field-label">Planner theme</legend>
              <div className="segmented-control segmented-control--compact" role="radiogroup" aria-label="Planner theme">
                {(["dark", "light"] as ThemeMode[]).map((theme) => (
                  <button
                    key={theme}
                    type="button"
                    className={draft.theme === theme ? "segment is-selected" : "segment"}
                    role="radio"
                    aria-checked={draft.theme === theme}
                    onClick={() => updateDraft("theme", theme)}
                  >
                    {theme === "dark" ? "Dark" : "Light"}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="field-group">
              <label className="field-label" htmlFor="seed-color">
                Accent color
              </label>
              <div className="color-row">
                {SEED_PRESETS.map((seed) => (
                  <button
                    key={seed}
                    type="button"
                    className={draft.seed.toLowerCase() === seed.toLowerCase() ? "color-chip is-selected" : "color-chip"}
                    style={{ backgroundColor: seed }}
                    aria-label={`Use ${seed} accent color`}
                    aria-pressed={draft.seed.toLowerCase() === seed.toLowerCase()}
                    onClick={() => updateDraft("seed", seed)}
                  />
                ))}
                <input
                  id="seed-color"
                  type="color"
                  value={draft.seed}
                  onChange={(event) => updateDraft("seed", event.target.value)}
                  aria-label="Choose a custom planner accent color"
                />
              </div>
              <p className="field-help">The color changes only this browser-local site interface.</p>
            </div>
            <div className="appearance-actions">
              <button type="button" className="secondary-button" onClick={resetDraft}>
                Reset browser draft
              </button>
              <p className="field-help">No credentials, server files, account data, or private planner file contents are placed in this draft record. Universal settings use a separate bounded local record.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );

  const overviewPage = (
    <div className="page-stack">
      <section className="hero-card">
        <div className="hero-card__copy">
          <p className="eyebrow">{universalSettings.appDisplayName}</p>
          <h1>Plan a safer Paper or Spigot server.</h1>
          <p className="hero-lede">Configure locally. Launch in the desktop app.</p>
          <p className="body-copy">
            This companion site turns guided choices into an explainable, read-only runtime plan. It never
            autonomously downloads, writes, starts, or administers a server.
          </p>
          <div className="button-row">
            <a
              className="primary-button"
              href={VERIFIED_INSTALLER.assetUrl}
              aria-describedby="verified-installer-home-note"
            >
              Download {VERIFIED_INSTALLER.releaseTag} {VERIFIED_INSTALLER.assetName}
            </a>
            <button type="button" className="primary-button" onClick={() => navigate("configure")}>
              Open guided configuration
            </button>
            <button type="button" className="secondary-button" onClick={() => navigate("safety")}>
              Review safety plan
            </button>
          </div>
          <p className="field-help release-download-note" id="verified-installer-home-note">
            Direct handoff to the fixed GitHub release asset. This site does not begin a background transfer or report
            a download or installation result.
          </p>
        </div>
        <div className="hero-card__plan" aria-label="Current plan summary">
          <div className="hero-card__plan-header">
            <span>Current local draft</span>
            <span className={requiredBlockers.length ? "status-chip status-chip--warning" : "status-chip status-chip--success"}>
              {requiredBlockers.length ? `${requiredBlockers.length} blocker${requiredBlockers.length === 1 ? "" : "s"}` : "Ready to hand off"}
            </span>
          </div>
          <dl className="summary-list">
            <div><dt>Server</dt><dd>{draft.kind === "paper" ? "Paper" : "Spigot"}</dd></div>
            <div><dt>Runtime</dt><dd>Java {draft.javaVersion} · {draft.memoryGiB} GiB</dd></div>
            <div><dt>World</dt><dd>{WORLD_OPTIONS.find((item) => item.id === draft.world)?.label}</dd></div>
            <div><dt>Network</dt><dd>{draft.port} · {draft.onlineMode ? "Online authentication" : "Offline mode"}</dd></div>
          </dl>
          <button type="button" className="text-action" onClick={() => navigate("runtime")}>
            Inspect runtime plan <span aria-hidden="true">→</span>
          </button>
        </div>
      </section>

      <section className="surface-card handoff-card" aria-labelledby="browser-handoff-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Desktop handoff</p>
            <h2 id="browser-handoff-title">Move a non-secret plan through a structured JSON file</h2>
          </div>
          <span className={`status-chip status-chip--${handoffStatus.tone}`}>{pendingPlannerHandoff ? "Ready to save locally" : "Local only"}</span>
        </div>
        <p className="body-copy">Export only the guided planning fields, or choose a local JSON file to preview in normalized v1 form before saving it to this browser. This companion never uploads, fetches, sends, or stores file paths, URLs, credentials, raw argv, or server addresses.</p>
        <input
          ref={plannerHandoffInput}
          className="sr-only"
          type="file"
          accept="application/json,.json"
          onChange={selectPlannerHandoff}
          aria-label="Choose planner handoff JSON file"
        />
        <div className="button-row" aria-label="Planner handoff actions">
          <button type="button" className="primary-button" onClick={exportPlannerHandoff}>
            Download planner JSON
          </button>
          <button type="button" className="secondary-button" onClick={() => plannerHandoffInput.current?.click()}>
            Choose planner JSON
          </button>
          <button type="button" className="secondary-button" onClick={saveImportedPlannerHandoff} disabled={!pendingPlannerHandoff}>
            Save imported plan locally
          </button>
          <button type="button" className="secondary-button" onClick={discardImportedPlannerHandoff} disabled={!pendingPlannerHandoff}>
            Discard imported plan
          </button>
        </div>
        <p className={handoffStatus.tone === "warning" ? "field-error" : "field-help"} role="status" aria-live="polite">
          {handoffStatus.message}
        </p>
        {pendingPlannerHandoffPreview ? (
          <dl className="handoff-preview" aria-label="Normalized v1 planner handoff preview">
            <div><dt>Contract</dt><dd>Planner Handoff v{pendingPlannerHandoffPreview.version}</dd></div>
            <div><dt>Plan</dt><dd>{pendingPlannerHandoffPreview.serverName}</dd></div>
            <div><dt>Server</dt><dd>{pendingPlannerHandoffPreview.serverKind === "paper" ? "Paper" : "Spigot"}</dd></div>
            <div><dt>Minecraft</dt><dd>{pendingPlannerHandoffPreview.minecraftVersion}</dd></div>
            <div><dt>Java</dt><dd>{pendingPlannerHandoffPreview.javaRuntime.replace("java-", "Java ")}</dd></div>
            <div><dt>Memory</dt><dd>{pendingPlannerHandoffPreview.memoryMiB} MiB</dd></div>
            <div><dt>World</dt><dd>{pendingPlannerHandoffPreview.worldName}</dd></div>
            <div><dt>Network</dt><dd>{pendingPlannerHandoffPreview.port} · {pendingPlannerHandoffPreview.onlineMode ? "online mode" : "offline mode"}</dd></div>
            <div><dt>RCON</dt><dd>{pendingPlannerHandoffPreview.rconEnabled ? `planned on ${pendingPlannerHandoffPreview.rconPort}` : "not planned"}</dd></div>
            <div><dt>EULA</dt><dd>{pendingPlannerHandoffPreview.eulaAcknowledged ? "acknowledged" : "not acknowledged"}</dd></div>
          </dl>
        ) : null}
      </section>

      <div className="overview-grid">
        <section className="surface-card">
          <p className="eyebrow">Planning boundary</p>
          <h2>Guided choices, not a remote console</h2>
          <p className="body-copy">Every server-control action remains in the installed desktop application. The companion site has no account, upload, terminal, telemetry, or network connection.</p>
          <div className="fact-list">
            <span>✓ No raw command entry</span>
            <span>✓ No RCON password field</span>
            <span>✓ No server start button</span>
          </div>
        </section>
        <ArgvPlan argv={activeArgv} caption={`${draft.kind === "paper" ? "Paper" : "Spigot"} argv preview`} />
      </div>

      <section className="surface-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Next pages</p>
            <h2>Move through the planning flow</h2>
          </div>
        </div>
        <div className="destination-grid">
          {PAGE_DEFINITIONS.filter((page) => page.id !== "overview").map((page) => (
            <button key={page.id} type="button" className="destination-card" onClick={() => navigate(page.id)}>
              <span className="destination-card__eyebrow">{page.eyebrow}</span>
              <strong>{page.label}</strong>
              <span>{page.description}</span>
              <span className="destination-card__arrow" aria-hidden="true">→</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );

  const paperCliPage = (
    <div className="page-stack">
      <PageHeading page={selectedPage} />
      <section className="surface-card notice-panel">
        <div>
          <p className="eyebrow">Paper template</p>
          <h2>Typed arguments, assembled from safe fields</h2>
          <p className="body-copy">The preview is a Paper-specific template. If the active draft is Spigot, switch kind in Configure before using the active plan.</p>
        </div>
        <button type="button" className="secondary-button" onClick={() => navigate("configure")}>Adjust base choices</button>
      </section>
      <ArgvPlan argv={paperArgv} caption="Paper startup argv" />
      <section className="surface-card split-card">
        <div>
          <p className="eyebrow">What the planner sets</p>
          <h2>Runtime, artifact, and no-GUI mode</h2>
          <p className="body-copy">Java version and memory come from the bounded controls. The JAR name is a readable template rather than an assertion that the file is installed here.</p>
        </div>
        <div className="callout callout--info">The installed desktop application resolves real Paper artifacts, validates the folder, and owns the launch action.</div>
      </section>
    </div>
  );

  const spigotSetupPage = (
    <div className="page-stack">
      <PageHeading page={selectedPage} />
      <section className="surface-card notice-panel">
        <div>
          <p className="eyebrow">Desktop-assisted route</p>
          <h2>Prepare a Spigot handoff without a shell</h2>
          <p className="body-copy">This companion does not run build tooling. It describes the resulting launch plan after the desktop application completes its supported setup flow.</p>
        </div>
        <button type="button" className="secondary-button" onClick={() => navigate("configure")}>Choose Spigot</button>
      </section>
      <div className="process-grid">
        {[
          ["1", "Confirm version & Java", "The selected preset establishes the compatible Java runtime."],
          ["2", "Choose local folder conventions", "World and plugin directory choices stay descriptive until desktop handoff."],
          ["3", "Let the desktop app prepare files", "Artifact acquisition and filesystem work belong to the installed application."],
          ["4", "Review the read-only plan", "Carry the generated values forward after the desktop app reports a ready state."],
        ].map(([number, title, text]) => (
          <article className="process-card" key={number}>
            <span className="process-card__number">{number}</span>
            <h2>{title}</h2>
            <p>{text}</p>
          </article>
        ))}
      </div>
      <ArgvPlan argv={spigotArgv} caption="Spigot startup argv" />
    </div>
  );

  const runtimePage = (
    <div className="page-stack">
      <PageHeading page={selectedPage} />
      <div className="runtime-grid">
        <section className="surface-card">
          <p className="eyebrow">Compatibility</p>
          <h2>Java {draft.javaVersion} for {draft.version}</h2>
          <p className={draft.javaVersion === versionDetail.java ? "field-help field-help--large" : "field-error field-error--large"}>
            {draft.javaVersion === versionDetail.java ? "The selected runtime matches this preset." : `Select Java ${versionDetail.java} to make this plan compatible.`}
          </p>
          <button type="button" className="text-action" onClick={() => navigate("configure")}>Change Java version <span aria-hidden="true">→</span></button>
        </section>
        <section className="surface-card">
          <p className="eyebrow">Memory plan</p>
          <h2>{draft.memoryGiB} GiB minimum and maximum heap</h2>
          <p className="field-help field-help--large">The planner uses the same bounded memory value for initial and maximum heap. The desktop application remains responsible for host capacity validation.</p>
          <button type="button" className="text-action" onClick={() => navigate("configure")}>Change memory allocation <span aria-hidden="true">→</span></button>
        </section>
      </div>
      <ArgvPlan argv={activeArgv} caption="Active runtime argv" />
      <section className="surface-card">
        <div className="section-heading"><div><p className="eyebrow">Readiness notes</p><h2>Contextual checks</h2></div></div>
        <NoticeList notices={validationNotices} emptyMessage="The current browser draft has no contextual notices." />
      </section>
    </div>
  );

  const safetyPage = (
    <div className="page-stack">
      <PageHeading page={selectedPage} />
      <section className="surface-card safety-hero">
        <div>
          <p className="eyebrow">No live controls</p>
          <h2>Safety is a handoff checklist, not an enforcement console.</h2>
          <p className="body-copy">This site can point out a conflicting plan, but it cannot inspect a port, authenticate a user, issue a credential, read a server folder, or start a process.</p>
        </div>
        <span className={requiredBlockers.length ? "status-chip status-chip--warning status-chip--large" : "status-chip status-chip--success status-chip--large"}>
          {requiredBlockers.length ? "Review blockers" : "Ready to hand off"}
        </span>
      </section>
      <NoticeList notices={validationNotices} emptyMessage="No safety issues are currently detected in this local draft." />
      <div className="safety-grid">
        <section className="surface-card"><p className="eyebrow">EULA</p><h2>Explicit acknowledgement</h2><p className="body-copy">The desktop application should require a real acknowledgement before launch. This planner’s toggle only records a local drafting choice.</p></section>
        <section className="surface-card"><p className="eyebrow">RCON</p><h2>Credentials stay out of the browser</h2><p className="body-copy">A port can be planned, but no password field exists here and no secret is persisted in local storage.</p></section>
        <section className="surface-card"><p className="eyebrow">Network</p><h2>Ports are not probed</h2><p className="body-copy">The selected port is a plan. The desktop application must validate real host availability and network policy.</p></section>
      </div>
    </div>
  );

  const docsPage = (
    <div className="page-stack">
      <PageHeading page={selectedPage} />
      <section className="surface-card">
        <div className="section-heading docs-heading">
          <div>
            <p className="eyebrow">Local guide</p>
            <h2>Find a planner topic</h2>
          </div>
          <SearchField
            id="docs-search"
            label="Search local guide"
            placeholder="Search planner docs"
            state={docsSearch}
            onChange={setDocsSearch}
          />
        </div>
        <div className="docs-grid">
          {DOC_ITEMS.filter((item) => testSearch(`${item.title} ${item.text}`, docsSearch)).map((item) => (
            <article key={item.title} className="doc-card">
              <h2>{item.title}</h2>
              <p>{item.text}</p>
            </article>
          ))}
          {DOC_ITEMS.filter((item) => testSearch(`${item.title} ${item.text}`, docsSearch)).length === 0 ? (
            <p className="empty-state">No local guide topics match this search.</p>
          ) : null}
        </div>
      </section>
      <section className="surface-card split-card">
        <div>
          <p className="eyebrow">Repository documentation</p>
          <h2>Source records live alongside this companion</h2>
          <p className="body-copy">The repository’s README, ROADMAP, HANDOFF, and categorized documentation explain how a future owner can build, host, or extend this source without treating it as a live service.</p>
        </div>
        <span className="status-chip status-chip--neutral">Source-only boundary</span>
      </section>
    </div>
  );

  const releaseStatusPage = (
    <div className="page-stack">
      <PageHeading page={selectedPage} />
      <section className="release-card">
        <div>
          <p className="eyebrow">Verified version-pinned release record</p>
          <h2>Download the Windows installer for {VERIFIED_INSTALLER.releaseTag}</h2>
          <p className="body-copy" id="verified-installer-release-summary">
            This button targets the exact <code>{VERIFIED_INSTALLER.assetName}</code> asset attached to the published
            {" "}{VERIFIED_INSTALLER.releaseTag} release. It is not a latest-release URL and this page does not fetch,
            parse, or refresh release data in the browser.
          </p>
          <div className="button-row release-card__actions">
            <a
              className="primary-button"
              href={VERIFIED_INSTALLER.assetUrl}
              aria-describedby="verified-installer-release-summary verified-installer-unsigned-warning"
            >
              Download {VERIFIED_INSTALLER.assetName} ({VERIFIED_INSTALLER.releaseTag})
            </a>
            <a className="secondary-button" href={VERIFIED_INSTALLER.releaseUrl}>
              View the published release record
            </a>
          </div>
          <p className="field-help" id="verified-installer-unsigned-warning">
            {VERIFIED_INSTALLER.unsigned
              ? "This installer is unsigned and can cause an unknown-publisher or SmartScreen warning. The link is an external handoff only; GitHub handles any transfer after you activate it."
              : "The installer signing state is not represented by this source record."}
          </p>
        </div>
        <dl className="release-facts">
          <div><dt>Release tag</dt><dd>{VERIFIED_INSTALLER.releaseTag}</dd></div>
          <div><dt>Installer asset</dt><dd><code>{VERIFIED_INSTALLER.assetName}</code></dd></div>
          <div><dt>Published size</dt><dd>{VERIFIED_INSTALLER.assetSizeBytes.toLocaleString("en-US")} bytes</dd></div>
          <div><dt>Source commit</dt><dd><code className="release-source-sha">{VERIFIED_INSTALLER.sourceCommit}</code></dd></div>
        </dl>
      </section>
      <section className="surface-card">
        <p className="eyebrow">Publication boundary</p>
        <h2>A direct handoff is not download, install, update, or server evidence</h2>
        <ul className="release-boundary-list">
          <li>The embedded manifest is updated only from a verified published release record; it is not discovered at runtime.</li>
          <li>Activating the link hands the browser to GitHub. This site neither transfers the file nor observes completion.</li>
          <li>The page does not verify installation, automatic updates, application startup, or any Minecraft server action.</li>
        </ul>
      </section>
    </div>
  );

  const changelogPage = (
    <div className="page-stack">
      <PageHeading page={selectedPage} />
      <section className="surface-card notice-panel" aria-labelledby="changelog-summary-title">
        <div>
          <p className="eyebrow">Source-backed release history</p>
          <h2 id="changelog-summary-title">Every released version recorded for this companion</h2>
          <p className="body-copy">
            This browser-local viewer reads all 29 checked-in records for every released version currently recorded, including the verified published v0.1.44, v0.1.42, and v0.1.40 records.
            It never asks GitHub for new data, invents missing releases, or treats Unreleased notes as shipped versions.
          </p>
        </div>
        <span className="status-chip status-chip--info">{filteredChangelogReleases.length} of {CHANGELOG_RELEASES.length} shown</span>
      </section>

      <section className="surface-card changelog-viewer" aria-labelledby="changelog-controls-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Search and date range</p>
            <h2 id="changelog-controls-title">Find the release record you need</h2>
          </div>
          <span className="status-chip status-chip--neutral">Plain text first</span>
        </div>
        <SearchField
          id="changelog-search"
          label="Search changelog text"
          placeholder="Search versions, changes, or commit SHAs"
          state={changelogSearch}
          onChange={setChangelogSearch}
        />
        <div className="changelog-filter-grid">
          <div className="field-group">
            <label className="field-label" htmlFor="changelog-start-date">Start date</label>
            <input
              id="changelog-start-date"
              className="text-input"
              type="text"
              inputMode="numeric"
              value={changelogStartDate}
              onChange={(event) => updateChangelogDate("start", event.target.value)}
              placeholder="YYYY-MM-DD"
              maxLength={10}
              aria-invalid={validateChangelogDate(changelogStartDate).state === "invalid" || validateChangelogDate(changelogStartDate).state === "partial"}
              aria-describedby="changelog-date-help changelog-date-status"
            />
            <p className={validateChangelogDate(changelogStartDate).state === "invalid" || validateChangelogDate(changelogStartDate).state === "partial" ? "field-error" : "field-help"}>
              Type ISO YYYY-MM-DD or the local MM/DD/YYYY form.
            </p>
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="changelog-end-date">End date</label>
            <input
              id="changelog-end-date"
              className="text-input"
              type="text"
              inputMode="numeric"
              value={changelogEndDate}
              onChange={(event) => updateChangelogDate("end", event.target.value)}
              placeholder="YYYY-MM-DD"
              maxLength={10}
              aria-invalid={validateChangelogDate(changelogEndDate).state === "invalid" || validateChangelogDate(changelogEndDate).state === "partial"}
              aria-describedby="changelog-date-help changelog-date-status"
            />
            <p className={validateChangelogDate(changelogEndDate).state === "invalid" || validateChangelogDate(changelogEndDate).state === "partial" ? "field-error" : "field-help"}>
              Partial input stays visible and is not applied until complete.
            </p>
          </div>
        </div>
        <p className="field-help" id="changelog-date-help">Dates are compared in ISO order. A range includes both its start and end dates.</p>
        <div className="changelog-filter-actions" role="group" aria-label="Changelog date presets">
          {([
            ["all", "All releases"],
            ["latest", "Latest release"],
            ["last-30-days", "Last 30 days"],
            ["current-year", "Current year"],
          ] as const).map(([preset, label]) => (
            <button
              key={preset}
              type="button"
              className={changelogDatePreset === preset ? "segment is-selected" : "segment"}
              aria-pressed={changelogDatePreset === preset}
              onClick={() => applyChangelogPreset(preset)}
            >
              {label}
            </button>
          ))}
        </div>
        <p
          id="changelog-date-status"
          className={changelogDateValidation ? "field-error" : "field-help"}
          role="status"
          aria-live="polite"
        >
          {changelogDateValidation?.message || changelogStatusMessage || `Showing ${filteredChangelogReleases.length} of ${CHANGELOG_RELEASES.length} released versions.`}
        </p>
        <div className="button-row" aria-label="Changelog export actions">
          <button type="button" className="secondary-button" onClick={copyChangelog} disabled={filteredChangelogReleases.length === 0}>
            Copy filtered Markdown
          </button>
          <button type="button" className="primary-button" onClick={exportChangelog} disabled={filteredChangelogReleases.length === 0}>
            Export filtered Markdown
          </button>
        </div>
        <div className="changelog-list" aria-live="polite">
          {filteredChangelogReleases.length === 0 ? (
            <p className="empty-state">No released version matches the current search and date range. Unreleased notes are not included.</p>
          ) : filteredChangelogReleases.map((release) => (
            <article key={release.tag} className="changelog-entry" aria-labelledby={`${release.tag}-title`}>
              <div className="changelog-entry__header">
                <div>
                  <p className="eyebrow">{release.sourceRecord}</p>
                  <h3 id={`${release.tag}-title`}>{release.tag} · {release.version}</h3>
                </div>
                <time dateTime={release.releaseDate}>{formatChangelogDate(release.releaseDate)}</time>
              </div>
              <div className="changelog-entry__categories">
                {release.categories.map((category) => (
                  <section key={category.label} className="changelog-category" aria-labelledby={`${release.tag}-${category.label}`}>
                    <h4 id={`${release.tag}-${category.label}`}>{category.label}</h4>
                    <ul>
                      {category.items.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </section>
                ))}
              </div>
              <section className="changelog-entry__links" aria-labelledby={`${release.tag}-commits`}>
                <h4 id={`${release.tag}-commits`}>Exact commit links</h4>
                <ul className="changelog-commit-list">
                  {release.commits.map((commit) => (
                    <li key={commit.sha}>
                      <a href={commit.url} target="_blank" rel="noreferrer">
                        {commit.label}: <code>{commit.sha}</code>
                      </a>
                    </li>
                  ))}
                </ul>
                <div className="changelog-record-links">
                  {release.links.map((link) => <a key={link.url} href={link.url} target="_blank" rel="noreferrer">{link.label}</a>)}
                </div>
              </section>
            </article>
          ))}
        </div>
      </section>
    </div>
  );

  const notificationPersistenceLabel = notificationPersistenceStatus === "saved"
    ? "Saved locally"
    : notificationPersistenceStatus === "unavailable"
      ? "Local persistence unavailable"
      : "Checking local storage";
  const notificationPage = (
    <div className="page-stack">
      <PageHeading page={selectedPage} />
      <section className="surface-card notice-panel" aria-labelledby="notification-centre-title">
        <div>
          <p className="eyebrow">Non-blocking notice history</p>
          <h2 id="notification-centre-title">Review what happened in this browser</h2>
          <p className="body-copy">
            Toasts remain non-blocking; informational and success notices auto-dismiss from the corner, while warnings and errors remain
            until dismissed. This centre keeps a bounded local record so you can review active and dismissed notices without any remote
            delivery or account.
          </p>
        </div>
        <span className={`status-chip status-chip--${notificationPersistenceStatus === "unavailable" ? "warning" : notificationPersistenceStatus === "saved" ? "success" : "neutral"}`}>
          {notificationPersistenceLabel}
        </span>
      </section>

      <section className="surface-card notification-centre" aria-labelledby="notification-controls-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Review and bulk actions</p>
            <h2 id="notification-controls-title">{activeNotificationCount} active · {dismissedNotificationCount} dismissed</h2>
          </div>
          <span className="status-chip status-chip--neutral">{notificationRecords.length} / 100 stored</span>
        </div>

        <SearchField
          id="notification-centre-search"
          label="Search notification centre"
          placeholder="Search notices"
          state={notificationSearch}
          onChange={setNotificationSearch}
        />

        <div className="notification-centre__view-row" role="group" aria-label="Notification record view">
          {([
            ["active", "Active", activeNotificationCount],
            ["dismissed", "Dismissed", dismissedNotificationCount],
            ["all", "All", notificationRecords.length],
          ] as const).map(([view, label, count]) => (
            <button
              key={view}
              type="button"
              className={notificationView === view ? "segment is-selected" : "segment"}
              aria-pressed={notificationView === view}
              onClick={() => setNotificationView(view)}
            >
              {label} <span aria-label={`${count} records`}>({count})</span>
            </button>
          ))}
        </div>

        <fieldset className="notification-centre__scope">
          <legend>Select-all scope</legend>
          <label className="check-row">
            <input
              type="radio"
              name="notification-select-scope"
              value="view"
              checked={notificationSelectScope === "view"}
              onChange={() => setNotificationSelectScope("view")}
            />
            Current view only ({filteredNotificationRecords.length})
          </label>
          <label className="check-row">
            <input
              type="radio"
              name="notification-select-scope"
              value="all"
              checked={notificationSelectScope === "all"}
              onChange={() => setNotificationSelectScope("all")}
            />
            Every matching record ({allMatchingNotificationRecords.length})
          </label>
          <p className="field-help">
            Current view respects the Active, Dismissed, or All filter. Every matching record includes matching records across all three statuses;
            both scopes stay inside this bounded browser-local collection.
          </p>
        </fieldset>

        <div className="button-row" aria-label="Notification selection actions">
          <button
            type="button"
            className="secondary-button"
            onClick={selectAllNotifications}
            aria-label={`Select all notification records in ${notificationSelectScope === "view" ? "the current view" : "every matching record"}`}
          >
            Select all in {notificationSelectScope === "view" ? "current view" : "every matching record"}
          </button>
          <button type="button" className="secondary-button" onClick={invertNotifications} aria-label="Invert notification selection">
            Invert selection
          </button>
          <button type="button" className="secondary-button" onClick={clearNotificationSelection} disabled={selectedNotificationIds.length === 0}>
            Clear selection ({selectedNotificationIds.length})
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={dismissSelectedNotifications}
            disabled={selectedDismissibleCount === 0}
            aria-describedby="notification-bulk-dismiss-help"
          >
            Dismiss selected ({selectedDismissibleCount})
          </button>
        </div>
        <p id="notification-bulk-dismiss-help" className="field-help">
          Bulk dismiss changes only selected active dismissible records. Dismissed records are retained for review and are never sent anywhere.
        </p>
        {notificationStatusMessage ? <p className="field-help" role="status" aria-live="polite">{notificationStatusMessage}</p> : null}

        {filteredNotificationRecords.length === 0 ? (
          <p className="empty-state empty-state--positive" role="status">
            {notificationRecords.length === 0
              ? "No notices have been recorded yet. Informational, success, warning, and error toasts will appear here after they occur."
              : "No notification records match the current view and search."}
          </p>
        ) : (
          <div className="notification-record-list" role="list" aria-label="Notification records">
            {filteredNotificationRecords.map((record) => {
              const isSelected = selectedNotificationSet.has(record.id);
              const isDismissed = record.dismissedAt !== null;
              const displayedTimestamp = isDismissed ? record.dismissedAt ?? record.createdAt : record.createdAt;
              return (
                <article key={record.id} className={`notification-record notification-record--${record.tone}`} role="listitem">
                  <label className="notification-record__select">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleNotificationSelection(record.id)}
                      aria-label={`Select notification: ${record.title}`}
                    />
                    <span aria-hidden="true" />
                  </label>
                  <div className="notification-record__body">
                    <div className="notification-record__heading">
                      <span className="notice__marker" aria-label={`${record.tone} notification`}>
                        {record.tone === "error" || record.tone === "warning" ? "!" : record.tone === "success" ? "✓" : "i"}
                      </span>
                      <div>
                        <h3>{record.title}</h3>
                        <p>{record.detail}</p>
                      </div>
                    </div>
                    <div className="notification-record__meta">
                      <time dateTime={displayedTimestamp}>{isDismissed ? "Dismissed" : "Received"} {new Date(displayedTimestamp).toLocaleString()}</time>
                      {isDismissed ? (
                        <span className="status-chip status-chip--neutral">Dismissed · retained for review</span>
                      ) : record.dismissible ? (
                        <button type="button" className="text-action" onClick={() => dismissNotification(record.id)} aria-label={`Dismiss notification: ${record.title}`}>
                          Dismiss
                        </button>
                      ) : (
                        <span className="status-chip status-chip--neutral">Review only</span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );

  const settingsPage = (
    <div className="page-stack">
      <PageHeading page={selectedPage} />
      <section className="surface-card notice-panel">
        <div>
          <p className="eyebrow">Local-only settings foundation</p>
          <h2>One bounded preference record for this site</h2>
          <p className="body-copy">
            These controls persist in this browser only. They do not change package identity, installer identity, server files,
            accounts, credentials, or any remote service. The full universal surface inventory remains the release gate.
          </p>
        </div>
        <span className="status-chip status-chip--info">Schema v1</span>
      </section>

      <section className="surface-card" aria-labelledby="settings-language-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Language & tone</p>
            <h2 id="settings-language-title">Choose how local copy is presented</h2>
          </div>
          <span className="status-chip status-chip--neutral">Persisted</span>
        </div>
        {universalSettings.schoolModeEnabled ? (
          <p className="field-help field-help--large">{universalSettings.schoolModeName} is on: English is forced and Cantonese, bilingual, funny-level, emoji, and private-vocabulary controls are omitted until the setting is unlocked.</p>
        ) : (
          <>
            <div className="form-grid">
              <div className="field-group">
                <label className="field-label" htmlFor="universal-language-mode">Language mode</label>
                <select
                  id="universal-language-mode"
                  className="select-input"
                  value={universalSettings.languageMode}
                  onChange={(event) => updateUniversalSettings("languageMode", event.target.value as UniversalLanguageMode)}
                >
                  <option value="english">English</option>
                  <option value="cantonese">Playful Hong Kong-style Cantonese</option>
                  <option value="bilingual">Bilingual</option>
                </select>
                <p className="field-help">The setting is stored as a bounded enum. This foundation shows the selected mode in its tone preview; complete app-wide localization remains unverified.</p>
              </div>
              <div className="field-group">
                <span className="field-label">Dialog emoji decoration</span>
                <div className="switch-row">
                  <span><strong>Show emojis in dialogs and message boxes</strong><small>Emoji is decoration only and never replaces a control label or accessible name.</small></span>
                  <input id="universal-emojis" type="checkbox" checked={universalSettings.showEmojisInDialogs} onChange={(event) => updateUniversalSettings("showEmojisInDialogs", event.target.checked)} />
                  <span className="switch-track" aria-hidden="true" />
                </div>
              </div>
            </div>
            <div className="form-grid">
              <div className="field-group">
                <label className="field-label" htmlFor="funny-level-english">English funny level: {universalSettings.funnyLevelEnglish} / 5</label>
                <input id="funny-level-english" type="range" min="1" max="5" step="1" value={universalSettings.funnyLevelEnglish} onChange={(event) => updateUniversalSettings("funnyLevelEnglish", Number(event.target.value))} />
                <p className="field-help">Level 1 is fully serious; level 5 styles every message, including warnings and errors, without changing facts.</p>
              </div>
              <div className="field-group">
                <label className="field-label" htmlFor="funny-level-cantonese">Cantonese funny level: {universalSettings.funnyLevelCantonese} / 5</label>
                <input id="funny-level-cantonese" type="range" min="1" max="5" step="1" value={universalSettings.funnyLevelCantonese} onChange={(event) => updateUniversalSettings("funnyLevelCantonese", Number(event.target.value))} />
                <p className="field-help">This independent slider is stored separately from English and keeps the same factual-warning boundary.</p>
              </div>
            </div>
            <div className="surface-card surface-card--nested" aria-live="polite">
              <p className="eyebrow">Tone preview</p>
              <p className="body-copy">{universalSettings.showEmojisInDialogs ? "✨ " : ""}{tonePreview(universalSettings.languageMode, universalSettings.languageMode === "cantonese" ? universalSettings.funnyLevelCantonese : universalSettings.funnyLevelEnglish)}</p>
            </div>
          </>
        )}
      </section>

      <section className="surface-card" aria-labelledby="settings-school-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Focus boundary</p>
            <h2 id="settings-school-title">{universalSettings.schoolModeName}</h2>
          </div>
          <span className={universalSettings.schoolModeEnabled ? "status-chip status-chip--warning" : "status-chip status-chip--neutral"}>{universalSettings.schoolModeEnabled ? "On" : "Off"}</span>
        </div>
        {!universalSettings.schoolModeEnabled ? (
          <>
            <div className="field-group">
              <label className="field-label" htmlFor="school-mode-name">Display name</label>
              <input id="school-mode-name" className="text-input" value={universalSettings.schoolModeName} maxLength={80} onChange={(event) => updateUniversalSettings("schoolModeName", event.target.value)} />
              <p className="field-help">The chosen name is used on this surface after saving. It is a user-experience lock, not a security boundary.</p>
            </div>
            <div className="switch-row">
              <span><strong>Turn on {universalSettings.schoolModeName}</strong><small>When enabled, English is forced and the optional language, tone, emoji, and private-vocabulary controls are omitted.</small></span>
              <input id="school-mode-enabled" type="checkbox" checked={false} onChange={() => updateUniversalSettings("schoolModeEnabled", true)} />
              <span className="switch-track" aria-hidden="true" />
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="school-unlock-create">Set or replace local unlock value</label>
              <input id="school-unlock-create" className="text-input" type="password" value={schoolUnlockInput} maxLength={32} onChange={(event) => setSchoolUnlockInput(event.target.value)} autoComplete="new-password" />
              <div className="button-row"><button type="button" className="secondary-button" onClick={saveSchoolUnlock}>Save local unlock value</button></div>
              <p className="field-help">{schoolUnlockConfigured ? "A local digest is configured; the value itself is never shown, exported, logged, or placed in the vocabulary cache." : "No unlock value is configured yet."}</p>
            </div>
          </>
        ) : (
          <>
            <p className="body-copy">This site uses a local digest for the toy unlock. It makes no security claim and does not protect data from another person using this browser.</p>
            <div className="field-group">
              <label className="field-label" htmlFor="school-unlock-disable">Enter the local unlock value to turn off {universalSettings.schoolModeName}</label>
              <input id="school-unlock-disable" className="text-input" type="password" value={schoolUnlockInput} maxLength={32} onChange={(event) => setSchoolUnlockInput(event.target.value)} autoComplete="current-password" />
              <div className="button-row"><button type="button" className="secondary-button" onClick={disableSchoolMode}>Unlock and turn off</button></div>
              <p className="field-help">Forgotten values recover by clearing this site&apos;s browser storage; the site does not provide a support reset or claim encryption.</p>
            </div>
          </>
        )}
      </section>

      <section className="surface-card" aria-labelledby="settings-appearance-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Appearance</p>
            <h2 id="settings-appearance-title">Theme, density, accent, and app display name</h2>
          </div>
          <span className="status-chip status-chip--info">Live local preview</span>
        </div>
        <div className="form-grid">
          <div className="field-group">
            <label className="field-label" htmlFor="app-display-name">App display name</label>
            <input id="app-display-name" className="text-input" value={universalSettings.appDisplayName} maxLength={100} onChange={(event) => updateUniversalSettings("appDisplayName", event.target.value)} />
            <p className="field-help">This changes the user-facing label only. Package identity, data location, executable name, installer, and update feed stay constant.</p>
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="universal-density">Density</label>
            <select id="universal-density" className="select-input" value={universalSettings.density} onChange={(event) => updateUniversalSettings("density", event.target.value as UniversalSettingsV1["density"])}>
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </select>
            <p className="field-help">The preference is persisted and exposed as a document density state; full every-element editing remains a separate incomplete contract.</p>
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="universal-theme">Theme</label>
            <select id="universal-theme" className="select-input" value={universalSettings.theme} onChange={(event) => { const theme = event.target.value as UniversalSettingsV1["theme"]; updateUniversalSettings("theme", theme); setDraft((current) => ({ ...current, theme })); }}>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
            <p className="field-help">The site applies this theme live and keeps it in the universal preference record.</p>
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="universal-seed">Accent color</label>
            <div className="color-row"><input id="universal-seed" type="color" value={universalSettings.seedColor} onChange={(event) => { const seed = event.target.value.toUpperCase(); updateUniversalSettings("seedColor", seed); setDraft((current) => ({ ...current, seed })); }} /><code>{universalSettings.seedColor}</code><span className="field-help">{hexToRgb(universalSettings.seedColor)}</span></div>
            <p className="field-help">This foundation keeps the hex and RGB readout synchronized. The full multi-space translator remains unverified.</p>
          </div>
        </div>
      </section>

      <section className="surface-card" aria-labelledby="settings-logo-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">App logo</p>
            <h2 id="settings-logo-title">Choose a shipped mark or a private local image</h2>
          </div>
          <span className="status-chip status-chip--neutral">{universalSettings.customLogoStatus === "loaded" ? "Custom loaded" : "Preset active"}</span>
        </div>
        <div className="form-grid">
          <div className="field-group">
            <span className="field-label">Logo presets</span>
            <div className="segmented-control segmented-control--compact" role="radiogroup" aria-label="App logo presets">
              {LOGO_PRESETS.map((preset) => (
                <button key={preset} type="button" className={universalSettings.logoPreset === preset ? "segment is-selected" : "segment"} role="radio" aria-checked={universalSettings.logoPreset === preset} onClick={() => { updateUniversalSettings("logoPreset", preset as LogoPreset); setCustomLogoPreview(null); updateUniversalSettings("customLogoStatus", "empty"); window.localStorage.removeItem(CUSTOM_LOGO_CACHE_KEY); }}>
                  {preset === "default" ? "Default" : preset === "paper" ? "Paper" : "Pixel"}
                </button>
              ))}
            </div>
            <p className="field-help">Presets change the local display mark only. They do not change package or installer identity.</p>
          </div>
          <div className="field-group">
            <span className="field-label">Custom image</span>
            <input ref={customLogoInput} className="sr-only" type="file" accept="image/png,image/jpeg" onChange={selectCustomLogo} aria-label="Choose a local custom app logo" />
            <div className="button-row"><button type="button" className="secondary-button" onClick={() => customLogoInput.current?.click()}>Choose local PNG or JPEG</button><button type="button" className="secondary-button" onClick={clearCustomLogo} disabled={!customLogoPreview}>Reset custom logo</button></div>
            <p className="field-help">The file is decoded and bounded locally at 512 KiB and 4096 pixels per axis. No upload or remote converter is used.</p>
            {customLogoPreview ? <img className="custom-logo-preview" src={customLogoPreview} alt="User-selected local custom app logo preview" /> : <p className="empty-state">No custom image is loaded.</p>}
          </div>
        </div>
      </section>

      <section className="surface-card" aria-labelledby="settings-tabs-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Tabbed navigation</p>
            <h2 id="settings-tabs-title">Choose the tab strip docking edge</h2>
          </div>
          <span className="status-chip status-chip--neutral">Persisted</span>
        </div>
        <label className="field-label" htmlFor="tab-dock-position">Tab strip position</label>
        <select id="tab-dock-position" className="select-input" value={universalSettings.tabDock} onChange={(event) => updateUniversalSettings("tabDock", event.target.value as UniversalSettingsV1["tabDock"])}>
          {TAB_DOCK_POSITIONS.map((position) => <option key={position} value={position}>{position[0].toUpperCase() + position.slice(1)}</option>)}
        </select>
        <p className="field-help">The preference is stored for future tab-strip layout work. Reordering, pinning, grouping, four discovery searches, and bulk close remain explicitly unverified.</p>
      </section>

      {!universalSettings.schoolModeEnabled ? (
        <section className="surface-card" aria-labelledby="settings-vocabulary-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Private personal vocabulary</p>
              <h2 id="settings-vocabulary-title">Upload a validated local JSON file</h2>
            </div>
            <span className={universalSettings.personalVocabulary.status === "loaded" ? "status-chip status-chip--success" : "status-chip status-chip--neutral"}>{universalSettings.personalVocabulary.status === "loaded" ? `${universalSettings.personalVocabulary.entryCount} entries loaded` : "No file loaded"}</span>
          </div>
          <input ref={personalVocabularyInput} className="sr-only" type="file" accept="application/json,.json" onChange={selectPersonalVocabulary} aria-label="Choose local personal vocabulary JSON" />
          <div className="button-row"><button type="button" className="secondary-button" onClick={() => personalVocabularyInput.current?.click()}>Choose personal vocabulary JSON</button><button type="button" className="secondary-button" onClick={clearPersonalVocabulary} disabled={universalSettings.personalVocabulary.status !== "loaded"}>Clear private vocabulary</button></div>
          <p className="field-help">Schema v1 is bounded to 64 KiB, 128 entries, 160-character strings, fixed fields, safe object keys, and no duplicate keys. The cache is local-only and this foundation does not copy its values into exports, logs, or public text.</p>
          <p className="field-error">The validated cache is recorded, but complete private text-boundary replacement across every surface is not yet shipped.</p>
        </section>
      ) : null}

      <section className="surface-card">
        <div className="section-heading">
          <div><p className="eyebrow">Recovery</p><h2>Reset this browser&apos;s local preference record</h2></div>
          <span className="status-chip status-chip--warning">Destructive local reset</span>
        </div>
        <p className="body-copy">This action clears the universal preference record, the private vocabulary cache, the custom logo cache, and the toy unlock digest. It does not touch server files or the desktop draft.</p>
        <button type="button" className="secondary-button" onClick={resetUniversalSettings}>Reset universal settings</button>
      </section>
    </div>
  );

  const pageContent: Record<PageId, ReactNode> = {
    overview: overviewPage,
    configure: configurePage,
    "paper-cli": paperCliPage,
    "spigot-setup": spigotSetupPage,
    runtime: runtimePage,
    safety: safetyPage,
    docs: docsPage,
    "release-status": releaseStatusPage,
    changelog: changelogPage,
    notifications: notificationPage,
    settings: settingsPage,
  };

  return (
    <PersonalVocabularyBoundary entries={universalSettings.schoolModeEnabled ? [] : personalVocabularyEntries}>
      <main className="planner-shell" style={appStyle}>
      <a className="skip-link" href="#planner-content">Skip to planner content</a>
      <header className="top-app-bar">
        <div className="brand-lockup">
          {customLogoPreview && universalSettings.customLogoStatus === "loaded" ? (
            <img className="brand-mark brand-mark--custom" src={customLogoPreview} alt="User-selected app logo" />
          ) : (
            <div className={`brand-mark brand-mark--${universalSettings.logoPreset}`} aria-hidden="true"><span /><span /><span /></div>
          )}
          <div>
            <p className="brand-name">{universalSettings.appDisplayName}</p>
            <p className="brand-subtitle">Companion configuration planner</p>
          </div>
        </div>
        <div className="top-app-bar__actions">
          <SearchField
            id="destination-search"
            label="Search destinations"
            placeholder="Search pages"
            state={navigationSearch}
            onChange={setNavigationSearch}
          />
          <button type="button" className="command-button" onClick={() => setPaletteOpen(true)} aria-label="Open command palette">
            <span>Command palette</span>
            <kbd>Ctrl Shift F</kbd>
          </button>
        </div>
      </header>

      <div className="workspace-layout">
        <aside className="navigation-rail" aria-label="Planner destinations">
          <p className="navigation-rail__label">Destinations</p>
          <div className="tab-list" role="tablist" aria-label="Planner pages">
            {matchingPages.map((page) => (
              <button
                key={page.id}
                id={`tab-${page.id}`}
                role="tab"
                aria-selected={activePage === page.id}
                aria-controls={`panel-${page.id}`}
                tabIndex={activePage === page.id ? 0 : -1}
                type="button"
                className={activePage === page.id ? "nav-tab is-active" : "nav-tab"}
                onClick={() => navigate(page.id)}
              >
                <span className="nav-tab__dot" aria-hidden="true" />
                <span>{page.label}</span>
              </button>
            ))}
            {matchingPages.length === 0 ? <p className="empty-nav">No destinations match this search.</p> : null}
          </div>
          <div className="navigation-rail__footer">
            <span className="status-dot" aria-hidden="true" />
            <span>Browser-local draft</span>
          </div>
        </aside>

        <section
          className="content-pane"
          id="planner-content"
          role="tabpanel"
          aria-labelledby={`tab-${activePage}`}
          tabIndex={-1}
        >
          {pageContent[activePage]}
        </section>
      </div>

      <footer className="site-footer">
        <span>Local planner source · no analytics · no external fonts · no server controls</span>
        <button type="button" className="text-action" onClick={() => navigate("release-status")}>View release boundary <span aria-hidden="true">→</span></button>
      </footer>

      {notice ? (
        <div className={`toast toast--${notice.tone}`} role="status" aria-live="polite">
          <strong>{notice.title}</strong>
          <span>{notice.detail}</span>
          <div className="toast__actions">
            <button type="button" className="toast__review" onClick={() => { setActivePage("notifications"); setPaletteOpen(false); setNotice(null); }}>
              Review
            </button>
            <button type="button" onClick={() => dismissNotification(notice.id)} aria-label={`Dismiss notification: ${notice.title}`}>×</button>
          </div>
        </div>
      ) : null}

      {paletteOpen ? (
          <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPaletteOpen(false);
          }}>
            <section className="command-palette" role="dialog" aria-modal="true" aria-labelledby="palette-title">
            <div className="command-palette__heading">
              <div>
                <p className="eyebrow">Ctrl Shift F</p>
                <h2 id="palette-title">Command palette</h2>
              </div>
              <button type="button" className="icon-button" onClick={() => setPaletteOpen(false)} aria-label="Close command palette">×</button>
            </div>
            <SearchField
              id="command-palette-search"
              label="Search command palette"
              placeholder="Search destinations and actions"
              state={paletteSearch}
              onChange={setPaletteSearch}
            />
            <div className="command-list" role="list">
              {paletteItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="command-item"
                  onClick={() => {
                    item.action();
                    setPaletteOpen(false);
                  }}
                >
                  <span><strong>{item.label}</strong><small>{item.detail}</small></span>
                  <span aria-hidden="true">↗</span>
                </button>
              ))}
              {paletteItems.length === 0 ? <p className="empty-state">No commands match this search.</p> : null}
            </div>
            <p className="field-help">Escape closes this palette. It does not connect to a server or send a command.</p>
          </section>
        </div>
      ) : null}
      </main>
    </PersonalVocabularyBoundary>
  );
}

function PageHeading({ page }: { page: (typeof PAGE_DEFINITIONS)[number] }) {
  const entries = usePersonalVocabularyEntries();
  return (
    <PersonalVocabularyBoundary entries={entries}>
      <header className="page-heading">
      <p className="eyebrow">{page.eyebrow}</p>
      <h1>{page.label}</h1>
      <p>{page.description}</p>
      </header>
    </PersonalVocabularyBoundary>
  );
}

function NoticeList({ notices, emptyMessage }: { notices: Notice[]; emptyMessage: string }) {
  const entries = usePersonalVocabularyEntries();
  if (notices.length === 0) {
    return (
      <PersonalVocabularyBoundary entries={entries}>
        <p className="empty-state empty-state--positive">{emptyMessage}</p>
      </PersonalVocabularyBoundary>
    );
  }
  return (
    <PersonalVocabularyBoundary entries={entries}>
      <div className="notice-list">
      {notices.map((item) => (
        <article key={item.title} className={`notice notice--${item.tone}`}>
          <span className="notice__marker" aria-hidden="true">{item.tone === "error" ? "!" : item.tone === "warning" ? "!" : "i"}</span>
          <div><h3>{item.title}</h3><p>{item.detail}</p></div>
        </article>
      ))}
      </div>
    </PersonalVocabularyBoundary>
  );
}
