import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { normalizeServerDraft, type ServerDraft } from "../shared/server-draft";

const DRAFT_FILENAME = "server-draft.v1.json";

function draftPath(userDataDirectory: string): string {
  return join(userDataDirectory, DRAFT_FILENAME);
}

export async function loadDraft(userDataDirectory: string): Promise<ServerDraft> {
  try {
    const raw = await readFile(draftPath(userDataDirectory), "utf8");
    return normalizeServerDraft(JSON.parse(raw) as unknown);
  } catch {
    return normalizeServerDraft(undefined);
  }
}

export async function saveDraft(userDataDirectory: string, value: unknown): Promise<ServerDraft> {
  const normalized = normalizeServerDraft(value);
  await mkdir(userDataDirectory, { recursive: true });
  const target = draftPath(userDataDirectory);
  const temporary = target + "." + process.pid + ".tmp";
  await writeFile(temporary, JSON.stringify(normalized, null, 2) + "\n", {
    encoding: "utf8",
    mode: 0o600
  });
  await rename(temporary, target);
  return normalized;
}

