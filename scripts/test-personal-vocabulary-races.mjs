import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createVersionedDebouncedSave } from "../src/shared/versioned-debounced-save.ts";
import { projectPersonalVocabularyRecovery } from "../src/shared/personal-vocabulary-recovery.ts";

const repositoryRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));

function createFakeTimers() {
  const pending = [];
  return {
    api: {
      set(callback) {
        const entry = { callback, cancelled: false };
        pending.push(entry);
        return entry;
      },
      clear(entry) {
        entry.cancelled = true;
      },
    },
    flush() {
      const next = pending.splice(0);
      for (const entry of next) {
        if (!entry.cancelled) entry.callback();
      }
    },
  };
}

async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
}

const timers = createFakeTimers();
const resolvers = [];
const saved = [];
const errors = [];
const scheduler = createVersionedDebouncedSave(
  (value) => new Promise((resolve) => resolvers.push({ value, resolve })),
  (value) => saved.push(value),
  (error) => errors.push(error),
  350,
  timers.api,
);
scheduler.schedule("old");
timers.flush();
assert.equal(resolvers.length, 1, "the first scheduled save must start after the timer flush");
scheduler.schedule("new");
resolvers[0].resolve("OLD RESULT");
await flushMicrotasks();
assert.deepEqual(saved, [], "a save that resolves during the newer debounce window must not restore stale state");
timers.flush();
assert.equal(resolvers.length, 2, "the replacement save must start after the second timer flush");
resolvers[1].resolve("NEW RESULT");
await flushMicrotasks();
assert.deepEqual(saved, ["NEW RESULT"], "the latest save result must be the only result applied");
assert.deepEqual(errors, [], "the versioned save probe must not report an unexpected error");

const staleErrorTimers = createFakeTimers();
const staleErrorResolvers = [];
const staleErrors = [];
const staleErrorScheduler = createVersionedDebouncedSave(
  (value) => new Promise((resolve, reject) => staleErrorResolvers.push({ value, resolve, reject })),
  () => undefined,
  (error) => staleErrors.push(error),
  350,
  staleErrorTimers.api,
);
staleErrorScheduler.schedule("old");
staleErrorTimers.flush();
staleErrorScheduler.schedule("new");
staleErrorResolvers[0].reject(new Error("stale failure"));
await flushMicrotasks();
assert.deepEqual(staleErrors, [], "a stale save rejection must not report a false current-save failure");

const recovery = projectPersonalVocabularyRecovery({
  status: "empty",
  entryCount: 0,
  recovery: "malformed-cache-removal-failed",
});
assert.deepEqual(
  recovery,
  { status: "empty", entryCount: 0, retryAvailable: true },
  "malformed-cache cleanup failure must expose a direct retry projection",
);
assert.deepEqual(
  projectPersonalVocabularyRecovery({ status: "empty", entryCount: 0 }),
  { status: "empty", entryCount: 0, retryAvailable: false },
  "a clean empty state must not expose a retry action",
);

async function runMutatedModule(source, probe, label) {
  const temporaryRoot = await mkdtemp(join(tmpdir(), `personal-vocabulary-race-${label}-`));
  try {
    const modulePath = join(temporaryRoot, `${label}.ts`);
    const probePath = join(temporaryRoot, "probe.mjs");
    await writeFile(modulePath, source, "utf8");
    await writeFile(probePath, probe.replaceAll("MODULE_PATH", modulePath.replaceAll("\\", "/")), "utf8");
    return spawnSync(process.execPath, ["--experimental-strip-types", probePath], { encoding: "utf8" });
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

const schedulerSource = await readFile(join(repositoryRoot, "src/shared/versioned-debounced-save.ts"), "utf8");
const schedulerProbe = `
import assert from "node:assert/strict";
import { createVersionedDebouncedSave } from "file:///MODULE_PATH";
const pending = [];
const resolvers = [];
const saved = [];
const scheduler = createVersionedDebouncedSave(
  (value) => new Promise((resolve) => resolvers.push({ value, resolve })),
  (value) => saved.push(value),
  () => process.exit(2),
  0,
  { set: (callback) => { const entry = { callback, cancelled: false }; pending.push(entry); return entry; }, clear: (entry) => { entry.cancelled = true; } },
);
scheduler.schedule("old");
for (const entry of pending.splice(0)) if (!entry.cancelled) entry.callback();
scheduler.schedule("new");
resolvers[0].resolve("OLD RESULT");
await Promise.resolve();
await Promise.resolve();
assert.deepEqual(saved, []);
for (const entry of pending.splice(0)) if (!entry.cancelled) entry.callback();
resolvers[1].resolve("NEW RESULT");
await Promise.resolve();
await Promise.resolve();
assert.deepEqual(saved, ["NEW RESULT"]);
`;
const schedulerMutation = schedulerSource.replace(
  "const requestedVersion = ++version;",
  "const requestedVersion = version;",
);
assert.notEqual(schedulerMutation, schedulerSource, "the scheduler negative mutation must change executable versioning");
const schedulerMutationResult = await runMutatedModule(schedulerMutation, schedulerProbe, "scheduler-mutant");
assert.notEqual(
  schedulerMutationResult.status,
  0,
  "the versioned-save guard must turn red when schedule-time invalidation is removed",
);

const recoverySource = await readFile(join(repositoryRoot, "src/shared/personal-vocabulary-recovery.ts"), "utf8");
const recoveryProbe = `
import assert from "node:assert/strict";
import { projectPersonalVocabularyRecovery } from "file:///MODULE_PATH";
assert.equal(projectPersonalVocabularyRecovery({ status: "empty", entryCount: 0, recovery: "malformed-cache-removal-failed" }).retryAvailable, true);
`;
const recoveryMutation = recoverySource.replace(
  'return { status: "empty", entryCount: 0, retryAvailable: true };',
  'return { status: "empty", entryCount: 0, retryAvailable: false };',
);
assert.notEqual(recoveryMutation, recoverySource, "the recovery negative mutation must change executable retry state");
const recoveryMutationResult = await runMutatedModule(recoveryMutation, recoveryProbe, "recovery-mutant");
assert.notEqual(
  recoveryMutationResult.status,
  0,
  "the recovery guard must turn red when the direct retry state is disabled",
);

console.log("PASS: stale-save invalidation, retry projection, and executable negative regressions");
