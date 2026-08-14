import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = process.cwd();
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const manifestPath = join(root, 'package.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const expectedElectronRange = '^42.4.0';

if (manifest.devDependencies?.electron !== expectedElectronRange) {
  throw new Error(
    `Expected devDependencies.electron to be ${expectedElectronRange}; found ${manifest.devDependencies?.electron ?? 'missing'}`,
  );
}

function runNpm(args, cwd) {
  const command = process.platform === 'win32' ? (process.env.ComSpec || 'cmd.exe') : npmCommand;
  const commandArgs = process.platform === 'win32'
    ? ['/d', '/s', '/c', [npmCommand, ...args].join(' ')]
    : args;
  const result = spawnSync(command, commandArgs, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, npm_config_audit: 'false', npm_config_fund: 'false' },
    maxBuffer: 8 * 1024 * 1024,
  });

  if (result.error) {
    throw new Error(`Could not run ${npmCommand}: ${result.error.message}`);
  }

  return result;
}

function parseAudit(result) {
  const output = (result.stdout || result.stderr || '').trim();
  try {
    return JSON.parse(output);
  } catch {
    throw new Error(
      `npm audit did not return JSON (exit ${result.status}). Output: ${output.slice(0, 1200)}`,
    );
  }
}

function versionTuple(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version || '');
  if (!match) throw new Error(`Unexpected Electron version in generated lockfile: ${version}`);
  return match.slice(1).map(Number);
}

function atLeast(version, minimum) {
  const actual = versionTuple(version);
  return actual[0] > minimum[0]
    || (actual[0] === minimum[0] && actual[1] > minimum[1])
    || (actual[0] === minimum[0] && actual[1] === minimum[1] && actual[2] >= minimum[2]);
}

const temporaryProject = await mkdtemp(join(tmpdir(), 'mssc-security-audit-'));

try {
  await writeFile(join(temporaryProject, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  const install = runNpm(
    ['install', '--package-lock-only', '--ignore-scripts', '--no-audit', '--no-fund'],
    temporaryProject,
  );
  if (install.status !== 0) {
    throw new Error(`Temporary lockfile generation failed (exit ${install.status}): ${install.stderr.trim()}`);
  }

  const lockfile = JSON.parse(await readFile(join(temporaryProject, 'package-lock.json'), 'utf8'));
  const electron = lockfile.packages?.['node_modules/electron'];
  if (!electron) throw new Error('Generated lockfile has no node_modules/electron entry');
  if (!atLeast(electron.version, [42, 4, 0])) {
    throw new Error(`Generated Electron version ${electron.version} is below the first safe 42.4.0 release`);
  }

  const vulnerableExtractor = Object.keys(lockfile.packages || {}).filter(
    (path) => path === 'node_modules/extract-zip' || path.startsWith('node_modules/extract-zip/'),
  );
  if (vulnerableExtractor.length > 0) {
    throw new Error(`Generated lockfile still contains vulnerable extract-zip paths: ${vulnerableExtractor.join(', ')}`);
  }

  const internalExtractorPath = Object.keys(lockfile.packages || {}).find(
    (path) => path.startsWith('node_modules/@electron-internal/extract-zip'),
  );
  if (!internalExtractorPath) {
    throw new Error('Generated lockfile has no @electron-internal/extract-zip entry');
  }

  const auditResult = runNpm(['audit', '--json'], temporaryProject);
  const audit = parseAudit(auditResult);
  const vulnerabilities = audit.metadata?.vulnerabilities || {};
  const vulnerablePackages = Object.entries(audit.vulnerabilities || {}).map(([name, item]) => ({
    name,
    severity: item.severity,
  }));

  if (auditResult.status !== 0 || (vulnerabilities.total || 0) !== 0) {
    throw new Error(`Temporary npm audit found vulnerabilities: ${JSON.stringify({ vulnerabilities, vulnerablePackages })}`);
  }

  console.log(JSON.stringify({
    verified: true,
    manifestElectronRange: expectedElectronRange,
    resolvedElectron: electron.version,
    resolvedExtractor: lockfile.packages[internalExtractorPath].version,
    npmAuditExit: auditResult.status,
    vulnerabilities,
  }, null, 2));
} finally {
  await rm(temporaryProject, { recursive: true, force: true });
}
