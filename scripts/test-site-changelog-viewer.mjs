import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { CHANGELOG_RELEASES } from "../site/app/changelog-data.ts";

const repoRoot = resolve(process.cwd());
const readText = async (path) => (await readFile(resolve(repoRoot, path), "utf8")).replace(/\r\n/g, "\n");
const pageSource = await readText("site/app/page.tsx");
const dataSource = await readText("site/app/changelog-data.ts");
const styleSource = await readText("site/app/globals.css");
const changelogSource = await readText("CHANGELOG.md");

const expectedVersions = [
  "0.1.39", "0.1.38", "0.1.37", "0.1.36", "0.1.35", "0.1.34", "0.1.33", "0.1.32", "0.1.31", "0.1.30",
  "0.1.29", "0.1.28", "0.1.27", "0.1.26", "0.1.25", "0.1.24", "0.1.23", "0.1.22", "0.1.21", "0.1.20",
  "0.1.19", "0.1.16", "0.1.15", "0.1.14", "0.1.13", "0.1.12",
];
assert.deepEqual(CHANGELOG_RELEASES.map((release) => release.version), expectedVersions);
assert.equal(new Set(CHANGELOG_RELEASES.map((release) => release.tag)).size, expectedVersions.length);
assert.ok(!dataSource.includes("Unreleased"), "the viewer data must not include Unreleased records");

for (const release of CHANGELOG_RELEASES) {
  assert.match(release.releaseDate, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(release.releaseTargetSha, /^[0-9a-f]{40}$/);
  assert.equal(
    execFileSync("git", ["rev-parse", `refs/tags/${release.tag}^{commit}`], { cwd: repoRoot, encoding: "utf8" }).trim(),
    release.releaseTargetSha,
    `${release.tag} tag target changed without updating the viewer record`,
  );
  for (const commit of release.commits) {
    assert.match(commit.sha, /^[0-9a-f]{40}$/);
    assert.equal(commit.url, `https://github.com/Ding-Ding-Projects/minecraft-server-command-center/commit/${commit.sha}`);
    execFileSync("git", ["cat-file", "-e", `${commit.sha}^{commit}`], { cwd: repoRoot, stdio: "ignore" });
  }
  assert.ok(release.categories.length > 0, `${release.tag} has no categorized changes or verification`);
  assert.ok(release.links.some((link) => link.url === release.releaseUrl), `${release.tag} has no release-record link`);
}

for (const version of ["0.1.38", "0.1.33", "0.1.32", "0.1.31", "0.1.30"]) {
  assert.match(changelogSource, new RegExp(`^## ${version} — 2026-08-14$`, "m"));
}

const requiredPageMarkers = [
  'id: "changelog",\n    label: "Changelog",',
  "const changelogPage = (",
  'id="changelog-search"',
  "validateChangelogDate",
  "applyChangelogPreset",
  "onClick={copyChangelog}",
  "onClick={exportChangelog}",
  "renderChangelogMarkdown(filteredChangelogReleases, changelogFilterSummary)",
  "Exact commit links",
];

function assertSourceContract(source, markers, label) {
  for (const marker of markers) {
    assert.ok(source.includes(marker), `missing ${label} marker: ${marker}`);
  }
}

assertSourceContract(pageSource, requiredPageMarkers, "changelog viewer");
for (const marker of requiredPageMarkers) {
  const removed = pageSource.replaceAll(marker, "");
  assert.notEqual(removed, pageSource, `negative regression fixture could not remove ${marker}`);
  assert.throws(
    () => assertSourceContract(removed, requiredPageMarkers, "changelog viewer"),
    `negative regression stayed green after removing ${marker}`,
  );
}

assertSourceContract(styleSource, [
  ".changelog-viewer",
  ".changelog-filter-grid",
  ".changelog-entry__categories",
  ".changelog-commit-list",
  "@media (max-width: 780px)",
], "changelog responsive styling");
assertSourceContract(dataSource, [
  "export const CHANGELOG_RELEASES",
  "releaseTargetSha",
  "sourceRecord",
  "commits:",
], "changelog data model");

console.log("PASS: site changelog records, commit provenance, filters, exports, responsive styling, and negative regressions");
