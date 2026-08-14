import { randomUUID } from "node:crypto";
import { mkdir, open, rename, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  parsePersonalVocabularyJson,
  PERSONAL_VOCABULARY_LIMITS,
  type PersonalVocabularyEntryV1,
} from "../shared/universal-contracts.ts";
import type { PersonalVocabularyState } from "../shared/desktop-api.ts";

export const PERSONAL_VOCABULARY_CACHE_FILENAME = "personal-vocabulary.v1.json";

const EMPTY_STATE: PersonalVocabularyState = {
  status: "empty",
  entryCount: 0,
  entries: [],
};

function cachePath(userDataDirectory: string): string {
  return join(userDataDirectory, PERSONAL_VOCABULARY_CACHE_FILENAME);
}

function stateFromEntries(entries: readonly PersonalVocabularyEntryV1[]): PersonalVocabularyState {
  return {
    status: "loaded",
    entryCount: entries.length,
    entries,
  };
}

async function readBoundedUtf8(filePath: string): Promise<string> {
  const handle = await open(filePath, "r");
  try {
    const buffer = Buffer.alloc(PERSONAL_VOCABULARY_LIMITS.maxBytes + 1);
    let bytesRead = 0;
    while (bytesRead < buffer.length) {
      const result = await handle.read(buffer, bytesRead, buffer.length - bytesRead, bytesRead);
      if (result.bytesRead === 0) break;
      bytesRead += result.bytesRead;
    }
    if (bytesRead <= 0 || bytesRead > PERSONAL_VOCABULARY_LIMITS.maxBytes) {
      throw new Error("The vocabulary file is empty or exceeds the 64 KiB limit.");
    }
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer.subarray(0, bytesRead));
  } finally {
    await handle.close().catch(() => undefined);
  }
}

async function readValidatedFile(filePath: string): Promise<PersonalVocabularyState> {
  const text = await readBoundedUtf8(filePath);
  const parsed = parsePersonalVocabularyJson(text);
  if (!parsed.ok) throw new Error(parsed.reason);
  return stateFromEntries(parsed.value.entries);
}

export async function loadPersonalVocabulary(userDataDirectory: string): Promise<PersonalVocabularyState> {
  const target = cachePath(userDataDirectory);
  try {
    return await readValidatedFile(target);
  } catch {
    await unlink(target).catch(() => undefined);
    return EMPTY_STATE;
  }
}

export async function replacePersonalVocabulary(
  userDataDirectory: string,
  sourcePath: string,
): Promise<PersonalVocabularyState> {
  let next: PersonalVocabularyState;
  try {
    next = await readValidatedFile(sourcePath);
  } catch {
    throw new Error("The selected vocabulary file was rejected before it could change the active cache.");
  }

  await mkdir(userDataDirectory, { recursive: true });
  const target = cachePath(userDataDirectory);
  const temporary = `${target}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, JSON.stringify({ schemaVersion: 1, entries: next.entries }, null, 2) + "\n", {
      encoding: "utf8",
      mode: 0o600,
    });
    await rename(temporary, target);
  } catch {
    await unlink(temporary).catch(() => undefined);
    throw new Error("The local vocabulary cache could not be updated.");
  }
  return next;
}

export async function clearPersonalVocabulary(userDataDirectory: string): Promise<PersonalVocabularyState> {
  try {
    await unlink(cachePath(userDataDirectory));
  } catch (error: unknown) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") {
      throw new Error("The local vocabulary cache could not be removed.");
    }
  }
  return EMPTY_STATE;
}
