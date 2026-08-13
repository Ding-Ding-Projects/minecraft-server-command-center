import { app, BrowserWindow, dialog, ipcMain, type OpenDialogOptions } from "electron";
import { join } from "node:path";
import type { PickerKind } from "../shared/desktop-api";
import { loadCliCatalog } from "./cli-catalog";
import { buildArgvPreview } from "./argv-preview";
import { loadDraft, saveDraft } from "./draft-store";
import { getUpdateBoundary } from "./update-boundary";
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
      : kind === "java"
        ? {
            title: "Choose Java executable",
            properties: ["openFile"],
            filters: [{ name: "Executable files", extensions: ["exe", "cmd", "bat"] }]
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
  ipcMain.handle("draft:load", () => loadDraft(app.getPath("userData")));
  ipcMain.handle("draft:save", (_event, value: unknown) => saveDraft(app.getPath("userData"), value));
  ipcMain.handle("handoff:choose", () => choosePlannerHandoff());
  ipcMain.handle("handoff:apply", (_event, currentDraft: unknown) => applyPendingPlannerHandoff(currentDraft));
  ipcMain.handle("handoff:clear", () => {
    pendingPlannerHandoff = undefined;
  });
  ipcMain.handle("picker:select", (_event, kind: PickerKind) => selectPath(kind));
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
