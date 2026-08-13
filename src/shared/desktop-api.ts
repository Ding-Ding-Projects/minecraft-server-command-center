import type { ServerDraft } from "./server-draft";

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

export interface DesktopApi {
  readonly draft: {
    load(): Promise<ServerDraft>;
    save(value: unknown): Promise<ServerDraft>;
  };
  readonly picker: {
    select(kind: PickerKind): Promise<string | null>;
  };
  readonly catalog: {
    get(): Promise<CliCatalogProjection>;
  };
  readonly window: {
    minimize(): Promise<void>;
    toggleMaximize(): Promise<boolean>;
    close(): Promise<void>;
    isMaximized(): Promise<boolean>;
  };
}

