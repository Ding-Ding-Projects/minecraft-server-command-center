export const DRAFT_SCHEMA_VERSION = 1 as const;

export const SERVER_KINDS = ["paper", "spigot"] as const;
export const JAVA_RUNTIMES = ["auto", "java-17", "java-21", "java-25", "custom"] as const;
export const GAME_MODES = ["survival", "creative", "adventure", "spectator"] as const;
export const DIFFICULTIES = ["peaceful", "easy", "normal", "hard"] as const;
export const CONSOLE_MODES = ["interactive", "no-console", "vanilla-console"] as const;
export const UI_MODES = ["headless", "server-gui"] as const;

export type ServerKind = (typeof SERVER_KINDS)[number];
export type JavaRuntime = (typeof JAVA_RUNTIMES)[number];
export type GameMode = (typeof GAME_MODES)[number];
export type Difficulty = (typeof DIFFICULTIES)[number];
export type ConsoleMode = (typeof CONSOLE_MODES)[number];
export type UiMode = (typeof UI_MODES)[number];

export interface ServerDraft {
  readonly schemaVersion: typeof DRAFT_SCHEMA_VERSION;
  readonly serverName: string;
  readonly serverRoot: string;
  readonly serverJar: string;
  readonly serverKind: ServerKind;
  readonly minecraftVersion: string;
  readonly paperBuild: string;
  readonly javaRuntime: JavaRuntime;
  readonly javaExecutable: string;
  readonly memoryInitialMiB: number;
  readonly memoryMaximumMiB: number;
  readonly diskReserveMiB: number;
  readonly eulaAcknowledged: boolean;
  readonly onlineMode: boolean;
  readonly host: string;
  readonly port: number;
  readonly worldName: string;
  readonly seed: string;
  readonly gameMode: GameMode;
  readonly difficulty: Difficulty;
  readonly rconEnabled: boolean;
  readonly rconPort: number;
  readonly pluginsDirectory: string;
  readonly serverPropertiesPath: string;
  readonly bukkitSettingsPath: string;
  readonly spigotSettingsPath: string;
  readonly paperConfigDirectory: string;
  readonly commandsSettingsPath: string;
  readonly consoleMode: ConsoleMode;
  readonly uiMode: UiMode;
  readonly safeMode: boolean;
  readonly initSettings: boolean;
  readonly demoMode: boolean;
  readonly bonusChest: boolean;
}

export interface DraftLimits {
  readonly maxTextLength: number;
  readonly maxPathLength: number;
  readonly maxSeedLength: number;
  readonly minimumMemoryMiB: number;
  readonly maximumMemoryMiB: number;
  readonly maximumDiskReserveMiB: number;
}

export const DRAFT_LIMITS: DraftLimits = {
  maxTextLength: 120,
  maxPathLength: 2048,
  maxSeedLength: 256,
  minimumMemoryMiB: 256,
  maximumMemoryMiB: 1048576,
  maximumDiskReserveMiB: 1048576
};

export const DEFAULT_SERVER_DRAFT: ServerDraft = {
  schemaVersion: DRAFT_SCHEMA_VERSION,
  serverName: "My Minecraft Server",
  serverRoot: "",
  serverJar: "server.jar",
  serverKind: "paper",
  minecraftVersion: "1.21.4",
  paperBuild: "",
  javaRuntime: "auto",
  javaExecutable: "",
  memoryInitialMiB: 2048,
  memoryMaximumMiB: 4096,
  diskReserveMiB: 2048,
  eulaAcknowledged: false,
  onlineMode: true,
  host: "",
  port: 25565,
  worldName: "world",
  seed: "",
  gameMode: "survival",
  difficulty: "normal",
  rconEnabled: false,
  rconPort: 25575,
  pluginsDirectory: "plugins",
  serverPropertiesPath: "server.properties",
  bukkitSettingsPath: "bukkit.yml",
  spigotSettingsPath: "spigot.yml",
  paperConfigDirectory: "config",
  commandsSettingsPath: "commands.yml",
  consoleMode: "interactive",
  uiMode: "headless",
  safeMode: false,
  initSettings: false,
  demoMode: false,
  bonusChest: false
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function boundedText(value: unknown, fallback: string, maximum: number): string {
  if (typeof value !== "string") return fallback;
  return value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, maximum);
}

function boundedPath(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  return value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, DRAFT_LIMITS.maxPathLength);
}

function boundedInteger(value: unknown, fallback: number, minimum: number, maximum: number): number {
  const candidate = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(candidate)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.trunc(candidate)));
}

function booleanValue(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function enumValue<T extends readonly string[]>(value: unknown, values: T, fallback: T[number]): T[number] {
  return typeof value === "string" && values.includes(value as T[number]) ? value as T[number] : fallback;
}

export function normalizeServerDraft(value: unknown): ServerDraft {
  const input = isRecord(value) ? value : {};
  const maximumMemoryMiB = boundedInteger(
    input.memoryMaximumMiB,
    DEFAULT_SERVER_DRAFT.memoryMaximumMiB,
    DRAFT_LIMITS.minimumMemoryMiB,
    DRAFT_LIMITS.maximumMemoryMiB
  );
  const initialCandidate = boundedInteger(
    input.memoryInitialMiB,
    DEFAULT_SERVER_DRAFT.memoryInitialMiB,
    DRAFT_LIMITS.minimumMemoryMiB,
    DRAFT_LIMITS.maximumMemoryMiB
  );

  return {
    schemaVersion: DRAFT_SCHEMA_VERSION,
    serverName: boundedText(input.serverName, DEFAULT_SERVER_DRAFT.serverName, DRAFT_LIMITS.maxTextLength),
    serverRoot: boundedPath(input.serverRoot, DEFAULT_SERVER_DRAFT.serverRoot),
    serverJar: boundedPath(input.serverJar, DEFAULT_SERVER_DRAFT.serverJar),
    serverKind: enumValue(input.serverKind, SERVER_KINDS, DEFAULT_SERVER_DRAFT.serverKind),
    minecraftVersion: boundedText(input.minecraftVersion, DEFAULT_SERVER_DRAFT.minecraftVersion, 32),
    paperBuild: boundedText(input.paperBuild, DEFAULT_SERVER_DRAFT.paperBuild, 32),
    javaRuntime: enumValue(input.javaRuntime, JAVA_RUNTIMES, DEFAULT_SERVER_DRAFT.javaRuntime),
    javaExecutable: boundedPath(input.javaExecutable, DEFAULT_SERVER_DRAFT.javaExecutable),
    memoryInitialMiB: Math.min(initialCandidate, maximumMemoryMiB),
    memoryMaximumMiB,
    diskReserveMiB: boundedInteger(
      input.diskReserveMiB,
      DEFAULT_SERVER_DRAFT.diskReserveMiB,
      0,
      DRAFT_LIMITS.maximumDiskReserveMiB
    ),
    eulaAcknowledged: booleanValue(input.eulaAcknowledged, DEFAULT_SERVER_DRAFT.eulaAcknowledged),
    onlineMode: booleanValue(input.onlineMode, DEFAULT_SERVER_DRAFT.onlineMode),
    host: boundedText(input.host, DEFAULT_SERVER_DRAFT.host, 255),
    port: boundedInteger(input.port, DEFAULT_SERVER_DRAFT.port, 1, 65535),
    worldName: boundedText(input.worldName, DEFAULT_SERVER_DRAFT.worldName, DRAFT_LIMITS.maxTextLength),
    seed: boundedText(input.seed, DEFAULT_SERVER_DRAFT.seed, DRAFT_LIMITS.maxSeedLength),
    gameMode: enumValue(input.gameMode, GAME_MODES, DEFAULT_SERVER_DRAFT.gameMode),
    difficulty: enumValue(input.difficulty, DIFFICULTIES, DEFAULT_SERVER_DRAFT.difficulty),
    rconEnabled: booleanValue(input.rconEnabled, DEFAULT_SERVER_DRAFT.rconEnabled),
    rconPort: boundedInteger(input.rconPort, DEFAULT_SERVER_DRAFT.rconPort, 1, 65535),
    pluginsDirectory: boundedPath(input.pluginsDirectory, DEFAULT_SERVER_DRAFT.pluginsDirectory),
    serverPropertiesPath: boundedPath(input.serverPropertiesPath, DEFAULT_SERVER_DRAFT.serverPropertiesPath),
    bukkitSettingsPath: boundedPath(input.bukkitSettingsPath, DEFAULT_SERVER_DRAFT.bukkitSettingsPath),
    spigotSettingsPath: boundedPath(input.spigotSettingsPath, DEFAULT_SERVER_DRAFT.spigotSettingsPath),
    paperConfigDirectory: boundedPath(input.paperConfigDirectory, DEFAULT_SERVER_DRAFT.paperConfigDirectory),
    commandsSettingsPath: boundedPath(input.commandsSettingsPath, DEFAULT_SERVER_DRAFT.commandsSettingsPath),
    consoleMode: enumValue(input.consoleMode, CONSOLE_MODES, DEFAULT_SERVER_DRAFT.consoleMode),
    uiMode: enumValue(input.uiMode, UI_MODES, DEFAULT_SERVER_DRAFT.uiMode),
    safeMode: booleanValue(input.safeMode, DEFAULT_SERVER_DRAFT.safeMode),
    initSettings: booleanValue(input.initSettings, DEFAULT_SERVER_DRAFT.initSettings),
    demoMode: booleanValue(input.demoMode, DEFAULT_SERVER_DRAFT.demoMode),
    bonusChest: booleanValue(input.bonusChest, DEFAULT_SERVER_DRAFT.bonusChest)
  };
}

function withValue(argv: string[], flag: string, value: string): void {
  if (value.length > 0) {
    argv.push(flag, value);
  }
}

export function makeDirectArgv(value: unknown): readonly string[] {
  const draft = normalizeServerDraft(value);
  const java = draft.javaRuntime === "custom" && draft.javaExecutable.length > 0
    ? draft.javaExecutable
    : "java";
  const argv: string[] = [
    java,
    "-Xms" + draft.memoryInitialMiB + "M",
    "-Xmx" + draft.memoryMaximumMiB + "M",
    "-jar",
    draft.serverJar || "server.jar"
  ];

  if (draft.uiMode === "headless") argv.push("--nogui");
  withValue(argv, "-h", draft.host);
  argv.push("-p", String(draft.port), "-o", String(draft.onlineMode), "-w", draft.worldName);

  if (draft.serverKind !== "paper") return argv;

  withValue(argv, "-P", draft.pluginsDirectory);
  withValue(argv, "-c", draft.serverPropertiesPath);
  withValue(argv, "-b", draft.bukkitSettingsPath);
  withValue(argv, "-S", draft.spigotSettingsPath);
  withValue(argv, "-C", draft.commandsSettingsPath);
  withValue(argv, "--paper-dir", draft.paperConfigDirectory);
  if (draft.consoleMode === "no-console") argv.push("--noconsole");
  if (draft.consoleMode === "vanilla-console") argv.push("--nojline");
  if (draft.safeMode) argv.push("--safeMode");
  if (draft.initSettings) argv.push("--initSettings");
  if (draft.demoMode) argv.push("--demo");
  if (draft.bonusChest) argv.push("--bonusChest");
  return argv;
}

export function describeJavaRuntime(runtime: JavaRuntime): string {
  if (runtime === "auto") return "Use java resolved by the operating system";
  if (runtime === "custom") return "Use the selected Java executable without invoking a shell";
  return "Prefer Java " + runtime.replace("java-", "");
}
