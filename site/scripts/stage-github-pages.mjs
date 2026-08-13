import { access, cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const projectPath = "/minecraft-server-command-center/";
const projectDirectory = projectPath.slice(1, -1);
const siteDirectory = process.cwd();
const clientDirectory = path.resolve(siteDirectory, "dist", "client");
const prefixedAssetDirectory = path.resolve(clientDirectory, projectDirectory);
const publishDirectory = path.resolve(siteDirectory, "dist", "github-pages");

function pathWithin(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative !== "" && !relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative);
}

async function requireDirectory(directory, description) {
  try {
    const entries = await readdir(directory);
    if (entries.length === 0) {
      throw new Error(`${description} is empty: ${directory}`);
    }
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`${description} is missing: ${directory}`);
    }
    throw error;
  }
}

async function copyClientRoot() {
  const entries = await readdir(clientDirectory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === projectDirectory) {
      continue;
    }
    await cp(path.resolve(clientDirectory, entry.name), path.resolve(publishDirectory, entry.name), {
      recursive: entry.isDirectory(),
    });
  }
}

function referencedProjectAssets(document) {
  const references = new Set();
  const pattern = /(?:href|src)="([^"?#]+)(?:[?#][^"]*)?"/g;
  for (const match of document.matchAll(pattern)) {
    const url = match[1];
    if (url.startsWith(projectPath)) {
      references.add(url);
    }
  }
  return [...references];
}

async function validatePublishedAssets() {
  const indexPath = path.resolve(publishDirectory, "index.html");
  const document = await readFile(indexPath, "utf8");
  const assets = referencedProjectAssets(document);
  if (assets.length === 0) {
    throw new Error(`No ${projectPath} asset references were found in ${indexPath}.`);
  }

  for (const asset of assets) {
    const relativeAssetPath = asset.slice(projectPath.length);
    const stagedAssetPath = path.resolve(publishDirectory, relativeAssetPath);
    if (!pathWithin(publishDirectory, stagedAssetPath)) {
      throw new Error(`Asset path escapes the publish root: ${asset}`);
    }
    try {
      await access(stagedAssetPath);
    } catch {
      throw new Error(`HTML references ${asset}, but the staged publish root lacks ${relativeAssetPath}.`);
    }
  }

  return assets;
}

await requireDirectory(clientDirectory, "Static client output");
await requireDirectory(prefixedAssetDirectory, "Project-prefixed static assets");

await rm(publishDirectory, { recursive: true, force: true });
await mkdir(publishDirectory, { recursive: true });
await copyClientRoot();
await cp(prefixedAssetDirectory, publishDirectory, { recursive: true });
await writeFile(path.resolve(publishDirectory, ".nojekyll"), "\n", "utf8");

const assets = await validatePublishedAssets();
console.log(`Staged ${assets.length} project-prefixed HTML asset reference(s) at ${publishDirectory}.`);
console.log("GitHub Pages publish root is ready: index.html, _next/, and .nojekyll are siblings.");
