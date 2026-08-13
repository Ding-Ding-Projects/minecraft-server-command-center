import { appendFileSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const CATALOG_REPOSITORY = "Ding-Ding-Projects/dim-sum-photos";
const API_ORIGIN = "https://api.github.com";
const CODE_NAME_PREFIX = "Dim sum code name:";
const MAX_CATALOG_BYTES = 16 * 1024 * 1024;
const MAX_API_RESPONSE_BYTES = 8 * 1024 * 1024;
const MAX_API_PAGES = 100;
const MAX_API_RECORDS = 10_000;
const MAX_CATALOG_DISHES = 10_000;
const REQUEST_TIMEOUT_MS = 15_000;
const execFileAsync = promisify(execFile);

function readRepository(value, name) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value)) {
    throw new Error(`${name} must name one GitHub owner/repository pair.`);
  }
  return value;
}

function safeOutputValue(value) {
  if (typeof value !== "string" || /[\r\n]/.test(value)) {
    throw new Error("Release metadata contains an unsafe workflow-output value.");
  }
  return value;
}

function writeOutput(key, value) {
  const line = `${key}=${safeOutputValue(value)}`;
  if (typeof process.env.GITHUB_OUTPUT === "string" && process.env.GITHUB_OUTPUT.length > 0) {
    appendFileSync(process.env.GITHUB_OUTPUT, `${line}\n`, "utf8");
    return;
  }
  console.log(line);
}

function writeResolution(resolution) {
  writeOutput("available", resolution.available ? "true" : "false");
  writeOutput("name_en", resolution.nameEn ?? "");
  writeOutput("name_zh_hant", resolution.nameZhHant ?? "");
  writeOutput("image_url", resolution.imageUrl ?? "");
  writeOutput("image_release_tag", resolution.imageReleaseTag ?? "");
  writeOutput("image_asset_name", resolution.imageAssetName ?? "");
}

async function runGh(args, maxBytes) {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const environment = token
    ? { ...process.env, GH_TOKEN: token }
    : process.env;
  const { stdout } = await execFileAsync("gh", args, {
    encoding: "utf8",
    env: environment,
    maxBuffer: maxBytes,
    timeout: REQUEST_TIMEOUT_MS,
    windowsHide: true
  });
  if (Buffer.byteLength(stdout, "utf8") > maxBytes) {
    throw new Error("GitHub metadata response exceeds the configured size limit.");
  }
  return stdout;
}

async function readCatalogText() {
  return runGh([
    "api",
    "--method", "GET",
    "-H", "Accept: application/vnd.github.raw+json",
    `repos/${CATALOG_REPOSITORY}/contents/catalog/index.json`
  ], MAX_CATALOG_BYTES);
}

function endpointFromApiUrl(value) {
  const url = new URL(value);
  if (url.origin !== API_ORIGIN || !url.pathname.startsWith("/repos/")) {
    throw new Error("GitHub metadata endpoint was outside the approved API origin.");
  }
  return `${url.pathname.slice(1)}${url.search}`;
}

async function listGitHubPages(endpoint) {
  const stdout = await runGh([
    "api",
    "--paginate",
    "--slurp",
    "--method", "GET",
    "-H", "Accept: application/vnd.github+json",
    "-H", "X-GitHub-Api-Version: 2022-11-28",
    endpoint
  ], MAX_API_RESPONSE_BYTES);
  const pages = JSON.parse(stdout);
  if (!Array.isArray(pages) || pages.length > MAX_API_PAGES) {
    throw new Error("GitHub metadata pagination exceeded the configured page limit.");
  }

  const records = [];
  for (const page of pages) {
    if (!Array.isArray(page)) {
      throw new Error("GitHub metadata response was not an array.");
    }
    records.push(...page);
    if (records.length > MAX_API_RECORDS) {
      throw new Error("GitHub metadata pagination exceeded the configured record limit.");
    }
  }
  return records;
}

function codeName(nameEn, nameZhHant) {
  return `${nameEn} · ${nameZhHant}`;
}

function usedCodeNames(projectReleases) {
  const used = new Set();
  const marker = new RegExp(`^${CODE_NAME_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*(.+?)\\s*$`, "gmi");

  for (const release of projectReleases) {
    if (!release || typeof release.body !== "string") {
      continue;
    }
    for (const match of release.body.matchAll(marker)) {
      const value = match[1].trim();
      if (value.length > 0 && !/^unavailable\b/i.test(value)) {
        used.add(value);
      }
    }
  }

  return used;
}

function isPublishedCatalogAsset(asset, releaseTag) {
  if (!asset || typeof asset.name !== "string" || typeof asset.browser_download_url !== "string") {
    return false;
  }
  if (!asset.name.endsWith(".png") || asset.state !== "uploaded" || !Number.isSafeInteger(asset.size) || asset.size <= 0) {
    return false;
  }
  const url = new URL(asset.browser_download_url);
  const expectedPrefix = `/${CATALOG_REPOSITORY}/releases/download/${encodeURIComponent(releaseTag)}/`;
  return url.protocol === "https:" && url.hostname === "github.com" && url.pathname.startsWith(expectedPrefix);
}

async function publishedCatalogAssets() {
  const releases = await listGitHubPages(`repos/${CATALOG_REPOSITORY}/releases?per_page=100`);
  const assets = new Map();

  for (const release of releases) {
    if (!release || release.draft === true || typeof release.tag_name !== "string" || !release.tag_name.startsWith("catalog-v1") || typeof release.assets_url !== "string") {
      continue;
    }
    const releaseAssets = await listGitHubPages(endpointFromApiUrl(release.assets_url));
    for (const asset of releaseAssets) {
      if (isPublishedCatalogAsset(asset, release.tag_name) && !assets.has(asset.name)) {
        assets.set(asset.name, Object.freeze({
          url: asset.browser_download_url,
          releaseTag: release.tag_name,
          assetName: asset.name
        }));
      }
    }
  }

  return assets;
}

function dishMetadata(dish) {
  if (!dish || typeof dish !== "object" || !dish.name || !dish.image) {
    return null;
  }
  const nameEn = dish.name.en;
  const nameZhHant = dish.name.zhHant;
  const imagePath = dish.image.path;
  if (
    typeof nameEn !== "string" || nameEn.length === 0 || nameEn.length > 256 ||
    typeof nameZhHant !== "string" || nameZhHant.length === 0 || nameZhHant.length > 256 ||
    typeof imagePath !== "string" || !/^images\/[a-z0-9][a-z0-9._-]*\.png$/.test(imagePath)
  ) {
    return null;
  }
  return Object.freeze({
    nameEn,
    nameZhHant,
    assetName: imagePath.slice("images/".length)
  });
}

async function resolveReleaseDimSum() {
  const projectRepository = readRepository(process.env.PROJECT_REPOSITORY || process.env.GITHUB_REPOSITORY, "PROJECT_REPOSITORY");
  const [catalogText, projectReleases, catalogAssets] = await Promise.all([
    readCatalogText(),
    listGitHubPages(`repos/${projectRepository}/releases?per_page=100`),
    publishedCatalogAssets()
  ]);
  const catalog = JSON.parse(catalogText);
  if (!catalog || catalog.schemaVersion !== "1.0.0" || !Array.isArray(catalog.dishes) || catalog.dishes.length > MAX_CATALOG_DISHES) {
    throw new Error("The public dim sum catalog did not match the supported bounded schema.");
  }

  const used = usedCodeNames(projectReleases);
  for (const dish of catalog.dishes) {
    const metadata = dishMetadata(dish);
    if (!metadata) {
      continue;
    }
    if (used.has(codeName(metadata.nameEn, metadata.nameZhHant))) {
      continue;
    }
    const asset = catalogAssets.get(metadata.assetName);
    if (!asset) {
      continue;
    }
    return Object.freeze({
      available: true,
      nameEn: metadata.nameEn,
      nameZhHant: metadata.nameZhHant,
      imageUrl: asset.url,
      imageReleaseTag: asset.releaseTag,
      imageAssetName: asset.assetName
    });
  }

  return Object.freeze({ available: false });
}

try {
  const resolution = await resolveReleaseDimSum();
  writeResolution(resolution);
  console.log(
    resolution.available
      ? "Resolved a next-unused dim sum release code name from public catalog metadata."
      : "No eligible published dim sum catalog asset was available; release notes will use the omission fallback."
  );
} catch {
  writeResolution(Object.freeze({ available: false }));
  console.log("Dim sum metadata was unavailable; release notes will use the omission fallback.");
}
