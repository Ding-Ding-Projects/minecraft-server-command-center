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

type VocabularyReadFailureKind = "missing" | "corrupt" | "unavailable";

type CacheSnapshot = {
  readonly size: number;
  readonly bytes: Buffer;
};

const vocabularyLocks = new Map<string, Promise<void>>();

class VocabularyReadError extends Error {
  readonly kind: VocabularyReadFailureKind;
  readonly snapshot?: CacheSnapshot;

  constructor(kind: VocabularyReadFailureKind, message: string, cause?: unknown, snapshot?: CacheSnapshot) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "VocabularyReadError";
    this.kind = kind;
    this.snapshot = snapshot;
  }
}

function errorCode(error: unknown): string | undefined {
  return error && typeof error === "object" && "code" in error && typeof error.code === "string"
    ? error.code
    : undefined;
}

function cachePath(userDataDirectory: string): string {
  return join(userDataDirectory, PERSONAL_VOCABULARY_CACHE_FILENAME);
}

async function withVocabularyLock<T>(userDataDirectory: string, operation: () => Promise<T>): Promise<T> {
  const previous = vocabularyLocks.get(userDataDirectory) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  vocabularyLocks.set(userDataDirectory, current);
  await previous;
  try {
    return await operation();
  } finally {
    release();
    if (vocabularyLocks.get(userDataDirectory) === current) vocabularyLocks.delete(userDataDirectory);
  }
}

function stateFromEntries(entries: readonly PersonalVocabularyEntryV1[]): PersonalVocabularyState {
  return {
    status: "loaded",
    entryCount: entries.length,
    entries,
  };
}

async function readBoundedUtf8(filePath: string): Promise<{ readonly text: string; readonly snapshot: CacheSnapshot }> {
  let handle;
  try {
    handle = await open(filePath, "r");
  } catch (error) {
    throw new VocabularyReadError(
      errorCode(error) === "ENOENT" ? "missing" : "unavailable",
      errorCode(error) === "ENOENT" ? "The local vocabulary cache is not present." : "The local vocabulary cache could not be opened.",
      error,
    );
  }
  try {
    const buffer = Buffer.alloc(PERSONAL_VOCABULARY_LIMITS.maxBytes + 1);
    let bytesRead = 0;
    while (bytesRead < buffer.length) {
      let result;
      try {
        result = await handle.read(buffer, bytesRead, buffer.length - bytesRead, bytesRead);
      } catch (error) {
        throw new VocabularyReadError("unavailable", "The local vocabulary cache could not be read.", error);
      }
      if (result.bytesRead === 0) break;
      bytesRead += result.bytesRead;
    }
    const snapshot: CacheSnapshot = {
      size: Number((await handle.stat()).size),
      bytes: Buffer.from(buffer.subarray(0, bytesRead)),
    };
    if (bytesRead <= 0 || bytesRead > PERSONAL_VOCABULARY_LIMITS.maxBytes) {
      throw new VocabularyReadError("corrupt", "The vocabulary file is empty or exceeds the 64 KiB limit.", undefined, snapshot);
    }
    try {
      return {
        text: new TextDecoder("utf-8", { fatal: true }).decode(buffer.subarray(0, bytesRead)),
        snapshot,
      };
    } catch (error) {
      throw new VocabularyReadError("corrupt", "The vocabulary cache is not valid UTF-8.", error, snapshot);
    }
  } finally {
    await handle.close().catch(() => undefined);
  }
}

async function readValidatedFile(filePath: string): Promise<PersonalVocabularyState> {
  const result = await readBoundedUtf8(filePath);
  const parsed = parsePersonalVocabularyJson(result.text);
  if (!parsed.ok) throw new VocabularyReadError("corrupt", parsed.reason, undefined, result.snapshot);
  return stateFromEntries(parsed.value.entries);
}

async function readCacheSnapshot(filePath: string): Promise<CacheSnapshot | undefined> {
  try {
    return (await readBoundedUtf8(filePath)).snapshot;
  } catch (error) {
    return error instanceof VocabularyReadError ? error.snapshot : undefined;
  }
}

function sameCacheSnapshot(left: CacheSnapshot | undefined, right: CacheSnapshot | undefined): boolean {
  return left !== undefined
    && right !== undefined
    && left.size === right.size
    && left.bytes.equals(right.bytes);
}

async function removeMalformedCacheIfUnchanged(filePath: string, expected?: CacheSnapshot): Promise<void> {
  if (expected === undefined) return;
  const current = await readCacheSnapshot(filePath);
  if (!sameCacheSnapshot(expected, current)) return;
  await unlink(filePath);
}

export async function loadPersonalVocabulary(
  userDataDirectory: string,
  options: { readonly removeMalformedCache?: (filePath: string, expected?: CacheSnapshot) => Promise<void> } = {},
): Promise<PersonalVocabularyState> {
  return withVocabularyLock(userDataDirectory, async () => {
    const target = cachePath(userDataDirectory);
    const removeMalformedCache = options.removeMalformedCache ?? removeMalformedCacheIfUnchanged;
    try {
      return await readValidatedFile(target);
    } catch (error) {
      if (!(error instanceof VocabularyReadError)) {
        throw new Error("The local vocabulary cache could not be read; the previous valid cache remains active.", { cause: error });
      }
      if (error.kind === "missing") return EMPTY_STATE;
      if (error.kind === "unavailable") {
        throw new Error("The local vocabulary cache could not be read; the previous valid cache remains active.", { cause: error });
      }
      try {
        await removeMalformedCache(target, error.snapshot);
      } catch (removeError) {
        if (errorCode(removeError) !== "ENOENT") {
          return {
            ...EMPTY_STATE,
            recovery: "malformed-cache-removal-failed",
          };
        }
      }
      try {
        return await readValidatedFile(target);
      } catch (afterRecoveryError) {
        if (afterRecoveryError instanceof VocabularyReadError && afterRecoveryError.kind === "missing") return EMPTY_STATE;
        if (afterRecoveryError instanceof VocabularyReadError && afterRecoveryError.kind === "unavailable") {
          throw new Error("The local vocabulary cache could not be read; the previous valid cache remains active.", { cause: afterRecoveryError });
        }
        return { ...EMPTY_STATE, recovery: "malformed-cache-removal-failed" };
      }
    }
  });
}

export async function replacePersonalVocabulary(
  userDataDirectory: string,
  sourcePath: string,
): Promise<PersonalVocabularyState> {
  return withVocabularyLock(userDataDirectory, async () => {
    let next: PersonalVocabularyState;
    try {
      next = await readValidatedFile(sourcePath);
    } catch {
      throw new Error("The selected vocabulary file was rejected before it could change the active cache.");
    }

    const target = cachePath(userDataDirectory);
    const temporary = `${target}.${process.pid}.${randomUUID()}.tmp`;
    try {
      await mkdir(userDataDirectory, { recursive: true });
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
  });
}

export async function clearPersonalVocabulary(userDataDirectory: string): Promise<PersonalVocabularyState> {
  return withVocabularyLock(userDataDirectory, async () => {
    try {
      await unlink(cachePath(userDataDirectory));
    } catch (error: unknown) {
      if (errorCode(error) !== "ENOENT") {
        throw new Error("The local vocabulary cache could not be removed.");
      }
    }
    return EMPTY_STATE;
  });
}
