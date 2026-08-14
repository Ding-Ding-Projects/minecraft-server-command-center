export const REGEX_SEARCH_LIMITS = {
  maxQueryCharacters: 160,
  maxPatternCharacters: 160,
  maxFlagsCharacters: 2,
  maxCandidateCharacters: 8192,
  maxResults: 64,
} as const;

export type RegexSearchMode = "plain" | "regex";

export interface RegexSearchOptions {
  readonly mode: RegexSearchMode;
  readonly query: string;
  readonly pattern?: string;
  readonly flags?: string;
}

export type RegexSearchResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly reason: string };

export function boundedResultLimit(requested?: number): number {
  const value = Number.isFinite(requested) ? Math.trunc(requested as number) : REGEX_SEARCH_LIMITS.maxResults;
  return Math.min(Math.max(1, value), REGEX_SEARCH_LIMITS.maxResults);
}

export function createBoundedSearchMatcher(
  options: RegexSearchOptions,
): RegexSearchResult<(text: string) => boolean> {
  if (options.query.length > REGEX_SEARCH_LIMITS.maxQueryCharacters) {
    return { ok: false, reason: "Search text is limited to 160 characters." };
  }

  if (options.mode === "plain") {
    const query = options.query.trim().toLocaleLowerCase();
    return {
      ok: true,
      value: (text: string) => query.length === 0 || text.slice(0, REGEX_SEARCH_LIMITS.maxCandidateCharacters).toLocaleLowerCase().includes(query),
    };
  }

  const pattern = options.pattern ?? options.query;
  if (pattern.length > REGEX_SEARCH_LIMITS.maxPatternCharacters) {
    return { ok: false, reason: "The regex pattern is limited to 160 characters." };
  }

  const flags = [...new Set((options.flags ?? "").split(""))];
  if (flags.length > REGEX_SEARCH_LIMITS.maxFlagsCharacters || flags.some((flag) => flag !== "i" && flag !== "m")) {
    return { ok: false, reason: "Only the local i and m regex flags are supported." };
  }

  try {
    const expression = new RegExp(pattern, flags.join(""));
    return {
      ok: true,
      value: (text: string) => {
        expression.lastIndex = 0;
        return expression.test(text.slice(0, REGEX_SEARCH_LIMITS.maxCandidateCharacters));
      },
    };
  } catch {
    return { ok: false, reason: "The regex pattern is invalid for the local JavaScript engine." };
  }
}
