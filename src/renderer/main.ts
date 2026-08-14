import "./styles.css";
import type {
  ArgvPreview,
  CliCatalogProjection,
  JavaRuntimeAssessment,
  JavaRuntimeCandidateSummary,
  JavaRuntimeDiscovery,
  PickerKind
} from "../shared/desktop-api";
import type { PlannerHandoffPreview } from "../shared/planner-handoff";
import { DEFAULT_UNIVERSAL_SETTINGS, normalizeUniversalSettings, type UniversalSettingsV1 } from "../shared/universal-contracts";
import {
  DEFAULT_SERVER_DRAFT,
  describeJavaRuntime,
  normalizeServerDraft,
  type ServerDraft
} from "../shared/server-draft";
import { bindOfflineDocumentation } from "./offline-documentation";

const form = document.querySelector<HTMLFormElement>("#server-form");
const saveState = document.querySelector<HTMLElement>("#save-state");
const snackbar = document.querySelector<HTMLElement>("#snackbar");
const argvPreview = document.querySelector<HTMLOListElement>("#argv-preview");
const catalogGrid = document.querySelector<HTMLElement>("#catalog-grid");
const catalogSource = document.querySelector<HTMLElement>("#catalog-source");
const workspaceTitle = document.querySelector<HTMLElement>("#workspace-title");
const workspaceSubtitle = document.querySelector<HTMLElement>("#workspace-subtitle");
const updateState = document.querySelector<HTMLElement>("#update-state");
const copyArgvButton = document.querySelector<HTMLButtonElement>("#copy-argv");
const choosePlannerHandoffButton = document.querySelector<HTMLButtonElement>("#choose-planner-handoff");
const applyPlannerHandoffButton = document.querySelector<HTMLButtonElement>("#apply-planner-handoff");
const discardPlannerHandoffButton = document.querySelector<HTMLButtonElement>("#discard-planner-handoff");
const plannerHandoffState = document.querySelector<HTMLElement>("#planner-handoff-state");
const plannerHandoffPreview = document.querySelector<HTMLDListElement>("#planner-handoff-preview");
const discoverJavaRuntimesButton = document.querySelector<HTMLButtonElement>("#discover-java-runtimes");
const chooseJavaRuntimeButton = document.querySelector<HTMLButtonElement>("#choose-java-runtime");
const assessJavaRuntimeButton = document.querySelector<HTMLButtonElement>("#assess-java-runtime");
const javaRuntimeState = document.querySelector<HTMLElement>("#java-runtime-state");
const selectedJavaRuntime = document.querySelector<HTMLElement>("#selected-java-runtime");
const javaRuntimeCandidates = document.querySelector<HTMLElement>("#java-runtime-candidates");
const javaRuntimeAssessmentBadge = document.querySelector<HTMLElement>("#java-runtime-assessment-badge");
const javaRuntimeAssessmentSummary = document.querySelector<HTMLElement>("#java-runtime-assessment-summary");
const javaRuntimeAssessmentDetails = document.querySelector<HTMLDListElement>("#java-runtime-assessment-details");
const javaRuntimeAssessmentRecovery = document.querySelector<HTMLElement>("#java-runtime-assessment-recovery");
const javaRuntimeAssessmentPlan = document.querySelector<HTMLElement>("#java-runtime-assessment-plan");
const universalSettingsState = document.querySelector<HTMLElement>("#universal-settings-state");
const resetUniversalSettingsButton = document.querySelector<HTMLButtonElement>("#reset-universal-settings");
const settingsSearch = document.querySelector<HTMLInputElement>("#settings-search");
const settingsRegexToggle = document.querySelector<HTMLButtonElement>("#settings-regex-toggle");
const settingsRegexBuilder = document.querySelector<HTMLElement>("#settings-regex-builder");
const settingsRegexPattern = document.querySelector<HTMLInputElement>("#settings-regex-pattern");
const settingsRegexIgnoreCase = document.querySelector<HTMLInputElement>("#settings-regex-ignore-case");
const settingsRegexStatus = document.querySelector<HTMLElement>("#settings-regex-status");

if (!form || !saveState || !snackbar || !argvPreview || !catalogGrid || !catalogSource || !workspaceTitle || !workspaceSubtitle || !updateState || !copyArgvButton || !choosePlannerHandoffButton || !applyPlannerHandoffButton || !discardPlannerHandoffButton || !plannerHandoffState || !plannerHandoffPreview || !discoverJavaRuntimesButton || !chooseJavaRuntimeButton || !assessJavaRuntimeButton || !javaRuntimeState || !selectedJavaRuntime || !javaRuntimeCandidates || !javaRuntimeAssessmentBadge || !javaRuntimeAssessmentSummary || !javaRuntimeAssessmentDetails || !javaRuntimeAssessmentRecovery || !javaRuntimeAssessmentPlan || !universalSettingsState || !resetUniversalSettingsButton || !settingsSearch || !settingsRegexToggle || !settingsRegexBuilder || !settingsRegexPattern || !settingsRegexIgnoreCase || !settingsRegexStatus) {
  throw new Error("The desktop renderer is missing a required foundation element.");
}

let draft: ServerDraft = DEFAULT_SERVER_DRAFT;
let activeTab = "overview";
let saveTimer: number | undefined;
let snackTimer: number | undefined;
let saveVersion = 0;
let currentArgvTokens: readonly string[] = [];
let pendingPlannerHandoff: PlannerHandoffPreview | undefined;
let latestJavaRuntimeDiscovery: JavaRuntimeDiscovery | undefined;
let selectedJavaCandidateId: string | null = null;
let universalSettings: UniversalSettingsV1 = DEFAULT_UNIVERSAL_SETTINGS;
let universalSaveTimer: number | undefined;
let universalSaveVersion = 0;
let settingsRegexMode = false;

const tabCopy: Record<string, readonly [string, string]> = {
  overview: ["Create a bounded setup draft", "Choose meaningful values through controls. This foundation never turns them into a shell command."],
  runtime: ["Plan and inspect a Java runtime", "Use bounded candidate discovery, fixed direct version probing, and the bundled official Paper target catalog. Spigot remains separately unverified."],
  world: ["Describe a world", "Record world intent without writing server files or touching a Minecraft save."],
  access: ["Set access intent", "Keep network and RCON planning visible without opening a port or remote console."],
  paths: ["Choose local paths", "Native file and folder pickers supply direct values without a generic command field."],
  preview: ["Inspect direct tokens", "The preview is an argument vector, not a command line, and it cannot be launched here."],
  catalog: ["Review supported CLI categories", "Mapped and unavailable entries stay visible so no arbitrary argument escape hatch is needed."],
  docs: ["Read offline documentation", "Search bundled desktop articles locally. External links stay unavailable without a network route."],
  settings: ["Adjust universal local settings", "Set language, funny levels, emoji, display name, appearance, and tab docking without server actions."]
};

function showSnackbar(message: string): void {
  snackbar.textContent = message;
  snackbar.hidden = false;
  if (snackTimer !== undefined) window.clearTimeout(snackTimer);
  snackTimer = window.setTimeout(() => {
    snackbar.hidden = true;
  }, 4200);
}

function writeSaveState(message: string): void {
  saveState.textContent = message;
}

function settingsControls(): Array<HTMLInputElement | HTMLSelectElement> {
  return Array.from(document.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-universal-setting]"));
}

function settingsMatches(text: string): boolean {
  const query = settingsSearch.value.trim();
  if (!settingsRegexMode) return text.toLocaleLowerCase().includes(query.toLocaleLowerCase());
  if (!settingsRegexPattern.value) return true;
  try {
    settingsRegexStatus.textContent = "Pattern is valid and runs only in this settings surface.";
    return new RegExp(settingsRegexPattern.value, settingsRegexIgnoreCase.checked ? "i" : "").test(text);
  } catch (error) {
    settingsRegexStatus.textContent = error instanceof Error ? error.message : "The local pattern is invalid.";
    return false;
  }
}

function renderSettingsSearch(): void {
  for (const card of document.querySelectorAll<HTMLElement>("[data-settings-item]")) {
    const label = card.dataset.settingsLabel ?? "";
    const matches = settingsMatches(`${label} ${card.textContent ?? ""}`);
    const hiddenByFocusMode = universalSettings.schoolModeEnabled && ["Language mode", "English funny level", "Cantonese funny level", "Emoji dialogs"].includes(label);
    card.hidden = hiddenByFocusMode || !matches;
  }
  if (!settingsRegexMode) settingsRegexStatus.textContent = "Plain text search is active. Regex is an explicit local opt-in.";
}

function renderUniversalSettings(): void {
  for (const control of settingsControls()) {
    const key = control.dataset.universalSetting as keyof UniversalSettingsV1 | undefined;
    if (!key) continue;
    const value = universalSettings[key];
    if (control instanceof HTMLInputElement && control.type === "checkbox") {
      control.checked = Boolean(value);
    } else {
      control.value = String(value);
    }
  }
  for (const output of document.querySelectorAll<HTMLOutputElement>("[data-universal-output]")) {
    const key = output.dataset.universalOutput as keyof UniversalSettingsV1 | undefined;
    if (!key) continue;
    output.value = `${String(universalSettings[key])} / 5`;
    output.textContent = output.value;
  }
  const title = document.querySelector<HTMLElement>(".titlebar__copy strong");
  const brand = document.querySelector<HTMLElement>(".titlebar__brand");
  if (title) title.textContent = universalSettings.appDisplayName;
  if (brand) brand.setAttribute("aria-label", universalSettings.appDisplayName);
  document.documentElement.dataset.theme = universalSettings.theme;
  document.documentElement.dataset.density = universalSettings.density;
  renderSettingsSearch();
}

function scheduleUniversalSettingsSave(): void {
  if (universalSaveTimer !== undefined) window.clearTimeout(universalSaveTimer);
  universalSettingsState.textContent = "Universal setting changes pending…";
  universalSaveTimer = window.setTimeout(() => {
    universalSaveTimer = undefined;
    const requestedVersion = ++universalSaveVersion;
    void window.commandCenter.settings.save(universalSettings).then((saved) => {
      if (requestedVersion !== universalSaveVersion) return;
      universalSettings = saved;
      renderUniversalSettings();
      universalSettingsState.textContent = "Universal settings saved locally.";
    }).catch(() => {
      universalSettingsState.textContent = "Universal settings could not be saved; the current window values remain visible.";
      showSnackbar("The universal settings file could not be saved. No server draft or process was changed.");
    });
  }, 350);
}

function handleUniversalSetting(control: HTMLInputElement | HTMLSelectElement): void {
  const key = control.dataset.universalSetting as keyof UniversalSettingsV1 | undefined;
  if (!key) return;
  const value = control instanceof HTMLInputElement && control.type === "checkbox"
    ? control.checked
    : control instanceof HTMLInputElement && control.type === "range"
      ? Number(control.value)
      : control.value;
  universalSettings = normalizeUniversalSettings({ ...universalSettings, [key]: value });
  renderUniversalSettings();
  scheduleUniversalSettingsSave();
}

function resetUniversalSettings(): void {
  universalSaveVersion += 1;
  if (universalSaveTimer !== undefined) window.clearTimeout(universalSaveTimer);
  universalSaveTimer = undefined;
  universalSettings = DEFAULT_UNIVERSAL_SETTINGS;
  renderUniversalSettings();
  void window.commandCenter.settings.save(universalSettings).then(() => {
    universalSettingsState.textContent = "Universal settings reset and saved locally.";
    showSnackbar("Universal settings reset. Server files and the server draft were not changed.");
  }).catch(() => {
    universalSettingsState.textContent = "Universal settings reset in this window; the file could not be updated.";
    showSnackbar("The universal settings reset could not be persisted.");
  });
}

function invalidatePendingSave(): void {
  if (saveTimer !== undefined) {
    window.clearTimeout(saveTimer);
    saveTimer = undefined;
  }
  // A prior IPC save must not overwrite an explicitly applied imported plan.
  saveVersion += 1;
}

function handoffValue(value: boolean): string {
  return value ? "Enabled" : "Off";
}

function renderPlannerHandoff(preview: PlannerHandoffPreview | undefined, message: string): void {
  pendingPlannerHandoff = preview;
  applyPlannerHandoffButton.disabled = preview === undefined;
  discardPlannerHandoffButton.disabled = preview === undefined;
  plannerHandoffState.textContent = message;
  plannerHandoffPreview.hidden = preview === undefined;
  plannerHandoffPreview.replaceChildren();
  if (!preview) return;

  const details: ReadonlyArray<readonly [string, string]> = [
    ["Plan", preview.serverName],
    ["Server", preview.serverKind === "paper" ? "Paper" : "Spigot"],
    ["Minecraft", preview.minecraftVersion],
    ["Java", preview.javaRuntime.replace("java-", "Java ")],
    ["Memory", `${preview.memoryMiB} MiB`],
    ["World", preview.worldName],
    ["Network", `${preview.port} · ${preview.onlineMode ? "online mode" : "offline mode"}`],
    ["RCON", preview.rconEnabled ? `planned on ${preview.rconPort}` : "not planned"],
    ["EULA", handoffValue(preview.eulaAcknowledged)]
  ];
  for (const [label, value] of details) {
    const row = document.createElement("div");
    const name = document.createElement("dt");
    const content = document.createElement("dd");
    name.textContent = label;
    content.textContent = value;
    row.append(name, content);
    plannerHandoffPreview.append(row);
  }
}

async function choosePlannerHandoff(): Promise<void> {
  writeSaveState("Waiting for a planner JSON selection…");
  try {
    const preview = await window.commandCenter.handoff.choose();
    if (!preview) {
      writeSaveState("Local draft ready");
      return;
    }
    renderPlannerHandoff(preview, "Imported plan is ready for review. Apply it to replace only its safe planning fields.");
    writeSaveState("Imported plan ready to apply");
    showSnackbar("Planner handoff parsed locally. Review the safe values before applying them.");
  } catch {
    renderPlannerHandoff(undefined, "The selected JSON could not be used. Choose a complete non-secret planner handoff v1.");
    writeSaveState("Planner handoff rejected");
    showSnackbar("The selected JSON was rejected before it could change this local draft.");
  }
}

async function applyPlannerHandoff(): Promise<void> {
  if (!pendingPlannerHandoff) return;
  invalidatePendingSave();
  writeSaveState("Applying imported plan locally…");
  try {
    draft = await window.commandCenter.handoff.apply(draft);
    hydrateForm();
    void renderArgv();
    updateLaunchBoundary();
    renderPlannerHandoff(undefined, "Imported plan applied and saved locally. Paths, executable locations, and other local-only values were retained.");
    writeSaveState("Imported plan applied locally");
    showSnackbar("Imported plan applied and saved locally. No server files or processes were changed.");
  } catch {
    writeSaveState("Imported plan could not be applied");
    showSnackbar("The imported plan was not applied. Review or choose a new JSON plan.");
  }
}

async function discardPlannerHandoff(): Promise<void> {
  try {
    await window.commandCenter.handoff.clear();
  } catch {
    // The preview is local UI state. Never retain an unavailable pending import.
  }
  renderPlannerHandoff(undefined, "No planner handoff is selected.");
  writeSaveState("Local draft ready");
  showSnackbar("Imported planner handoff discarded. The local draft was not changed.");
}

function readableRuntimeStatus(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function currentJavaRuntimeCandidate(): JavaRuntimeCandidateSummary | undefined {
  return latestJavaRuntimeDiscovery?.candidates.find((candidate) => candidate.id === selectedJavaCandidateId);
}

function setJavaRuntimeBusy(busy: boolean): void {
  discoverJavaRuntimesButton.disabled = busy;
  chooseJavaRuntimeButton.disabled = busy;
  assessJavaRuntimeButton.disabled = busy || selectedJavaCandidateId === null;
  for (const candidate of javaRuntimeCandidates.querySelectorAll<HTMLButtonElement>("[data-java-candidate-id]")) {
    candidate.disabled = busy;
  }
}

function renderJavaRuntimeAssessment(assessment: JavaRuntimeAssessment | undefined, message: string): void {
  javaRuntimeAssessmentDetails.replaceChildren();
  javaRuntimeAssessmentDetails.hidden = assessment === undefined;
  if (!assessment) {
    javaRuntimeAssessmentBadge.className = "badge";
    javaRuntimeAssessmentBadge.textContent = "Not assessed";
    javaRuntimeAssessmentSummary.textContent = message;
    javaRuntimeAssessmentRecovery.textContent = "Paper compatibility stays unverified until the selected target is present in the bundled official Paper catalog and covered by the documented requirements table. Spigot requires its own sourced resolver.";
    javaRuntimeAssessmentPlan.textContent = "Any setup plan remains review-only and is not available until the target is officially verified.";
    return;
  }

  const probe = assessment.probe.status === "valid" && assessment.probe.javaMajor !== null
    ? `Java ${assessment.probe.normalizedVersion ?? assessment.probe.javaMajor} (major ${assessment.probe.javaMajor})`
    : readableRuntimeStatus(assessment.probe.status);
  const requirement = assessment.requirement.requiredJavaMajor !== null
    ? `Recommended Java ${assessment.requirement.requiredJavaMajor}`
    : readableRuntimeStatus(assessment.requirement.status);
  const compatibility = readableRuntimeStatus(assessment.compatibility.status);
  const plan = readableRuntimeStatus(assessment.setupPlan.status);
  const catalog = assessment.officialTargetCatalog.status === "available"
    ? `${readableRuntimeStatus(assessment.officialTargetCatalog.status)} · ${assessment.officialTargetCatalog.versionCount} numeric versions`
    : readableRuntimeStatus(assessment.officialTargetCatalog.status);
  const details: ReadonlyArray<readonly [string, string]> = [
    ["Selected runtime", assessment.selectedCandidate?.label ?? "No candidate selected"],
    ["Direct version probe", probe],
    ["Target catalog", catalog],
    ["Paper requirement", requirement],
    ["Compatibility", compatibility],
    ["Setup plan", `${plan} · ${assessment.setupPlan.executionState}`]
  ];
  for (const [label, value] of details) {
    const row = document.createElement("div");
    const name = document.createElement("dt");
    const content = document.createElement("dd");
    name.textContent = label;
    content.textContent = value;
    row.append(name, content);
    javaRuntimeAssessmentDetails.append(row);
  }

  javaRuntimeAssessmentBadge.className = assessment.compatibility.status === "compatible" ? "badge badge--safe" : "badge";
  javaRuntimeAssessmentBadge.textContent = compatibility;
  javaRuntimeAssessmentSummary.textContent = assessment.probe.status === "valid"
    ? "The selected candidate was probed by the privileged process with fixed direct Java version arguments. Raw version output and executable paths are not shown here."
    : "The selected candidate could not produce a validated Java version. The result remains a review state; no fallback command, installation, or server action was attempted.";
  javaRuntimeAssessmentRecovery.textContent = assessment.officialTargetCatalog.message;
  const routeSummary = assessment.setupPlan.routes.length > 0
    ? ` Review-only route metadata: ${assessment.setupPlan.routes.map((route) => `${route.label} (${route.availability})`).join(", ")}.`
    : "";
  javaRuntimeAssessmentPlan.textContent = `Setup-plan state: ${plan}. ${assessment.setupPlan.mutationState.replaceAll("-", " ")}.${routeSummary}`;
}

function renderJavaRuntimeSelection(candidate: JavaRuntimeCandidateSummary | undefined, assessmentMessage: string): void {
  selectedJavaCandidateId = candidate?.id ?? null;
  selectedJavaRuntime.textContent = candidate
    ? `${candidate.label} · ${candidate.sourceLabel}`
    : "No Java runtime candidate is selected.";
  assessJavaRuntimeButton.disabled = selectedJavaCandidateId === null;
  for (const button of javaRuntimeCandidates.querySelectorAll<HTMLButtonElement>("[data-java-candidate-id]")) {
    const selected = button.dataset.javaCandidateId === selectedJavaCandidateId;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  }
  renderJavaRuntimeAssessment(undefined, assessmentMessage);
}

function renderJavaRuntimeDiscovery(discovery: JavaRuntimeDiscovery, message: string): void {
  latestJavaRuntimeDiscovery = discovery;
  const boundarySummary = `${discovery.searchedLocations.knownRootCount} bounded location roots checked; PATH search and recursive search remain off.`;
  const diagnosticSummary = discovery.diagnostics.length > 0
    ? ` ${discovery.diagnostics.map((diagnostic) => diagnostic.message).join(" ")}`
    : "";
  javaRuntimeState.textContent = `${message} ${boundarySummary}${diagnosticSummary}`;
  javaRuntimeCandidates.replaceChildren();

  if (discovery.candidates.length === 0) {
    const empty = document.createElement("p");
    empty.className = "java-runtime-candidates__empty";
    empty.textContent = "No usable Java executables were found in the bounded locations. Choose a Java executable with the native picker; this card will not widen the search.";
    javaRuntimeCandidates.append(empty);
  } else {
    for (const candidate of discovery.candidates) {
      const button = document.createElement("button");
      const top = document.createElement("span");
      const label = document.createElement("strong");
      const source = document.createElement("span");
      const description = document.createElement("small");
      button.type = "button";
      button.className = "java-runtime-candidate";
      button.dataset.javaCandidateId = candidate.id;
      button.setAttribute("aria-pressed", "false");
      top.className = "java-runtime-candidate__top";
      label.textContent = candidate.label;
      source.className = "badge";
      source.textContent = candidate.selectedByUser ? "Native choice" : "Bounded discovery";
      description.textContent = candidate.sourceLabel;
      top.append(label, source);
      button.append(top, description);
      javaRuntimeCandidates.append(button);
    }
  }

  const selected = discovery.selectedCandidateId
    ? discovery.candidates.find((candidate) => candidate.id === discovery.selectedCandidateId)
    : undefined;
  renderJavaRuntimeSelection(selected, "Choose a candidate, then probe it with fixed direct Java version arguments. No command text, package manager, installer, server, or configuration write is available.");
}

function resetJavaRuntimeGuidance(message: string): void {
  latestJavaRuntimeDiscovery = undefined;
  selectedJavaCandidateId = null;
  javaRuntimeState.textContent = message;
  javaRuntimeCandidates.replaceChildren();
  const empty = document.createElement("p");
  empty.className = "java-runtime-candidates__empty";
  empty.textContent = "Use Find bounded runtimes or Choose Java executable to begin a local, non-installing review.";
  javaRuntimeCandidates.append(empty);
  renderJavaRuntimeSelection(undefined, "Choose a candidate, then probe it with fixed direct Java version arguments. No command text, package manager, installer, server, or configuration write is available.");
}

async function discoverJavaRuntimes(): Promise<void> {
  setJavaRuntimeBusy(true);
  writeSaveState("Discovering bounded Java runtimes…");
  try {
    renderJavaRuntimeDiscovery(await window.commandCenter.runtime.discover(), "Bounded Java discovery completed.");
    writeSaveState("Local draft ready");
    showSnackbar("Bounded Java discovery completed. No PATH, disk, registry, or recursive scan was used.");
  } catch {
    javaRuntimeState.textContent = "Bounded Java discovery could not complete. No wider discovery or system change was attempted.";
    writeSaveState("Java runtime discovery unavailable");
    showSnackbar("Java runtime discovery could not complete. The local draft was not changed.");
  } finally {
    setJavaRuntimeBusy(false);
  }
}

async function chooseJavaRuntime(): Promise<void> {
  setJavaRuntimeBusy(true);
  writeSaveState("Waiting for a Java executable selection…");
  try {
    const discovery = await window.commandCenter.runtime.choose();
    if (!discovery) {
      writeSaveState("Local draft ready");
      return;
    }
    renderJavaRuntimeDiscovery(discovery, "The native Java selection was checked within the bounded discovery service.");
    const selected = currentJavaRuntimeCandidate();
    if (selected) {
      draft = normalizeServerDraft({ ...draft, javaRuntime: "custom", javaExecutable: "" });
      hydrateForm();
      void renderArgv();
      schedulePersist();
    }
    showSnackbar(selected
      ? "A Java runtime was selected for review. Its path remains in the privileged process."
      : "The selected item was not a usable Java executable. Choose another executable through the native picker.");
  } catch {
    javaRuntimeState.textContent = "The native Java selection could not be used. The local draft and server configuration were not changed.";
    writeSaveState("Java selection unavailable");
    showSnackbar("The Java selection could not be used. Choose another executable through the native picker.");
  } finally {
    setJavaRuntimeBusy(false);
  }
}

async function selectJavaRuntimeCandidate(candidateId: string): Promise<void> {
  setJavaRuntimeBusy(true);
  try {
    const candidate = await window.commandCenter.runtime.select(candidateId);
    if (!candidate) {
      javaRuntimeState.textContent = "That Java candidate is no longer available. Refresh bounded discovery and choose a listed candidate.";
      return;
    }
    draft = normalizeServerDraft({ ...draft, javaRuntime: "custom", javaExecutable: "" });
    hydrateForm();
    void renderArgv();
    schedulePersist();
    renderJavaRuntimeSelection(candidate, "The selected runtime is ready for a fixed direct version probe. It is not an argv text field and no executable path is sent to this renderer.");
    javaRuntimeState.textContent = "Java runtime candidate selected. Probe it to obtain a bounded parsed Java version result.";
    showSnackbar("Java runtime candidate selected for review. No server action or installer route was opened.");
  } catch {
    javaRuntimeState.textContent = "The Java candidate could not be selected. Refresh bounded discovery and choose a listed candidate.";
    showSnackbar("The Java candidate could not be selected. The local draft was not changed.");
  } finally {
    setJavaRuntimeBusy(false);
  }
}

async function assessJavaRuntime(): Promise<void> {
  if (!selectedJavaCandidateId) {
    renderJavaRuntimeAssessment(undefined, "Choose a Java runtime candidate before requesting a version probe.");
    return;
  }
  setJavaRuntimeBusy(true);
  writeSaveState("Probing the selected Java runtime…");
  try {
    const assessment = await window.commandCenter.runtime.assess({
      candidateId: selectedJavaCandidateId,
      serverKind: draft.serverKind,
      targetVersion: draft.minecraftVersion
    });
    renderJavaRuntimeAssessment(assessment, "Java runtime assessment completed.");
    writeSaveState("Java runtime review complete");
    showSnackbar("Java runtime review completed. Compatibility remains honest about the available catalog evidence.");
  } catch {
    renderJavaRuntimeAssessment(undefined, "The selected runtime could not be probed. No shell, fallback command, installation, or server action was attempted.");
    writeSaveState("Java runtime review unavailable");
    showSnackbar("The Java runtime could not be probed. The local draft and server configuration were not changed.");
  } finally {
    setJavaRuntimeBusy(false);
  }
}

function fieldElements(): Array<HTMLInputElement | HTMLSelectElement> {
  return Array.from(form.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input[data-field], select[data-field]"));
}

function hydrateForm(): void {
  for (const element of fieldElements()) {
    const key = element.dataset.field as keyof ServerDraft | undefined;
    if (!key) continue;
    const value = draft[key];
    if (element instanceof HTMLInputElement && element.type === "checkbox") {
      element.checked = Boolean(value);
    } else {
      element.value = String(value);
    }
  }
  const javaHint = document.querySelector<HTMLElement>("#java-runtime-hint");
  if (javaHint) javaHint.textContent = describeJavaRuntime(draft.javaRuntime);
}

async function renderArgv(): Promise<void> {
  let preview: ArgvPreview;
  try {
    preview = await window.commandCenter.preview.get(draft);
  } catch {
    currentArgvTokens = [];
    copyArgvButton.disabled = true;
    argvPreview.replaceChildren();
    const item = document.createElement("li");
    const message = document.createElement("code");
    message.textContent = "Preview unavailable until the typed CLI registry is available.";
    item.append(message);
    argvPreview.append(item);
    return;
  }
  currentArgvTokens = preview.tokens;
  copyArgvButton.disabled = preview.tokens.length === 0;
  argvPreview.replaceChildren();
  for (const [index, token] of preview.tokens.entries()) {
    const item = document.createElement("li");
    const position = document.createElement("span");
    const content = document.createElement("code");
    position.className = "argv-list__position";
    position.textContent = String(index);
    position.setAttribute("aria-label", "Argument " + index);
    content.textContent = token;
    item.append(position, content);
    argvPreview.append(item);
  }
  if (preview.unsupported.length > 0) {
    const notice = document.createElement("li");
    const position = document.createElement("span");
    const message = document.createElement("code");
    position.className = "argv-list__position";
    position.textContent = "!";
    message.textContent = "Spigot-unavailable selections omitted: " + preview.unsupported.join(", ");
    notice.append(position, message);
    argvPreview.append(notice);
  }
}

function updateLaunchBoundary(): void {
  const boundary = document.querySelector<HTMLElement>("#launch-readiness");
  if (!boundary) return;
  const acknowledgement = draft.eulaAcknowledged
    ? "EULA acknowledgement is recorded in this local draft."
    : "EULA acknowledgement has not been recorded in this local draft.";
  boundary.textContent = acknowledgement + " Starting a server remains unavailable until the dedicated safety route exists.";
}

function activateTab(nextTab: string, focus = false): void {
  const copy = tabCopy[nextTab];
  if (!copy) return;
  activeTab = nextTab;
  for (const button of document.querySelectorAll<HTMLButtonElement>("[data-tab]")) {
    const selected = button.dataset.tab === nextTab;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
    if (selected && focus) button.focus();
  }
  for (const panel of document.querySelectorAll<HTMLElement>("[data-panel]")) {
    const selected = panel.dataset.panel === nextTab;
    panel.classList.toggle("is-active", selected);
    panel.hidden = !selected;
  }
  workspaceTitle.textContent = copy[0];
  workspaceSubtitle.textContent = copy[1];
}

function draftFromControl(control: HTMLInputElement | HTMLSelectElement): ServerDraft {
  const field = control.dataset.field as keyof ServerDraft | undefined;
  if (!field) return draft;
  const value = control instanceof HTMLInputElement && control.type === "checkbox"
    ? control.checked
    : control.value;
  return normalizeServerDraft({ ...draft, [field]: value });
}

async function persistDraft(): Promise<void> {
  const requestedVersion = ++saveVersion;
  writeSaveState("Saving local draft…");
  try {
    const saved = await window.commandCenter.draft.save(draft);
    if (requestedVersion !== saveVersion) return;
    draft = saved;
    hydrateForm();
    void renderArgv();
    updateLaunchBoundary();
    writeSaveState("Saved locally");
    showSnackbar("Draft saved locally. No server files or processes were changed.");
  } catch {
    writeSaveState("Local draft could not be saved");
    showSnackbar("The draft could not be saved. Current form values remain in this window.");
  }
}

function schedulePersist(): void {
  if (saveTimer !== undefined) window.clearTimeout(saveTimer);
  writeSaveState("Draft changes pending…");
  saveTimer = window.setTimeout(() => {
    saveTimer = undefined;
    void persistDraft();
  }, 450);
}

async function usePicker(button: HTMLButtonElement): Promise<void> {
  const kind = button.dataset.pickerKind as PickerKind | undefined;
  const target = button.dataset.pickerTarget as keyof ServerDraft | undefined;
  if (!kind || !target) return;
  const chosen = await window.commandCenter.picker.select(kind);
  if (!chosen) return;
  draft = normalizeServerDraft({ ...draft, [target]: chosen });
  hydrateForm();
  void renderArgv();
  schedulePersist();
}

async function copyArgv(): Promise<void> {
  if (currentArgvTokens.length === 0) {
    showSnackbar("The direct argv preview is unavailable, so nothing was copied.");
    return;
  }
  try {
    await navigator.clipboard.writeText(JSON.stringify(currentArgvTokens, null, 2));
    showSnackbar("Copied the direct argv JSON array. It is data, not a shell command.");
  } catch {
    showSnackbar("The operating system clipboard did not accept the direct argv preview.");
  }
}

function renderCatalog(catalog: CliCatalogProjection): void {
  catalogSource.textContent = catalog.source;
  catalogGrid.replaceChildren();
  for (const category of catalog.categories) {
    const article = document.createElement("article");
    const header = document.createElement("header");
    const title = document.createElement("h3");
    const product = document.createElement("span");
    const list = document.createElement("ul");
    article.className = "catalog-card";
    title.textContent = category.label;
    product.className = "badge";
    product.textContent = category.product;
    header.append(title, product);
    for (const entry of category.entries) {
      const item = document.createElement("li");
      const name = document.createElement("strong");
      const summary = document.createElement("p");
      const status = document.createElement("span");
      name.textContent = entry.label;
      summary.textContent = entry.summary;
      status.className = "entry-status entry-status--" + entry.status;
      status.textContent = entry.status === "mapped" ? "Mapped" : "Unavailable";
      item.append(name, status, summary);
      list.append(item);
    }
    article.append(header, list);
    catalogGrid.append(article);
  }
}

function bindInteraction(): void {
  bindOfflineDocumentation();
  for (const control of settingsControls()) {
    control.addEventListener("input", () => handleUniversalSetting(control));
    control.addEventListener("change", () => handleUniversalSetting(control));
  }
  settingsSearch.addEventListener("input", renderSettingsSearch);
  settingsRegexPattern.addEventListener("input", () => {
    settingsRegexMode = true;
    renderSettingsSearch();
  });
  settingsRegexIgnoreCase.addEventListener("change", renderSettingsSearch);
  form.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;
    if (!target.dataset.field) return;
    draft = draftFromControl(target);
    hydrateForm();
    void renderArgv();
    updateLaunchBoundary();
    if (target.dataset.field === "serverKind" || target.dataset.field === "minecraftVersion") {
      renderJavaRuntimeAssessment(undefined, "The Paper or Spigot target changed. Probe the selected runtime again to review the new target without making any server change.");
    }
    schedulePersist();
  });
  form.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;
    if (!target.dataset.field) return;
    draft = draftFromControl(target);
    hydrateForm();
    void renderArgv();
    updateLaunchBoundary();
    if (target.dataset.field === "serverKind" || target.dataset.field === "minecraftVersion") {
      renderJavaRuntimeAssessment(undefined, "The Paper or Spigot target changed. Probe the selected runtime again to review the new target without making any server change.");
    }
    schedulePersist();
  });
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const picker = target.closest<HTMLButtonElement>("[data-picker-kind]");
    if (picker) {
      void usePicker(picker);
      return;
    }
    const settingsToken = target.closest<HTMLButtonElement>("[data-settings-token]");
    if (settingsToken?.dataset.settingsToken) {
      settingsRegexMode = true;
      settingsRegexPattern.value = (settingsRegexPattern.value + settingsToken.dataset.settingsToken).slice(0, 160);
      renderSettingsSearch();
      settingsRegexPattern.focus();
      return;
    }
    const settingsRegex = target.closest<HTMLButtonElement>("#settings-regex-toggle");
    if (settingsRegex) {
      settingsRegexMode = !settingsRegexMode;
      settingsRegex.setAttribute("aria-expanded", String(settingsRegexMode));
      settingsRegexBuilder.hidden = !settingsRegexMode;
      renderSettingsSearch();
      if (settingsRegexMode) settingsRegexPattern.focus();
      return;
    }
    const resetUniversal = target.closest<HTMLButtonElement>("#reset-universal-settings");
    if (resetUniversal) {
      resetUniversalSettings();
      return;
    }
    const chooseHandoff = target.closest<HTMLButtonElement>("#choose-planner-handoff");
    if (chooseHandoff) {
      void choosePlannerHandoff();
      return;
    }
    const applyHandoff = target.closest<HTMLButtonElement>("#apply-planner-handoff");
    if (applyHandoff) {
      void applyPlannerHandoff();
      return;
    }
    const discardHandoff = target.closest<HTMLButtonElement>("#discard-planner-handoff");
    if (discardHandoff) {
      void discardPlannerHandoff();
      return;
    }
    const discoverJava = target.closest<HTMLButtonElement>("#discover-java-runtimes");
    if (discoverJava) {
      void discoverJavaRuntimes();
      return;
    }
    const chooseJava = target.closest<HTMLButtonElement>("#choose-java-runtime");
    if (chooseJava) {
      void chooseJavaRuntime();
      return;
    }
    const assessJava = target.closest<HTMLButtonElement>("#assess-java-runtime");
    if (assessJava) {
      void assessJavaRuntime();
      return;
    }
    const javaCandidate = target.closest<HTMLButtonElement>("[data-java-candidate-id]");
    if (javaCandidate?.dataset.javaCandidateId) {
      void selectJavaRuntimeCandidate(javaCandidate.dataset.javaCandidateId);
      return;
    }
    const tab = target.closest<HTMLButtonElement>("[data-tab]");
    if (tab?.dataset.tab) {
      activateTab(tab.dataset.tab, true);
      return;
    }
    const reset = target.closest<HTMLButtonElement>("#reset-draft");
    if (reset) {
      invalidatePendingSave();
      draft = DEFAULT_SERVER_DRAFT;
      renderPlannerHandoff(undefined, "No planner handoff is selected.");
      void window.commandCenter.handoff.clear();
      void window.commandCenter.runtime.clear();
      resetJavaRuntimeGuidance("The Java runtime review was cleared with the local draft. No Java path, server file, or process was changed.");
      hydrateForm();
      void renderArgv();
      updateLaunchBoundary();
      schedulePersist();
      showSnackbar("Draft reset to the shipped bounded values.");
      return;
    }
    const copy = target.closest<HTMLButtonElement>("#copy-argv");
    if (copy) {
      void copyArgv();
      return;
    }
    const action = target.closest<HTMLButtonElement>("[data-window-action]")?.dataset.windowAction;
    if (action === "minimize") void window.commandCenter.window.minimize();
    if (action === "maximize") void window.commandCenter.window.toggleMaximize();
    if (action === "close") void window.commandCenter.window.close();
  });
  document.addEventListener("keydown", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement) || !target.dataset.tab) return;
    const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-tab]"));
    const current = tabs.indexOf(target);
    if (current < 0) return;
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    const next = event.key === "Home"
      ? 0
      : event.key === "End"
        ? tabs.length - 1
        : (current + (event.key === "ArrowDown" ? 1 : -1) + tabs.length) % tabs.length;
    const destination = tabs[next];
    if (destination?.dataset.tab) activateTab(destination.dataset.tab, true);
  });
}

async function start(): Promise<void> {
  bindInteraction();
  try {
    universalSettings = await window.commandCenter.settings.load();
    renderUniversalSettings();
    universalSettingsState.textContent = "Universal settings ready locally.";
  } catch {
    universalSettings = DEFAULT_UNIVERSAL_SETTINGS;
    renderUniversalSettings();
    universalSettingsState.textContent = "Universal settings are using the bounded in-window defaults.";
    showSnackbar("The universal settings file was unavailable. Bounded defaults are shown and no server state changed.");
  }
  resetJavaRuntimeGuidance("No Java runtime candidates have been requested. Discovery never scans PATH, disks, the registry, or arbitrary folders.");
  try {
    draft = await window.commandCenter.draft.load();
    hydrateForm();
    void renderArgv();
    updateLaunchBoundary();
    writeSaveState("Local draft ready");
  } catch {
    draft = DEFAULT_SERVER_DRAFT;
    hydrateForm();
    void renderArgv();
    updateLaunchBoundary();
    writeSaveState("Using a temporary draft");
    showSnackbar("A stored draft was unavailable. The safe default draft is shown.");
  }
  try {
    renderCatalog(await window.commandCenter.catalog.get());
  } catch {
    catalogSource.textContent = "The catalog could not be loaded. Unsupported arguments remain unavailable.";
  }
  try {
    const update = await window.commandCenter.updater.get();
    updateState.textContent = update.message;
    updateState.title = update.reason;
  } catch {
    updateState.textContent = "Update status unavailable.";
  }
  activateTab(activeTab);
}

void start();
