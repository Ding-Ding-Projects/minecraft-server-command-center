import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  appendNotificationRecord,
  bulkDismissNotificationRecords,
  createNotificationRecord,
  dismissNotificationRecord,
  invertNotificationSelection,
  MAX_NOTIFICATION_RECORDS,
  parseNotificationCenter,
  serializeNotificationCenter,
} from "../src/renderer/notification-center.ts";

const repoRoot = resolve(process.cwd());
const readText = async (path) => (await readFile(resolve(repoRoot, path), "utf8")).replace(/\r\n/g, "\n");
const rendererSource = await readText("src/renderer/main.ts");
const htmlSource = await readText("src/renderer/index.html");
const moduleSource = await readText("src/renderer/notification-center.ts");

function assertSourceContract(source, markers, label) {
  for (const marker of markers) {
    assert.ok(source.includes(marker), `missing ${label} marker: ${marker}`);
  }
}

const rendererMarkers = [
  "function loadNotificationCenter(): void",
  "function persistNotificationCenter(): void",
  "function renderNotificationCenter(): void",
  "function dismissSelectedNotifications(): void",
  "notificationRegexBinding = bindAnchoredRegexBuilder({",
  'data-notification-action=\"dismiss-selected\"',
  "showSnackbar(message: string, tone?:",
];
const htmlMarkers = [
  'data-tab=\"notifications\"',
  'id=\"panel-notifications\"',
  'id=\"notification-record-list\"',
  'data-notification-action=\"select-all\"',
  'data-notification-action=\"invert\"',
  'data-notification-action=\"dismiss-selected\"',
  'aria-label=\"Desktop notification records\"',
];
const moduleMarkers = [
  "export function parseNotificationCenter",
  "export function serializeNotificationCenter",
  "export function dismissNotificationRecord",
  "export function bulkDismissNotificationRecords",
  "export function invertNotificationSelection",
  "export const MAX_NOTIFICATION_STORAGE_BYTES = 128 * 1024;",
];

assertSourceContract(rendererSource, rendererMarkers, "desktop notification renderer");
assertSourceContract(htmlSource, htmlMarkers, "desktop notification surface");
assertSourceContract(moduleSource, moduleMarkers, "desktop notification storage");

for (const marker of rendererMarkers) {
  const removed = rendererSource.replace(marker, "");
  assert.throws(
    () => assertSourceContract(removed, rendererMarkers, "desktop notification renderer"),
    `negative regression stayed green after removing ${marker}`,
  );
}
for (const marker of htmlMarkers) {
  const removed = htmlSource.replace(marker, "");
  assert.throws(
    () => assertSourceContract(removed, htmlMarkers, "desktop notification surface"),
    `negative regression stayed green after removing ${marker}`,
  );
}
for (const marker of moduleMarkers) {
  const removed = moduleSource.replace(marker, "");
  assert.throws(
    () => assertSourceContract(removed, moduleMarkers, "desktop notification storage"),
    `negative regression stayed green after removing ${marker}`,
  );
}

const active = createNotificationRecord({
  id: "desktop-notice-1",
  tone: "info",
  title: "Draft saved",
  detail: "The local draft was saved.",
  createdAt: "2026-08-14T12:00:00.000Z",
});
const reviewOnly = createNotificationRecord({
  id: "desktop-notice-2",
  tone: "warning",
  title: "Review only",
  detail: "This record cannot be dismissed.",
  dismissible: false,
  createdAt: "2026-08-14T12:01:00.000Z",
});
const dismissed = { ...active, id: "desktop-notice-3", dismissedAt: "2026-08-14T12:02:00.000Z" };
const state = { schemaVersion: 1, records: [active, reviewOnly, dismissed] };
const parsed = parseNotificationCenter(JSON.parse(serializeNotificationCenter(state)));
assert.equal(parsed.ok, true);
if (parsed.ok) assert.deepEqual(parsed.value.records, state.records);

assert.equal(parseNotificationCenter({ schemaVersion: 2, records: [] }).ok, false);
assert.equal(parseNotificationCenter({ schemaVersion: 1, records: [{ ...active, extra: true }] }).ok, false);
assert.equal(parseNotificationCenter({ schemaVersion: 1, records: [active, active] }).ok, false);
assert.equal(parseNotificationCenter({ schemaVersion: 1, records: [{ ...active, detail: "x".repeat(1201) }] }).ok, false);

assert.deepEqual(appendNotificationRecord([active], reviewOnly).map((record) => record.id), [reviewOnly.id, active.id]);
const capped = Array.from({ length: MAX_NOTIFICATION_RECORDS + 1 }, (_, index) => createNotificationRecord({
  id: `desktop-cap-${index}`,
  tone: "info",
  title: `Notice ${index}`,
  detail: "Bounded desktop record.",
  createdAt: "2026-08-14T12:00:00.000Z",
}));
assert.equal(appendNotificationRecord(capped, active).length, MAX_NOTIFICATION_RECORDS);

const dismissedOnce = dismissNotificationRecord([active, reviewOnly], active.id, "2026-08-14T12:03:00.000Z");
assert.equal(dismissedOnce[0].dismissedAt, "2026-08-14T12:03:00.000Z");
assert.equal(dismissedOnce[1].dismissedAt, null);
assert.deepEqual(invertNotificationSelection([active.id], [active.id, reviewOnly.id]), [reviewOnly.id]);

const bulk = bulkDismissNotificationRecords([active, reviewOnly, dismissed], [active.id, reviewOnly.id, dismissed.id], "2026-08-14T12:04:00.000Z");
assert.deepEqual(bulk.dismissedIds, [active.id]);
assert.equal(bulk.records[0].dismissedAt, "2026-08-14T12:04:00.000Z");
assert.equal(bulk.records[1].dismissedAt, null);
assert.equal(bulk.records[2].dismissedAt, dismissed.dismissedAt);

console.log("PASS: desktop notification-centre schema, local persistence, review, selection, bulk actions, and negative regressions");
