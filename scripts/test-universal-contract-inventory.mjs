import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  UNIVERSAL_CONTRACT_EVIDENCE_KEYS,
  UNIVERSAL_CONTRACT_INVENTORY,
} from "./universal-contract-inventory.mjs";

const repositoryRoot = resolve(process.cwd());
const inventoryMetadataPath = resolve(repositoryRoot, "scripts/universal-contract-inventory.mjs");
const inventoryDocumentationPath = resolve(repositoryRoot, "docs/verification/completeness-inventory.md");
const inventoryMetadataSource = await readFile(inventoryMetadataPath, "utf8");
const inventoryDocumentationSource = await readFile(inventoryDocumentationPath, "utf8");

const expectedRows = Object.freeze([
  ["language-modes-and-school-mode", "English, playful Cantonese, bilingual modes; independent funny levels; emoji toggle; renameable School mode"],
  ["spoken-narrator", "Spoken narrator, language choice, voice pickers, rate, pitch, queue, and accessibility coexistence"],
  ["scheduled-settings-and-external-sources", "Scheduled settings and validated external/Home Assistant sources"],
  ["personal-vocabulary-json", "Local personal-vocabulary JSON upload, validation, cache, replace, and clear"],
  ["startup-dim-sum-surprise", "Startup dim-sum surprise with bundled/public-catalog asset boundary"],
  ["anchored-regex-builder", "Full anchored regex builder on every search, menu, dropdown, and settings surface"],
  ["notifications-and-bulk-notification-actions", "Non-blocking notifications, notification centre, and bulk notification actions"],
  ["appearance-editor-and-logo-customization", "Material 3 appearance system, every-element editor, infinite color translator, presets, import/export, and app-logo customization"],
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

const allowedStatuses = new Set(["verified", "partial", "not-implemented", "unverified", "not-applicable"]);
const requiredSourceMarkers = Object.freeze([
  "export const UNIVERSAL_CONTRACT_EVIDENCE_KEYS",
  "export const UNIVERSAL_CONTRACT_INVENTORY",
  'id: "language-modes-and-school-mode"',
  'id: "complete-inventory-negative-regression"',
]);

function assertSourceContract(source) {
  for (const marker of requiredSourceMarkers) {
    assert.ok(source.includes(marker), `inventory metadata is missing ${marker}`);
  }
}

function assertDocumentationTable(source) {
  const sectionStart = source.indexOf("## Universal surface contract audit");
  const sectionEnd = source.indexOf("## Required evidence before a release claim", sectionStart);
  assert.ok(sectionStart >= 0, "the universal surface contract section must exist");
  assert.ok(sectionEnd > sectionStart, "the universal surface contract section must have a bounded end");

  const section = source.slice(sectionStart, sectionEnd);
  const rows = section
    .split(/\r?\n/)
    .filter((line) => line.startsWith("| ") && !line.startsWith("| ---") && !line.startsWith("| Canonical feature"));
  assert.equal(rows.length, expectedRows.length, "the documented universal-contract row count must stay exact");

  const titles = rows.map((line) => {
    const cells = line.slice(1, -1).split("|").map((cell) => cell.trim());
    assert.equal(cells.length, 5, "each universal-contract row must keep five auditable columns");
    for (const [index, cell] of cells.entries()) {
      assert.ok(cell.length > 0, `universal-contract row column ${index + 1} must not be empty`);
    }
    return cells[0];
  });
  assert.deepEqual(titles, expectedRows.map(([, title]) => title), "the documented canonical rows must stay explicit and ordered");
}

function assertEvidenceSlot(slot, rowId, evidenceKey) {
  assert.ok(slot && typeof slot === "object" && !Array.isArray(slot), `${rowId} must keep ${evidenceKey} evidence metadata`);
  assert.ok(allowedStatuses.has(slot.status), `${rowId} ${evidenceKey} must use a known evidence status`);
  assert.ok(Array.isArray(slot.paths) && slot.paths.length > 0, `${rowId} ${evidenceKey} must list at least one auditable path`);
  for (const path of slot.paths) {
    assert.equal(typeof path, "string", `${rowId} ${evidenceKey} paths must be strings`);
    assert.ok(existsSync(resolve(repositoryRoot, path)), `${rowId} ${evidenceKey} path is missing: ${path}`);
  }
  assert.equal(typeof slot.assertion, "string", `${rowId} ${evidenceKey} must keep an assertion`);
  assert.ok(slot.assertion.trim().length >= 20, `${rowId} ${evidenceKey} assertion is too short to be auditable`);

  if (evidenceKey === "persistence") {
    assert.equal(typeof slot.applicable, "boolean", `${rowId} persistence must declare applicability`);
    if (slot.applicable) {
      assert.notEqual(slot.status, "not-applicable", `${rowId} applicable persistence cannot be marked not-applicable`);
      assert.equal(slot.reason, undefined, `${rowId} applicable persistence must not carry a not-applicable reason`);
    } else {
      assert.equal(slot.status, "not-applicable", `${rowId} non-applicable persistence must be marked not-applicable`);
      assert.equal(typeof slot.reason, "string", `${rowId} non-applicable persistence must explain why`);
      assert.ok(slot.reason.trim().length >= 20, `${rowId} non-applicable persistence reason is too short`);
    }
  }
}

function assertInventory(inventory, documentationSource) {
  assertSourceContract(inventoryMetadataSource);
  assertDocumentationTable(documentationSource);
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
      ["evidence", "id", "title"],
      `${row.id} must not silently drop or add inventory fields`,
    );
    assert.deepEqual(
      Object.keys(row.evidence).sort(),
      [...UNIVERSAL_CONTRACT_EVIDENCE_KEYS].sort(),
      `${row.id} must keep every required evidence slot`,
    );
    for (const evidenceKey of UNIVERSAL_CONTRACT_EVIDENCE_KEYS) {
      assertEvidenceSlot(row.evidence[evidenceKey], row.id, evidenceKey);
    }
  }
}

function cloneInventory() {
  return structuredClone(UNIVERSAL_CONTRACT_INVENTORY);
}

assertSourceContract(inventoryMetadataSource);
assertInventory(UNIVERSAL_CONTRACT_INVENTORY, inventoryDocumentationSource);

let mutationCount = 0;
for (const marker of requiredSourceMarkers) {
  const removedSourceMarker = inventoryMetadataSource.replace(marker, "");
  assert.throws(
    () => assertSourceContract(removedSourceMarker),
    `removing metadata marker ${marker} must turn the inventory check red`,
  );
  mutationCount += 1;
}

for (let rowIndex = 0; rowIndex < UNIVERSAL_CONTRACT_INVENTORY.length; rowIndex += 1) {
  const removedRow = cloneInventory();
  removedRow.splice(rowIndex, 1);
  assert.throws(
    () => assertInventory(removedRow, inventoryDocumentationSource),
    `removing row ${expectedRows[rowIndex][0]} must turn the inventory check red`,
  );
  mutationCount += 1;

  for (const evidenceKey of UNIVERSAL_CONTRACT_EVIDENCE_KEYS) {
    const removedEvidence = cloneInventory();
    delete removedEvidence[rowIndex].evidence[evidenceKey];
    assert.throws(
      () => assertInventory(removedEvidence, inventoryDocumentationSource),
      `removing ${expectedRows[rowIndex][0]} ${evidenceKey} evidence must turn the inventory check red`,
    );
    mutationCount += 1;

    const removedAssertion = cloneInventory();
    delete removedAssertion[rowIndex].evidence[evidenceKey].assertion;
    assert.throws(
      () => assertInventory(removedAssertion, inventoryDocumentationSource),
      `removing ${expectedRows[rowIndex][0]} ${evidenceKey} assertion must turn the inventory check red`,
    );
    mutationCount += 1;
  }
}

for (const [, title] of expectedRows) {
  const removedDocumentationRow = inventoryDocumentationSource.replace(`| ${title} |`, "");
  assert.throws(
    () => assertInventory(UNIVERSAL_CONTRACT_INVENTORY, removedDocumentationRow),
    `removing the documented row ${title} must turn the inventory check red`,
  );
  mutationCount += 1;
}

assertInventory(UNIVERSAL_CONTRACT_INVENTORY, inventoryDocumentationSource);
console.log(`PASS: explicit universal-contract inventory, ${UNIVERSAL_CONTRACT_INVENTORY.length} canonical rows, ${UNIVERSAL_CONTRACT_EVIDENCE_KEYS.length} evidence slots per row, and ${mutationCount} remove/restore mutations`);
