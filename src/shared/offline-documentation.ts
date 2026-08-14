import { boundedResultLimit, createBoundedSearchMatcher, REGEX_SEARCH_LIMITS } from "./regex-search.ts";

export const OFFLINE_DOCUMENTATION_SCHEMA_VERSION = 1 as const;

export const OFFLINE_DOCUMENTATION_LIMITS = {
  maxArticles: 64,
  maxArticleIdLength: 96,
  maxTitleLength: 160,
  maxSourcePathLength: 240,
  maxMarkdownCharacters: 64 * 1024,
  maxTotalMarkdownCharacters: 256 * 1024,
  maxSearchCharacters: REGEX_SEARCH_LIMITS.maxQueryCharacters,
  maxRegexPatternCharacters: REGEX_SEARCH_LIMITS.maxPatternCharacters,
  maxCandidateCharacters: REGEX_SEARCH_LIMITS.maxCandidateCharacters,
  maxResults: REGEX_SEARCH_LIMITS.maxResults,
  maxLinkCharacters: 512,
} as const;

export interface OfflineDocumentationArticle {
  readonly id: string;
  readonly title: string;
  readonly sourcePath: string;
  readonly markdown: string;
}

export interface OfflineDocumentationRegistry {
  readonly schemaVersion: typeof OFFLINE_DOCUMENTATION_SCHEMA_VERSION;
  readonly articles: readonly OfflineDocumentationArticle[];
}

export type OfflineDocumentationSearchMode = "plain" | "regex";

export interface OfflineDocumentationSearchOptions {
  readonly mode: OfflineDocumentationSearchMode;
  readonly query: string;
  readonly pattern?: string;
  readonly flags?: string;
  readonly maxResults?: number;
}

export type OfflineDocumentationResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly reason: string };

export interface OfflineArticleLinkTarget {
  readonly articleId: string;
  readonly fragment: string | null;
}

export interface OfflineMarkdownRenderOptions {
  readonly resolveLink?: (href: string) => OfflineArticleLinkTarget | null;
}

function boundedText(value: string, maximum: number, label: string): string {
  if (value.length === 0 || value.length > maximum) {
    throw new Error(`${label} is empty or exceeds its bounded length.`);
  }
  return value;
}

function assertArticlePath(sourcePath: string): void {
  if (sourcePath.startsWith("docs/site/") || sourcePath.includes("\\") || sourcePath.includes("..")) {
    throw new Error("Offline documentation source paths must stay inside the desktop docs tree.");
  }
  if (!sourcePath.startsWith("docs/") || !sourcePath.endsWith(".md")) {
    throw new Error("Offline documentation source paths must be Markdown files below docs/.");
  }
}

function normalizeArticle(article: OfflineDocumentationArticle): OfflineDocumentationArticle {
  const id = boundedText(article.id, OFFLINE_DOCUMENTATION_LIMITS.maxArticleIdLength, "The article id");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
    throw new Error("Offline documentation article ids must be lowercase kebab-case.");
  }
  const title = boundedText(article.title, OFFLINE_DOCUMENTATION_LIMITS.maxTitleLength, "The article title");
  const sourcePath = boundedText(article.sourcePath, OFFLINE_DOCUMENTATION_LIMITS.maxSourcePathLength, "The article source path");
  assertArticlePath(sourcePath);
  const markdown = boundedText(article.markdown, OFFLINE_DOCUMENTATION_LIMITS.maxMarkdownCharacters, "The article Markdown");
  return Object.freeze({ id, title, sourcePath, markdown });
}

export function createOfflineDocumentationRegistry(
  articles: readonly OfflineDocumentationArticle[],
): OfflineDocumentationRegistry {
  if (articles.length === 0 || articles.length > OFFLINE_DOCUMENTATION_LIMITS.maxArticles) {
    throw new Error("The offline documentation registry is empty or exceeds its article limit.");
  }
  const normalized = articles.map(normalizeArticle);
  const ids = new Set<string>();
  const sourcePaths = new Set<string>();
  let totalCharacters = 0;
  for (const article of normalized) {
    if (ids.has(article.id) || sourcePaths.has(article.sourcePath)) {
      throw new Error("Offline documentation article ids and source paths must be unique.");
    }
    ids.add(article.id);
    sourcePaths.add(article.sourcePath);
    totalCharacters += article.markdown.length;
  }
  if (totalCharacters > OFFLINE_DOCUMENTATION_LIMITS.maxTotalMarkdownCharacters) {
    throw new Error("The offline documentation bundle exceeds its total Markdown limit.");
  }
  return Object.freeze({
    schemaVersion: OFFLINE_DOCUMENTATION_SCHEMA_VERSION,
    articles: Object.freeze(normalized),
  });
}

function searchText(article: OfflineDocumentationArticle): string {
  return `${article.title}\n${article.markdown}`;
}

export function searchOfflineDocumentation(
  registry: OfflineDocumentationRegistry,
  options: OfflineDocumentationSearchOptions,
): OfflineDocumentationResult<readonly OfflineDocumentationArticle[]> {
  const matcher = createBoundedSearchMatcher(options);
  if (!matcher.ok) return matcher;
  const matches = registry.articles.filter((article) => matcher.value(searchText(article)));
  return { ok: true, value: matches.slice(0, boundedResultLimit(options.maxResults)) };
}

function normalizeDocumentationPath(path: string): string | null {
  const output: string[] = [];
  for (const segment of path.replaceAll("\\", "/").split("/")) {
    if (segment.length === 0 || segment === ".") continue;
    if (segment === "..") {
      if (output.length === 0) return null;
      output.pop();
      continue;
    }
    if (!/^[A-Za-z0-9._-]+$/.test(segment)) return null;
    output.push(segment);
  }
  return output.join("/");
}

function decodeFragment(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

export function slugifyOfflineHeading(value: string): string {
  const slug = value
    .replace(/[`*_~]/g, "")
    .replace(/!?\[([^\]]+)\]\([^)]*\)/g, "$1")
    .trim()
    .toLocaleLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
  return slug || "section";
}

export function resolveOfflineArticleLink(
  href: string,
  currentSourcePath: string,
  registry: OfflineDocumentationRegistry,
): OfflineArticleLinkTarget | null {
  if (href.length === 0 || href.length > OFFLINE_DOCUMENTATION_LIMITS.maxLinkCharacters) return null;
  const trimmed = href.trim();
  if (/^(?:https?:|mailto:|data:|javascript:|\/\/)/i.test(trimmed)) return null;
  const hashIndex = trimmed.indexOf("#");
  const pathPart = hashIndex >= 0 ? trimmed.slice(0, hashIndex) : trimmed;
  const rawFragment = hashIndex >= 0 ? trimmed.slice(hashIndex + 1) : "";
  if (pathPart.includes("?")) return null;
  const current = normalizeDocumentationPath(currentSourcePath);
  if (!current || !current.endsWith(".md")) return null;
  const currentArticle = registry.articles.find((article) => article.sourcePath === current);
  if (!currentArticle) return null;
  const targetPath = pathPart.length === 0
    ? current
    : normalizeDocumentationPath([...current.split("/").slice(0, -1), pathPart].join("/"));
  if (!targetPath || !targetPath.startsWith("docs/") || targetPath.startsWith("docs/site/")) return null;
  const target = registry.articles.find((article) => article.sourcePath === targetPath);
  if (!target) return null;
  const decodedFragment = decodeFragment(rawFragment);
  return {
    articleId: target.id,
    fragment: decodedFragment && decodedFragment.length > 0 ? slugifyOfflineHeading(decodedFragment) : null,
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

interface ParsedLink {
  readonly label: string;
  readonly href: string;
  readonly end: number;
}

function parseInlineLink(text: string, start: number, image: boolean): ParsedLink | null {
  const labelStart = image ? start + 2 : start + 1;
  const labelEnd = text.indexOf("](", labelStart);
  if (labelEnd < 0) return null;
  const end = text.indexOf(")", labelEnd + 2);
  if (end < 0) return null;
  const href = text.slice(labelEnd + 2, end).trim().split(/\s+/)[0] ?? "";
  return { label: text.slice(labelStart, labelEnd), href, end: end + 1 };
}

function renderInlineMarkdown(
  text: string,
  options: OfflineMarkdownRenderOptions,
  depth = 0,
): string {
  if (depth > 3) return escapeHtml(text);
  let html = "";
  let plain = "";
  const flushPlain = (): void => {
    if (plain.length > 0) html += escapeHtml(plain);
    plain = "";
  };
  for (let index = 0; index < text.length;) {
    if (text[index] === "`" && text.indexOf("`", index + 1) > index + 1) {
      const end = text.indexOf("`", index + 1);
      flushPlain();
      html += `<code>${escapeHtml(text.slice(index + 1, end))}</code>`;
      index = end + 1;
      continue;
    }
    const image = text.startsWith("![", index);
    const link = image || text[index] === "[" ? parseInlineLink(text, index, image) : null;
    if (link) {
      flushPlain();
      const label = renderInlineMarkdown(link.label, options, depth + 1);
      if (image) {
        html += `<span class="offline-doc-media-unavailable">Image omitted offline: ${label}</span>`;
      } else {
        const target = options.resolveLink?.(link.href) ?? null;
        if (!target) {
          html += `<span class="offline-doc-link offline-doc-link--unavailable">${label} <span class="offline-doc-link__note">Unavailable offline</span></span>`;
        } else {
          const fragment = target.fragment ? ` data-offline-fragment="${escapeHtml(target.fragment)}"` : "";
          html += `<a class="offline-doc-link" href="#offline-doc-${escapeHtml(target.articleId)}" data-offline-article-link="${escapeHtml(target.articleId)}"${fragment}>${label}</a>`;
        }
      }
      index = link.end;
      continue;
    }
    if (text.startsWith("**", index) || text.startsWith("__", index)) {
      const marker = text.slice(index, index + 2);
      const end = text.indexOf(marker, index + 2);
      if (end > index + 2) {
        flushPlain();
        html += `<strong>${renderInlineMarkdown(text.slice(index + 2, end), options, depth + 1)}</strong>`;
        index = end + 2;
        continue;
      }
    }
    if (text[index] === "*" || text[index] === "_") {
      const marker = text[index];
      if (marker) {
        const end = text.indexOf(marker, index + 1);
        if (end > index + 1) {
          flushPlain();
          html += `<em>${renderInlineMarkdown(text.slice(index + 1, end), options, depth + 1)}</em>`;
          index = end + 1;
          continue;
        }
      }
    }
    if (text.startsWith("~~", index)) {
      const end = text.indexOf("~~", index + 2);
      if (end > index + 2) {
        flushPlain();
        html += `<del>${renderInlineMarkdown(text.slice(index + 2, end), options, depth + 1)}</del>`;
        index = end + 2;
        continue;
      }
    }
    plain += text[index] ?? "";
    index += 1;
  }
  flushPlain();
  return html;
}

export function renderOfflineMarkdown(
  markdown: string,
  options: OfflineMarkdownRenderOptions = {},
): string {
  const lines = markdown.slice(0, OFFLINE_DOCUMENTATION_LIMITS.maxMarkdownCharacters).replace(/\r\n?/g, "\n").split("\n");
  const output: string[] = [];
  const paragraph: string[] = [];
  const listItems: string[] = [];
  const quoteLines: string[] = [];
  let listKind: "ul" | "ol" | null = null;
  let fenceMarker: string | null = null;
  let fenceLanguage = "";
  const codeLines: string[] = [];
  const headingCounts = new Map<string, number>();

  const flushParagraph = (): void => {
    if (paragraph.length === 0) return;
    output.push(`<p>${renderInlineMarkdown(paragraph.join(" "), options)}</p>`);
    paragraph.length = 0;
  };
  const flushList = (): void => {
    if (!listKind) return;
    output.push(`<${listKind}>${listItems.map((item) => `<li>${item}</li>`).join("")}</${listKind}>`);
    listItems.length = 0;
    listKind = null;
  };
  const flushQuote = (): void => {
    if (quoteLines.length === 0) return;
    output.push(`<blockquote>${renderOfflineMarkdown(quoteLines.join("\n"), options)}</blockquote>`);
    quoteLines.length = 0;
  };
  const flushBlocks = (): void => {
    flushParagraph();
    flushList();
    flushQuote();
  };
  const flushCode = (): void => {
    const languageClass = fenceLanguage && /^[A-Za-z0-9_-]{1,32}$/.test(fenceLanguage)
      ? ` class="language-${escapeHtml(fenceLanguage)}"`
      : "";
    output.push(`<pre><code${languageClass}>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
    codeLines.length = 0;
    fenceLanguage = "";
  };

  for (const line of lines) {
    if (fenceMarker) {
      if (line.trim().startsWith(fenceMarker)) {
        flushCode();
        fenceMarker = null;
      } else {
        codeLines.push(line);
      }
      continue;
    }
    const fence = line.match(/^\s{0,3}(```+|~~~+)(.*)$/);
    if (fence) {
      flushBlocks();
      fenceMarker = fence[1] ?? "```";
      fenceLanguage = (fence[2] ?? "").trim().split(/\s+/)[0] ?? "";
      continue;
    }
    if (/^\s{0,3}(?:[-*_]\s*){3,}$/.test(line)) {
      flushBlocks();
      output.push("<hr>");
      continue;
    }
    const heading = line.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (heading) {
      flushBlocks();
      const level = Math.min(6, heading[1]?.length ?? 1);
      const content = heading[2] ?? "";
      const baseSlug = slugifyOfflineHeading(content);
      const count = headingCounts.get(baseSlug) ?? 0;
      headingCounts.set(baseSlug, count + 1);
      const slug = count === 0 ? baseSlug : `${baseSlug}-${count + 1}`;
      output.push(`<h${level} id="${escapeHtml(slug)}">${renderInlineMarkdown(content, options)}</h${level}>`);
      continue;
    }
    const quote = line.match(/^\s{0,3}>\s?(.*)$/);
    if (quote) {
      flushParagraph();
      flushList();
      quoteLines.push(quote[1] ?? "");
      continue;
    }
    if (quoteLines.length > 0) flushQuote();
    const list = line.match(/^\s{0,3}([-+*]|\d+[.)])\s+(.+)$/);
    if (list) {
      flushParagraph();
      const nextKind: "ul" | "ol" = /^\d/.test(list[1] ?? "") ? "ol" : "ul";
      if (listKind && listKind !== nextKind) flushList();
      listKind = nextKind;
      listItems.push(renderInlineMarkdown(list[2] ?? "", options));
      continue;
    }
    if (listItems.length > 0) flushList();
    if (line.trim().length === 0) {
      flushParagraph();
      continue;
    }
    paragraph.push(line.trim());
  }
  if (fenceMarker) flushCode();
  flushBlocks();
  return output.join("");
}
