import { access, copyFile, mkdir } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, resolve } from "node:path";

const source = resolve("src", "shared", "paper-spigot-cli-catalog.cjs");
const destination = resolve("dist", "shared", "paper-spigot-cli-catalog.cjs");

try {
  await access(source, constants.R_OK);
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(source, destination);
  console.log("Copied Paper/Spigot CLI catalog seam.");
} catch {
  console.log("Paper/Spigot CLI catalog is not present yet; the renderer will show the bounded fallback catalog.");
}

