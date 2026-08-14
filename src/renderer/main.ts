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
import { createBoundedSearchMatcher } from "../shared/regex-search";
import { DEFAULT_UNIVERSAL_SETTINGS, normalizeUniversalSettings, type UniversalSettingsV1 } from "../shared/universal-contracts";
import {
  DEFAULT_SERVER_DRAFT,
  describeJavaRuntime,
  normalizeServerDraft,
  type ServerDraft
} from "../shared/server-draft";
import { bindOfflineDocumentation } from "./offline-documentation";
import { bindAnchoredRegexBuilder, type AnchoredRegexBuilderBinding, type RegexBuilderState } from "./regex-builder";
import {
  appendNotificationRecord,
  bulkDismissNotificationRecords,
  createNotificationRecord,
  dismissNotificationRecord,
  EMPTY_NOTIFICATION_CENTER,
  invertNotificationSelection,
  MAX_NOTIFICATION_RECORDS,
  NOTIFICATION_STORAGE_KEY,
  parseNotificationCenter,
  serializeNotificationCenter,
  type NotificationCenterState,
  type NotificationRecord,
  type NotificationSelectScope,
  type NotificationView,
} from "./notification-center";

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
const commandPalette = document.querySelector<HTMLElement>("#command-palette");
const commandPaletteDialog = document.querySelector<HTMLElement>("#command-palette-dialog");
const commandPaletteSearch = document.querySelector<HTMLInputElement>("#command-palette-search");
const commandPaletteRegexToggle = document.querySelector<HTMLButtonElement>("#command-palette-regex-toggle");
const commandPaletteRegexBuilder = document.querySelector<HTMLElement>("#command-palette-regex-builder");
const commandPaletteRegexPattern = document.querySelector<HTMLInputElement>("#command-palette-regex-pattern");
const commandPaletteRegexIgnoreCase = document.querySelector<HTMLInputElement>("#command-palette-regex-ignore-case");
const commandPaletteRegexStatus = document.querySelector<HTMLElement>("#command-palette-regex-status");
const commandPaletteStatus = document.querySelector<HTMLElement>("#command-palette-status");
const commandPaletteResultList = document.querySelector<HTMLElement>("#command-palette-result-list");
const notificationSearch = document.querySelector<HTMLInputElement>("#notification-search");
const notificationRegexToggle = document.querySelector<HTMLButtonElement>("#notification-regex-toggle");
const notificationRegexBuilder = document.querySelector<HTMLElement>("#notification-regex-builder");
const notificationRegexPattern = document.querySelector<HTMLInputElement>("#notification-regex-pattern");
const notificationRegexIgnoreCase = document.querySelector<HTMLInputElement>("#notification-regex-ignore-case");
const notificationRegexStatus = document.querySelector<HTMLElement>("#notification-regex-status");
const notificationPersistenceStatus = document.querySelector<HTMLElement>("#notification-persistence-status");
const notificationActiveCount = document.querySelector<HTMLElement>("#notification-active-count");
const notificationDismissedCount = document.querySelector<HTMLElement>("#notification-dismissed-count");
const notificationRecordCount = document.querySelector<HTMLElement>("#notification-record-count");
const notificationViewActiveCount = document.querySelector<HTMLElement>("#notification-view-active-count");
const notificationViewDismissedCount = document.querySelector<HTMLElement>("#notification-view-dismissed-count");
const notificationViewAllCount = document.querySelector<HTMLElement>("#notification-view-all-count");
const notificationRecordList = document.querySelector<HTMLElement>("#notification-record-list");
const notificationStatusMessage = document.querySelector<HTMLElement>("#notification-status-message");

if (!form || !saveState || !snackbar || !argvPreview || !catalogGrid || !catalogSource || !workspaceTitle || !workspaceSubtitle || !updateState || !copyArgvButton || !choosePlannerHandoffButton || !applyPlannerHandoffButton || !discardPlannerHandoffButton || !plannerHandoffState || !plannerHandoffPreview || !discoverJavaRuntimesButton || !chooseJavaRuntimeButton || !assessJavaRuntimeButton || !javaRuntimeState || !selectedJavaRuntime || !javaRuntimeCandidates || !javaRuntimeAssessmentBadge || !javaRuntimeAssessmentSummary || !javaRuntimeAssessmentDetails || !javaRuntimeAssessmentRecovery || !javaRuntimeAssessmentPlan || !universalSettingsState || !resetUniversalSettingsButton || !settingsSearch || !settingsRegexToggle || !settingsRegexBuilder || !settingsRegexPattern || !settingsRegexIgnoreCase || !settingsRegexStatus || !commandPalette || !commandPaletteDialog || !commandPaletteSearch || !commandPaletteRegexToggle || !commandPaletteRegexBuilder || !commandPaletteRegexPattern || !commandPaletteRegexIgnoreCase || !commandPaletteRegexStatus || !commandPaletteStatus || !commandPaletteResultList || !notificationSearch || !notificationRegexToggle || !notificationRegexBuilder || !notificationRegexPattern || !notificationRegexIgnoreCase || !notificationRegexStatus || !notificationPersistenceStatus || !notificationActiveCount || !notificationDismissedCount || !notificationRecordCount || !notificationViewActiveCount || !notificationViewDismissedCount || !notificationViewAllCount || !notificationRecordList || !notificationStatusMessage) {
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
let settingsRegexState: RegexBuilderState = { mode: "plain", query: "", pattern: "", flags: "i" };
let commandPaletteRegexState: RegexBuilderState = { mode: "plain", query: "", pattern: "", flags: "i" };
let commandPaletteBinding: AnchoredRegexBuilderBinding | undefined;
let commandPaletteOpen = false;
let commandPaletteReturnFocus: HTMLElement | null = null;
let notificationCenter: NotificationCenterState = EMPTY_NOTIFICATION_CENTER;
let notificationView: NotificationView = "active";
let notificationSelectScope: NotificationSelectScope = "view";
let selectedNotificationIds: string[] = [];
let notificationRegexState: RegexBuilderState = { mode: "plain", query: "", pattern: "", flags: "i" };
let notificationRegexBinding: AnchoredRegexBuilderBinding | undefined;
let notificationPersistence: "checking" | "saved" | "unavailable" = "checking";
let notificationStatus = "";
let currentSnackbarId: string | null = null;

const tabCopy: Record<string, readonly [string, string]> = {
  overview: ["Create a bounded setup draft", "Choose meaningful values through controls. This foundation never turns them into a shell command."],
  runtime: ["Plan and inspect a Java runtime", "Use bounded candidate discovery, fixed direct version probing, and the bundled official Paper target catalog. Spigot remains separately unverified."],
  world: ["Describe a world", "Record world intent without writing server files or touching a Minecraft save."],
  access: ["Set access intent", "Keep network and RCON planning visible without opening a port or remote console."],
  paths: ["Choose local paths", "Native file and folder pickers supply direct values without a generic command field."],
  preview: ["Inspect direct tokens", "The preview is an argument vector, not a command line, and it cannot be launched here."],
  catalog: ["Review supported CLI categories", "Mapped and unavailable entries stay visible so no arbitrary argument escape hatch is needed."],
  docs: ["Read offline documentation", "Search bundled desktop articles locally. External links stay unavailable without a network route."],
  settings: ["Adjust universal local settings", "Set language, funny levels, emoji, display name, appearance, and tab docking without server actions."],
  notifications: ["Review desktop notifications", "Keep bounded local snackbar records available for review, dismissal, and honest bulk actions."]
};

interface CommandPaletteCommand {
  readonly id: "docs-search" | "docs-regex" | "settings-search" | "settings-regex";
  readonly label: string;
  readonly description: string;
  readonly tab: "docs" | "settings";
  readonly searchId: "offline-docs-search" | "settings-search";
  readonly regexToggleId: "offline-docs-regex-toggle" | "settings-regex-toggle";
  readonly openRegex: boolean;
}

const commandPaletteCommands: readonly CommandPaletteCommand[] = [
  {
    id: "docs-search",
    label: "Search offline documentation",
    description: "Open Docs and focus the local article search.",
    tab: "docs",
    searchId: "offline-docs-search",
    regexToggleId: "offline-docs-regex-toggle",
    openRegex: false,
  },
  {
    id: "docs-regex",
    label: "Open documentation regex builder",
    description: "Open Docs and focus its anchored Regex builder.",
    tab: "docs",
    searchId: "offline-docs-search",
    regexToggleId: "offline-docs-regex-toggle",
    openRegex: true,
  },
  {
    id: "settings-search",
    label: "Search universal settings",
    description: "Open Universal settings and focus its local search.",
    tab: "settings",
    searchId: "settings-search",
    regexToggleId: "settings-regex-toggle",
    openRegex: false,
  },
  {
    id: "settings-regex",
    label: "Open settings regex builder",
    description: "Open Universal settings and focus its anchored Regex builder.",
    tab: "settings",
    searchId: "settings-search",
    regexToggleId: "settings-regex-toggle",
    openRegex: true,
  },
];

function notificationToneFor(message: string): "warning" | "error" | "success" | "info" {
  if (/\b(error|failed|failure|could not|unavailable|rejected|not accepted|unable)\b/i.test(message)) return "warning";
  if (/\b(saved|completed|copied|applied|selected|reset)\b/i.test(message)) return "success";
  return "info";
}

function persistNotificationCenter(): void {
  try {
    window.localStorage.setItem(NOTIFICATION_STORAGE_KEY, serializeNotificationCenter(notificationCenter));
    notificationPersistence = "saved";
  } catch {
    notificationPersistence = "unavailable";
  }
  renderNotificationCenter();
}

function loadNotificationCenter(): void {
  try {
    const stored = window.localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (!stored) {
      notificationCenter = EMPTY_NOTIFICATION_CENTER;
      notificationPersistence = "saved";
      return;
    }
    const parsed = parseNotificationCenter(JSON.parse(stored) as unknown);
    if (parsed.ok) {
      notificationCenter = parsed.value;
      notificationPersistence = "saved";
      return;
    }
    window.localStorage.removeItem(NOTIFICATION_STORAGE_KEY);
    notificationCenter = EMPTY_NOTIFICATION_CENTER;
    notificationPersistence = "saved";
    notificationStatus = `${parsed.reason} The invalid local value was cleared.`;
  } catch {
    notificationCenter = EMPTY_NOTIFICATION_CENTER;
    notificationPersistence = "unavailable";
    notificationStatus = "Local notification storage is unavailable; this window will keep notices temporarily.";
  }
}

function renderSnackbar(record: NotificationRecord): void {
  const content = document.createElement("div");
  content.className = "snackbar__content";
  const title = document.createElement("strong");
  title.textContent = record.title;
  const detail = document.createElement("span");
  detail.textContent = record.detail;
  content.append(title, detail);
  const actions = document.createElement("div");
  actions.className = "snackbar__actions";
  const review = document.createElement("button");
  review.type = "button";
  review.className = "text-action";
  review.dataset.snackbarReview = record.id;
  review.textContent = "Review";
  review.setAttribute("aria-label", `Review notification: ${record.title}`);
  const dismiss = document.createElement("button");
  dismiss.type = "button";
  dismiss.className = "icon-button icon-button--small";
  dismiss.dataset.snackbarDismiss = record.id;
  dismiss.textContent = "×";
  dismiss.setAttribute("aria-label", `Dismiss notification: ${record.title}`);
  actions.append(review, dismiss);
  snackbar.dataset.tone = record.tone;
  snackbar.replaceChildren(content, actions);
  snackbar.hidden = false;
  currentSnackbarId = record.id;
  if (snackTimer !== undefined) window.clearTimeout(snackTimer);
  snackTimer = window.setTimeout(() => {
    snackbar.hidden = true;
    currentSnackbarId = null;
  }, 4200);
}

function showSnackbar(message: string): void {
  const record = createNotificationRecord({
    tone: notificationToneFor(message),
    title: "Desktop notification",
    detail: message,
  });
  notificationCenter = {
    schemaVersion: 1,
    records: appendNotificationRecord(notificationCenter.records, record),
  };
  persistNotificationCenter();
  renderSnackbar(record);
}

function notificationMatches(record: NotificationRecord): boolean {
  const matcher = createBoundedSearchMatcher(notificationRegexState);
  return matcher.ok && matcher.value(`${record.title} ${record.detail} ${record.tone}`);
}

function notificationViewRecords(): NotificationRecord[] {
  return notificationCenter.records.filter((record) => {
    const matchesView = notificationView === "all"
      || (notificationView === "active" ? record.dismissedAt === null : record.dismissedAt !== null);
    return matchesView && notificationMatches(record);
  });
}

function notificationSelectionTarget(): NotificationRecord[] {
  return notificationSelectScope === "view"
    ? notificationViewRecords()
    : notificationCenter.records.filter(notificationMatches);
}

function renderNotificationCenter(): void {
  const matcher = createBoundedSearchMatcher(notificationRegexState);
  const activeCount = notificationCenter.records.filter((record) => record.dismissedAt === null).length;
  const dismissedCount = notificationCenter.records.length - activeCount;
  const matchingRecords = notificationViewRecords();
  const selected = new Set(selectedNotificationIds);
  const selectedDismissibleCount = notificationCenter.records.filter(
    (record) => selected.has(record.id) && record.dismissible && record.dismissedAt === null,
  ).length;
  const persistenceLabel = notificationPersistence === "saved"
    ? "Local persistence ready"
    : notificationPersistence === "unavailable"
      ? "Local persistence unavailable"
      : "Checking local storage…";
  notificationPersistenceStatus.textContent = persistenceLabel;
  notificationActiveCount.textContent = String(activeCount);
  notificationDismissedCount.textContent = String(dismissedCount);
  notificationRecordCount.textContent = `${notificationCenter.records.length} / ${MAX_NOTIFICATION_RECORDS} stored`;
  notificationViewActiveCount.textContent = String(activeCount);
  notificationViewDismissedCount.textContent = String(dismissedCount);
  notificationViewAllCount.textContent = String(notificationCenter.records.length);
  for (const button of document.querySelectorAll<HTMLButtonElement>("[data-notification-view]")) {
    const isSelected = button.dataset.notificationView === notificationView;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  }
  const clearButton = document.querySelector<HTMLButtonElement>('[data-notification-action="clear"]');
  const dismissSelectedButton = document.querySelector<HTMLButtonElement>('[data-notification-action="dismiss-selected"]');
  if (clearButton) {
    clearButton.disabled = selectedNotificationIds.length === 0;
    clearButton.textContent = `Clear selection (${selectedNotificationIds.length})`;
  }
  if (dismissSelectedButton) {
    dismissSelectedButton.disabled = selectedDismissibleCount === 0;
    dismissSelectedButton.textContent = `Dismiss selected (${selectedDismissibleCount})`;
  }
  if (!matcher.ok) {
    notificationStatusMessage.textContent = matcher.reason;
  } else if (notificationStatus) {
    notificationStatusMessage.textContent = notificationStatus;
  } else {
    notificationStatusMessage.textContent = `${matchingRecords.length} notification record${matchingRecords.length === 1 ? "" : "s"} shown.`;
  }
  notificationRecordList.replaceChildren();
  if (matchingRecords.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = notificationCenter.records.length === 0
      ? "No desktop notifications have been recorded yet. Existing snackbars will appear here after they occur."
      : "No desktop notification records match the current view and search.";
    notificationRecordList.append(empty);
    return;
  }
  for (const record of matchingRecords) {
    const article = document.createElement("article");
    article.className = `notification-record notification-record--${record.tone}`;
    article.dataset.notificationRecordId = record.id;
    article.tabIndex = -1;
    article.setAttribute("role", "listitem");
    const selection = document.createElement("label");
    selection.className = "notification-record__select";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = selected.has(record.id);
    checkbox.dataset.notificationSelect = record.id;
    checkbox.setAttribute("aria-label", `Select notification: ${record.title}`);
    selection.append(checkbox);
    const body = document.createElement("div");
    body.className = "notification-record__body";
    const heading = document.createElement("div");
    heading.className = "notification-record__heading";
    const marker = document.createElement("span");
    marker.className = "notification-record__marker";
    marker.setAttribute("aria-hidden", "true");
    marker.textContent = record.tone === "warning" ? "!" : record.tone === "error" ? "×" : record.tone === "success" ? "✓" : "i";
    const title = document.createElement("h4");
    title.textContent = record.title;
    heading.append(marker, title);
    const detail = document.createElement("p");
    detail.textContent = record.detail;
    const meta = document.createElement("p");
    meta.className = "notification-record__meta";
    meta.textContent = `${new Date(record.createdAt).toLocaleString()} · ${record.dismissedAt ? `Dismissed ${new Date(record.dismissedAt).toLocaleString()}` : "Active"}${record.dismissible ? " · Dismissible" : " · Review only"}`;
    body.append(heading, detail, meta);
    const actions = document.createElement("div");
    actions.className = "notification-record__actions";
    const review = document.createElement("button");
    review.type = "button";
    review.className = "text-action";
    review.dataset.notificationReview = record.id;
    review.textContent = "Review";
    review.setAttribute("aria-label", `Review notification: ${record.title}`);
    actions.append(review);
    if (record.dismissible && record.dismissedAt === null) {
      const dismiss = document.createElement("button");
      dismiss.type = "button";
      dismiss.className = "text-action";
      dismiss.dataset.notificationDismiss = record.id;
      dismiss.textContent = "Dismiss";
      dismiss.setAttribute("aria-label", `Dismiss notification: ${record.title}`);
      actions.append(dismiss);
    }
    article.append(selection, body, actions);
    notificationRecordList.append(article);
  }
}

function focusNotificationRecord(id: string): void {
  window.requestAnimationFrame(() => {
    const target = Array.from(document.querySelectorAll<HTMLElement>("[data-notification-record-id]"))
      .find((candidate) => candidate.dataset.notificationRecordId === id);
    target?.focus();
  });
}

function reviewNotification(id: string): void {
  notificationView = "all";
  notificationStatus = "Notification opened in the local review trail.";
  activateTab("notifications", true);
  renderNotificationCenter();
  focusNotificationRecord(id);
}

function dismissNotification(id: string): void {
  notificationCenter = {
    schemaVersion: 1,
    records: dismissNotificationRecord(notificationCenter.records, id),
  };
  selectedNotificationIds = selectedNotificationIds.filter((selectedId) => selectedId !== id);
  notificationStatus = "Notification dismissed locally and kept for review.";
  persistNotificationCenter();
  if (currentSnackbarId === id) {
    snackbar.hidden = true;
    currentSnackbarId = null;
  }
}

function dismissSelectedNotifications(): void {
  const selectedCountBeforeDismiss = selectedNotificationIds.length;
  const result = bulkDismissNotificationRecords(notificationCenter.records, selectedNotificationIds);
  notificationCenter = { schemaVersion: 1, records: result.records };
  selectedNotificationIds = selectedNotificationIds.filter((id) => !result.dismissedIds.includes(id));
  const skippedCount = selectedCountBeforeDismiss - result.dismissedIds.length;
  notificationStatus = result.dismissedIds.length === 0
    ? "No selected active dismissible notifications were changed."
    : `${result.dismissedIds.length} notification record${result.dismissedIds.length === 1 ? "" : "s"} dismissed locally${skippedCount ? `; ${skippedCount} selected record${skippedCount === 1 ? " was" : "s were"} not dismissible or already dismissed.` : "."}`;
  persistNotificationCenter();
}

function renderCommandPalette(): void {
  const matcher = createBoundedSearchMatcher(commandPaletteRegexState);
  commandPaletteResultList.replaceChildren();
  if (!matcher.ok) {
    commandPaletteStatus.textContent = matcher.reason;
    const empty = document.createElement("p");
    empty.className = "command-palette__empty";
    empty.textContent = matcher.reason;
    commandPaletteResultList.append(empty);
    return;
  }

  const matches = commandPaletteCommands.filter((command) => matcher.value(`${command.label} ${command.description}`));
  commandPaletteStatus.textContent = `${matches.length} command${matches.length === 1 ? "" : "s"} available.`;
  if (matches.length === 0) {
    const empty = document.createElement("p");
    empty.className = "command-palette__empty";
    empty.textContent = "No existing desktop search surface matches this query.";
    commandPaletteResultList.append(empty);
    return;
  }
  for (const command of matches) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "command-palette__result";
    item.setAttribute("role", "option");
    item.dataset.commandPaletteId = command.id;
    item.setAttribute("aria-label", `${command.label}. ${command.description}`);
    const label = document.createElement("strong");
    const description = document.createElement("span");
    label.textContent = command.label;
    description.textContent = command.description;
    item.append(label, description);
    commandPaletteResultList.append(item);
  }
}

function closeCommandPalette(restoreFocus = true): void {
  if (!commandPaletteOpen) return;
  commandPaletteOpen = false;
  commandPalette.hidden = true;
  commandPaletteDialog.setAttribute("aria-hidden", "true");
  if (restoreFocus && commandPaletteReturnFocus?.isConnected) commandPaletteReturnFocus.focus();
  commandPaletteReturnFocus = null;
}

function openCommandPalette(): void {
  if (commandPaletteOpen) return;
  commandPaletteReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  commandPaletteOpen = true;
  commandPalette.hidden = false;
  commandPaletteDialog.setAttribute("aria-hidden", "false");
  commandPaletteSearch.value = "";
  commandPaletteRegexPattern.value = "";
  commandPaletteBinding?.setRegexMode(false, false);
  renderCommandPalette();
  commandPaletteSearch.focus();
}

function toggleCommandPalette(): void {
  if (commandPaletteOpen) closeCommandPalette();
  else openCommandPalette();
}

function executeCommandPaletteCommand(command: CommandPaletteCommand): void {
  closeCommandPalette(false);
  activateTab(command.tab);
  window.requestAnimationFrame(() => {
    const search = document.getElementById(command.searchId);
    if (!(search instanceof HTMLInputElement)) return;
    search.focus();
    if (command.openRegex) document.getElementById(command.regexToggleId)?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

function writeSaveState(message: string): void {
  saveState.textContent = message;
}

function settingsControls(): Array<HTMLInputElement | HTMLSelectElement> {
  return Array.from(document.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-universal-setting]"));
}

function renderSettingsSearch(): void {
  const matcher = createBoundedSearchMatcher(settingsRegexState);
  if (!matcher.ok) {
    settingsRegexStatus.textContent = matcher.reason;
  }
  for (const card of document.querySelectorAll<HTMLElement>("[data-settings-item]")) {
    const label = card.dataset.settingsLabel ?? "";
    const matches = matcher.ok && matcher.value(`${label} ${card.textContent ?? ""}`);
    const hiddenByFocusMode = universalSettings.schoolModeEnabled && ["Language mode", "English funny level", "Cantonese funny level", "Emoji dialogs"].includes(label);
    card.hidden = hiddenByFocusMode || !matches;
  }
  if (matcher.ok) {
    settingsRegexStatus.textContent = settingsRegexState.mode === "regex"
      ? settingsRegexState.pattern.length === 0
        ? "Regex mode is ready. Add a bounded pattern or choose a token."
        : "Pattern runs locally against this settings surface."
      : "Plain text search is active. Regex is an explicit local opt-in.";
  }
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
  const settingsBinding = bindAnchoredRegexBuilder({
    id: "settings",
    searchInput: settingsSearch,
    toggle: settingsRegexToggle,
    builder: settingsRegexBuilder,
    pattern: settingsRegexPattern,
    ignoreCase: settingsRegexIgnoreCase,
    status: settingsRegexStatus,
    onStateChange: (state) => {
      settingsRegexState = state;
      renderSettingsSearch();
    },
  });
  settingsRegexState = settingsBinding.getState();
  commandPaletteBinding = bindAnchoredRegexBuilder({
    id: "command-palette",
    searchInput: commandPaletteSearch,
    toggle: commandPaletteRegexToggle,
    builder: commandPaletteRegexBuilder,
    pattern: commandPaletteRegexPattern,
    ignoreCase: commandPaletteRegexIgnoreCase,
    status: commandPaletteRegexStatus,
    onStateChange: (state) => {
      commandPaletteRegexState = state;
      renderCommandPalette();
    },
  });
  commandPaletteRegexState = commandPaletteBinding.getState();
  notificationRegexBinding = bindAnchoredRegexBuilder({
    id: "desktop-notifications",
    searchInput: notificationSearch,
    toggle: notificationRegexToggle,
    builder: notificationRegexBuilder,
    pattern: notificationRegexPattern,
    ignoreCase: notificationRegexIgnoreCase,
    status: notificationRegexStatus,
    onStateChange: (state) => {
      notificationRegexState = state;
      notificationStatus = "";
      renderNotificationCenter();
    },
  });
  notificationRegexState = notificationRegexBinding.getState();
  renderSettingsSearch();
  renderCommandPalette();
  renderNotificationCenter();
  for (const control of settingsControls()) {
    control.addEventListener("input", () => handleUniversalSetting(control));
    control.addEventListener("change", () => handleUniversalSetting(control));
  }
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
    if (target === commandPalette) {
      closeCommandPalette();
      return;
    }
    if (target.closest<HTMLButtonElement>("[data-command-palette-close]")) {
      closeCommandPalette();
      return;
    }
    const snackbarReview = target.closest<HTMLButtonElement>("[data-snackbar-review]");
    if (snackbarReview?.dataset.snackbarReview) {
      reviewNotification(snackbarReview.dataset.snackbarReview);
      return;
    }
    const snackbarDismiss = target.closest<HTMLButtonElement>("[data-snackbar-dismiss]");
    if (snackbarDismiss?.dataset.snackbarDismiss) {
      dismissNotification(snackbarDismiss.dataset.snackbarDismiss);
      return;
    }
    const paletteItem = target.closest<HTMLButtonElement>("[data-command-palette-id]");
    if (paletteItem?.dataset.commandPaletteId) {
      const command = commandPaletteCommands.find((candidate) => candidate.id === paletteItem.dataset.commandPaletteId);
      if (command) executeCommandPaletteCommand(command);
      return;
    }
    const notificationViewButton = target.closest<HTMLButtonElement>("[data-notification-view]");
    if (notificationViewButton?.dataset.notificationView) {
      notificationView = notificationViewButton.dataset.notificationView as NotificationView;
      notificationStatus = "";
      renderNotificationCenter();
      return;
    }
    const notificationAction = target.closest<HTMLButtonElement>("[data-notification-action]")?.dataset.notificationAction;
    if (notificationAction === "select-all") {
      selectedNotificationIds = Array.from(new Set([...selectedNotificationIds, ...notificationSelectionTarget().map((record) => record.id)]));
      notificationStatus = `Selected ${notificationSelectionTarget().length} record${notificationSelectionTarget().length === 1 ? "" : "s"} in the ${notificationSelectScope === "view" ? "current-view" : "every-match"} scope.`;
      renderNotificationCenter();
      return;
    }
    if (notificationAction === "invert") {
      selectedNotificationIds = invertNotificationSelection(selectedNotificationIds, notificationSelectionTarget().map((record) => record.id));
      notificationStatus = "Notification selection inverted within the stated scope.";
      renderNotificationCenter();
      return;
    }
    if (notificationAction === "clear") {
      selectedNotificationIds = [];
      notificationStatus = "Notification selection cleared.";
      renderNotificationCenter();
      return;
    }
    if (notificationAction === "dismiss-selected") {
      dismissSelectedNotifications();
      return;
    }
    const notificationReview = target.closest<HTMLButtonElement>("[data-notification-review]");
    if (notificationReview?.dataset.notificationReview) {
      reviewNotification(notificationReview.dataset.notificationReview);
      return;
    }
    const notificationDismiss = target.closest<HTMLButtonElement>("[data-notification-dismiss]");
    if (notificationDismiss?.dataset.notificationDismiss) {
      dismissNotification(notificationDismiss.dataset.notificationDismiss);
      return;
    }
    const picker = target.closest<HTMLButtonElement>("[data-picker-kind]");
    if (picker) {
      void usePicker(picker);
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
  document.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.dataset.notificationSelect) {
      selectedNotificationIds = target.checked
        ? Array.from(new Set([...selectedNotificationIds, target.dataset.notificationSelect]))
        : selectedNotificationIds.filter((id) => id !== target.dataset.notificationSelect);
      notificationStatus = "";
      renderNotificationCenter();
      return;
    }
    if (target.dataset.notificationScope) {
      notificationSelectScope = target.value as NotificationSelectScope;
      notificationStatus = `Select-all scope set to ${notificationSelectScope === "view" ? "current view only" : "every matching record"}.`;
      renderNotificationCenter();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.shiftKey && event.key.toLocaleUpperCase() === "F") {
      event.preventDefault();
      event.stopPropagation();
      toggleCommandPalette();
      return;
    }
    if (event.key === "Escape" && commandPaletteOpen) {
      event.preventDefault();
      closeCommandPalette();
      return;
    }
    if (event.key === "Tab" && commandPaletteOpen) {
      const focusable = Array.from(commandPaletteDialog.querySelectorAll<HTMLElement>("button, input, [tabindex]"))
        .filter((element) => !element.hasAttribute("disabled") && !element.closest("[hidden]") && element.getAttribute("aria-hidden") !== "true");
      const first = focusable[0];
      const last = focusable.at(-1);
      if (first && last) {
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
      return;
    }
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
  loadNotificationCenter();
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
