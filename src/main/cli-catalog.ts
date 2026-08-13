import { existsSync } from "node:fs";
import { join } from "node:path";
import type {
  CliCatalogCategory,
  CliCatalogEntry,
  CliCatalogProjection
} from "../shared/desktop-api";

type UnknownRecord = Record<string, unknown>;

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

export function loadCliCatalog(): CliCatalogProjection {
  const catalogPath = join(__dirname, "..", "shared", "paper-spigot-cli-catalog.cjs");
  if (!existsSync(catalogPath)) return FALLBACK_CATALOG;
  try {
    const candidate = require("../shared/paper-spigot-cli-catalog.cjs") as unknown;
    return normaliseCatalog(candidate) ?? FALLBACK_CATALOG;
  } catch {
    return FALLBACK_CATALOG;
  }
}

