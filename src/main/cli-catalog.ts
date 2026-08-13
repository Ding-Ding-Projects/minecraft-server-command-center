import { existsSync } from "node:fs";
import { join } from "node:path";
import type {
  CliCatalogCategory,
  CliCatalogEntry,
  CliCatalogProjection
} from "../shared/desktop-api";

type UnknownRecord = Record<string, unknown>;

interface CatalogOption {
  readonly id: string;
  readonly category?: string;
  readonly flags?: { readonly canonical?: string };
  readonly ui?: { readonly label?: string; readonly richHelp?: string };
  readonly support?: { readonly paper?: string; readonly spigot?: string };
  readonly safety?: { readonly consequence?: string };
}

interface CatalogCategory {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
}

interface SpigotUnavailableOption {
  readonly id: string;
  readonly flags?: readonly string[];
  readonly reason?: string;
}

interface CatalogModule {
  readonly CATALOG_CONTRACT?: {
    readonly sourceUrls?: { readonly paperCli?: string; readonly spigotStartupParameters?: string };
  };
  readonly PAPER_CLI_CATEGORIES?: readonly CatalogCategory[];
  readonly PAPER_CLI_OPTIONS?: readonly CatalogOption[];
  readonly SPIGOT_UNAVAILABLE_OPTIONS?: readonly SpigotUnavailableOption[];
}

const FALLBACK_CATALOG: CliCatalogProjection = {
  source: "Bounded desktop fallback; the versioned Paper/Spigot catalog module is not yet present.",
  categories: [
    {
      id: "shared-startup",
      label: "Shared startup preview",
      product: "Shared",
      entries: [
        {
          id: "java-memory",
          label: "Java heap limits",
          status: "mapped",
          summary: "The preview emits direct -Xms and -Xmx argument tokens from bounded MiB controls."
        },
        {
          id: "server-jar",
          label: "Server JAR",
          status: "mapped",
          summary: "The selected path is displayed as the direct value after -jar; it is never sent to a shell."
        }
      ]
    },
    {
      id: "paper",
      label: "Paper arguments",
      product: "Paper",
      entries: [
        {
          id: "paper-config",
          label: "Configuration and plugin paths",
          status: "mapped",
          summary: "The focused form maps supported Paper path arguments into the direct preview."
        },
        {
          id: "paper-advanced",
          label: "Advanced Paper arguments",
          status: "unavailable",
          summary: "The detailed catalog has not yet been loaded; unsupported values cannot be passed through."
        }
      ]
    },
    {
      id: "spigot",
      label: "Spigot arguments",
      product: "Spigot",
      entries: [
        {
          id: "spigot-direct",
          label: "Spigot-specific pass-through",
          status: "unavailable",
          summary: "This foundation intentionally does not expose arbitrary Spigot arguments or raw command entry."
        }
      ]
    }
  ]
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normaliseEntry(value: unknown, index: number): CliCatalogEntry | null {
  if (!isRecord(value) || typeof value.label !== "string") return null;
  const status = value.status === "mapped" || value.status === "unavailable"
    ? value.status
    : "unavailable";
  return {
    id: typeof value.id === "string" ? value.id.slice(0, 120) : "entry-" + index,
    label: value.label.slice(0, 160),
    status,
    summary: typeof value.summary === "string"
      ? value.summary.slice(0, 600)
      : "No bounded summary was supplied by the catalog."
  };
}

function normaliseCategory(value: unknown, index: number): CliCatalogCategory | null {
  if (!isRecord(value) || typeof value.label !== "string" || !Array.isArray(value.entries)) return null;
  const entries = value.entries
    .map((entry, entryIndex) => normaliseEntry(entry, entryIndex))
    .filter((entry): entry is CliCatalogEntry => entry !== null)
    .slice(0, 100);
  const product = value.product === "Paper" || value.product === "Spigot" || value.product === "Shared"
    ? value.product
    : "Shared";
  return {
    id: typeof value.id === "string" ? value.id.slice(0, 120) : "category-" + index,
    label: value.label.slice(0, 160),
    product,
    entries
  };
}

function normaliseCatalog(value: unknown): CliCatalogProjection | null {
  if (!isRecord(value) || !Array.isArray(value.categories)) return null;
  const categories = value.categories
    .map((category, index) => normaliseCategory(category, index))
    .filter((category): category is CliCatalogCategory => category !== null)
    .slice(0, 30);
  if (categories.length === 0) return null;
  return {
    source: typeof value.source === "string"
      ? value.source.slice(0, 600)
      : "Versioned Paper/Spigot catalog module",
    categories
  };
}

function catalogEntry(option: CatalogOption): CliCatalogEntry {
  const supported = option.support?.paper === "documented";
  const label = option.ui?.label ?? option.flags?.canonical ?? option.id;
  const summary = option.ui?.richHelp ?? option.safety?.consequence ?? "The typed registry does not provide a human-readable description.";
  return {
    id: option.id,
    label,
    status: supported ? "mapped" : "unavailable",
    summary
  };
}

function projectTypedCatalog(catalog: CatalogModule): CliCatalogProjection | null {
  const catalogCategories = catalog.PAPER_CLI_CATEGORIES;
  const catalogOptions = catalog.PAPER_CLI_OPTIONS;
  if (!Array.isArray(catalogCategories) || !Array.isArray(catalogOptions)) return null;
  const categories: CliCatalogCategory[] = catalogCategories.map((category) => {
    const entries = catalogOptions
      .filter((option) => option.category === category.id)
      .map(catalogEntry);
    return {
      id: category.id,
      label: category.label,
      product: "Paper" as const,
      entries
    };
  }).filter((category) => category.entries.length > 0);

  const spigotEntries = (catalog.SPIGOT_UNAVAILABLE_OPTIONS ?? []).map((option) => ({
    id: option.id,
    label: option.flags?.join(", ") || option.id,
    status: "unavailable" as const,
    summary: option.reason ?? "This Spigot item has no safely wired typed support."
  }));
  if (spigotEntries.length > 0) {
    categories.push({
      id: "spigot-unavailable",
      label: "Spigot visible compatibility boundaries",
      product: "Spigot",
      entries: spigotEntries
    });
  }
  if (categories.length === 0) return null;
  const sources = catalog.CATALOG_CONTRACT?.sourceUrls;
  return {
    source: "Typed registry loaded from official Paper and Spigot references" +
      (sources?.paperCli ? ": " + sources.paperCli : "."),
    categories
  };
}

export function loadCliCatalog(): CliCatalogProjection {
  const catalogPath = join(__dirname, "..", "shared", "paper-spigot-cli-catalog.cjs");
  if (!existsSync(catalogPath)) return FALLBACK_CATALOG;
  try {
    const candidate = require("../shared/paper-spigot-cli-catalog.cjs") as CatalogModule;
    return projectTypedCatalog(candidate) ?? normaliseCatalog(candidate) ?? FALLBACK_CATALOG;
  } catch {
    return FALLBACK_CATALOG;
  }
}

