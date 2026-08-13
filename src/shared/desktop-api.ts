import type { ServerDraft } from "./server-draft";
import type { PlannerHandoffPreview } from "./planner-handoff";

export type PickerKind = "folder" | "jar" | "java" | "config";

export interface CliCatalogEntry {
  readonly id: string;
  readonly label: string;
  readonly status: "mapped" | "unavailable";
  readonly summary: string;
}

export interface CliCatalogCategory {
  readonly id: string;
  readonly label: string;
  readonly product: "Paper" | "Spigot" | "Shared";
  readonly entries: readonly CliCatalogEntry[];
}

export interface CliCatalogProjection {
  readonly source: string;
  readonly categories: readonly CliCatalogCategory[];
}

export interface ArgvPreview {
  readonly tokens: readonly string[];
  readonly source: string;
  readonly unsupported: readonly string[];
}

export interface UpdateBoundary {
  readonly state: "unavailable";
  readonly message: string;
  readonly reason: string;
}

export interface DesktopApi {
  readonly draft: {
    load(): Promise<ServerDraft>;
    save(value: unknown): Promise<ServerDraft>;
  };
  readonly handoff: {
    choose(): Promise<PlannerHandoffPreview | null>;
    apply(currentDraft: unknown): Promise<ServerDraft>;
    clear(): Promise<void>;
  };
  readonly picker: {
    select(kind: PickerKind): Promise<string | null>;
  };
  readonly catalog: {
    get(): Promise<CliCatalogProjection>;
  };
  readonly preview: {
    get(value: unknown): Promise<ArgvPreview>;
  };
  readonly updater: {
    get(): Promise<UpdateBoundary>;
  };
  readonly window: {
    minimize(): Promise<void>;
    toggleMaximize(): Promise<boolean>;
    close(): Promise<void>;
    isMaximized(): Promise<boolean>;
  };
}

