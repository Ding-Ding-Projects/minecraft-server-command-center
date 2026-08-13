import { spawnSync } from "node:child_process";
import path from "node:path";

const [command, ...args] = process.argv.slice(2);

if (!command) {
  console.error("Expected a vinext command such as dev, build, or start.");
  process.exit(1);
}

const executable = process.execPath;
const vinextCli = path.join(process.cwd(), "node_modules", "vinext", "dist", "cli.js");

const result = spawnSync(executable, [vinextCli, command, ...args], {
  stdio: "inherit",
});

if (result.error) {
  console.error(`Unable to start vinext: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
