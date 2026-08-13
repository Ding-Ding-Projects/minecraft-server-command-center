import type { ServerDraft } from "./server-draft";
import type { PlannerHandoffPreview } from "./planner-handoff";

export type PickerKind = "folder" | "jar" | "config";

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

export interface JavaRuntimeCandidateSummary {
  readonly id: string;
  readonly label: string;
  readonly sourceLabel: string;
  readonly selectedByUser: boolean;
}

export interface JavaRuntimeDiscovery {
  readonly candidates: readonly JavaRuntimeCandidateSummary[];
  readonly diagnostics: readonly {
    readonly code: string;
    readonly message: string;
  }[];
  readonly selectedCandidateId: string | null;
  readonly searchedLocations: {
    readonly javaHome: boolean;
    readonly jdkHome: boolean;
    readonly knownRootCount: number;
    readonly pathSearchUsed: false;
    readonly recursiveSearchUsed: false;
  };
}

export interface JavaRuntimeAssessmentRequest {
  readonly candidateId: string | null;
  readonly serverKind: "paper" | "spigot";
  readonly targetVersion: string;
}

export interface JavaRuntimeAssessment {
  readonly selectedCandidate: JavaRuntimeCandidateSummary | null;
  readonly officialTargetCatalog: {
    readonly status: "available" | "invalid";
    readonly message: string;
    readonly versionCount: number;
    readonly sourceTitle: string | null;
    readonly sourceUrl: string | null;
    readonly snapshotDate: string | null;
    readonly diagnosticCode: string | null;
  };
  readonly probe: {
    readonly status: string;
    readonly diagnosticCode: string | null;
    readonly javaMajor: number | null;
    readonly normalizedVersion: string | null;
  };
  readonly requirement: {
    readonly status: string;
    readonly reason: string | null;
    readonly targetVersion: string | null;
    readonly requiredJavaMajor: number | null;
    readonly recommendationKind: string | null;
    readonly sourceTitle: string | null;
  };
  readonly compatibility: {
    readonly status: string;
    readonly reason: string | null;
    readonly requiredJavaMajor: number | null;
    readonly selectedJavaMajor: number | null;
  };
  readonly setupPlan: {
    readonly status: string;
    readonly reason: string | null;
    readonly executionState: "not-executed";
    readonly mutationState: "no-system-state-changed";
    readonly routes: readonly {
      readonly label: string;
      readonly availability: string;
    }[];
  };
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
  readonly runtime: {
    discover(): Promise<JavaRuntimeDiscovery>;
    choose(): Promise<JavaRuntimeDiscovery | null>;
    select(candidateId: string): Promise<JavaRuntimeCandidateSummary | null>;
    assess(value: JavaRuntimeAssessmentRequest): Promise<JavaRuntimeAssessment>;
    clear(): Promise<void>;
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

