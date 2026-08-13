"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";

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
  | "release-status";

type PlannerDraft = {
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

type Notice = {
  tone: "warning" | "error" | "success" | "info";
  title: string;
  detail: string;
};

const STORAGE_KEY = "minecraft-server-command-center.site.planner.v1";
const SEARCH_DEFAULT: SearchState = {
  query: "",
  pattern: "",
  flags: "i",
  regexMode: false,
  builderOpen: false,
};
const DEFAULT_DRAFT: PlannerDraft = {
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
    eyebrow: "Source boundary",
    description: "This companion source has not been bound to a hosted project or published release.",
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
];

function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
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
  const addToken = (token: string) => {
    onChange({ ...state, regexMode: true, pattern: `${state.pattern}${token}`.slice(0, 160) });
  };

  return (
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
  return (
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
  const setSafeValue = (nextValue: number) => onChange(clamp(nextValue, min, max));
  return (
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
  );
}

function ArgvPlan({ argv, caption }: { argv: string[]; caption: string }) {
  return (
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
  );
}

export default function Home() {
  const [draft, setDraft] = useState<PlannerDraft>(DEFAULT_DRAFT);
  const [activePage, setActivePage] = useState<PageId>("overview");
  const [navigationSearch, setNavigationSearch] = useState<SearchState>(SEARCH_DEFAULT);
  const [docsSearch, setDocsSearch] = useState<SearchState>(SEARCH_DEFAULT);
  const [paletteSearch, setPaletteSearch] = useState<SearchState>(SEARCH_DEFAULT);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setDraft(restoreDraft(window.localStorage.getItem(STORAGE_KEY)));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    document.documentElement.dataset.theme = draft.theme;
  }, [draft, hydrated]);

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
    if (!notice) return;
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
  ].filter((item) => testSearch(`${item.label} ${item.detail}`, paletteSearch));

  const updateDraft = <Key extends keyof PlannerDraft>(key: Key, value: PlannerDraft[Key]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };
  const navigate = (page: PageId) => {
    setActivePage(page);
    setPaletteOpen(false);
    setNotice({ tone: "info", title: `Opened ${PAGE_DEFINITIONS.find((item) => item.id === page)?.label}`, detail: "The planner stayed in this browser; no server action was started." });
  };
  const resetDraft = () => {
    setDraft(DEFAULT_DRAFT);
    window.localStorage.removeItem(STORAGE_KEY);
    setNotice({ tone: "success", title: "Browser draft reset", detail: "Only non-secret planner values were removed from this browser." });
  };
  const copyPlan = async () => {
    try {
      await navigator.clipboard.writeText(activeArgv.join(" "));
      setNotice({ tone: "success", title: "Read-only plan copied", detail: "Paste it into the installed desktop application; this site does not launch servers." });
    } catch {
      setNotice({ tone: "warning", title: "Copy was unavailable", detail: "Your browser did not allow clipboard access. The typed plan remains visible for manual use." });
    }
  };

  const appStyle = { "--seed": draft.seed } as CSSProperties;
  const selectedPage = PAGE_DEFINITIONS.find((page) => page.id === activePage) ?? PAGE_DEFINITIONS[0];

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
          <label className="switch-row">
            <span>
              <strong>Enable RCON planning</strong>
              <small>Shows a non-secret management port choice only.</small>
            </span>
            <input
              type="checkbox"
              checked={draft.rconEnabled}
              onChange={(event) => updateDraft("rconEnabled", event.target.checked)}
            />
            <span className="switch-track" aria-hidden="true" />
          </label>
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
          <label className="switch-row switch-row--eula">
            <span>
              <strong>I have reviewed the Minecraft EULA</strong>
              <small>This is an acknowledgement for the handoff plan, not a substitute for reading the EULA.</small>
            </span>
            <input
              type="checkbox"
              checked={draft.eulaAccepted}
              onChange={(event) => updateDraft("eulaAccepted", event.target.checked)}
            />
            <span className="switch-track" aria-hidden="true" />
          </label>
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
              <p className="field-help">No secrets, server files, account data, or live settings are placed in browser storage.</p>
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
          <p className="eyebrow">Minecraft Server Command Center</p>
          <h1>Plan a safer Paper or Spigot server.</h1>
          <p className="hero-lede">Configure locally. Launch in the desktop app.</p>
          <p className="body-copy">
            This companion site turns guided choices into an explainable, read-only runtime plan. It never downloads,
            writes, starts, or administers a server.
          </p>
          <div className="button-row">
            <button type="button" className="primary-button" onClick={() => navigate("configure")}>
              Open guided configuration
            </button>
            <button type="button" className="secondary-button" onClick={() => navigate("safety")}>
              Review safety plan
            </button>
          </div>
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
          <p className="eyebrow">Deployment deliberately absent</p>
          <h2>This companion source is ready for an owner-managed hosting handoff.</h2>
          <p className="body-copy">No hosted project has been connected, no URL is claimed, and no release status has been inferred. The source stays local until the owner chooses the Sites project and hosting step.</p>
        </div>
        <dl className="release-facts">
          <div><dt>Sites project ID</dt><dd>Not set</dd></div>
          <div><dt>Hosted URL</dt><dd>Not published</dd></div>
          <div><dt>Server control</dt><dd>Not available</dd></div>
          <div><dt>Browser persistence</dt><dd>Non-secret local draft only</dd></div>
        </dl>
      </section>
      <section className="surface-card">
        <p className="eyebrow">Next owner action</p>
        <h2>Bind, build, and host only after reviewing the source boundary</h2>
        <p className="body-copy">When hosting is intentionally requested, a separate owner-managed step can associate the source with a Sites project and update this status with factual evidence.</p>
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
  };

  return (
    <main className="planner-shell" style={appStyle}>
      <a className="skip-link" href="#planner-content">Skip to planner content</a>
      <header className="top-app-bar">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true"><span /><span /><span /></div>
          <div>
            <p className="brand-name">Minecraft Server Command Center</p>
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
          <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss notification">×</button>
        </div>
      ) : null}

      {paletteOpen ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setPaletteOpen(false)}>
          <section className="command-palette" role="dialog" aria-modal="true" aria-labelledby="palette-title" onMouseDown={(event) => event.stopPropagation()}>
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
  );
}

function PageHeading({ page }: { page: (typeof PAGE_DEFINITIONS)[number] }) {
  return (
    <header className="page-heading">
      <p className="eyebrow">{page.eyebrow}</p>
      <h1>{page.label}</h1>
      <p>{page.description}</p>
    </header>
  );
}

function NoticeList({ notices, emptyMessage }: { notices: Notice[]; emptyMessage: string }) {
  if (notices.length === 0) return <p className="empty-state empty-state--positive">{emptyMessage}</p>;
  return (
    <div className="notice-list">
      {notices.map((item) => (
        <article key={item.title} className={`notice notice--${item.tone}`}>
          <span className="notice__marker" aria-hidden="true">{item.tone === "error" ? "!" : item.tone === "warning" ? "!" : "i"}</span>
          <div><h3>{item.title}</h3><p>{item.detail}</p></div>
        </article>
      ))}
    </div>
  );
}
