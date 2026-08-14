import assert from "node:assert/strict";
import { copyFile, mkdtemp, mkdir, readFile, rm } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const repoRoot = resolve(process.cwd());
const sourcePath = resolve(repoRoot, "src/main/java-runtime-manager.cjs");
const builtPath = resolve(repoRoot, "dist/main/java-runtime-manager.cjs");
const copyScriptPath = resolve(repoRoot, "scripts/copy-java-runtime-manager.mjs");
const packageJson = JSON.parse(await readFile(resolve(repoRoot, "package.json"), "utf8"));
const sourceBytes = readFileSync(sourcePath);

assert.match(
  packageJson.scripts?.["build:main"] ?? "",
  /node scripts\/copy-java-runtime-manager\.mjs/,
  "build:main must copy the Java runtime manager after compiling main output",
);

function assertCopyScriptContract(source) {
  for (const marker of [
    'resolve("src", "main", "java-runtime-manager.cjs")',
    'resolve("dist", "main", "java-runtime-manager.cjs")',
    "await copyFile(source, destination);",
  ]) {
    assert.ok(source.includes(marker), `missing Java runtime copy marker: ${marker}`);
  }
}

const copyScriptSource = await readFile(copyScriptPath, "utf8");
assertCopyScriptContract(copyScriptSource);
for (const marker of [
  'resolve("src", "main", "java-runtime-manager.cjs")',
  'resolve("dist", "main", "java-runtime-manager.cjs")',
  "await copyFile(source, destination);",
]) {
  const mutated = copyScriptSource.replace(marker, "");
  assert.notEqual(mutated, copyScriptSource, `negative regression fixture could not remove ${marker}`);
  assert.throws(
    () => assertCopyScriptContract(mutated),
    `negative regression stayed green after removing ${marker}`,
  );
}

function assertBuiltMainOutput(root) {
  const outputPath = join(root, "dist", "main", "java-runtime-manager.cjs");
  assert.ok(existsSync(outputPath), "built main output is missing java-runtime-manager.cjs");
  assert.deepEqual(readFileSync(outputPath), sourceBytes, "built manager must byte-match the checked-in source");
}

assertBuiltMainOutput(repoRoot);

const temporaryRoot = await mkdtemp(join(tmpdir(), "java-runtime-package-seam-"));
const stagedPath = join(temporaryRoot, "dist", "main", "java-runtime-manager.cjs");
try {
  await mkdir(dirname(stagedPath), { recursive: true });
  await copyFile(builtPath, stagedPath);
  assertBuiltMainOutput(temporaryRoot);

  await rm(stagedPath, { force: true });
  assert.throws(
    () => assertBuiltMainOutput(temporaryRoot),
    /built main output is missing java-runtime-manager\.cjs/,
    "negative regression stayed green when the packaged manager was absent",
  );

  await copyFile(builtPath, stagedPath);
  assertBuiltMainOutput(temporaryRoot);
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}

console.log("PASS: Java runtime manager build seam, byte-match, and absent-output negative regression");
