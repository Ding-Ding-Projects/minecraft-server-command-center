import { contextBridge, ipcRenderer } from "electron";
import type { DesktopApi, PickerKind } from "../shared/desktop-api";

const desktopApi: DesktopApi = {
  draft: {
    load: () => ipcRenderer.invoke("draft:load"),
    save: (value: unknown) => ipcRenderer.invoke("draft:save", value)
  },
  picker: {
    select: (kind: PickerKind) => ipcRenderer.invoke("picker:select", kind)
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

