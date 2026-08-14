export const NOTIFICATION_SCHEMA_VERSION = 1 as const;
export const NOTIFICATION_STORAGE_KEY = "minecraft-server-command-center.desktop.notifications.v1";
export const MAX_NOTIFICATION_RECORDS = 100;
export const MAX_NOTIFICATION_ID_LENGTH = 96;
export const MAX_NOTIFICATION_TITLE_LENGTH = 180;
export const MAX_NOTIFICATION_DETAIL_LENGTH = 1200;
export const MAX_NOTIFICATION_STORAGE_BYTES = 128 * 1024;

export type NotificationTone = "warning" | "error" | "success" | "info";
export type NotificationView = "active" | "dismissed" | "all";
export type NotificationSelectScope = "view" | "all";

export type NotificationRecord = {
  id: string;
  tone: NotificationTone;
  title: string;
  detail: string;
  createdAt: string;
  dismissible: boolean;
  dismissedAt: string | null;
};

export type NotificationInput = Pick<NotificationRecord, "tone" | "title" | "detail"> & {
  dismissible?: boolean;
  id?: string;
  createdAt?: string;
};

export type NotificationCenterState = {
  schemaVersion: typeof NOTIFICATION_SCHEMA_VERSION;
  records: NotificationRecord[];
};

export type ParseResult =
  | { ok: true; value: NotificationCenterState }
  | { ok: false; reason: string };

const NOTIFICATION_TONES: readonly NotificationTone[] = ["warning", "error", "success", "info"];
const NOTIFICATION_RECORD_KEYS = ["id", "tone", "title", "detail", "createdAt", "dismissible", "dismissedAt"];
const NOTIFICATION_STATE_KEYS = ["schemaVersion", "records"];

export const EMPTY_NOTIFICATION_CENTER: NotificationCenterState = {
  schemaVersion: NOTIFICATION_SCHEMA_VERSION,
  records: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const keys = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return keys.length === sortedExpected.length && keys.every((key, index) => key === sortedExpected[index]);
}

function isBoundedText(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= maxLength;
}

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === "string" && value.length <= 40 && !Number.isNaN(Date.parse(value));
}

function isNotificationRecord(value: unknown): value is NotificationRecord {
  if (!isRecord(value) || !hasExactKeys(value, NOTIFICATION_RECORD_KEYS)) return false;
  return (
    isBoundedText(value.id, MAX_NOTIFICATION_ID_LENGTH) &&
    NOTIFICATION_TONES.includes(value.tone as NotificationTone) &&
    isBoundedText(value.title, MAX_NOTIFICATION_TITLE_LENGTH) &&
    isBoundedText(value.detail, MAX_NOTIFICATION_DETAIL_LENGTH) &&
    isIsoTimestamp(value.createdAt) &&
    typeof value.dismissible === "boolean" &&
    (value.dismissedAt === null || isIsoTimestamp(value.dismissedAt))
  );
}

export function parseNotificationCenter(value: unknown): ParseResult {
  if (!isRecord(value) || !hasExactKeys(value, NOTIFICATION_STATE_KEYS)) {
    return { ok: false, reason: "The desktop notification record did not match schema v1." };
  }
  if (value.schemaVersion !== NOTIFICATION_SCHEMA_VERSION || !Array.isArray(value.records)) {
    return { ok: false, reason: "The desktop notification record used an unsupported schema or shape." };
  }
  if (value.records.length > MAX_NOTIFICATION_RECORDS || !value.records.every(isNotificationRecord)) {
    return { ok: false, reason: "The desktop notification record exceeded its bounded record or field limits." };
  }
  const ids = value.records.map((record) => record.id);
  if (new Set(ids).size !== ids.length) {
    return { ok: false, reason: "The desktop notification record contained duplicate identifiers." };
  }
  return {
    ok: true,
    value: {
      schemaVersion: NOTIFICATION_SCHEMA_VERSION,
      records: value.records.map((record) => ({ ...record })),
    },
  };
}

export function serializeNotificationCenter(state: NotificationCenterState): string {
  const normalized: NotificationCenterState = {
    schemaVersion: NOTIFICATION_SCHEMA_VERSION,
    records: state.records.slice(0, MAX_NOTIFICATION_RECORDS),
  };
  const serialized = JSON.stringify(normalized);
  if (new TextEncoder().encode(serialized).byteLength > MAX_NOTIFICATION_STORAGE_BYTES) {
    throw new Error("The local desktop notification record exceeded its storage bound.");
  }
  return serialized;
}

function makeNotificationId(): string {
  return `desktop-notification-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createNotificationRecord(input: NotificationInput, now = new Date()): NotificationRecord {
  const record: NotificationRecord = {
    id: input.id ?? makeNotificationId(),
    tone: input.tone,
    title: input.title,
    detail: input.detail,
    createdAt: input.createdAt ?? now.toISOString(),
    dismissible: input.dismissible ?? true,
    dismissedAt: null,
  };
  if (!isNotificationRecord(record)) throw new Error("Desktop notification content exceeded its bounded local contract.");
  return record;
}

export function appendNotificationRecord(records: readonly NotificationRecord[], record: NotificationRecord): NotificationRecord[] {
  return [record, ...records].slice(0, MAX_NOTIFICATION_RECORDS);
}

export function dismissNotificationRecord(
  records: readonly NotificationRecord[],
  id: string,
  dismissedAt = new Date().toISOString(),
): NotificationRecord[] {
  return records.map((record) =>
    record.id === id && record.dismissible && record.dismissedAt === null
      ? { ...record, dismissedAt }
      : record,
  );
}

export function invertNotificationSelection(selectedIds: readonly string[], targetIds: readonly string[]): string[] {
  const selected = new Set(selectedIds);
  for (const id of targetIds) {
    if (selected.has(id)) selected.delete(id);
    else selected.add(id);
  }
  return [...selected];
}

export function bulkDismissNotificationRecords(
  records: readonly NotificationRecord[],
  selectedIds: readonly string[],
  dismissedAt = new Date().toISOString(),
): { records: NotificationRecord[]; dismissedIds: string[] } {
  const selected = new Set(selectedIds);
  const dismissedIds: string[] = [];
  const nextRecords = records.map((record) => {
    if (!selected.has(record.id) || !record.dismissible || record.dismissedAt !== null) return record;
    dismissedIds.push(record.id);
    return { ...record, dismissedAt };
  });
  return { records: nextRecords, dismissedIds };
}
