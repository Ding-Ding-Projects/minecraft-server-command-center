import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { normalizeUniversalSettings, parseUniversalSettings, type UniversalSettingsV1 } from "../shared/universal-contracts";

const SETTINGS_FILENAME = "universal-settings.v1.json";

function settingsPath(userDataDirectory: string): string {
  return join(userDataDirectory, SETTINGS_FILENAME);
}

export async function loadUniversalSettings(userDataDirectory: string): Promise<UniversalSettingsV1> {
  try {
    const raw = await readFile(settingsPath(userDataDirectory), "utf8");
    const parsed = parseUniversalSettings(JSON.parse(raw) as unknown);
    return parsed.ok ? parsed.value : normalizeUniversalSettings(undefined);
  } catch {
    return normalizeUniversalSettings(undefined);
  }
}

export async function saveUniversalSettings(userDataDirectory: string, value: unknown): Promise<UniversalSettingsV1> {
  const parsed = parseUniversalSettings(value);
  if (!parsed.ok) throw new Error(parsed.reason);
  const normalized = parsed.value;
  await mkdir(userDataDirectory, { recursive: true });
  const target = settingsPath(userDataDirectory);
  const temporary = `${target}.${process.pid}.tmp`;
  await writeFile(temporary, JSON.stringify(normalized, null, 2) + "\n", { encoding: "utf8", mode: 0o600 });
  await rename(temporary, target);
  return normalized;
}
