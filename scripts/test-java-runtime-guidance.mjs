import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { mkdtemp, mkdir, readFile, rm, writeFile, chmod } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";

const repoRoot = resolve(process.cwd());
const require = createRequire(import.meta.url);
const childProcess = require("node:child_process");
const managerPath = resolve(repoRoot, "src/main/java-runtime-manager.cjs");

async function readText(relativePath) {
  return (await readFile(resolve(repoRoot, relativePath), "utf8")).replace(/\r\n/g, "\n");
}

function requireMarkers(source, markers, label) {
  for (const marker of markers) {
    assert.ok(source.includes(marker), `missing ${label} marker: ${marker}`);
  }
}

function verifyNegativeRegression(source, markers, label) {
  for (const marker of markers) {
    const removed = source.replace(marker, "");
    assert.throws(
      () => requireMarkers(removed, markers, label),
      `negative regression stayed green after removing ${label} marker: ${marker}`,
    );
  }
}

const managerSource = await readText("src/main/java-runtime-manager.cjs");
const controllerSource = await readText("src/main/java-runtime-controller.ts");
const mainSource = await readText("src/main/index.ts");
const preloadSource = await readText("src/preload/index.ts");
const sharedSource = await readText("src/shared/desktop-api.ts");
const rendererSource = await readText("src/renderer/main.ts");
const htmlSource = await readText("src/renderer/index.html");

const managerMarkers = [
  "async function inspectExecutable(executablePath, platform)",
  "metadata: candidate.metadata",
  "spawn(executablePath, ['-version']",
  "shell: false",
  "pathSearchUsed: false",
  "recursiveSearchUsed: false",
  "function createJavaSetupPlan",
  "status: 'review-required',\n    executionState: 'not-executed',\n    mutationState: 'no-system-state-changed',\n    requiresExplicitUserIntent: true,\n    installationMayRunAutomatically: false,",
];
const rendererMarkers = [
  'id="choose-java-folder"',
  "function formatJavaCandidateMetadata(candidate: JavaRuntimeCandidateSummary)",
  "javaRuntimeSetupPlanRoutes",
  "runtime.choose(kind)",
  "assessJavaRuntimeButton.disabled = busy;",
  "Assessing the Paper target without a selected runtime…",
];
const bridgeMarkers = [
  'properties: ["openDirectory"]',
  "normalizedJavaRuntimePickerKind",
  'ipcRenderer.invoke("runtime:choose", kind ?? "executable")',
  "JavaRuntimePickerKind",
];

requireMarkers(managerSource, managerMarkers, "Java runtime manager");
requireMarkers(controllerSource, ["metadata: {", "sourceUrl", "installationMayRunAutomatically", "packageSearch"], "Java runtime controller");
requireMarkers(sharedSource, ["JavaRuntimePickerKind", "fileSizeBytes", "requiresExplicitUserIntent", "headlessVariantRecommended"], "desktop API");
requireMarkers(rendererSource, rendererMarkers.slice(1), "Java runtime renderer");
requireMarkers(htmlSource, [rendererMarkers[0], 'id="java-runtime-setup-plan-routes"'], "Java runtime surface");
requireMarkers(mainSource, bridgeMarkers.slice(0, 2), "main picker bridge");
requireMarkers(preloadSource, [bridgeMarkers[2]], "preload picker bridge");
verifyNegativeRegression(managerSource, managerMarkers, "Java runtime manager");

assert.doesNotMatch(managerSource, /\bexecFile\s*\(/, "Java discovery must not execute through execFile");
assert.doesNotMatch(managerSource, /\bexec\s*\(/, "Java discovery must not execute shell text");
assert.doesNotMatch(managerSource, /\bfork\s*\(/, "Java discovery must not fork a server or installer");
assert.doesNotMatch(managerSource, /\bshell:\s*true/, "Java probing must never enable a shell");
assert.doesNotMatch(managerSource, /(?:winget|choco|brew|apt(?:-get)?|dnf|pacman)\s+(?:install|add)/i, "Java review must not invoke a package manager");
assert.doesNotMatch(managerSource, /\b(?:fetch|writeFile|appendFile|mkdir|rm|unlink|rmdir)\s*\(/, "Java review must not download or mutate files");
assert.doesNotMatch(managerSource, /server-(?:start|stop|config)|serverConfiguration/i, "Java review must not control server lifecycle or configuration");

const originalSpawn = childProcess.spawn;
const spawnCalls = [];
childProcess.spawn = (executablePath, args, options) => {
  spawnCalls.push({ executablePath, args, options });
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.kill = () => {
    child.emit("close", null, "SIGTERM");
    return true;
  };
  setImmediate(() => {
    child.stderr.emit("data", Buffer.from('openjdk version "21.0.2"\n'));
    child.emit("close", 0, null);
  });
  return child;
};

let temporaryRoot;
try {
  const manager = require(managerPath);
  temporaryRoot = await mkdtemp(join(tmpdir(), "java-runtime-guidance-"));
  const javaHome = join(temporaryRoot, "jdk-21");
  const javaBin = join(javaHome, "bin");
  const javaExecutable = join(javaBin, manager.executableNameForPlatform(process.platform));
  await mkdir(javaBin, { recursive: true });
  await writeFile(javaExecutable, Buffer.alloc(321, 0x4a));
  if (process.platform !== "win32") {
    await chmod(javaExecutable, 0o755);
  }

  const executableSelection = manager.candidatePathsFromSelection(javaExecutable, process.platform);
  const binSelection = manager.candidatePathsFromSelection(javaBin, process.platform);
  const homeSelection = manager.candidatePathsFromSelection(javaHome, process.platform);
  assert.deepEqual(executableSelection, [javaExecutable]);
  assert.deepEqual(binSelection, [javaExecutable]);
  assert.deepEqual(homeSelection, [javaExecutable]);
  assert.deepEqual(manager.candidatePathsFromSelection("relative-java-home", process.platform), []);

  const discovery = await manager.discoverJavaCandidates({
    selectedPath: javaHome,
    env: {},
    homeDir: temporaryRoot,
    platform: process.platform,
    limits: { maxRoots: 2, maxChildrenPerRoot: 2, maxCandidates: 8 },
  });
  assert.equal(discovery.candidates.length, 1);
  assert.equal(discovery.candidates[0].selectedByUser, true);
  assert.equal(discovery.candidates[0].metadata.runtimeHomeName, "jdk-21");
  assert.equal(discovery.candidates[0].metadata.executableName, manager.executableNameForPlatform(process.platform));
  assert.equal(discovery.candidates[0].metadata.fileSizeBytes, 321);
  assert.match(discovery.candidates[0].metadata.modifiedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(discovery.searchedLocations.pathSearchUsed, false);
  assert.equal(discovery.searchedLocations.recursiveSearchUsed, false);

  const probe = await manager.probeJavaExecutable(javaExecutable, {
    platform: process.platform,
    limits: { timeoutMs: 2_000, maxOutputBytes: 4_096 },
  });
  assert.equal(probe.status, "valid");
  assert.equal(probe.version.major, 21);
  assert.equal(spawnCalls.length, 1);
  assert.equal(spawnCalls[0].executablePath, javaExecutable);
  assert.deepEqual(spawnCalls[0].args, ["-version"]);
  assert.equal(spawnCalls[0].options.shell, false);
  assert.deepEqual(spawnCalls[0].options.stdio, ["ignore", "pipe", "pipe"]);

  const catalog = manager.getPaperRuntimeTargetCatalog();
  assert.equal(catalog.status, "available");
  assert.ok(catalog.versionCount >= 20);
  const leadingZeroCatalog = JSON.parse(JSON.stringify(manager.PAPER_RUNTIME_TARGET_CATALOG_SOURCE));
  leadingZeroCatalog.versions["1.20"][0] = "01.20";
  assert.equal(manager.normalizePaperRuntimeTargetCatalog(leadingZeroCatalog).status, "invalid");
  const suffixedCatalog = JSON.parse(JSON.stringify(manager.PAPER_RUNTIME_TARGET_CATALOG_SOURCE));
  suffixedCatalog.versions["1.20"][0] = "1.20.6-pre";
  assert.equal(manager.normalizePaperRuntimeTargetCatalog(suffixedCatalog).status, "invalid");
  const noSelectedRuntime = await manager.assessSelectedJavaRuntime({
    serverKind: "paper",
    targetVersion: "1.20.6",
    officialCatalogVersions: catalog.versions,
    platform: process.platform,
  });
  assert.equal(noSelectedRuntime.requirement.status, "resolved");
  assert.equal(noSelectedRuntime.requirement.requiredJavaMajor, 21);
  assert.equal(noSelectedRuntime.compatibility.status, "missing");
  assert.equal(noSelectedRuntime.setupPlan.status, "review-required");
  assert.equal(noSelectedRuntime.setupPlan.executionState, "not-executed");
  assert.equal(noSelectedRuntime.setupPlan.mutationState, "no-system-state-changed");
  assert.equal(noSelectedRuntime.setupPlan.requiresExplicitUserIntent, true);
  assert.equal(noSelectedRuntime.setupPlan.installationMayRunAutomatically, false);
  assert.equal(noSelectedRuntime.setupPlan.routes.length, process.platform === "win32" ? 2 : 1);
  assert.ok(noSelectedRuntime.setupPlan.routes.every((route) => route.executionState === "not-executed"));
  assert.ok(noSelectedRuntime.setupPlan.routes.every((route) => route.requiresExplicitUserIntent));

  const compatibleRuntime = await manager.assessSelectedJavaRuntime({
    serverKind: "paper",
    targetVersion: "1.20.6",
    officialCatalogVersions: catalog.versions,
    selectedCandidate: { executablePath: javaExecutable },
    platform: process.platform,
  });
  assert.equal(compatibleRuntime.compatibility.status, "compatible");
  assert.equal(compatibleRuntime.setupPlan.status, "not-needed");
  assert.equal(spawnCalls.length, 2);

  const spigot = await manager.assessSelectedJavaRuntime({
    serverKind: "spigot",
    targetVersion: "1.20.6",
    officialCatalogVersions: catalog.versions,
    platform: process.platform,
  });
  assert.equal(spigot.requirement.status, "unverified");
  assert.equal(spigot.requirement.reason, "spigot-java-requirement-not-sourced-by-paper-documentation");
  assert.equal(spigot.setupPlan.status, "blocked");
  assert.equal(spigot.setupPlan.routes.length, 0);

  console.log("PASS: Java runtime picker, bounded metadata, direct probe, Paper assessment, review-only setup plan, and side-effect regression");
} finally {
  childProcess.spawn = originalSpawn;
  if (temporaryRoot) {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}
