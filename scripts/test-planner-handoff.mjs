import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  PLANNER_HANDOFF_MAX_BYTES,
  PLANNER_HANDOFF_SCHEMA,
  PLANNER_HANDOFF_VERSION,
  PlannerHandoffValidationError,
  applyPlannerHandoffToDraft,
  createPlannerHandoff,
  parsePlannerHandoffJson,
  previewPlannerHandoff,
} from "../src/shared/planner-handoff.ts";
import { DEFAULT_SERVER_DRAFT, normalizeServerDraft } from "../src/shared/server-draft.ts";
import { readSelectedPlannerHandoff } from "../src/main/planner-handoff-file.ts";

const repositoryRoot = path.resolve(process.cwd());
const readText = async (filePath) => (await readFile(path.resolve(repositoryRoot, filePath), "utf8")).replace(/\r\n/g, "\n");
const fileChecks = new Map();

function record(filePath) {
  fileChecks.set(filePath, (fileChecks.get(filePath) ?? 0) + 1);
}

function check(filePath, assertion) {
  assertion();
  record(filePath);
}

function reject(filePath, operation, message) {
  assert.throws(operation, (error) => error instanceof PlannerHandoffValidationError, message);
  record(filePath);
}

const requiredMarkers = [
  ["src/shared/planner-handoff.ts", "function assertNoDuplicateJsonKeys("],
  ["src/shared/planner-handoff.ts", "export function parsePlannerHandoffJson("],
  ["src/shared/planner-handoff.ts", "export function previewPlannerHandoff("],
  ["src/shared/planner-handoff.ts", "export function applyPlannerHandoffToDraft("],
  ["src/main/planner-handoff-file.ts", "export async function readSelectedPlannerHandoff("],
  ["src/main/index.ts", 'ipcMain.handle("handoff:choose"'],
  ["src/main/index.ts", 'ipcMain.handle("handoff:apply"'],
  ["src/preload/index.ts", "handoff: {"],
  ["src/renderer/index.html", 'id="choose-planner-handoff"'],
  ["src/renderer/index.html", 'id="save-planner-handoff"'],
  ["src/renderer/index.html", "Normalized v1 planner handoff preview"],
  ["src/renderer/main.ts", "async function savePlannerHandoff(): Promise<void>"],
  ["src/renderer/main.ts", "window.commandCenter.handoff.apply(draft)"],
  ["site/app/page.tsx", "const exportPlannerHandoff = () => {"],
  ["site/app/page.tsx", "const selectPlannerHandoff = async"],
  ["site/app/page.tsx", "const saveImportedPlannerHandoff = () => {"],
  ["site/app/page.tsx", "Normalized v1 planner handoff preview"],
];

const sources = new Map();
for (const [filePath] of requiredMarkers) {
  if (!sources.has(filePath)) sources.set(filePath, await readText(filePath));
}

function assertSourceContract(currentSources) {
  for (const [filePath, marker] of requiredMarkers) {
    assert.ok(currentSources.get(filePath)?.includes(marker), `missing planner handoff marker: ${filePath} :: ${marker}`);
    record(filePath);
  }
}

assertSourceContract(sources);
for (const [filePath, marker] of requiredMarkers) {
  const removed = new Map(sources);
  removed.set(filePath, removed.get(filePath).replace(marker, ""));
  assert.throws(
    () => assertSourceContract(removed),
    /missing planner handoff marker/,
    `negative regression stayed green after removing ${filePath} :: ${marker}`,
  );
  record(filePath);
}

const plan = {
  serverName: "Planning Lab",
  serverKind: "paper",
  minecraftVersion: "1.21.4",
  javaRuntime: "java-21",
  memoryMiB: 4096,
  worldName: "creative-lab",
  eulaAcknowledged: true,
  onlineMode: true,
  port: 25565,
  rconEnabled: true,
  rconPort: 25575,
};
const handoff = createPlannerHandoff(plan);
const json = `${JSON.stringify(handoff)}\n`;

check("src/shared/planner-handoff.ts", () => {
  assert.equal(handoff.schema, PLANNER_HANDOFF_SCHEMA);
  assert.equal(handoff.version, PLANNER_HANDOFF_VERSION);
  assert.deepEqual(parsePlannerHandoffJson(json), handoff);
});
check("src/shared/planner-handoff.ts", () => {
  assert.deepEqual(Object.keys(previewPlannerHandoff(handoff)).sort(), [
    "eulaAcknowledged",
    "javaRuntime",
    "memoryMiB",
    "minecraftVersion",
    "onlineMode",
    "plan",
    "port",
    "rconEnabled",
    "rconPort",
    "schema",
    "serverKind",
    "serverName",
    "version",
    "worldName",
  ].sort().filter((key) => key !== "plan"));
  assert.equal(JSON.stringify(previewPlannerHandoff(handoff)).includes("serverRoot"), false);
});

reject("src/shared/planner-handoff.ts", () => parsePlannerHandoffJson("{"), "malformed JSON must be rejected");
reject("src/shared/planner-handoff.ts", () => parsePlannerHandoffJson(JSON.stringify({ ...handoff, version: 2 })), "unsupported versions must be rejected");
reject("src/shared/planner-handoff.ts", () => parsePlannerHandoffJson(JSON.stringify({
  ...handoff,
  plan: { ...plan, rconPassword: "credential-value-fixture" },
})), "secret-shaped unknown fields must be rejected");
reject("src/shared/planner-handoff.ts", () => parsePlannerHandoffJson(`{"schema":"${PLANNER_HANDOFF_SCHEMA}","schema":"${PLANNER_HANDOFF_SCHEMA}","version":1,"plan":${JSON.stringify(plan)}}`), "duplicate keys must be rejected");
reject("src/shared/planner-handoff.ts", () => parsePlannerHandoffJson("x".repeat(PLANNER_HANDOFF_MAX_BYTES + 1)), "oversized payloads must be rejected");
reject("src/shared/planner-handoff.ts", () => parsePlannerHandoffJson(JSON.stringify({ ...handoff, plan: { ...plan, serverName: "https://private.example" } })), "URLs must be rejected");
reject("src/shared/planner-handoff.ts", () => parsePlannerHandoffJson(JSON.stringify({ ...handoff, plan: { ...plan, serverName: "C:\\\\private\\\\server" } })), "paths must be rejected");
reject("src/shared/planner-handoff.ts", () => parsePlannerHandoffJson(JSON.stringify({ ...handoff, plan: { ...plan, port: plan.rconPort } })), "ambiguous port relationships must be rejected");

const localDraft = normalizeServerDraft({
  ...DEFAULT_SERVER_DRAFT,
  serverRoot: "C:\\Local\\Server",
  serverJar: "custom-server.jar",
  seed: "local-seed",
  commandsSettingsPath: "custom-commands.yml",
});
const savedDraft = applyPlannerHandoffToDraft(handoff, localDraft);
check("src/shared/planner-handoff.ts", () => {
  assert.equal(savedDraft.serverName, plan.serverName);
  assert.equal(savedDraft.minecraftVersion, plan.minecraftVersion);
  assert.equal(savedDraft.memoryInitialMiB, plan.memoryMiB);
  assert.equal(savedDraft.memoryMaximumMiB, plan.memoryMiB);
  assert.equal(savedDraft.serverRoot, localDraft.serverRoot);
  assert.equal(savedDraft.serverJar, localDraft.serverJar);
  assert.equal(savedDraft.seed, localDraft.seed);
  assert.equal(savedDraft.commandsSettingsPath, localDraft.commandsSettingsPath);
});

const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "planner-handoff-v1-"));
try {
  const validPath = path.join(temporaryDirectory, "valid.json");
  await writeFile(validPath, json, "utf8");
  const selected = await readSelectedPlannerHandoff(validPath);
  check("src/main/planner-handoff-file.ts", () => assert.deepEqual(selected, handoff));

  const malformedPath = path.join(temporaryDirectory, "malformed.json");
  await writeFile(malformedPath, "{", "utf8");
  await assert.rejects(() => readSelectedPlannerHandoff(malformedPath), (error) => error instanceof PlannerHandoffValidationError, "selected malformed files must be rejected");
  record("src/main/planner-handoff-file.ts");

  const secretPath = path.join(temporaryDirectory, "secret.json");
  await writeFile(secretPath, JSON.stringify({ ...handoff, plan: { ...plan, rconPassword: "credential-value-fixture" } }), "utf8");
  await assert.rejects(() => readSelectedPlannerHandoff(secretPath), (error) => error instanceof PlannerHandoffValidationError, "selected secret-shaped files must be rejected");
  record("src/main/planner-handoff-file.ts");

  const oversizedPath = path.join(temporaryDirectory, "oversized.json");
  await writeFile(oversizedPath, Buffer.alloc(PLANNER_HANDOFF_MAX_BYTES + 1, 0x20));
  await assert.rejects(() => readSelectedPlannerHandoff(oversizedPath), (error) => error instanceof PlannerHandoffValidationError, "selected oversized files must be rejected before parsing");
  record("src/main/planner-handoff-file.ts");
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}

const totalChecks = [...fileChecks.values()].reduce((sum, count) => sum + count, 0);
console.log(`PASS: Planner Handoff v1 strict validation, normalized preview, explicit local save boundary, and ${totalChecks} focused assertions`);
for (const [filePath, count] of fileChecks) console.log(`TEST_COUNT ${filePath} ${count}`);
