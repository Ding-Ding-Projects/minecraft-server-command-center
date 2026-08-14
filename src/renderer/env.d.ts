import type { DesktopApi } from "../shared/desktop-api";

declare global {
  interface Window {
    commandCenter: DesktopApi;
  }
}

declare module "*.md?raw" {
  const markdown: string;
  export default markdown;
}

export {};

