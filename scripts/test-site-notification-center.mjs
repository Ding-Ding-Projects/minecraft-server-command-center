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
} from "../site/app/notification-center.ts";

const repoRoot = resolve(process.cwd());
const readText = async (path) => (await readFile(resolve(repoRoot, path), "utf8")).replace(/\r\n/g, "\n");
const pageSource = await readText("site/app/page.tsx");
const moduleSource = await readText("site/app/notification-center.ts");

const requiredPageMarkers = [
  'id: "notifications",\n    label: "Notification centre",',
  "const notificationPage = (",
  "bulkDismissNotificationRecords(notificationRecords, selectedNotificationIds)",
  "onClick={dismissSelectedNotifications}",
  'aria-label="Notification records"',
];

function assertSourceContract(source, markers, label) {
  for (const marker of markers) {
    assert.ok(source.includes(marker), `missing ${label} marker: ${marker}`);
  }
}

assertSourceContract(pageSource, requiredPageMarkers, "notification-centre");
for (const marker of requiredPageMarkers) {
  const removed = pageSource.replace(marker, "");
  assert.throws(
    () => assertSourceContract(removed, requiredPageMarkers, "notification-centre"),
    `negative regression stayed green after removing ${marker}`,
  );
}

assertSourceContract(moduleSource, [
  "export function parseNotificationCenter",
  "export function serializeNotificationCenter",
  "export function dismissNotificationRecord",
  "export function bulkDismissNotificationRecords",
  "export function invertNotificationSelection",
], "notification storage");

const first = createNotificationRecord({
  id: "notice-1",
  tone: "info",
  title: "Planner opened",
  detail: "The planner stayed local.",
  createdAt: "2026-08-14T12:00:00.000Z",
});
const second = createNotificationRecord({
  id: "notice-2",
  tone: "warning",
  title: "Review needed",
  detail: "The draft has one blocker.",
  createdAt: "2026-08-14T12:01:00.000Z",
});
const dismissed = { ...second, dismissedAt: "2026-08-14T12:02:00.000Z" };
const state = { schemaVersion: 1, records: [first, dismissed] };
const parsed = parseNotificationCenter(JSON.parse(serializeNotificationCenter(state)));
assert.equal(parsed.ok, true);
if (parsed.ok) assert.deepEqual(parsed.value.records, state.records);

assert.equal(parseNotificationCenter({ schemaVersion: 2, records: [] }).ok, false);
assert.equal(parseNotificationCenter({ schemaVersion: 1, records: [{ ...first, extra: true }] }).ok, false);
assert.equal(parseNotificationCenter({ schemaVersion: 1, records: [first, first] }).ok, false);
assert.equal(parseNotificationCenter({ schemaVersion: 1, records: [{ ...first, title: "x".repeat(181) }] }).ok, false);

const appended = appendNotificationRecord([first], second);
assert.deepEqual(appended.map((record) => record.id), ["notice-2", "notice-1"]);
const capped = Array.from({ length: MAX_NOTIFICATION_RECORDS + 1 }, (_, index) => createNotificationRecord({
  id: `cap-${index}`,
  tone: "info",
  title: `Notice ${index}`,
  detail: "Bounded record.",
  createdAt: "2026-08-14T12:00:00.000Z",
}));
assert.equal(appendNotificationRecord(capped, first).length, MAX_NOTIFICATION_RECORDS);

const dismissedOnce = dismissNotificationRecord([first, dismissed], "notice-1", "2026-08-14T12:03:00.000Z");
assert.equal(dismissedOnce[0].dismissedAt, "2026-08-14T12:03:00.000Z");
assert.equal(dismissedOnce[1].dismissedAt, dismissed.dismissedAt);

assert.deepEqual(invertNotificationSelection(["notice-1"], ["notice-1", "notice-2"]), ["notice-2"]);
const bulk = bulkDismissNotificationRecords([first, dismissed], ["notice-1", "notice-2"], "2026-08-14T12:04:00.000Z");
assert.deepEqual(bulk.dismissedIds, ["notice-1"]);
assert.equal(bulk.records[0].dismissedAt, "2026-08-14T12:04:00.000Z");
assert.equal(bulk.records[1].dismissedAt, dismissed.dismissedAt);

console.log("PASS: site notification-centre persistence, review, bulk actions, and negative regressions");
