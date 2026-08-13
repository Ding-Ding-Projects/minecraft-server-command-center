import "./styles.css";
import type { ArgvPreview, CliCatalogProjection, PickerKind } from "../shared/desktop-api";
import {
  DEFAULT_SERVER_DRAFT,
  describeJavaRuntime,
  normalizeServerDraft,
  type ServerDraft
} from "../shared/server-draft";

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

if (!form || !saveState || !snackbar || !argvPreview || !catalogGrid || !catalogSource || !workspaceTitle || !workspaceSubtitle || !updateState || !copyArgvButton) {
  throw new Error("The desktop renderer is missing a required foundation element.");
}

let draft: ServerDraft = DEFAULT_SERVER_DRAFT;
let activeTab = "overview";
let saveTimer: number | undefined;
let snackTimer: number | undefined;
let saveVersion = 0;
let currentArgvTokens: readonly string[] = [];

const tabCopy: Record<string, readonly [string, string]> = {
  overview: ["Create a bounded setup draft", "Choose meaningful values through controls. This foundation never turns them into a shell command."],
  runtime: ["Plan a Java runtime", "Choose resource boundaries and acknowledgement state before a future safety route exists."],
  world: ["Describe a world", "Record world intent without writing server files or touching a Minecraft save."],
  access: ["Set access intent", "Keep network and RCON planning visible without opening a port or remote console."],
  paths: ["Choose local paths", "Native file and folder pickers supply direct values without a generic command field."],
  preview: ["Inspect direct tokens", "The preview is an argument vector, not a command line, and it cannot be launched here."],
  catalog: ["Review supported CLI categories", "Mapped and unavailable entries stay visible so no arbitrary argument escape hatch is needed."]
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
  form.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;
    if (!target.dataset.field) return;
    draft = draftFromControl(target);
    hydrateForm();
    void renderArgv();
    updateLaunchBoundary();
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
    const tab = target.closest<HTMLButtonElement>("[data-tab]");
    if (tab?.dataset.tab) {
      activateTab(tab.dataset.tab, true);
      return;
    }
    const reset = target.closest<HTMLButtonElement>("#reset-draft");
    if (reset) {
      draft = DEFAULT_SERVER_DRAFT;
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
