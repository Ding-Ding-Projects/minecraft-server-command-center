import { existsSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const output = resolve("release", "squirrel-windows");
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

const setup = resolve(output, "Setup.exe").replace(/'/g, "''");
const script = "$signature = Get-AuthenticodeSignature -LiteralPath '" + setup + "'; " +
  "if ($signature.Status -ne 'NotSigned') { throw ('Expected NotSigned, got ' + $signature.Status) }; " +
  "Write-Output ('Unsigned installer verified: ' + $signature.Status)";

execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", script], {
  stdio: "inherit"
});

