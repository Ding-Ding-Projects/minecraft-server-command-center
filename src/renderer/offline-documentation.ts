import {
  renderOfflineMarkdown,
  resolveOfflineArticleLink,
  searchOfflineDocumentation,
  type OfflineDocumentationArticle,
} from "../shared/offline-documentation";
import { OFFLINE_DOCUMENTATION_REGISTRY } from "./offline-documentation-registry";

const searchInput = document.querySelector<HTMLInputElement>("#offline-docs-search");
const regexToggle = document.querySelector<HTMLButtonElement>("#offline-docs-regex-toggle");
const regexBuilder = document.querySelector<HTMLElement>("#offline-docs-regex-builder");
const regexPattern = document.querySelector<HTMLInputElement>("#offline-docs-regex-pattern");
const regexIgnoreCase = document.querySelector<HTMLInputElement>("#offline-docs-regex-ignore-case");
const regexStatus = document.querySelector<HTMLElement>("#offline-docs-regex-status");
const resultCount = document.querySelector<HTMLElement>("#offline-docs-result-count");
const resultList = document.querySelector<HTMLElement>("#offline-docs-result-list");
const articleTitle = document.querySelector<HTMLElement>("#offline-docs-article-title");
const articleSource = document.querySelector<HTMLElement>("#offline-docs-article-source");
const articleBody = document.querySelector<HTMLElement>("#offline-docs-article-body");
const articleState = document.querySelector<HTMLElement>("#offline-docs-article-state");

if (!searchInput || !regexToggle || !regexBuilder || !regexPattern || !regexIgnoreCase || !regexStatus || !resultCount || !resultList || !articleTitle || !articleSource || !articleBody || !articleState) {
  throw new Error("The desktop renderer is missing an offline documentation element.");
}

let regexMode = false;
let selectedArticleId = OFFLINE_DOCUMENTATION_REGISTRY.articles[0]?.id ?? "";

function selectedArticle(): OfflineDocumentationArticle | undefined {
  return OFFLINE_DOCUMENTATION_REGISTRY.articles.find((article) => article.id === selectedArticleId);
}

function renderArticle(article: OfflineDocumentationArticle, fragment: string | null = null): void {
  selectedArticleId = article.id;
  articleTitle.textContent = article.title;
  articleSource.textContent = `${article.sourcePath} · bundled locally · no network fetch`;
  articleBody.innerHTML = renderOfflineMarkdown(article.markdown, {
    resolveLink: (href) => resolveOfflineArticleLink(href, article.sourcePath, OFFLINE_DOCUMENTATION_REGISTRY),
  });
  articleState.textContent = `Showing ${article.title}. Local article links stay inside this browser.`;
  for (const item of resultList.querySelectorAll<HTMLButtonElement>("[data-offline-article-id]")) {
    const selected = item.dataset.offlineArticleId === article.id;
    item.classList.toggle("is-selected", selected);
    if (selected) item.setAttribute("aria-current", "page");
    else item.removeAttribute("aria-current");
  }
  if (fragment) {
    window.requestAnimationFrame(() => {
      const heading = Array.from(articleBody.querySelectorAll<HTMLElement>("[id]")).find((candidate) => candidate.id === fragment);
      heading?.scrollIntoView({ block: "start" });
    });
  }
}

function renderResults(): void {
  const search = searchOfflineDocumentation(OFFLINE_DOCUMENTATION_REGISTRY, {
    mode: regexMode ? "regex" : "plain",
    query: searchInput.value,
    pattern: regexPattern.value,
    flags: regexIgnoreCase.checked ? "i" : "",
  });
  resultList.replaceChildren();
  if (!search.ok) {
    resultCount.textContent = "No results";
    regexStatus.textContent = search.reason;
    const empty = document.createElement("p");
    empty.className = "offline-docs-empty";
    empty.textContent = search.reason;
    resultList.append(empty);
    return;
  }
  if (regexMode) {
    regexStatus.textContent = regexPattern.value.length === 0
      ? "Regex mode is ready. Add a bounded pattern or choose a token."
      : "Pattern runs locally against article titles and Markdown bodies.";
  } else {
    regexStatus.textContent = "Plain text search is active. Regex is an explicit local opt-in.";
  }
  resultCount.textContent = `${search.value.length} article${search.value.length === 1 ? "" : "s"}`;
  if (search.value.length === 0) {
    const empty = document.createElement("p");
    empty.className = "offline-docs-empty";
    empty.textContent = "No local articles match this search.";
    resultList.append(empty);
    return;
  }
  for (const article of search.value) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "offline-docs-result";
    item.dataset.offlineArticleId = article.id;
    item.setAttribute("aria-label", `Open documentation article ${article.title}`);
    if (article.id === selectedArticleId) item.setAttribute("aria-current", "page");
    if (article.id === selectedArticleId) item.classList.add("is-selected");
    const title = document.createElement("strong");
    const source = document.createElement("small");
    title.textContent = article.title;
    source.textContent = article.sourcePath;
    item.append(title, source);
    resultList.append(item);
  }
}

function openArticle(articleId: string, fragment: string | null = null): void {
  const article = OFFLINE_DOCUMENTATION_REGISTRY.articles.find((candidate) => candidate.id === articleId);
  if (!article) {
    articleState.textContent = "That local article is unavailable in this bundle.";
    return;
  }
  renderArticle(article, fragment);
}

function setRegexMode(enabled: boolean): void {
  regexMode = enabled;
  if (regexMode && regexPattern.value.length === 0) regexPattern.value = searchInput.value.slice(0, 160);
  regexToggle.setAttribute("aria-expanded", String(regexMode));
  regexBuilder.hidden = !regexMode;
  if (regexMode) regexPattern.focus();
  renderResults();
}

export function bindOfflineDocumentation(): void {
  searchInput.addEventListener("input", () => {
    if (regexMode) regexPattern.value = searchInput.value.slice(0, 160);
    renderResults();
  });
  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") event.preventDefault();
  });
  regexPattern.addEventListener("input", () => {
    if (regexMode) searchInput.value = regexPattern.value.slice(0, 160);
    renderResults();
  });
  regexPattern.addEventListener("keydown", (event) => {
    if (event.key === "Enter") event.preventDefault();
  });
  regexIgnoreCase.addEventListener("change", renderResults);
  regexToggle.addEventListener("click", () => setRegexMode(!regexMode));
  for (const token of regexBuilder.querySelectorAll<HTMLButtonElement>("[data-docs-regex-token]")) {
    token.addEventListener("click", () => {
      setRegexMode(true);
      regexPattern.value = `${regexPattern.value}${token.dataset.docsRegexToken ?? ""}`.slice(0, 160);
      searchInput.value = regexPattern.value;
      renderResults();
      regexPattern.focus();
    });
  }
  resultList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const item = target.closest<HTMLButtonElement>("[data-offline-article-id]");
    if (item?.dataset.offlineArticleId) openArticle(item.dataset.offlineArticleId);
  });
  articleBody.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest<HTMLElement>("[data-offline-article-link]");
    if (!link?.dataset.offlineArticleLink) return;
    event.preventDefault();
    openArticle(link.dataset.offlineArticleLink, link.dataset.offlineFragment ?? null);
  });
  const article = selectedArticle();
  if (article) renderArticle(article);
  renderResults();
}
