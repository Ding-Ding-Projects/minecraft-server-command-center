import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import {
  createOfflineDocumentationRegistry,
  OFFLINE_DOCUMENTATION_LIMITS,
  renderOfflineMarkdown,
  resolveOfflineArticleLink,
  searchOfflineDocumentation,
  slugifyOfflineHeading,
} from "../src/shared/offline-documentation.ts";

const repositoryRoot = resolve(process.cwd());
const registryPath = resolve(repositoryRoot, "src/renderer/offline-documentation-registry.ts");
const registrySource = await readFile(registryPath, "utf8");

// This is deliberately hand-written. A discovered list cannot detect an article
// that disappeared from the registry because it only describes what it finds.
const expectedArticlePaths = [
  "docs/README.md",
  "docs/architecture/README.md",
  "docs/architecture/desktop-foundation.md",
  "docs/reference/README.md",
  "docs/reference/desktop-presentation-settings.md",
  "docs/reference/java-runtime-setup.md",
  "docs/reference/notification-centre.md",
  "docs/reference/npm-security-audit.md",
  "docs/reference/offline-documentation-browser.md",
  "docs/reference/paper-spigot-cli-catalog.md",
  "docs/reference/release-dim-sum-metadata.md",
  "docs/reference/server-artifact-provisioning.md",
  "docs/reference/server-configuration-schema.md",
  "docs/reference/server-configuration-writer.md",
  "docs/reference/server-lifecycle.md",
  "docs/reference/universal-settings.md",
  "docs/reference/unsigned-automatic-updates.md",
  "docs/server-configuration/README.md",
  "docs/server-configuration/paper-spigot-cli.md",
  "docs/verification/README.md",
  "docs/verification/artifact-path-verification.md",
  "docs/verification/completeness-inventory.md",
  "docs/verification/release-line-count.md",
  "docs/verification/release-publication-timing.md",
];

async function collectMarkdown(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = [];
  for (const entry of entries) {
    const absolute = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "site") continue;
      paths.push(...await collectMarkdown(absolute));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".md")) {
      paths.push(relative(repositoryRoot, absolute).replaceAll("\\", "/"));
    }
  }
  return paths;
}

function assertRegistryCompleteness(source) {
  assert.ok(source.includes("createOfflineDocumentationRegistry(articles)"), "registry must construct the typed registry");
  for (const sourcePath of expectedArticlePaths) {
    assert.ok(source.includes(`sourcePath: "${sourcePath}"`), `registry is missing ${sourcePath}`);
  }
  assert.equal(
    source.match(/sourcePath: "/g)?.length,
    expectedArticlePaths.length,
    "registry source path count must match the hand-written article list",
  );
  assert.doesNotMatch(source, /docs\/site\//, "desktop registry must not bundle companion-site articles");
}

assertRegistryCompleteness(registrySource);
const removedMarker = registrySource.replace(`sourcePath: "${expectedArticlePaths[0]}"`, "");
assert.throws(() => assertRegistryCompleteness(removedMarker), "removing one exact registry marker must turn the completeness check red");

const discoveredArticlePaths = (await collectMarkdown(resolve(repositoryRoot, "docs"))).sort();
assert.deepEqual(discoveredArticlePaths, [...expectedArticlePaths].sort(), "hand-written registry list must cover every desktop Markdown article and no site article");

const fixture = createOfflineDocumentationRegistry([
  {
    id: "docs-readme",
    title: "Documentation",
    sourcePath: "docs/README.md",
    markdown: "# Documentation\n\nJava runtime setup is local guidance.\n\n[Runtime](reference/runtime.md)",
  },
  {
    id: "reference-runtime",
    title: "Runtime",
    sourcePath: "docs/reference/runtime.md",
    markdown: "# Runtime\n\nPaper setup stays bounded.",
  },
]);

assert.equal(fixture.schemaVersion, 1);
assert.equal(fixture.articles.length, 2);
assert.equal(searchOfflineDocumentation(fixture, { mode: "plain", query: "java" }).ok, true);
const plain = searchOfflineDocumentation(fixture, { mode: "plain", query: "paper" });
assert.equal(plain.ok, true);
if (plain.ok) assert.deepEqual(plain.value.map((article) => article.id), ["reference-runtime"]);
const regex = searchOfflineDocumentation(fixture, { mode: "regex", query: "", pattern: "^Runtime", flags: "i" });
assert.equal(regex.ok, true);
if (regex.ok) assert.deepEqual(regex.value.map((article) => article.id), ["reference-runtime"]);
assert.equal(searchOfflineDocumentation(fixture, { mode: "regex", query: "", pattern: "[", flags: "i" }).ok, false);
assert.equal(searchOfflineDocumentation(fixture, { mode: "regex", query: "", pattern: "x".repeat(OFFLINE_DOCUMENTATION_LIMITS.maxRegexPatternCharacters + 1) }).ok, false);
assert.equal(searchOfflineDocumentation(fixture, { mode: "plain", query: "x".repeat(OFFLINE_DOCUMENTATION_LIMITS.maxSearchCharacters + 1) }).ok, false);

const localTarget = resolveOfflineArticleLink("reference/runtime.md#Runtime", "docs/README.md", fixture);
assert.deepEqual(localTarget, { articleId: "reference-runtime", fragment: "runtime" });
assert.equal(resolveOfflineArticleLink("https://example.test/runtime", "docs/README.md", fixture), null);
assert.equal(resolveOfflineArticleLink("../site/private.md", "docs/reference/runtime.md", fixture), null);
assert.equal(slugifyOfflineHeading("A *bounded* heading!"), "a-bounded-heading");

const rendered = renderOfflineMarkdown(
  "# Local guide\n\n<script>alert(1)</script> **safe**\n\n[Runtime](reference/runtime.md) [Remote](https://example.test)\n\n```ts\nconst value = '<local>';\n```",
  { resolveLink: (href) => resolveOfflineArticleLink(href, "docs/README.md", fixture) },
);
assert.match(rendered, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
assert.match(rendered, /data-offline-article-link="reference-runtime"/);
assert.match(rendered, /Unavailable offline/);
assert.doesNotMatch(rendered, /href="https:\/\/example\.test/);
assert.match(rendered, /language-ts/);
assert.match(rendered, /&lt;local&gt;/);

console.log("PASS: offline documentation registry, renderer, search, and link contract");
