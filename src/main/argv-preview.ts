import type { ArgvPreview } from "../shared/desktop-api";
import { normalizeServerDraft, type ServerDraft } from "../shared/server-draft";

type UnknownRecord = Record<string, unknown>;

interface CatalogOption {
  readonly id: string;
  readonly support?: {
    readonly paper?: string;
    readonly spigot?: string;
  };
}

interface CatalogModule {
  readonly CATALOG_CONTRACT?: {
    readonly transport?: {
      readonly kind?: string;
      readonly shell?: boolean;
      readonly launchesServer?: boolean;
    };
  };
  readonly PAPER_CLI_OPTIONS: readonly CatalogOption[];
  readonly emitPaperCliArgv(selection: UnknownRecord): readonly string[];
  readonly emitSpigotCompatibleArgv(selection: UnknownRecord): readonly string[];
  readonly emitManagedJvmArgv(selection: UnknownRecord): readonly string[];
}

function readCatalog(): CatalogModule {
  return require("../shared/paper-spigot-cli-catalog.cjs") as CatalogModule;
}

function present(value: string): boolean {
  return value.trim().length > 0;
}

function requestedPaperSelections(draft: ServerDraft): UnknownRecord {
  const selection: UnknownRecord = {
    commandsSettings: draft.commandsSettingsPath,
    pluginsDirectory: draft.pluginsDirectory,
    spigotSettings: draft.spigotSettingsPath,
    bukkitSettings: draft.bukkitSettingsPath,
    serverProperties: draft.serverPropertiesPath,
    paperSettingsDirectory: draft.paperConfigDirectory,
    port: draft.port,
    onlineMode: draft.onlineMode,
    levelName: draft.worldName,
    serverName: draft.serverName,
    noGui: draft.uiMode === "headless",
    noConsole: draft.consoleMode === "no-console",
    noJline: draft.consoleMode === "vanilla-console",
    safeMode: draft.safeMode,
    initSettings: draft.initSettings,
    demo: draft.demoMode,
    bonusChest: draft.bonusChest
  };
  if (present(draft.host)) selection.host = draft.host;
  return selection;
}

function supportedSpigotSelections(catalog: CatalogModule, requested: UnknownRecord): UnknownRecord {
  const compatible = new Set(
    catalog.PAPER_CLI_OPTIONS
      .filter((option) => option.support?.spigot === "documented")
      .map((option) => option.id)
  );
  return Object.fromEntries(Object.entries(requested).filter(([id]) => compatible.has(id)));
}

function unsupportedSpigotSelections(catalog: CatalogModule, requested: UnknownRecord): readonly string[] {
  const compatible = new Set(
    catalog.PAPER_CLI_OPTIONS
      .filter((option) => option.support?.spigot === "documented")
      .map((option) => option.id)
  );
  return Object.entries(requested)
    .filter(([id, value]) => value !== false && value !== "" && !compatible.has(id))
    .map(([id]) => id);
}

function managedJvmSelection(draft: ServerDraft): UnknownRecord {
  const selection: UnknownRecord = {
    initialHeap: { amount: draft.memoryInitialMiB, unit: "M" },
    maximumHeap: { amount: draft.memoryMaximumMiB, unit: "M" }
  };
  if (draft.eulaAcknowledged) selection.eulaAgreement = true;
  return selection;
}

export function buildArgvPreview(value: unknown): ArgvPreview {
  const draft = normalizeServerDraft(value);
  const catalog = readCatalog();
  const transport = catalog.CATALOG_CONTRACT?.transport;
  if (transport?.kind !== "argument-arrays-only" || transport.shell !== false || transport.launchesServer !== false) {
    throw new Error("The CLI catalog does not provide the required no-shell, non-launching argument-array contract.");
  }

  const javaExecutable = draft.javaRuntime === "custom" && present(draft.javaExecutable)
    ? draft.javaExecutable
    : "java";
  const requested = requestedPaperSelections(draft);
  const cliTokens = draft.serverKind === "paper"
    ? catalog.emitPaperCliArgv(requested)
    : catalog.emitSpigotCompatibleArgv(supportedSpigotSelections(catalog, requested));
  const unsupported = draft.serverKind === "spigot"
    ? unsupportedSpigotSelections(catalog, requested)
    : [];

  return {
    tokens: [
      javaExecutable,
      ...catalog.emitManagedJvmArgv(managedJvmSelection(draft)),
      "-jar",
      draft.serverJar || "server.jar",
      ...cliTokens
    ],
    source: "Typed Paper/Spigot registry: direct argument arrays only; shell execution and server launch remain unavailable.",
    unsupported
  };
}

