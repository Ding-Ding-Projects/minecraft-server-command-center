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
  "0.1.50", "0.1.44", "0.1.42", "0.1.40", "0.1.39", "0.1.38", "0.1.37", "0.1.36", "0.1.35", "0.1.34", "0.1.33", "0.1.32", "0.1.31", "0.1.30",
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
  "including the verified published v0.1.50, v0.1.44, v0.1.42, and v0.1.40 records.",
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

const requiredInstallerMarkers = [
  'releaseTag: "v0.1.50"',
  'sourceCommit: "21fbb9b1377e4efdfc6a00798fa2749bf7aaa785"',
  'releaseUrl: "https://github.com/Ding-Ding-Projects/minecraft-server-command-center/releases/tag/v0.1.50"',
  'https://github.com/Ding-Ding-Projects/minecraft-server-command-center/releases/download/v0.1.50/Setup.exe',
  "assetSizeBytes: 140467200",
  'releasePublishedAt: "2026-08-14T20:34:07Z"',
];
assertSourceContract(pageSource, requiredInstallerMarkers, "verified installer handoff");
for (const marker of requiredInstallerMarkers) {
  const removed = pageSource.replaceAll(marker, "");
  assert.throws(
    () => assertSourceContract(removed, requiredInstallerMarkers, "verified installer handoff"),
    `negative regression stayed green after removing installer marker: ${marker}`,
  );
}

const requiredReleaseMarkers = [
  'version: "0.1.44"',
  'releaseTargetSha: "0888fa23289bbb58fd88c5455131a0eb1911da45"',
  'releaseUrl: `${RELEASE}v0.1.44`',
  "31796111487",
  "Watercress Beef Balls · 西洋菜牛肉球",
  "140399616 bytes",
  "project total (non-generated) 111 files / 27427 lines / 24666 non-blank",
  "grand total counted 112 / 27432 / 24670",
  "attribution total 112 / 27432 / 24670",
];

const requiredRelease50Markers = [
  'version: "0.1.50"',
  'releaseTargetSha: "21fbb9b1377e4efdfc6a00798fa2749bf7aaa785"',
  'releaseUrl: `${RELEASE}v0.1.50`',
  "31838299717",
  "Steamed Beef Tripe with Ginger and Scallion · 薑蔥牛柏葉",
  "140467200 bytes",
  "123 project-total files / 31957 lines / 28872 non-blank",
  "124 grand-total files / 31962 lines / 28876 non-blank",
];
assertSourceContract(dataSource, requiredRelease50Markers, "v0.1.50 changelog record");
for (const marker of requiredRelease50Markers) {
  const removed = dataSource.replaceAll(marker, "");
  assert.throws(
    () => assertSourceContract(removed, requiredRelease50Markers, "v0.1.50 changelog record"),
    `negative regression stayed green after removing v0.1.50 release marker: ${marker}`,
  );
}
assertSourceContract(dataSource, requiredReleaseMarkers, "v0.1.44 changelog record");
for (const marker of requiredReleaseMarkers) {
  const removed = dataSource.replaceAll(marker, "");
  assert.throws(
    () => assertSourceContract(removed, requiredReleaseMarkers, "v0.1.44 changelog record"),
    `negative regression stayed green after removing v0.1.44 release marker: ${marker}`,
  );
}

const requiredRelease42Markers = [
  'version: "0.1.42"',
  'releaseTargetSha: "052144ce44c7daf068170375d448b2da001a052a"',
  'releaseUrl: `${RELEASE}v0.1.42`',
  "31792576349",
  "Steamed Beef Balls · 山竹牛肉",
  "140395520 bytes",
  "project total (non-generated) 110 files / 27132 lines / 24403 non-blank",
  "grand total counted 111 / 27137 / 24407",
  "attribution total 111 / 27137 / 24407",
];
assertSourceContract(dataSource, requiredRelease42Markers, "v0.1.42 changelog record");
for (const marker of requiredRelease42Markers) {
  const removed = dataSource.replaceAll(marker, "");
  assert.throws(
    () => assertSourceContract(removed, requiredRelease42Markers, "v0.1.42 changelog record"),
    `negative regression stayed green after removing v0.1.42 release marker: ${marker}`,
  );
}

const requiredRelease40Markers = [
  'version: "0.1.40"',
  'releaseTargetSha: "be2460529a303e0ed0261a8717e13062866bfc0c"',
  'releaseUrl: `${RELEASE}v0.1.40`',
  'https://github.com/Ding-Ding-Projects/minecraft-server-command-center/releases/download/v0.1.40/Setup.exe',
  "31790273600",
  "2026-08-14T10:00:59Z",
  "Dark Chocolate Crystal Dumpling · 黑朱古力水晶餃",
  "115273216 bytes",
  "project total (non-generated) 104 files / 25610 lines / 23010 non-blank",
  "grand total counted 105 / 25615 / 23014",
  "attribution total 105 / 25615 / 23014",
];
assertSourceContract(dataSource, requiredRelease40Markers, "v0.1.40 changelog record");
for (const marker of requiredRelease40Markers) {
  const removed = dataSource.replaceAll(marker, "");
  assert.throws(
    () => assertSourceContract(removed, requiredRelease40Markers, "v0.1.40 changelog record"),
    `negative regression stayed green after removing v0.1.40 marker: ${marker}`,
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
