import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  lstatSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { readFile } from "node:fs/promises";
import {
  dirname,
  isAbsolute,
  join,
  posix,
  relative,
  resolve,
  sep,
  win32,
} from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import {
  UNIVERSAL_CONTRACT_EVIDENCE_KEYS,
  UNIVERSAL_CONTRACT_INVENTORY,
  UNIVERSAL_CONTRACT_SURFACE_KEYS,
  projectUniversalContractMarkdownRow,
} from "./universal-contract-inventory.mjs";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const inventoryMetadataPath = resolve(repositoryRoot, "scripts/universal-contract-inventory.mjs");
const inventoryDocumentationPath = resolve(repositoryRoot, "docs/verification/completeness-inventory.md");
const inventoryMetadataSource = await readFile(inventoryMetadataPath, "utf8");
const inventoryDocumentationSource = await readFile(inventoryDocumentationPath, "utf8");
const fixtureToken = `${process.pid}-${Date.now()}`;

const expectedRows = Object.freeze([
  ["language-modes-and-school-mode", "English, playful Cantonese, bilingual modes; independent funny levels; emoji toggle; renameable School mode"],
  ["spoken-narrator", "Spoken narrator, language choice, voice pickers, rate, pitch, queue, and accessibility coexistence"],
  ["scheduled-settings-and-external-sources", "Scheduled settings and validated external/Home Assistant sources"],
  ["personal-vocabulary-json", "Local personal-vocabulary JSON upload, validation, cache, replace, and clear"],
  ["startup-dim-sum-surprise", "Startup dim-sum surprise with bundled/public-catalog asset boundary"],
  ["anchored-regex-builder", "Full anchored regex builder on every search, menu, dropdown, and settings surface"],
  ["notifications-and-bulk-notification-actions", "Non-blocking notifications, notification centre, and bulk notification actions"],
  ["appearance-editor-and-logo-customization", "Material 3 appearance system, every-element editor, infinite color translator, presets, import/export, and app-logo customization"],
  ["app-display-name", "User-renamable application display name with stable application identity"],
  ["browser-style-tabs", "Complete browser-style tabs: docking, overflow, reorder, pin, groups, four searches, bulk close, and per-element appearance"],
  ["toy-locks-and-recovery", "Toy locks on every element, tab/group locks, independent credentials, QR pairing, and recovery"],
  ["built-in-authenticator-and-secret-history", "Built-in authenticator, TOTP/HOTP standards, secret-safe history, and protected history manager"],
  ["support-tickets", "Support Tickets local recovery desk"],
  ["command-palette", "Command palette on `Ctrl+Shift+F`, rich controls, and exact teleport targets"],
  ["destructive-action-super-confirmation", "Destructive-action super confirmation and emergency exit"],
  ["local-git-backed-version-history", "Local Git-backed version history for every user-managed record"],
  ["changelog-viewer", "Changelog viewer with date picker, search, commit links, copy, and export"],
  ["external-editor-handoff", "External-editor handoff, especially Visual Studio Code workspace opening"],
  ["complete-exports-and-reimports", "Complete export formats and re-importable records"],
  ["bulk-actions-everywhere", "Bulk actions on every list, table, grid, history, and notification surface"],
  ["local-file-converter", "Local categorized file converter with bundled adapters, PDF operations, queue, cancellation, and output validation"],
  ["local-ollama-suite-manager", "Complete local Ollama suite manager, exhaustive model catalog, hardware fit, chat, and allowlisted harness"],
  ["browser-extension-download-surfaces", "Browser-extension Start download, Downloading, and Download complete surfaces"],
  ["offline-documentation-and-landing-site", "Offline in-app documentation browser and complete landing/documentation site"],
  ["accessibility-responsive-sizing-and-captures", "Accessibility, responsive sizing, high-scale layout, reduced motion, and real captures for every surface"],
  ["shared-live-status-hub", "Shared live Status Hub registration and app-owned status surface"],
  ["complete-inventory-negative-regression", "Negative regression guard for the complete inventory"],
]);

const expectedEvidenceKeys = Object.freeze([
  "implementation",
  "documentation",
  "localization",
  "persistence",
  "focusedCheck",
  "builtArtifactInteraction",
  "captureEvidence",
]);
const expectedSurfaceKeys = Object.freeze(["desktop", "companionSite"]);
const allowedStatuses = new Set(["verified", "partial", "not-implemented", "unverified", "not-applicable"]);
const allowedSurfaceStatuses = new Set(["verified", "partial", "not-implemented", "unverified"]);
const requiredSourceLineTokens = Object.freeze([
  "export const UNIVERSAL_CONTRACT_SURFACE_KEYS = Object.freeze([",
  '"desktop",',
  '"companionSite",',
  "export const UNIVERSAL_CONTRACT_EVIDENCE_KEYS = Object.freeze([",
  '"implementation",',
  '"documentation",',
  '"localization",',
  '"persistence",',
  '"focusedCheck",',
  '"builtArtifactInteraction",',
  '"captureEvidence",',
  "const UNIVERSAL_CONTRACT_ROWS = [",
  "export const UNIVERSAL_CONTRACT_INVENTORY = Object.freeze(",
]);

const expectedRowSourceLineTokens = Object.freeze(
  expectedRows.flatMap(([rowId, rowTitle]) => [
    `id: "${rowId}",`,
    `title: "${rowTitle}",`,
  ]),
);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function exactLinePattern(token) {
  return new RegExp(`^[ \\t]*${escapeRegExp(token)}[ \\t]*$`, "m");
}

function replaceExactSourceLine(source, token, replacement) {
  const pattern = new RegExp(`^([ \\t]*)${escapeRegExp(token)}([ \\t]*)$`, "m");
  return source.replace(pattern, `$1${replacement}$2`);
}

function removeExactSourceLine(source, token) {
  const pattern = new RegExp(`^[ \\t]*${escapeRegExp(token)}[ \\t]*(?:\\r?\\n|$)`, "m");
  return source.replace(pattern, "");
}

function assertSourceContract(source) {
  for (const token of requiredSourceLineTokens) {
    assert.match(source, exactLinePattern(token), `inventory metadata is missing the exact source line ${token}`);
  }
  for (const token of expectedRowSourceLineTokens) {
    assert.match(source, exactLinePattern(token), `inventory metadata is missing the exact canonical row line ${token}`);
  }
}

function assertNoReparseComponents(relativePath, context) {
  let current = repositoryRoot;
  for (const part of relativePath.split("/")) {
    current = join(current, part);
    let stats;
    try {
      stats = lstatSync(current);
    } catch {
      assert.fail(`${context} path does not exist: ${relativePath}`);
    }
    assert.equal(stats.isSymbolicLink(), false, `${context} path must not contain a symlink or reparse component: ${relativePath}`);
  }
}

function assertRepositoryFile(relativePath, context, gitEnvironment = process.env) {
  assert.equal(typeof relativePath, "string", `${context} path must be a string`);
  assert.ok(relativePath.length > 0, `${context} path must not be empty`);
  assert.equal(relativePath.trim(), relativePath, `${context} path must not have surrounding whitespace`);
  assert.ok(!relativePath.includes("\\"), `${context} path must use forward slashes`);
  assert.ok(!relativePath.includes("\0"), `${context} path must not contain a NUL`);
  assert.ok(!isAbsolute(relativePath) && !win32.isAbsolute(relativePath) && !posix.isAbsolute(relativePath), `${context} path must be relative`);

  const parts = relativePath.split("/");
  assert.ok(parts.every((part) => part.length > 0 && part !== "." && part !== ".."), `${context} path must not contain escaping or ambiguous components`);
  const candidate = resolve(repositoryRoot, ...parts);
  const relativeCandidate = relative(repositoryRoot, candidate);
  assert.ok(relativeCandidate && relativeCandidate !== ".." && !relativeCandidate.startsWith(`..${sep}`) && !isAbsolute(relativeCandidate), `${context} path must stay inside the repository root`);

  assertNoReparseComponents(relativePath, context);

  const finalStats = lstatSync(candidate);
  assert.equal(finalStats.isFile(), true, `${context} path must name a file, not a directory: ${relativePath}`);

  const gitResult = spawnSync("git", ["ls-tree", "--full-tree", "--name-only", "HEAD", "--", relativePath], {
    cwd: repositoryRoot,
    env: gitEnvironment,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  assert.equal(gitResult.error, undefined, `${context} could not inspect the HEAD tree`);
  assert.equal(gitResult.status, 0, `${context} path must be present in the HEAD tree: ${relativePath}`);
  assert.equal(gitResult.stdout.trim(), relativePath, `${context} path must resolve to exactly one HEAD tree path: ${relativePath}`);
}

function pathExistsForCleanup(path) {
  try {
    lstatSync(path);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

function removeFixture(path) {
  rmSync(path, { force: true, recursive: true });
  assert.equal(pathExistsForCleanup(path), false, `fixture must be removed during cleanup: ${path}`);
}

function isReparseFixtureCapabilityError(error) {
  return ["EACCES", "EINVAL", "ENOTSUP", "EPERM"].includes(error?.code);
}

function tryCreateReparseFixture({ kind, linkRelativePath, targetPath, linkType, evidenceRelativePath }) {
  const linkAbsolutePath = resolve(repositoryRoot, linkRelativePath);
  assert.equal(pathExistsForCleanup(linkAbsolutePath), false, `${kind} fixture path must not already exist: ${linkAbsolutePath}`);

  try {
    symlinkSync(targetPath, linkAbsolutePath, linkType);
    assert.equal(lstatSync(linkAbsolutePath).isSymbolicLink(), true, `${kind} fixture probe must expose a reparse link`);
    if (evidenceRelativePath !== linkRelativePath) {
      assert.equal(lstatSync(resolve(repositoryRoot, evidenceRelativePath)).isFile(), true, `${kind} fixture probe must resolve to a file`);
    }
    return Object.freeze({
      kind,
      relativePath: evidenceRelativePath,
      cleanupPaths: Object.freeze([linkAbsolutePath]),
    });
  } catch (error) {
    if (pathExistsForCleanup(linkAbsolutePath)) {
      removeFixture(linkAbsolutePath);
    }
    if (!isReparseFixtureCapabilityError(error)) {
      throw error;
    }
    return null;
  }
}

function createReparseFixtures() {
  const fixtures = [];
  let ancestorFixture = tryCreateReparseFixture({
    kind: "ancestor-junction",
    linkRelativePath: `.inventory-junction-${fixtureToken}`,
    targetPath: resolve(repositoryRoot, "scripts"),
    linkType: "junction",
    evidenceRelativePath: `.inventory-junction-${fixtureToken}/test-universal-contract-inventory.mjs`,
  });
  if (!ancestorFixture) {
    ancestorFixture = tryCreateReparseFixture({
      kind: "ancestor-directory-symlink",
      linkRelativePath: `.inventory-directory-symlink-${fixtureToken}`,
      targetPath: resolve(repositoryRoot, "scripts"),
      linkType: "dir",
      evidenceRelativePath: `.inventory-directory-symlink-${fixtureToken}/test-universal-contract-inventory.mjs`,
    });
  }
  if (ancestorFixture) {
    fixtures.push(ancestorFixture);
  }

  const finalSymlink = tryCreateReparseFixture({
    kind: "final-symlink",
    linkRelativePath: `scripts/.inventory-symlink-${fixtureToken}.mjs`,
    targetPath: "test-universal-contract-inventory.mjs",
    linkType: "file",
    evidenceRelativePath: `scripts/.inventory-symlink-${fixtureToken}.mjs`,
  });
  if (finalSymlink) {
    fixtures.push(finalSymlink);
  }

  return Object.freeze(fixtures);
}

function assertDocumentationTable(source, inventory) {
  const sectionStart = source.indexOf("## Universal surface contract audit");
  const sectionEnd = source.indexOf("## Required evidence before a release claim", sectionStart);
  assert.ok(sectionStart >= 0, "the universal surface contract section must exist");
  assert.ok(sectionEnd > sectionStart, "the universal surface contract section must have a bounded end");

  const section = source.slice(sectionStart, sectionEnd);
  const rows = section
    .split(/\r?\n/)
    .filter((line) => line.startsWith("| ") && !line.startsWith("| ---") && !line.startsWith("| Canonical feature"))
    .map((line) => {
      const cells = line.slice(1, -1).split("|").map((cell) => cell.trim());
      assert.equal(cells.length, 5, "each universal-contract row must keep five auditable columns");
      for (const [index, cell] of cells.entries()) {
        assert.ok(cell.length > 0, `universal-contract row column ${index + 1} must not be empty`);
        assert.equal(cell.includes("|"), false, "universal-contract evidence summaries must use semicolons inside their five outer Markdown cells");
      }
      return cells;
    });

  assert.equal(rows.length, expectedRows.length, "the documented universal-contract row count must stay exact");
  assert.deepEqual(
    rows,
    inventory.map(projectUniversalContractMarkdownRow),
    "every documented evidence cell must equal the metadata-owned projection",
  );
}

function formatProjectedMarkdownRow(row) {
  return `| ${projectUniversalContractMarkdownRow(row).join(" | ")} |`;
}

function replaceProjectedMarkdownRow(source, originalRow, replacementRow) {
  const originalLine = formatProjectedMarkdownRow(originalRow);
  const replacementLine = formatProjectedMarkdownRow(replacementRow);
  const originalIndex = source.indexOf(originalLine);
  assert.ok(originalIndex >= 0, "the expected Markdown projection row must exist exactly before regeneration");
  assert.equal(source.indexOf(originalLine, originalIndex + originalLine.length), -1, "the expected Markdown projection row must occur exactly once before regeneration");
  return `${source.slice(0, originalIndex)}${replacementLine}${source.slice(originalIndex + originalLine.length)}`;
}

function regenerateProjectedMarkdown(source, originalInventory, mutatedInventory) {
  assert.equal(mutatedInventory.length, originalInventory.length, "projection regeneration requires the same canonical row count");
  return mutatedInventory.reduce(
    (currentSource, row, rowIndex) => replaceProjectedMarkdownRow(currentSource, originalInventory[rowIndex], row),
    source,
  );
}

function assertEvidenceSlot(slot, rowId, evidenceKey, gitEnvironment = process.env) {
  assert.ok(slot && typeof slot === "object" && !Array.isArray(slot), `${rowId} must keep ${evidenceKey} evidence metadata`);
  assert.ok(allowedStatuses.has(slot.status), `${rowId} ${evidenceKey} must use a known evidence status`);
  assert.ok(Array.isArray(slot.paths) && slot.paths.length > 0, `${rowId} ${evidenceKey} must list at least one auditable path`);
  for (const path of slot.paths) {
    assertRepositoryFile(path, `${rowId} ${evidenceKey}`, gitEnvironment);
  }
  assert.equal(typeof slot.assertion, "string", `${rowId} ${evidenceKey} must keep an assertion`);
  assert.ok(slot.assertion.trim().length >= 20, `${rowId} ${evidenceKey} assertion is too short to be auditable`);

  if (evidenceKey === "persistence") {
    assert.equal(typeof slot.applicable, "boolean", `${rowId} persistence must declare applicability`);
    if (slot.applicable) {
      assert.notEqual(slot.status, "not-applicable", `${rowId} applicable persistence cannot be marked not-applicable`);
      assert.equal(slot.reason, undefined, `${rowId} applicable persistence must not carry a not-applicable reason`);
      assert.deepEqual(Object.keys(slot).sort(), ["applicable", "assertion", "paths", "status"], `${rowId} applicable persistence must keep only its declared fields`);
    } else {
      assert.equal(slot.status, "not-applicable", `${rowId} non-applicable persistence must be marked not-applicable`);
      assert.equal(typeof slot.reason, "string", `${rowId} non-applicable persistence must explain why`);
      assert.ok(slot.reason.trim().length >= 20, `${rowId} non-applicable persistence reason is too short`);
      assert.deepEqual(Object.keys(slot).sort(), ["applicable", "assertion", "paths", "reason", "status"], `${rowId} non-applicable persistence must keep only its declared fields`);
    }
  } else {
    assert.notEqual(slot.status, "not-applicable", `${rowId} mandatory ${evidenceKey} cannot be not-applicable`);
    assert.equal(slot.applicable, undefined, `${rowId} mandatory ${evidenceKey} must not declare persistence applicability`);
    assert.equal(slot.reason, undefined, `${rowId} mandatory ${evidenceKey} must not carry a persistence reason`);
    assert.deepEqual(Object.keys(slot).sort(), ["assertion", "paths", "status"], `${rowId} mandatory ${evidenceKey} must keep only its declared fields`);
  }
}

function assertSurfaceEvidence(surface, rowId, surfaceKey, gitEnvironment = process.env) {
  assert.ok(surface && typeof surface === "object" && !Array.isArray(surface), `${rowId} must keep ${surfaceKey} surface evidence`);
  assert.deepEqual(Object.keys(surface).sort(), ["assertion", "paths", "status"], `${rowId} ${surfaceKey} surface evidence must keep its declared fields`);
  assert.ok(allowedSurfaceStatuses.has(surface.status), `${rowId} ${surfaceKey} must use a known surface status`);
  assert.ok(Array.isArray(surface.paths) && surface.paths.length > 0, `${rowId} ${surfaceKey} must list independent auditable paths`);
  for (const path of surface.paths) {
    assertRepositoryFile(path, `${rowId} ${surfaceKey}`, gitEnvironment);
  }
  assert.equal(typeof surface.assertion, "string", `${rowId} ${surfaceKey} must keep an assertion`);
  assert.ok(surface.assertion.trim().length >= 20, `${rowId} ${surfaceKey} assertion is too short to be auditable`);
}

function assertIndependentSurfaceEvidence(row) {
  const desktop = row.surfaces.desktop;
  const companionSite = row.surfaces.companionSite;
  assert.notEqual(desktop, companionSite, `${row.id} desktop and companion-site surface records must remain separate objects`);
  assert.notEqual(desktop.paths, companionSite.paths, `${row.id} desktop and companion-site path arrays must remain separate objects`);

  const desktopPaths = new Set(desktop.paths);
  const companionSitePaths = new Set(companionSite.paths);
  assert.equal(companionSitePaths.size, companionSite.paths.length, `${row.id} companion-site surface paths must be unique`);
  assert.equal(desktopPaths.size, desktop.paths.length, `${row.id} desktop surface paths must be unique`);
  for (const path of desktopPaths) {
    assert.equal(companionSitePaths.has(path), false, `${row.id} desktop and companion-site surface paths must be disjoint: ${path}`);
  }
}

function assertInventory(inventory, documentationSource, { gitEnvironment = process.env } = {}) {
  assertSourceContract(inventoryMetadataSource);
  assert.deepEqual([...UNIVERSAL_CONTRACT_EVIDENCE_KEYS], expectedEvidenceKeys, "the production evidence-slot list must match the independent seven-slot oracle");
  assert.deepEqual([...UNIVERSAL_CONTRACT_SURFACE_KEYS], expectedSurfaceKeys, "the production surface-key list must match the independent two-surface oracle");
  assertDocumentationTable(documentationSource, inventory);
  assert.ok(Array.isArray(inventory), "universal-contract inventory must be an array");
  assert.deepEqual(
    inventory.map(({ id, title }) => [id, title]),
    expectedRows,
    "the inventory must enumerate the exact hand-written canonical rows",
  );

  const ids = new Set();
  for (const row of inventory) {
    assert.equal(typeof row.id, "string", "every inventory row needs an id");
    assert.ok(!ids.has(row.id), `duplicate universal-contract row: ${row.id}`);
    ids.add(row.id);
    assert.equal(typeof row.title, "string", `${row.id} needs a title`);
    assert.deepEqual(
      Object.keys(row).sort(),
      ["evidence", "id", "surfaces", "title"],
      `${row.id} must not silently drop or add inventory fields`,
    );
    assert.deepEqual(
      Object.keys(row.evidence).sort(),
      expectedEvidenceKeys.slice().sort(),
      `${row.id} must keep every required evidence slot from the independent oracle`,
    );
    assert.deepEqual(
      Object.keys(row.surfaces).sort(),
      expectedSurfaceKeys.slice().sort(),
      `${row.id} must keep both independent surface evidence keys`,
    );
    for (const evidenceKey of expectedEvidenceKeys) {
      assertEvidenceSlot(row.evidence[evidenceKey], row.id, evidenceKey, gitEnvironment);
    }
    for (const surfaceKey of expectedSurfaceKeys) {
      assertSurfaceEvidence(row.surfaces[surfaceKey], row.id, surfaceKey, gitEnvironment);
    }
    assertIndependentSurfaceEvidence(row);
  }
}

function cloneInventory() {
  return structuredClone(UNIVERSAL_CONTRACT_INVENTORY);
}

function assertMutationFails(label, mutation) {
  assert.throws(mutation, `${label} must turn the inventory check red`);
}

assertSourceContract(inventoryMetadataSource);
assertInventory(UNIVERSAL_CONTRACT_INVENTORY, inventoryDocumentationSource);

let mutationCount = 0;
for (const token of requiredSourceLineTokens) {
  assertMutationFails(`removing exact source line ${token}`, () => assertSourceContract(removeExactSourceLine(inventoryMetadataSource, token)));
  mutationCount += 1;
}

for (const [rowId, rowTitle] of expectedRows) {
  const idToken = `id: "${rowId}",`;
  const titleToken = `title: "${rowTitle}",`;
  assertMutationFails(`removing source row ${rowId} id`, () => assertSourceContract(removeExactSourceLine(inventoryMetadataSource, idToken)));
  mutationCount += 1;
  assertMutationFails(`renaming source row ${rowId} id`, () => assertSourceContract(replaceExactSourceLine(inventoryMetadataSource, idToken, `id: "${rowId}-renamed",`)));
  mutationCount += 1;
  assertMutationFails(`removing source row ${rowId} title`, () => assertSourceContract(removeExactSourceLine(inventoryMetadataSource, titleToken)));
  mutationCount += 1;
  assertMutationFails(`renaming source row ${rowId} title`, () => assertSourceContract(replaceExactSourceLine(inventoryMetadataSource, titleToken, `title: "${rowTitle} (renamed)",`)));
  mutationCount += 1;
}

assertMutationFails("renaming the captureEvidence source slot marker", () => assertSourceContract(
  replaceExactSourceLine(inventoryMetadataSource, '"captureEvidence",', '"captureEvidenceRenamed",'),
));
mutationCount += 1;

for (let rowIndex = 0; rowIndex < UNIVERSAL_CONTRACT_INVENTORY.length; rowIndex += 1) {
  const [rowId, rowTitle] = expectedRows[rowIndex];

  const removedRow = cloneInventory();
  removedRow.splice(rowIndex, 1);
  assertMutationFails(`removing row ${rowId}`, () => assertInventory(removedRow, inventoryDocumentationSource));
  mutationCount += 1;

  const renamedId = cloneInventory();
  renamedId[rowIndex].id = `${rowId}-renamed`;
  assertMutationFails(`renaming row ${rowId}`, () => assertInventory(renamedId, inventoryDocumentationSource));
  mutationCount += 1;

  const renamedTitle = cloneInventory();
  renamedTitle[rowIndex].title = `${rowTitle} (renamed)`;
  assertMutationFails(`renaming title ${rowId}`, () => assertInventory(renamedTitle, inventoryDocumentationSource));
  mutationCount += 1;

  for (const evidenceKey of expectedEvidenceKeys) {
    const removedEvidence = cloneInventory();
    delete removedEvidence[rowIndex].evidence[evidenceKey];
    assertMutationFails(`removing ${rowId} ${evidenceKey} evidence`, () => assertInventory(removedEvidence, inventoryDocumentationSource));
    mutationCount += 1;

    const renamedEvidence = cloneInventory();
    renamedEvidence[rowIndex].evidence[`${evidenceKey}Renamed`] = renamedEvidence[rowIndex].evidence[evidenceKey];
    delete renamedEvidence[rowIndex].evidence[evidenceKey];
    assertMutationFails(`renaming ${rowId} ${evidenceKey} evidence`, () => assertInventory(renamedEvidence, inventoryDocumentationSource));
    mutationCount += 1;

    const removedAssertion = cloneInventory();
    delete removedAssertion[rowIndex].evidence[evidenceKey].assertion;
    assertMutationFails(`removing ${rowId} ${evidenceKey} assertion`, () => assertInventory(removedAssertion, inventoryDocumentationSource));
    mutationCount += 1;
  }

  const removedDesktopSurface = cloneInventory();
  delete removedDesktopSurface[rowIndex].surfaces.desktop;
  assertMutationFails(`removing ${rowId} desktop surface evidence`, () => assertInventory(removedDesktopSurface, inventoryDocumentationSource));
  mutationCount += 1;

  const renamedCompanionSurface = cloneInventory();
  renamedCompanionSurface[rowIndex].surfaces.companionSiteRenamed = renamedCompanionSurface[rowIndex].surfaces.companionSite;
  delete renamedCompanionSurface[rowIndex].surfaces.companionSite;
  assertMutationFails(`renaming ${rowId} companion-site surface evidence`, () => assertInventory(renamedCompanionSurface, inventoryDocumentationSource));
  mutationCount += 1;
}

const invalidMandatoryApplicability = cloneInventory();
invalidMandatoryApplicability[0].evidence.documentation.status = "not-applicable";
assertMutationFails("marking a mandatory evidence slot not-applicable", () => assertInventory(invalidMandatoryApplicability, inventoryDocumentationSource));
mutationCount += 1;

const invalidPersistenceApplicability = cloneInventory();
invalidPersistenceApplicability[0].evidence.persistence.status = "not-applicable";
assertMutationFails("marking applicable persistence not-applicable", () => assertInventory(invalidPersistenceApplicability, inventoryDocumentationSource));
mutationCount += 1;

const invalidPersistenceReason = cloneInventory();
delete invalidPersistenceReason[4].evidence.persistence.reason;
assertMutationFails("removing a not-applicable persistence reason", () => assertInventory(invalidPersistenceReason, inventoryDocumentationSource));
mutationCount += 1;

const collapsedSurfacePaths = cloneInventory();
collapsedSurfacePaths[0].surfaces.companionSite = {
  ...collapsedSurfacePaths[0].surfaces.companionSite,
  paths: collapsedSurfacePaths[0].surfaces.desktop.paths,
};
const collapsedSurfacePathsDocumentation = regenerateProjectedMarkdown(
  inventoryDocumentationSource,
  UNIVERSAL_CONTRACT_INVENTORY,
  collapsedSurfacePaths,
);
assertMutationFails("collapsing desktop and companion-site surface paths", () => assertInventory(collapsedSurfacePaths, collapsedSurfacePathsDocumentation));
mutationCount += 1;

const duplicatedDesktopSurfacePath = cloneInventory();
duplicatedDesktopSurfacePath[0].surfaces.desktop.paths = [
  duplicatedDesktopSurfacePath[0].surfaces.desktop.paths[0],
  ...duplicatedDesktopSurfacePath[0].surfaces.desktop.paths,
];
const duplicatedDesktopSurfacePathDocumentation = regenerateProjectedMarkdown(
  inventoryDocumentationSource,
  UNIVERSAL_CONTRACT_INVENTORY,
  duplicatedDesktopSurfacePath,
);
assertMutationFails("duplicating a desktop surface path", () => assertInventory(duplicatedDesktopSurfacePath, duplicatedDesktopSurfacePathDocumentation));
mutationCount += 1;

const duplicatedCompanionSurfacePath = cloneInventory();
duplicatedCompanionSurfacePath[0].surfaces.companionSite.paths = [
  duplicatedCompanionSurfacePath[0].surfaces.companionSite.paths[0],
  ...duplicatedCompanionSurfacePath[0].surfaces.companionSite.paths,
];
const duplicatedCompanionSurfacePathDocumentation = regenerateProjectedMarkdown(
  inventoryDocumentationSource,
  UNIVERSAL_CONTRACT_INVENTORY,
  duplicatedCompanionSurfacePath,
);
assertMutationFails("duplicating a companion-site surface path", () => assertInventory(duplicatedCompanionSurfacePath, duplicatedCompanionSurfacePathDocumentation));
mutationCount += 1;

const sharedSurfacePath = cloneInventory();
sharedSurfacePath[0].surfaces.companionSite.paths = [
  sharedSurfacePath[0].surfaces.desktop.paths[0],
  ...sharedSurfacePath[0].surfaces.companionSite.paths,
];
const sharedSurfacePathDocumentation = regenerateProjectedMarkdown(
  inventoryDocumentationSource,
  UNIVERSAL_CONTRACT_INVENTORY,
  sharedSurfacePath,
);
assertMutationFails("sharing a path between desktop and companion-site surface paths", () => assertInventory(sharedSurfacePath, sharedSurfacePathDocumentation));
mutationCount += 1;

const regeneratedMandatoryNotApplicable = cloneInventory();
regeneratedMandatoryNotApplicable[0].evidence.documentation.status = "not-applicable";
assert.deepEqual(
  Object.keys(regeneratedMandatoryNotApplicable[0].evidence.documentation).sort(),
  ["assertion", "paths", "status"],
  "the regenerated mandatory-applicability mutation must change status only",
);
const regeneratedMandatoryNotApplicableDocumentation = replaceProjectedMarkdownRow(
  inventoryDocumentationSource,
  UNIVERSAL_CONTRACT_INVENTORY[0],
  regeneratedMandatoryNotApplicable[0],
);
assertMutationFails(
  "regenerating Markdown after marking mandatory evidence not-applicable",
  () => assertInventory(regeneratedMandatoryNotApplicable, regeneratedMandatoryNotApplicableDocumentation),
);
mutationCount += 1;

const pathMutations = [
  ["absolute evidence path", resolve(repositoryRoot, "README.md")],
  ["escaping evidence path", "../README.md"],
  ["directory evidence path", "src"],
];
for (const [label, path] of pathMutations) {
  const mutated = cloneInventory();
  mutated[0].evidence.implementation.paths = [path];
  assertMutationFails(label, () => assertInventory(mutated, inventoryDocumentationSource));
  mutationCount += 1;
}

const untrackedRelativePath = `.inventory-untracked-${fixtureToken}.txt`;
const untrackedAbsolutePath = resolve(repositoryRoot, untrackedRelativePath);
writeFileSync(untrackedAbsolutePath, "temporary inventory mutation fixture\n", "utf8");
try {
  const mutated = cloneInventory();
  mutated[0].evidence.implementation.paths = [untrackedRelativePath];
  assertMutationFails("untracked evidence path", () => assertInventory(mutated, inventoryDocumentationSource));
  mutationCount += 1;
} finally {
  removeFixture(untrackedAbsolutePath);
}

const stagedOnlyRelativePath = `.inventory-staged-only-${fixtureToken}.txt`;
const stagedOnlyAbsolutePath = resolve(repositoryRoot, stagedOnlyRelativePath);
const stagedIndexRoot = mkdtempSync(join(tmpdir(), `universal-contract-index-${process.pid}-`));
const stagedIndexPath = join(stagedIndexRoot, "index");
const stagedGitEnvironment = { ...process.env, GIT_INDEX_FILE: stagedIndexPath };
writeFileSync(stagedOnlyAbsolutePath, "temporary staged-only inventory fixture\n", "utf8");
try {
  const addResult = spawnSync("git", ["add", "--", stagedOnlyRelativePath], {
    cwd: repositoryRoot,
    env: stagedGitEnvironment,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  assert.equal(addResult.error, undefined, "the staged-only fixture could not be added to the isolated test index");
  assert.equal(addResult.status, 0, `the staged-only fixture could not be added to the isolated test index: ${addResult.stderr}`);

  const stagedProbe = spawnSync("git", ["ls-files", "--error-unmatch", "--", stagedOnlyRelativePath], {
    cwd: repositoryRoot,
    env: stagedGitEnvironment,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  assert.equal(stagedProbe.status, 0, "the staged-only fixture must be visible from the isolated mutable index");
  assert.equal(stagedProbe.stdout.trim(), stagedOnlyRelativePath, "the staged-only probe must resolve exactly one mutable-index path");

  const mutated = cloneInventory();
  mutated[0].evidence.implementation.paths = [stagedOnlyRelativePath];
  const regeneratedDocumentation = regenerateProjectedMarkdown(
    inventoryDocumentationSource,
    UNIVERSAL_CONTRACT_INVENTORY,
    mutated,
  );
  assertMutationFails(
    "staged-only evidence path",
    () => assertInventory(mutated, regeneratedDocumentation, { gitEnvironment: stagedGitEnvironment }),
  );
  mutationCount += 1;
} finally {
  removeFixture(stagedOnlyAbsolutePath);
  removeFixture(stagedIndexRoot);
}

const reparseFixtures = createReparseFixtures();
if (reparseFixtures.length > 0) {
  try {
    for (const reparseFixture of reparseFixtures) {
      if (reparseFixture.kind.startsWith("ancestor-")) {
        assertMutationFails(
          `${reparseFixture.kind} reparse assertion`,
          () => assertNoReparseComponents(reparseFixture.relativePath, `${reparseFixture.kind} fixture`),
        );
        mutationCount += 1;
        continue;
      }
      const mutated = cloneInventory();
      mutated[0].evidence.implementation.paths = [reparseFixture.relativePath];
      const regeneratedDocumentation = regenerateProjectedMarkdown(
        inventoryDocumentationSource,
        UNIVERSAL_CONTRACT_INVENTORY,
        mutated,
      );
      assertMutationFails(
        `${reparseFixture.kind} evidence path`,
        () => assertInventory(mutated, regeneratedDocumentation),
      );
      mutationCount += 1;
    }
  } finally {
    for (const reparseFixture of reparseFixtures) {
      for (const cleanupPath of reparseFixture.cleanupPaths) {
        removeFixture(cleanupPath);
      }
    }
  }
} else {
  console.log("INFO: ancestor and final reparse fixture creation were unavailable; those capability-bound mutations were not counted");
}

for (const [rowId, rowTitle] of expectedRows) {
  const removedDocumentationRow = inventoryDocumentationSource.replace(`| ${rowTitle} |`, "");
  assertMutationFails(`removing documented row ${rowId}`, () => assertInventory(UNIVERSAL_CONTRACT_INVENTORY, removedDocumentationRow));
  mutationCount += 1;

  const renamedDocumentationRow = inventoryDocumentationSource.replace(`| ${rowTitle} |`, `| ${rowTitle} (renamed) |`);
  assertMutationFails(`renaming documented row ${rowId}`, () => assertInventory(UNIVERSAL_CONTRACT_INVENTORY, renamedDocumentationRow));
  mutationCount += 1;
}

const projectedRows = UNIVERSAL_CONTRACT_INVENTORY.map(projectUniversalContractMarkdownRow);
const mutatedEvidenceCellSource = inventoryDocumentationSource.replace(
  `| ${projectedRows[0][0]} | ${projectedRows[0][1]} |`,
  `| ${projectedRows[0][0]} | ${projectedRows[0][1]} (mutated) |`,
);
assert.notEqual(mutatedEvidenceCellSource, inventoryDocumentationSource, "the Markdown evidence-cell mutation must change the source");
assertMutationFails("changing a non-empty Markdown evidence cell", () => assertInventory(UNIVERSAL_CONTRACT_INVENTORY, mutatedEvidenceCellSource));
mutationCount += 1;

assertInventory(UNIVERSAL_CONTRACT_INVENTORY, inventoryDocumentationSource);
console.log(`PASS: explicit universal-contract inventory, ${UNIVERSAL_CONTRACT_INVENTORY.length} canonical rows, ${expectedEvidenceKeys.length} evidence slots, ${expectedSurfaceKeys.length} independent surfaces per row, and ${mutationCount} negative mutations (reparse fixtures: ${reparseFixtures.map(({ kind }) => kind).join(", ") || "unavailable"})`);
