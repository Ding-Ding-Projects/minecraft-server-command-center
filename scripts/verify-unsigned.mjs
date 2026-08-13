import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const output = resolve("release", "squirrel-windows", "squirrel-windows");
const required = ["Setup.exe", "RELEASES"];
const entries = existsSync(output) ? readdirSync(output) : [];

for (const name of required) {
  if (!entries.includes(name)) {
    throw new Error("Missing Squirrel.Windows artifact: " + resolve(output, name));
  }
}

if (!entries.some((entry) => /full\.nupkg$/i.test(entry))) {
  throw new Error("Missing full Squirrel.Windows package in " + output);
}

const setup = resolve(output, "Setup.exe");
const IMAGE_DIRECTORY_ENTRY_SECURITY = 4;

function requireRange(binary, offset, length, description) {
  if (!Number.isInteger(offset) || !Number.isInteger(length) || offset < 0 || length < 0 || offset + length > binary.length) {
    throw new Error(
      "Cannot determine whether Setup.exe is unsigned: " + description + " falls outside the PE file."
    );
  }
}

function readUint16(binary, offset, description) {
  requireRange(binary, offset, 2, description);
  return binary.readUInt16LE(offset);
}

function readUint32(binary, offset, description) {
  requireRange(binary, offset, 4, description);
  return binary.readUInt32LE(offset);
}

function readPeSignature(binary, offset, description) {
  requireRange(binary, offset, 4, description);
  return binary.subarray(offset, offset + 4).toString("ascii");
}

function verifyNoEmbeddedAuthenticodeCertificate(setupPath) {
  const binary = readFileSync(setupPath);
  requireRange(binary, 0, 0x40, "DOS header");

  if (binary.subarray(0, 2).toString("ascii") !== "MZ") {
    throw new Error("Cannot determine whether Setup.exe is unsigned: it does not start with an MZ header.");
  }

  const peOffset = readUint32(binary, 0x3c, "PE header offset");
  if (readPeSignature(binary, peOffset, "PE signature") !== "PE\0\0") {
    throw new Error("Cannot determine whether Setup.exe is unsigned: its PE signature is missing.");
  }

  const coffHeaderOffset = peOffset + 4;
  const optionalHeaderSize = readUint16(binary, coffHeaderOffset + 16, "COFF optional-header size");
  const optionalHeaderOffset = coffHeaderOffset + 20;
  requireRange(binary, optionalHeaderOffset, optionalHeaderSize, "PE optional header");

  const optionalMagic = readUint16(binary, optionalHeaderOffset, "PE optional-header magic");
  const dataDirectoryOffset = optionalMagic === 0x10b ? 96 : optionalMagic === 0x20b ? 112 : null;
  if (dataDirectoryOffset === null) {
    throw new Error(
      "Cannot determine whether Setup.exe is unsigned: unsupported PE optional-header magic 0x" +
      optionalMagic.toString(16) + "."
    );
  }

  const numberOfDirectoriesOffset = dataDirectoryOffset - 4;
  const securityDirectoryOffset = dataDirectoryOffset + (IMAGE_DIRECTORY_ENTRY_SECURITY * 8);
  if (optionalHeaderSize < securityDirectoryOffset + 8) {
    throw new Error(
      "Cannot determine whether Setup.exe is unsigned: its declared PE optional header is too small for " +
      "the certificate-table directory."
    );
  }
  requireRange(binary, optionalHeaderOffset + numberOfDirectoriesOffset, 4, "PE directory count");
  requireRange(binary, optionalHeaderOffset + securityDirectoryOffset, 8, "PE certificate-table directory");

  const numberOfDirectories = readUint32(
    binary,
    optionalHeaderOffset + numberOfDirectoriesOffset,
    "PE directory count"
  );
  if (numberOfDirectories <= IMAGE_DIRECTORY_ENTRY_SECURITY) {
    throw new Error(
      "Cannot determine whether Setup.exe is unsigned: its PE header omits the certificate-table directory."
    );
  }

  const certificateFileOffset = readUint32(
    binary,
    optionalHeaderOffset + securityDirectoryOffset,
    "PE certificate-table file offset"
  );
  const certificateSize = readUint32(
    binary,
    optionalHeaderOffset + securityDirectoryOffset + 4,
    "PE certificate-table size"
  );

  if (certificateFileOffset === 0 && certificateSize === 0) {
    console.log("Unsigned installer verified: Setup.exe has no embedded Authenticode certificate table.");
    return;
  }

  if (certificateFileOffset === 0 || certificateSize === 0 || certificateFileOffset % 8 !== 0 || certificateSize < 8) {
    throw new Error(
      "Cannot determine whether Setup.exe is unsigned: its PE certificate-table directory is malformed " +
      "(offset " + certificateFileOffset + ", size " + certificateSize + ")."
    );
  }

  requireRange(binary, certificateFileOffset, certificateSize, "PE certificate table");
  throw new Error(
    "Expected unsigned Setup.exe, but its embedded Authenticode certificate table is present " +
    "(offset " + certificateFileOffset + ", size " + certificateSize + ")."
  );
}

verifyNoEmbeddedAuthenticodeCertificate(setup);

