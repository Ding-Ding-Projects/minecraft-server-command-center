import { access, copyFile, mkdir } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, resolve } from "node:path";

const source = resolve("src", "main", "java-runtime-manager.cjs");
const destination = resolve("dist", "main", "java-runtime-manager.cjs");

try {
  await access(source, constants.R_OK);
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(source, destination);
  await access(destination, constants.R_OK);
  console.log("Copied Java runtime manager into the main-process output.");
} catch (error) {
  console.error("Required Java runtime manager copy failed.", error);
  process.exitCode = 1;
}
