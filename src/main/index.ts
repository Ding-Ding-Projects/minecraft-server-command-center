import { app, BrowserWindow, dialog, ipcMain, type OpenDialogOptions } from "electron";
import { join } from "node:path";
import type { JavaRuntimePickerKind, PickerKind } from "../shared/desktop-api";
import { loadCliCatalog } from "./cli-catalog";
import { buildArgvPreview } from "./argv-preview";
import { loadDraft, saveDraft } from "./draft-store";
import { loadUniversalSettings, saveUniversalSettings } from "./universal-settings-store";
import { JavaRuntimeController } from "./java-runtime-controller";
import { getUpdateBoundary } from "./update-boundary";
import {
  clearPersonalVocabulary,
  loadPersonalVocabulary,
  replacePersonalVocabulary,
} from "./personal-vocabulary-store";
import {
  applyPlannerHandoffToDraft,
  previewPlannerHandoff,
  type PlannerHandoffV1
} from "../shared/planner-handoff";
import { normalizeServerDraft } from "../shared/server-draft";
import { readSelectedPlannerHandoff } from "./planner-handoff-file";

const isSquirrelStartup = require("electron-squirrel-startup") as boolean;
let mainWindow: BrowserWindow | undefined;
let pendingPlannerHandoff: PlannerHandoffV1 | undefined;
const javaRuntimeController = new JavaRuntimeController();

function requireWindow(): BrowserWindow {
  if (!mainWindow || mainWindow.isDestroyed()) {
    throw new Error("The primary application window is not available.");
  }
  return mainWindow;
}

async function selectPath(kind: PickerKind): Promise<string | null> {
  const options: OpenDialogOptions = kind === "folder"
    ? {
        title: "Choose server folder",
        properties: ["openDirectory", "createDirectory"]
      }
    : kind === "jar"
      ? {
          title: "Choose server JAR",
          properties: ["openFile"],
          filters: [{ name: "Java archive", extensions: ["jar"] }]
        }
      : {
          title: "Choose configuration file",
          properties: ["openFile"],
          filters: [{ name: "Configuration files", extensions: ["properties", "yml", "yaml"] }]
        };

  const result = await dialog.showOpenDialog(requireWindow(), options);
  return result.canceled ? null : result.filePaths[0] ?? null;
}

async function choosePlannerHandoff() {
  const result = await dialog.showOpenDialog(requireWindow(), {
    title: "Choose planner handoff JSON",
    properties: ["openFile"],
    filters: [{ name: "Planner handoff JSON", extensions: ["json"] }]
  });
  if (result.canceled) return null;

  const selectedPath = result.filePaths[0];
  if (!selectedPath) return null;
  try {
    const handoff = await readSelectedPlannerHandoff(selectedPath);
    pendingPlannerHandoff = handoff;
    return previewPlannerHandoff(handoff);
  } catch {
    pendingPlannerHandoff = undefined;
    throw new Error("The selected JSON file is not a valid non-secret planner handoff v1.");
  }
}

async function choosePersonalVocabulary() {
  const result = await dialog.showOpenDialog(requireWindow(), {
    title: "Choose local personal vocabulary JSON",
    properties: ["openFile"],
    filters: [{ name: "Personal vocabulary JSON", extensions: ["json"] }]
  });
  if (result.canceled) return null;

  const selectedPath = result.filePaths[0];
  if (!selectedPath) return null;
  return replacePersonalVocabulary(app.getPath("userData"), selectedPath);
}

function normalizedJavaRuntimePickerKind(value: unknown): JavaRuntimePickerKind {
  return value === "folder" ? "folder" : "executable";
}

async function chooseJavaRuntime(kind: JavaRuntimePickerKind = "executable") {
  const options: OpenDialogOptions = kind === "folder"
    ? {
        title: "Choose Java home folder",
        properties: ["openDirectory"]
      }
    : {
        title: "Choose Java executable",
        properties: ["openFile"],
        filters: [{ name: "Java executable", extensions: ["exe"] }]
      };
  const result = await dialog.showOpenDialog(requireWindow(), options);
  const selectedPath = result.canceled ? null : result.filePaths[0] ?? null;
  return selectedPath ? javaRuntimeController.discoverFromNativeSelection(selectedPath) : null;
}

async function applyPendingPlannerHandoff(currentDraft: unknown): Promise<Awaited<ReturnType<typeof loadDraft>>> {
  if (!pendingPlannerHandoff) {
    throw new Error("Choose a valid planner handoff before applying it.");
  }
  const current = normalizeServerDraft(currentDraft);
  const applied = applyPlannerHandoffToDraft(pendingPlannerHandoff, current);
  const saved = await saveDraft(app.getPath("userData"), applied);
  pendingPlannerHandoff = undefined;
  return saved;
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 840,
    minHeight: 640,
    frame: false,
    backgroundColor: "#101412",
    show: false,
    webPreferences: {
      preload: join(__dirname, "..", "preload", "index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.once("ready-to-show", () => mainWindow?.show());
  void mainWindow.loadFile(join(__dirname, "..", "renderer", "index.html"));
  mainWindow.on("closed", () => {
    mainWindow = undefined;
  });
}

function registerIpc(): void {
  ipcMain.handle("settings:load", () => loadUniversalSettings(app.getPath("userData")));
  ipcMain.handle("settings:save", (_event, value: unknown) => saveUniversalSettings(app.getPath("userData"), value));
  ipcMain.handle("draft:load", () => loadDraft(app.getPath("userData")));
  ipcMain.handle("draft:save", (_event, value: unknown) => saveDraft(app.getPath("userData"), value));
  ipcMain.handle("handoff:choose", () => choosePlannerHandoff());
  ipcMain.handle("handoff:apply", (_event, currentDraft: unknown) => applyPendingPlannerHandoff(currentDraft));
  ipcMain.handle("handoff:clear", () => {
    pendingPlannerHandoff = undefined;
  });
  ipcMain.handle("picker:select", (_event, kind: PickerKind) => selectPath(kind));
  ipcMain.handle("personal-vocabulary:load", () => loadPersonalVocabulary(app.getPath("userData")));
  ipcMain.handle("personal-vocabulary:choose", () => choosePersonalVocabulary());
  ipcMain.handle("personal-vocabulary:clear", () => clearPersonalVocabulary(app.getPath("userData")));
  ipcMain.handle("runtime:discover", () => javaRuntimeController.discover());
  ipcMain.handle("runtime:choose", (_event, kind: unknown) => chooseJavaRuntime(normalizedJavaRuntimePickerKind(kind)));
  ipcMain.handle("runtime:select", (_event, candidateId: unknown) => javaRuntimeController.select(candidateId));
  ipcMain.handle("runtime:assess", (_event, value: unknown) => javaRuntimeController.assess(value));
  ipcMain.handle("runtime:clear", () => javaRuntimeController.clear());
  ipcMain.handle("catalog:get", () => loadCliCatalog());
  ipcMain.handle("preview:argv", (_event, value: unknown) => buildArgvPreview(value));
  ipcMain.handle("updater:status", () => getUpdateBoundary());
  ipcMain.handle("window:minimize", () => requireWindow().minimize());
  ipcMain.handle("window:toggle-maximize", () => {
    const window = requireWindow();
    if (window.isMaximized()) {
      window.unmaximize();
      return false;
    }
    window.maximize();
    return true;
  });
  ipcMain.handle("window:close", () => requireWindow().close());
  ipcMain.handle("window:is-maximized", () => requireWindow().isMaximized());
}

if (isSquirrelStartup) {
  app.quit();
} else {
  app.setAppUserModelId("com.minecraftservercommandcenter.desktop");
  registerIpc();

  app.whenReady().then(() => {
    createWindow();
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  }).catch((error: unknown) => {
    console.error("Unable to start the desktop shell.", error);
    app.quit();
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
