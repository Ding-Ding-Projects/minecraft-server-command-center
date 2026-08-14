import { contextBridge, ipcRenderer } from "electron";
import type { DesktopApi, JavaRuntimePickerKind, PickerKind } from "../shared/desktop-api";

const desktopApi: DesktopApi = {
  settings: {
    load: () => ipcRenderer.invoke("settings:load"),
    save: (value: unknown) => ipcRenderer.invoke("settings:save", value)
  },
  draft: {
    load: () => ipcRenderer.invoke("draft:load"),
    save: (value: unknown) => ipcRenderer.invoke("draft:save", value)
  },
  handoff: {
    choose: () => ipcRenderer.invoke("handoff:choose"),
    apply: (currentDraft: unknown) => ipcRenderer.invoke("handoff:apply", currentDraft),
    clear: () => ipcRenderer.invoke("handoff:clear")
  },
  picker: {
    select: (kind: PickerKind) => ipcRenderer.invoke("picker:select", kind)
  },
  personalVocabulary: {
    load: () => ipcRenderer.invoke("personal-vocabulary:load"),
    choose: () => ipcRenderer.invoke("personal-vocabulary:choose"),
    clear: () => ipcRenderer.invoke("personal-vocabulary:clear")
  },
  runtime: {
    discover: () => ipcRenderer.invoke("runtime:discover"),
    choose: (kind?: JavaRuntimePickerKind) => ipcRenderer.invoke("runtime:choose", kind ?? "executable"),
    select: (candidateId: string) => ipcRenderer.invoke("runtime:select", candidateId),
    assess: (value) => ipcRenderer.invoke("runtime:assess", value),
    clear: () => ipcRenderer.invoke("runtime:clear")
  },
  catalog: {
    get: () => ipcRenderer.invoke("catalog:get")
  },
  preview: {
    get: (value: unknown) => ipcRenderer.invoke("preview:argv", value)
  },
  updater: {
    get: () => ipcRenderer.invoke("updater:status")
  },
  window: {
    minimize: () => ipcRenderer.invoke("window:minimize"),
    toggleMaximize: () => ipcRenderer.invoke("window:toggle-maximize"),
    close: () => ipcRenderer.invoke("window:close"),
    isMaximized: () => ipcRenderer.invoke("window:is-maximized")
  }
};

contextBridge.exposeInMainWorld("commandCenter", desktopApi);

