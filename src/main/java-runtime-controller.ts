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
  readonly metadata?: {
    readonly executableName?: unknown;
    readonly runtimeHomeName?: unknown;
    readonly fileSizeBytes?: unknown;
    readonly modifiedAt?: unknown;
  };
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
    readonly url?: unknown;
  };
  readonly ruleId?: unknown;
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
  readonly requiredJavaMajor?: unknown;
  readonly targetVersion?: unknown;
  readonly compatibilityStatus?: unknown;
  readonly requiresExplicitUserIntent?: unknown;
  readonly installationMayRunAutomatically?: unknown;
  readonly source?: {
    readonly title?: unknown;
    readonly url?: unknown;
  };
  readonly nextUserFacingAction?: unknown;
  readonly executionState?: unknown;
  readonly mutationState?: unknown;
  readonly routes?: readonly {
    readonly id?: unknown;
    readonly label?: unknown;
    readonly availability?: unknown;
    readonly distribution?: unknown;
    readonly fullRuntimePreferred?: unknown;
    readonly headlessVariantRecommended?: unknown;
    readonly guideUrl?: unknown;
    readonly packageSearch?: unknown;
    readonly executionState?: unknown;
    readonly requiresExplicitUserIntent?: unknown;
  }[];
}

interface InternalPaperTargetCatalog {
  readonly status?: unknown;
  readonly versions?: readonly unknown[];
  readonly versionCount?: unknown;
  readonly diagnosticCode?: unknown;
  readonly diagnosticMessage?: unknown;
  readonly source?: {
    readonly title?: unknown;
    readonly url?: unknown;
    readonly snapshotDate?: unknown;
  } | null;
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
  getPaperRuntimeTargetCatalog(): InternalPaperTargetCatalog;
  assessSelectedJavaRuntime(options: {
    readonly serverKind: "paper" | "spigot";
    readonly targetVersion: string;
    readonly officialCatalogVersions: readonly string[];
    readonly selectedCandidate?: InternalCandidate;
  }): Promise<InternalAssessment>;
}

const javaRuntimeManager = require("./java-runtime-manager.cjs") as JavaRuntimeManager;

const EMPTY_OFFICIAL_PAPER_TARGET_CATALOG: readonly string[] = Object.freeze([]);

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

function booleanValue(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function metadataName(value: unknown): string | null {
  if (typeof value !== "string" || !value || value.length > 96 || /[/\\\u0000-\u001f\u007f]/.test(value)) {
    return null;
  }
  return value;
}

function metadataTimestamp(value: unknown): string | null {
  const timestamp = stringValue(value, null);
  return timestamp && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(timestamp)
    ? timestamp
    : null;
}

function candidateSummary(candidate: InternalCandidate): JavaRuntimeCandidateSummary {
  const sourceLabel = SOURCE_LABELS[candidate.source] ?? "Bounded conventional Java location";
  return {
    id: candidate.id,
    label: candidate.selectedByUser ? "Java runtime chosen with the native picker" : "Discovered Java runtime",
    sourceLabel,
    selectedByUser: candidate.selectedByUser,
    metadata: {
      executableName: metadataName(candidate.metadata?.executableName),
      runtimeHomeName: metadataName(candidate.metadata?.runtimeHomeName),
      fileSizeBytes: (() => {
        const value = integerValue(candidate.metadata?.fileSizeBytes);
        return value !== null && value >= 0 && value <= 4 * 1024 * 1024 * 1024 ? value : null;
      })(),
      modifiedAt: metadataTimestamp(candidate.metadata?.modifiedAt)
    }
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
    sourceTitle: stringValue(requirement?.source?.title),
    sourceUrl: stringValue(requirement?.source?.url)
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
        id: stringValue(route.id, "review-only-route") ?? "review-only-route",
        label: stringValue(route.label, "Review-only setup route") ?? "Review-only setup route",
        availability: stringValue(route.availability, "not-executed") ?? "not-executed",
        distribution: stringValue(route.distribution),
        fullRuntimePreferred: booleanValue(route.fullRuntimePreferred, true),
        headlessVariantRecommended: booleanValue(route.headlessVariantRecommended, false),
        guideUrl: stringValue(route.guideUrl),
        packageSearch: stringValue(route.packageSearch),
        executionState: "not-executed" as const,
        requiresExplicitUserIntent: booleanValue(route.requiresExplicitUserIntent, true)
      }))
    : [];

  return {
    status: stringValue(plan?.status, "blocked") ?? "blocked",
    reason: stringValue(plan?.reason),
    requiredJavaMajor: integerValue(plan?.requiredJavaMajor),
    targetVersion: stringValue(plan?.targetVersion),
    compatibilityStatus: stringValue(plan?.compatibilityStatus),
    requiresExplicitUserIntent: booleanValue(plan?.requiresExplicitUserIntent, true),
    installationMayRunAutomatically: booleanValue(plan?.installationMayRunAutomatically, false),
    sourceTitle: stringValue(plan?.source?.title),
    sourceUrl: stringValue(plan?.source?.url),
    nextUserFacingAction: stringValue(plan?.nextUserFacingAction),
    executionState: plan?.executionState === "not-executed" ? "not-executed" : "not-executed",
    mutationState: plan?.mutationState === "no-system-state-changed" ? "no-system-state-changed" : "no-system-state-changed",
    routes
  };
}

function projectOfficialTargetCatalog(
  catalog: InternalPaperTargetCatalog,
  serverKind: "paper" | "spigot"
): JavaRuntimeAssessment["officialTargetCatalog"] {
  const available = catalog.status === "available";
  const status: JavaRuntimeAssessment["officialTargetCatalog"]["status"] = available ? "available" : "invalid";
  const declaredVersionCount = integerValue(catalog.versionCount);
  const versionCount = available && Array.isArray(catalog.versions)
    ? Math.min(96, catalog.versions.length, Math.max(0, declaredVersionCount ?? catalog.versions.length))
    : 0;
  const sourceTitle = stringValue(catalog.source?.title);
  const sourceUrl = stringValue(catalog.source?.url);
  const snapshotDate = stringValue(catalog.source?.snapshotDate);
  const diagnosticCode = stringValue(catalog.diagnosticCode);

  if (!available) {
    return {
      status,
      message: serverKind === "spigot"
        ? "The bundled official Paper target catalog was rejected as malformed or unknown. Spigot Java compatibility remains unverified because it requires a separate resolver."
        : "The bundled official Paper target catalog was rejected as malformed or unknown. Paper compatibility remains unverified and no catalog fallback was used.",
      versionCount: 0,
      sourceTitle: null,
      sourceUrl: null,
      snapshotDate: null,
      diagnosticCode
    };
  }

  return {
    status,
    message: serverKind === "spigot"
      ? `The official Paper target catalog is available with ${versionCount} bounded numeric version keys, but it is not applied to Spigot. Spigot Java compatibility remains unverified until a separate resolver exists.`
      : `The official Paper target catalog is available with ${versionCount} bounded numeric version keys from the Paper Downloads Service snapshot${snapshotDate ? ` dated ${snapshotDate}` : ""}. Only validated catalog keys are used for Paper requirements.`,
    versionCount,
    sourceTitle,
    sourceUrl,
    snapshotDate,
    diagnosticCode: null
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

    const paperCatalog = javaRuntimeManager.getPaperRuntimeTargetCatalog();
    const officialCatalogVersions = paperCatalog.status === "available"
      && Array.isArray(paperCatalog.versions)
      ? paperCatalog.versions.slice(0, 96).filter((version): version is string => typeof version === "string")
      : EMPTY_OFFICIAL_PAPER_TARGET_CATALOG;

    const assessment = await javaRuntimeManager.assessSelectedJavaRuntime({
      serverKind: request.serverKind,
      targetVersion: request.targetVersion,
      officialCatalogVersions,
      ...(candidate ? { selectedCandidate: candidate } : {})
    });

    return {
      selectedCandidate: candidate ? candidateSummary(candidate) : null,
      officialTargetCatalog: projectOfficialTargetCatalog(paperCatalog, request.serverKind),
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
