import type { PersonalVocabularyEntryV1 } from "./universal-contracts";

// Keep the runtime helper dependency-free for both the browser bundle and the
// strip-types test runner. These are the parser's public v1 limits.
const PERSONAL_VOCABULARY_MAX_ENTRIES = 128;
const PERSONAL_VOCABULARY_MAX_STRING_LENGTH = 160;

export type PersonalVocabularyTextBoundary =
  | "ui"
  | "code"
  | "command"
  | "url"
  | "identifier"
  | "path"
  | "external";

export interface PersonalVocabularyTextOptions {
  readonly boundary?: PersonalVocabularyTextBoundary;
}

type ProtectedRange = {
  readonly start: number;
  readonly end: number;
};

const PROTECTED_TOKEN_PATTERNS: readonly RegExp[] = [
  /(?:https?|ftp):\/\/[^\s<>"']+/gi,
  /(["'])(?:[A-Za-z]:[\\/]|\\\\|\/(?:Users|home|etc|var|opt|tmp|Program Files)[\\/])[^"'\r\n]*\1/g,
  // Keep unquoted paths with spaces, commas, and semicolons intact too. A
  // comma or semicolon is part of the path when it touches a path token; when
  // followed by whitespace it remains a sentence delimiter for the next UI
  // phrase.
  /(?:[A-Za-z]:[\\/]|\\\\|\/(?:Users|home|etc|var|opt|tmp|Program Files)[\\/])(?:[^\s<>"'`,;]+|[,;](?=[^\s<>"'`,;]))+(?:[ \t]+(?:[^\s<>"'`,;]+|[,;](?=[^\s<>"'`,;]))+)*/g,
  /\b[A-Za-z_][A-Za-z0-9_]*=(?:"[^"]*"|'[^']*'|[^\s,;]+)/g,
  /#[0-9a-f]{6,8}\b/gi,
  /\b(?:v?\d+\.)+\d+(?:-[A-Za-z0-9.-]+)?\b/g,
  /\b\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:?\d{2})?)?\b/g,
  /\b[0-9a-f]{8,64}\b/gi,
  /\b(?:[A-Za-z0-9_-]+\.)+[A-Za-z0-9_/-]+\b/g,
  /\b(?:[A-Za-z0-9_-]+\/)+[A-Za-z0-9_.-]*\b/g,
];

function isValidEntryList(entries: readonly PersonalVocabularyEntryV1[]): boolean {
  if (!Array.isArray(entries) || entries.length > PERSONAL_VOCABULARY_MAX_ENTRIES) return false;
  const sources = new Set<string>();
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") return false;
    if (!Object.prototype.hasOwnProperty.call(entry, "source") || !Object.prototype.hasOwnProperty.call(entry, "replacement")) return false;
    if (Object.keys(entry).some((key) => key !== "source" && key !== "replacement")) return false;
    if (
      typeof entry.source !== "string"
      || entry.source.length === 0
      || entry.source.length > PERSONAL_VOCABULARY_MAX_STRING_LENGTH
      || /[\u0000-\u001f\u007f]/.test(entry.source)
      || typeof entry.replacement !== "string"
      || entry.replacement.length > PERSONAL_VOCABULARY_MAX_STRING_LENGTH
      || /[\u0000-\u001f\u007f]/.test(entry.replacement)
      || sources.has(entry.source)
    ) {
      return false;
    }
    sources.add(entry.source);
  }
  return true;
}

function collectProtectedRanges(text: string): ProtectedRange[] {
  const ranges: ProtectedRange[] = [];
  const collectDelimited = (opening: string, closing: string): void => {
    let cursor = 0;
    while (cursor < text.length) {
      const start = text.indexOf(opening, cursor);
      if (start < 0) return;
      const endStart = text.indexOf(closing, start + opening.length);
      const end = endStart < 0 ? text.length : endStart + closing.length;
      ranges.push({ start, end });
      cursor = end;
    }
  };

  // Mark authored code as one unit before token matching. This covers spaces
  // and punctuation that token-shaped expressions cannot safely infer.
  collectDelimited("```", "```");
  collectDelimited("`", "`");

  // Shell transcripts are factual external records even when the command
  // contains spaces, flags, URLs, or paths. Keep the prompted line exact.
  let lineStart = 0;
  while (lineStart < text.length) {
    const lineEnd = text.indexOf("\n", lineStart);
    const end = lineEnd < 0 ? text.length : lineEnd;
    const line = text.slice(lineStart, end);
    if (/^\s*(?:\$\s+|PS\s+[^>\r\n]+>\s+|>\s+)/.test(line)) {
      ranges.push({ start: lineStart, end });
    }
    lineStart = lineEnd < 0 ? text.length : lineEnd + 1;
  }

  for (const pattern of PROTECTED_TOKEN_PATTERNS) {
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      const start = match.index ?? 0;
      const token = match[0] ?? "";
      if (token) ranges.push({ start, end: start + token.length });
    }
  }
  ranges.sort((left, right) => left.start - right.start || right.end - left.end);

  const merged: ProtectedRange[] = [];
  for (const range of ranges) {
    const previous = merged.at(-1);
    if (!previous || range.start > previous.end) {
      merged.push(range);
    } else if (range.end > previous.end) {
      merged[merged.length - 1] = { start: previous.start, end: range.end };
    }
  }
  return merged;
}

function replaceInSegment(text: string, entries: readonly PersonalVocabularyEntryV1[]): string {
  if (!text || entries.length === 0) return text;
  const orderedEntries = [...entries].sort((left, right) => right.source.length - left.source.length);
  let result = "";
  let index = 0;
  while (index < text.length) {
    const entry = orderedEntries.find((candidate) => text.startsWith(candidate.source, index));
    if (!entry) {
      result += text[index] ?? "";
      index += 1;
      continue;
    }
    result += entry.replacement;
    index += entry.source.length;
  }
  return result;
}

/**
 * Applies already-validated private replacements to user-facing copy only.
 * Replacement is one-pass over the original text; generated replacement text
 * is never fed back through another entry. Protected tokens stay byte-for-byte
 * unchanged so labels cannot rewrite commands, URLs, paths, identifiers, code,
 * or factual external records.
 */
export function applyPersonalVocabularyReplacements(
  text: string,
  entries: readonly PersonalVocabularyEntryV1[],
  options: PersonalVocabularyTextOptions = {},
): string {
  const boundary = options.boundary ?? "ui";
  if (typeof text !== "string" || boundary !== "ui" || !isValidEntryList(entries) || entries.length === 0) return text;

  const protectedRanges = collectProtectedRanges(text);
  if (protectedRanges.length === 0) return replaceInSegment(text, entries);

  let result = "";
  let cursor = 0;
  for (const range of protectedRanges) {
    if (range.start > cursor) result += replaceInSegment(text.slice(cursor, range.start), entries);
    result += text.slice(range.start, range.end);
    cursor = range.end;
  }
  return result + replaceInSegment(text.slice(cursor), entries);
}
