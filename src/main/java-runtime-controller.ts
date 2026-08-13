import type {
  JavaRuntimeAssessment,
  JavaRuntimeAssessmentRequest,
  JavaRuntimeCandidateSummary,
  JavaRuntimeDiscovery
} from "../shared/desktop-api";

type UnknownRecord = Record<string, unknown>;

interface InternalCandidate {
  readonly id: string;
  readonly executablePath: string;
  readonly source: string;
  readonly selectedByUser: boolean;
}

interface InternalDiscovery {
  readonly candidates: readonly InternalCandidate[];
  readonly diagnostics: readonly {
    readonly code?: unknown;
  }[];
  readonly searchedLocations: {
    readonly javaHome: boolean;
    readonly jdkHome: boolean;
    readonly knownRootCount: number;
    readonly pathSearchUsed: false;
    readonly recursiveSearchUsed: false;
  };
}

interface InternalProbe {
  readonly status?: unknown;
  readonly diagnosticCode?: unknown;
  readonly version?: {
    readonly major?: unknown;
    readonly normalized?: unknown;
  };
}

interface InternalRequirement {
  readonly status?: unknown;
  readonly reason?: unknown;
  readonly targetVersion?: unknown;
  readonly requiredJavaMajor?: unknown;
  readonly recommendationKind?: unknown;
  readonly source?: {
    readonly title?: unknown;
  };
}

interface InternalCompatibility {
  readonly status?: unknown;
  readonly reason?: unknown;
  readonly requiredJavaMajor?: unknown;
  readonly selectedJavaMajor?: unknown;
}

interface InternalSetupPlan {
  readonly status?: unknown;
  readonly reason?: unknown;
  readonly executionState?: unknown;
  readonly mutationState?: unknown;
  readonly routes?: readonly {
    readonly label?: unknown;
    readonly availability?: unknown;
  }[];
}

interface InternalAssessment {
  readonly requirement?: InternalRequirement;
  readonly probe?: InternalProbe | null;
  readonly compatibility?: InternalCompatibility;
  readonly setupPlan?: InternalSetupPlan;
}

interface JavaRuntimeManager {
  discoverJavaCandidates(options?: { readonly selectedPath?: string }): Promise<InternalDiscovery>;
  selectDiscoveredJavaCandidate(discovery: InternalDiscovery, candidateId: string): InternalCandidate | null;
  assessSelectedJavaRuntime(options: {
    readonly serverKind: "paper" | "spigot";
    readonly targetVersion: string;
    readonly officialCatalogVersions: readonly string[];
    readonly selectedCandidate?: InternalCandidate;
  }): Promise<InternalAssessment>;
}

const javaRuntimeManager = require("./java-runtime-manager.cjs") as JavaRuntimeManager;

const EMPTY_OFFICIAL_PAPER_TARGET_CATALOG: readonly string[] = Object.freeze([]);

const NO_PAPER_TARGET_CATALOG_MESSAGE =
  "No verified official Paper target catalog is configured in this desktop foundation. Paper compatibility remains unverified until a bounded catalog adapter is supplied.";

const SOURCE_LABELS: Readonly<Record<string, string>> = Object.freeze({
  "user-selected": "Chosen with the native Java picker",
  JAVA_HOME: "JAVA_HOME",
  JDK_HOME: "JDK_HOME",
  "current-user-known-location": "Known current-user Java location",
  "system-known-location": "Known system Java location"
});

const DIAGNOSTIC_MESSAGES: Readonly<Record<string, string>> = Object.freeze({
  "selected-path-must-be-absolute": "The selected Java item was not an absolute local path and was ignored.",
  "selected-java-not-found-or-not-executable": "The selected Java item was not a usable Java executable. Choose a Java executable through the native picker."
});

function stringValue(value: unknown, fallback: string | null = null): string | null {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 240) : fallback;
}

function integerValue(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) ? value : null;
}

function candidateSummary(candidate: InternalCandidate): JavaRuntimeCandidateSummary {
  const sourceLabel = SOURCE_LABELS[candidate.source] ?? "Bounded conventional Java location";
  return {
    id: candidate.id,
    label: candidate.selectedByUser ? "Java runtime chosen with the native picker" : "Discovered Java runtime",
    sourceLabel,
    selectedByUser: candidate.selectedByUser
  };
}

function discoveryDiagnostic(entry: { readonly code?: unknown }): { readonly code: string; readonly message: string } {
  const code = stringValue(entry.code, "java-discovery-diagnostic") ?? "java-discovery-diagnostic";
  return {
    code,
    message: DIAGNOSTIC_MESSAGES[code] ?? "A bounded Java discovery check could not use one candidate. No broader filesystem or PATH scan was performed."
  };
}

function projectProbe(probe: InternalProbe | null | undefined): JavaRuntimeAssessment["probe"] {
  if (!probe) {
    return {
      status: "not-run",
      diagnosticCode: null,
      javaMajor: null,
      normalizedVersion: null
    };
  }

  return {
    status: stringValue(probe.status, "unverified") ?? "unverified",
    diagnosticCode: stringValue(probe.diagnosticCode),
    javaMajor: integerValue(probe.version?.major),
    normalizedVersion: stringValue(probe.version?.normalized)
  };
}

function projectRequirement(requirement: InternalRequirement | undefined): JavaRuntimeAssessment["requirement"] {
  return {
    status: stringValue(requirement?.status, "unverified") ?? "unverified",
    reason: stringValue(requirement?.reason),
    targetVersion: stringValue(requirement?.targetVersion),
    requiredJavaMajor: integerValue(requirement?.requiredJavaMajor),
    recommendationKind: stringValue(requirement?.recommendationKind),
    sourceTitle: stringValue(requirement?.source?.title)
  };
}

function projectCompatibility(compatibility: InternalCompatibility | undefined): JavaRuntimeAssessment["compatibility"] {
  return {
    status: stringValue(compatibility?.status, "unverified") ?? "unverified",
    reason: stringValue(compatibility?.reason),
    requiredJavaMajor: integerValue(compatibility?.requiredJavaMajor),
    selectedJavaMajor: integerValue(compatibility?.selectedJavaMajor)
  };
}

function projectSetupPlan(plan: InternalSetupPlan | undefined): JavaRuntimeAssessment["setupPlan"] {
  const routes = Array.isArray(plan?.routes)
    ? plan.routes.slice(0, 8).map((route) => ({
        label: stringValue(route.label, "Review-only setup route") ?? "Review-only setup route",
        availability: stringValue(route.availability, "not-executed") ?? "not-executed"
      }))
    : [];

  return {
    status: stringValue(plan?.status, "blocked") ?? "blocked",
    reason: stringValue(plan?.reason),
    executionState: plan?.executionState === "not-executed" ? "not-executed" : "not-executed",
    mutationState: plan?.mutationState === "no-system-state-changed" ? "no-system-state-changed" : "no-system-state-changed",
    routes
  };
}

function normalizedAssessmentRequest(value: unknown): JavaRuntimeAssessmentRequest {
  const input = value && typeof value === "object" && !Array.isArray(value)
    ? value as UnknownRecord
    : {};
  const candidateId = typeof input.candidateId === "string" && /^java-candidate-\d{1,3}$/.test(input.candidateId)
    ? input.candidateId
    : null;
  return {
    candidateId,
    serverKind: input.serverKind === "spigot" ? "spigot" : "paper",
    targetVersion: typeof input.targetVersion === "string"
      ? input.targetVersion.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 32)
      : ""
  };
}

/**
 * Keeps Java executable paths and probe results in the privileged process.
 * The renderer receives only opaque candidate IDs and bounded non-path
 * summaries, so this controller cannot become a generic filesystem or command
 * bridge.
 */
export class JavaRuntimeController {
  private discovery: InternalDiscovery | undefined;
  private selectedCandidateId: string | null = null;

  async discover(): Promise<JavaRuntimeDiscovery> {
    const discovery = await javaRuntimeManager.discoverJavaCandidates();
    this.discovery = discovery;
    this.selectedCandidateId = null;
    return this.projectDiscovery(discovery);
  }

  async discoverFromNativeSelection(selectedPath: string): Promise<JavaRuntimeDiscovery> {
    const discovery = await javaRuntimeManager.discoverJavaCandidates({ selectedPath });
    this.discovery = discovery;
    const selected = discovery.candidates.find((candidate) => candidate.selectedByUser) ?? null;
    this.selectedCandidateId = selected?.id ?? null;
    return this.projectDiscovery(discovery);
  }

  select(candidateId: unknown): JavaRuntimeCandidateSummary | null {
    if (!this.discovery || typeof candidateId !== "string" || !/^java-candidate-\d{1,3}$/.test(candidateId)) {
      return null;
    }
    const candidate = javaRuntimeManager.selectDiscoveredJavaCandidate(this.discovery, candidateId);
    if (!candidate) return null;
    this.selectedCandidateId = candidate.id;
    return candidateSummary(candidate);
  }

  async assess(value: unknown): Promise<JavaRuntimeAssessment> {
    const request = normalizedAssessmentRequest(value);
    const candidate = this.discovery && request.candidateId
      ? javaRuntimeManager.selectDiscoveredJavaCandidate(this.discovery, request.candidateId)
      : null;
    if (candidate) this.selectedCandidateId = candidate.id;

    const assessment = await javaRuntimeManager.assessSelectedJavaRuntime({
      serverKind: request.serverKind,
      targetVersion: request.targetVersion,
      officialCatalogVersions: EMPTY_OFFICIAL_PAPER_TARGET_CATALOG,
      ...(candidate ? { selectedCandidate: candidate } : {})
    });

    return {
      selectedCandidate: candidate ? candidateSummary(candidate) : null,
      officialTargetCatalog: {
        status: "unavailable",
        message: request.serverKind === "spigot"
          ? "Spigot Java compatibility is unverified because this desktop foundation has no separately sourced Spigot resolver."
          : NO_PAPER_TARGET_CATALOG_MESSAGE
      },
      probe: projectProbe(assessment.probe),
      requirement: projectRequirement(assessment.requirement),
      compatibility: projectCompatibility(assessment.compatibility),
      setupPlan: projectSetupPlan(assessment.setupPlan)
    };
  }

  clear(): void {
    this.discovery = undefined;
    this.selectedCandidateId = null;
  }

  private projectDiscovery(discovery: InternalDiscovery): JavaRuntimeDiscovery {
    return {
      candidates: discovery.candidates.slice(0, 96).map(candidateSummary),
      diagnostics: discovery.diagnostics.slice(0, 24).map(discoveryDiagnostic),
      selectedCandidateId: this.selectedCandidateId,
      searchedLocations: {
        javaHome: discovery.searchedLocations.javaHome,
        jdkHome: discovery.searchedLocations.jdkHome,
        knownRootCount: Math.min(24, Math.max(0, discovery.searchedLocations.knownRootCount)),
        pathSearchUsed: false,
        recursiveSearchUsed: false
      }
    };
  }
}
