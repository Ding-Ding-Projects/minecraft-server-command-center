import {
  DEFAULT_SERVER_DRAFT,
  normalizeServerDraft,
  type JavaRuntime,
  type ServerDraft,
  type ServerKind
} from "./server-draft";

/**
 * The browser-to-desktop plan is intentionally smaller than ServerDraft. It
 * includes only user-selected, non-secret planning values. Local file paths,
 * executable locations, raw argv, URLs, credentials, and private addresses
 * never cross this boundary.
 */
export const PLANNER_HANDOFF_SCHEMA = "minecraft-server-command-center/planner-handoff.v1" as const;
export const PLANNER_HANDOFF_VERSION = 1 as const;
export const PLANNER_HANDOFF_MAX_BYTES = 12 * 1024;
export const PLANNER_HANDOFF_MAX_JSON_DEPTH = 8;
export const PLANNER_HANDOFF_FILENAME = "minecraft-server-command-center-planner-handoff.v1.json";

export const PLANNER_HANDOFF_MINECRAFT_VERSIONS = ["1.21.4", "1.20.6", "1.20.4"] as const;
export const PLANNER_HANDOFF_JAVA_RUNTIMES = ["java-17", "java-21"] as const;
export const PLANNER_HANDOFF_WORLD_NAMES = ["world", "creative-lab", "adventure-hub"] as const;

export type PlannerHandoffMinecraftVersion = (typeof PLANNER_HANDOFF_MINECRAFT_VERSIONS)[number];
export type PlannerHandoffJavaRuntime = (typeof PLANNER_HANDOFF_JAVA_RUNTIMES)[number];
export type PlannerHandoffWorldName = (typeof PLANNER_HANDOFF_WORLD_NAMES)[number];

export interface PlannerHandoffPlanV1 {
  readonly serverName: string;
  readonly serverKind: ServerKind;
  readonly minecraftVersion: PlannerHandoffMinecraftVersion;
  readonly javaRuntime: PlannerHandoffJavaRuntime;
  readonly memoryMiB: number;
  readonly worldName: PlannerHandoffWorldName;
  readonly eulaAcknowledged: boolean;
  readonly onlineMode: boolean;
  readonly port: number;
  readonly rconEnabled: boolean;
  readonly rconPort: number;
}

export interface PlannerHandoffV1 {
  readonly schema: typeof PLANNER_HANDOFF_SCHEMA;
  readonly version: typeof PLANNER_HANDOFF_VERSION;
  readonly plan: PlannerHandoffPlanV1;
}

/** A renderer-safe summary: it deliberately contains no source path or raw JSON. */
export interface PlannerHandoffPreview {
  readonly schema: typeof PLANNER_HANDOFF_SCHEMA;
  readonly version: typeof PLANNER_HANDOFF_VERSION;
  readonly serverName: string;
  readonly serverKind: ServerKind;
  readonly minecraftVersion: PlannerHandoffMinecraftVersion;
  readonly javaRuntime: PlannerHandoffJavaRuntime;
  readonly memoryMiB: number;
  readonly worldName: PlannerHandoffWorldName;
  readonly eulaAcknowledged: boolean;
  readonly onlineMode: boolean;
  readonly port: number;
  readonly rconEnabled: boolean;
  readonly rconPort: number;
}

type UnknownRecord = Record<string, unknown>;

const ROOT_KEYS = ["schema", "version", "plan"] as const;
const PLAN_KEYS = [
  "serverName",
  "serverKind",
  "minecraftVersion",
  "javaRuntime",
  "memoryMiB",
  "worldName",
  "eulaAcknowledged",
  "onlineMode",
  "port",
  "rconEnabled",
  "rconPort"
] as const;
const UNSAFE_OBJECT_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const PLAN_NAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} ,'()_-]{0,79}$/u;

export class PlannerHandoffValidationError extends Error {
  constructor(message = "The selected planner handoff is not a valid v1 non-secret plan.") {
    super(message);
    this.name = "PlannerHandoffValidationError";
  }
}

function failure(message?: string): never {
  throw new PlannerHandoffValidationError(message);
}

function isPlainRecord(value: unknown): value is UnknownRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function requireRecord(value: unknown, label: string): UnknownRecord {
  if (!isPlainRecord(value)) failure(`${label} must be a JSON object.`);
  return value;
}

function assertExactKeys(record: UnknownRecord, expected: readonly string[], label: string): void {
  const keys = Object.keys(record);
  if (keys.length !== expected.length) failure(`${label} must contain the complete v1 field set.`);
  for (const key of keys) {
    if (UNSAFE_OBJECT_KEYS.has(key) || !expected.includes(key)) {
      failure(`${label} contains an unsupported field.`);
    }
  }
  for (const key of expected) {
    if (!Object.prototype.hasOwnProperty.call(record, key)) {
      failure(`${label} is missing a required v1 field.`);
    }
  }
}

function requireBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") failure(`${label} must be a boolean.`);
  return value;
}

function requireInteger(value: unknown, label: string, minimum: number, maximum: number): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < minimum || value > maximum) {
    failure(`${label} is outside the supported range.`);
  }
  return value;
}

function requireEnum<T extends readonly string[]>(value: unknown, values: T, label: string): T[number] {
  if (typeof value !== "string" || !values.includes(value as T[number])) {
    failure(`${label} is not a supported v1 value.`);
  }
  return value as T[number];
}

export function isPlannerHandoffName(value: unknown): value is string {
  return typeof value === "string"
    && value.length > 0
    && value.length <= 80
    && value === value.trim()
    && PLAN_NAME_PATTERN.test(value);
}

function requirePlanName(value: unknown, label: string): string {
  if (!isPlannerHandoffName(value)) {
    failure(`${label} contains an unsupported character, path, URL, address, or command-like value.`);
  }
  return value;
}

function expectedJavaRuntime(version: PlannerHandoffMinecraftVersion): PlannerHandoffJavaRuntime {
  return version === "1.20.4" ? "java-17" : "java-21";
}

/**
 * Parses an already-decoded JSON value. The function intentionally rejects
 * rather than defaulting a malformed import so an unsafe partial plan can
 * never replace a local draft.
 */
export function parsePlannerHandoff(value: unknown): PlannerHandoffV1 {
  const root = requireRecord(value, "Planner handoff");
  assertExactKeys(root, ROOT_KEYS, "Planner handoff");
  if (root.schema !== PLANNER_HANDOFF_SCHEMA || root.version !== PLANNER_HANDOFF_VERSION) {
    failure("The selected planner handoff does not use the supported v1 schema.");
  }

  const plan = requireRecord(root.plan, "Planner handoff plan");
  assertExactKeys(plan, PLAN_KEYS, "Planner handoff plan");
  const minecraftVersion = requireEnum(plan.minecraftVersion, PLANNER_HANDOFF_MINECRAFT_VERSIONS, "Minecraft version");
  const javaRuntime = requireEnum(plan.javaRuntime, PLANNER_HANDOFF_JAVA_RUNTIMES, "Java runtime");
  const rconEnabled = requireBoolean(plan.rconEnabled, "RCON enabled");
  const port = requireInteger(plan.port, "Server port", 1, 65535);
  const rconPort = requireInteger(plan.rconPort, "RCON port", 1, 65535);
  const memoryMiB = requireInteger(plan.memoryMiB, "Memory plan", 1024, 32768);

  if (memoryMiB % 1024 !== 0) {
    failure("Memory plan must use whole GiB increments.");
  }
  if (javaRuntime !== expectedJavaRuntime(minecraftVersion)) {
    failure("The selected Java runtime is not compatible with this Minecraft version preset.");
  }
  if (rconEnabled && port === rconPort) {
    failure("RCON and server ports must differ when RCON planning is enabled.");
  }

  return {
    schema: PLANNER_HANDOFF_SCHEMA,
    version: PLANNER_HANDOFF_VERSION,
    plan: {
      serverName: requirePlanName(plan.serverName, "Server name"),
      serverKind: requireEnum(plan.serverKind, ["paper", "spigot"] as const, "Server kind"),
      minecraftVersion,
      javaRuntime,
      memoryMiB,
      worldName: requireEnum(plan.worldName, PLANNER_HANDOFF_WORLD_NAMES, "World preset"),
      eulaAcknowledged: requireBoolean(plan.eulaAcknowledged, "EULA acknowledgement"),
      onlineMode: requireBoolean(plan.onlineMode, "Online mode"),
      port,
      rconEnabled,
      rconPort
    }
  };
}

function skipWhitespace(source: string, index: number): number {
  let next = index;
  while (next < source.length && /[\u0009\u000a\u000d\u0020]/.test(source[next] ?? "")) next += 1;
  return next;
}

function scanJsonString(source: string, index: number): { readonly value: string; readonly next: number } {
  if (source[index] !== '"') failure();
  const start = index;
  let cursor = index + 1;
  while (cursor < source.length) {
    const character = source[cursor];
    if (character === "\\") {
      cursor += 2;
      continue;
    }
    if (character === '"') {
      try {
        return { value: JSON.parse(source.slice(start, cursor + 1)) as string, next: cursor + 1 };
      } catch {
        failure();
      }
    }
    if (character !== undefined && character.charCodeAt(0) < 0x20) failure();
    cursor += 1;
  }
  return failure();
}

/**
 * JSON.parse deliberately accepts duplicate object members by keeping the
 * last one. A handoff must not be ambiguous, so scan its small bounded source
 * once before parsing and reject duplicate members at every object depth.
 */
function assertNoDuplicateJsonKeys(source: string): void {
  const scanValue = (initialIndex: number, depth: number): number => {
    if (depth > PLANNER_HANDOFF_MAX_JSON_DEPTH) failure("Planner handoff JSON is nested too deeply.");
    let index = skipWhitespace(source, initialIndex);
    const token = source[index];
    if (token === "{") {
      index = skipWhitespace(source, index + 1);
      const seen = new Set<string>();
      if (source[index] === "}") return index + 1;
      while (true) {
        const key = scanJsonString(source, index);
        if (seen.has(key.value) || UNSAFE_OBJECT_KEYS.has(key.value)) failure();
        seen.add(key.value);
        index = skipWhitespace(source, key.next);
        if (source[index] !== ":") failure();
        index = scanValue(index + 1, depth + 1);
        index = skipWhitespace(source, index);
        if (source[index] === "}") return index + 1;
        if (source[index] !== ",") failure();
        index = skipWhitespace(source, index + 1);
      }
    }
    if (token === "[") {
      index = skipWhitespace(source, index + 1);
      if (source[index] === "]") return index + 1;
      while (true) {
        index = scanValue(index, depth + 1);
        index = skipWhitespace(source, index);
        if (source[index] === "]") return index + 1;
        if (source[index] !== ",") failure();
        index = skipWhitespace(source, index + 1);
      }
    }
    if (token === '"') return scanJsonString(source, index).next;

    const primitiveStart = index;
    while (index < source.length && !/[\u0009\u000a\u000d\u0020,}\]]/.test(source[index] ?? "")) index += 1;
    if (primitiveStart === index) failure();
    try {
      JSON.parse(source.slice(primitiveStart, index));
    } catch {
      failure();
    }
    return index;
  };

  const end = skipWhitespace(source, scanValue(0, 1));
  if (end !== source.length) failure();
}

export function parsePlannerHandoffJson(source: unknown): PlannerHandoffV1 {
  if (typeof source !== "string") failure("Planner handoff JSON must be text.");
  const byteLength = new TextEncoder().encode(source).byteLength;
  if (byteLength === 0 || byteLength > PLANNER_HANDOFF_MAX_BYTES) {
    failure("Planner handoff JSON is empty or exceeds the supported size.");
  }
  assertNoDuplicateJsonKeys(source);
  try {
    return parsePlannerHandoff(JSON.parse(source) as unknown);
  } catch (error) {
    if (error instanceof PlannerHandoffValidationError) throw error;
    failure("Planner handoff JSON could not be parsed.");
  }
}

export function createPlannerHandoff(plan: PlannerHandoffPlanV1): PlannerHandoffV1 {
  return parsePlannerHandoff({
    schema: PLANNER_HANDOFF_SCHEMA,
    version: PLANNER_HANDOFF_VERSION,
    plan
  });
}

export function previewPlannerHandoff(value: PlannerHandoffV1): PlannerHandoffPreview {
  const handoff = parsePlannerHandoff(value);
  return { schema: handoff.schema, version: handoff.version, ...handoff.plan };
}

/**
 * Overlay only handoff-owned non-secret fields. Existing local-only draft
 * values such as paths, executable locations, and a world seed remain local.
 */
export function applyPlannerHandoffToDraft(value: PlannerHandoffV1, current: ServerDraft = DEFAULT_SERVER_DRAFT): ServerDraft {
  const handoff = parsePlannerHandoff(value);
  const plan = handoff.plan;
  return normalizeServerDraft({
    ...current,
    serverName: plan.serverName,
    serverKind: plan.serverKind,
    minecraftVersion: plan.minecraftVersion,
    javaRuntime: plan.javaRuntime as JavaRuntime,
    memoryInitialMiB: plan.memoryMiB,
    memoryMaximumMiB: plan.memoryMiB,
    eulaAcknowledged: plan.eulaAcknowledged,
    onlineMode: plan.onlineMode,
    port: plan.port,
    worldName: plan.worldName,
    rconEnabled: plan.rconEnabled,
    rconPort: plan.rconPort
  });
}
