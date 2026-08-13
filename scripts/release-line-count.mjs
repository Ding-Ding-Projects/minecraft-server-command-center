#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TextDecoder } from 'node:util';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, '..');
const utf8 = new TextDecoder('utf-8', { fatal: true });

const categoryOrder = [
  ['source', 'Own source'],
  ['tests', 'Tests'],
  ['markup', 'Styles / markup'],
  ['generated', 'Generated'],
  ['other', 'Other project text'],
];

const exclusionOrder = [
  ['dependencies', 'Dependency or vendor trees'],
  ['output', 'Build or packaging output'],
  ['lockfiles', 'Package-manager lockfiles'],
  ['binary', 'Binary or non-UTF-8 files'],
];

const lockfileNames = new Set([
  'package-lock.json',
  'npm-shrinkwrap.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'bun.lockb',
  'cargo.lock',
  'composer.lock',
  'gemfile.lock',
  'poetry.lock',
]);

const sourceExtensions = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.c', '.cc', '.cpp', '.cxx',
  '.h', '.hh', '.hpp', '.hxx', '.cs', '.java', '.py', '.rb', '.php', '.go',
  '.rs', '.swift', '.kt', '.kts', '.scala', '.sc', '.sh', '.bash', '.zsh',
  '.fish', '.ps1', '.psm1', '.psd1', '.bat', '.cmd', '.lua', '.r', '.sql',
]);

const markupExtensions = new Set([
  '.css', '.scss', '.sass', '.less', '.html', '.htm', '.md', '.mdx', '.xml',
  '.svg', '.yml', '.yaml', '.json', '.jsonc', '.toml', '.ini', '.cfg', '.conf',
  '.txt', '.properties', '.env',
]);

function git(args, options = {}) {
  try {
    return execFileSync('git', args, {
      cwd: repositoryRoot,
      encoding: options.encoding,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    const detail = error.stderr ? String(error.stderr).trim() : error.message;
    throw new Error(`git ${args.join(' ')} failed: ${detail}`);
  }
}

function parseOutputPath(args) {
  if (args.length === 0) return null;
  if (args.length !== 2 || args[0] !== '--output' || !args[1]) {
    throw new Error('Usage: node scripts/release-line-count.mjs [--output <repository-relative-path>]');
  }

  const outputPath = resolve(repositoryRoot, args[1]);
  const outputRelativePath = relative(repositoryRoot, outputPath);
  if (!outputRelativePath || outputRelativePath.startsWith('..') || isAbsolute(outputRelativePath)) {
    throw new Error('The report output path must be a non-empty path inside this repository.');
  }
  return outputPath;
}

function ensureReleaseCheckout() {
  if (git(['rev-parse', '--is-shallow-repository'], { encoding: 'utf8' }).trim() === 'true') {
    throw new Error('A full Git checkout is required for surviving-line attribution.');
  }

  for (const args of [['diff', '--quiet'], ['diff', '--cached', '--quiet']]) {
    try {
      execFileSync('git', args, { cwd: repositoryRoot, stdio: 'ignore' });
    } catch {
      throw new Error('The line-count report requires a clean tracked checkout at the release commit.');
    }
  }
}

function normalizePath(path) {
  return path.replaceAll('\\', '/');
}

function basename(path) {
  const segments = path.split('/');
  return segments[segments.length - 1].toLowerCase();
}

function extension(path) {
  const name = basename(path);
  const index = name.lastIndexOf('.');
  return index === -1 ? '' : name.slice(index);
}

function exclusionFor(path) {
  if (/(^|\/)(node_modules|vendor|third_party|third-party|external)(\/|$)/i.test(path)) {
    return 'dependencies';
  }
  if (/(^|\/)(dist|out|release|artifacts|coverage|\.next|\.vite|\.vinext)(\/|$)/i.test(path)) {
    return 'output';
  }
  if (lockfileNames.has(basename(path))) return 'lockfiles';
  return null;
}

function categoryFor(path) {
  if (/(^|\/)(generated|__generated__)(\/|$)|(?:^|\/)[^/]+\.(generated|gen)\.[^/]+$|(?:^|\/)next-env\.d\.ts$/i.test(path)) {
    return 'generated';
  }
  if (/(^|\/)(test|tests|__tests__|__mocks__)(\/|$)|(?:^|\/)[^/]+\.(test|spec)\.[^/]+$/i.test(path)) {
    return 'tests';
  }
  if (sourceExtensions.has(extension(path))) return 'source';
  if (markupExtensions.has(extension(path))) return 'markup';
  return 'other';
}

function decodeText(path) {
  const buffer = readFileSync(resolve(repositoryRoot, path));
  if (buffer.includes(0)) return null;
  try {
    return utf8.decode(buffer);
  } catch {
    return null;
  }
}

function lineCounts(text) {
  if (text.length === 0) return { lines: 0, nonBlank: 0 };
  const lines = text.split(/\r\n|\r|\n/);
  if (text.endsWith('\n') || text.endsWith('\r')) lines.pop();
  return {
    lines: lines.length,
    nonBlank: lines.filter((line) => line.trim().length > 0).length,
  };
}

function emptyTotals() {
  return { files: 0, lines: 0, nonBlank: 0 };
}

function addTotals(target, addition) {
  target.files += addition.files;
  target.lines += addition.lines;
  target.nonBlank += addition.nonBlank;
}

function automationCommitClassifier() {
  const cache = new Map();
  const automationIdentity = /\b(?:claude fable 5|github-actions(?:\[bot\])?|dependabot(?:\[bot\])?|renovate(?:\[bot\])?|automation)\b/i;
  const automationTrailer = /^Co-Authored-By:\s*(?:Claude Fable 5|.*(?:\[bot\]|automation|github-actions|dependabot|renovate|codex|openai|gpt)\b)/im;

  return (commit) => {
    if (!cache.has(commit)) {
      const metadata = git(['show', '-s', '--format=%an%n%ae%n%B', commit], { encoding: 'utf8' });
      const [author = '', email = '', ...body] = metadata.split(/\r?\n/);
      cache.set(commit, automationIdentity.test(`${author}\n${email}`) || automationTrailer.test(body.join('\n')));
    }
    return cache.get(commit);
  };
}

function blameAttribution(path, expectedLines, isAutomationCommit) {
  if (expectedLines === 0) return { agent: emptyTotals(), people: emptyTotals() };

  const blame = git(['blame', '--line-porcelain', '--root', '--', path], { encoding: 'utf8' });
  const headers = blame.match(/^([0-9a-f]{40}) \d+ \d+(?: \d+)?$/gmi) ?? [];
  if (headers.length !== expectedLines) {
    throw new Error(`git blame did not attribute every counted line in ${path}.`);
  }

  const records = blame.split(/\r?\n/);
  const contentLines = records.filter((line) => line.startsWith('\t')).map((line) => line.slice(1));
  if (contentLines.length !== expectedLines) {
    throw new Error(`git blame content did not match the counted line total in ${path}.`);
  }

  const attribution = { agent: emptyTotals(), people: emptyTotals() };
  for (let index = 0; index < headers.length; index += 1) {
    const commit = headers[index].split(' ')[0];
    const bucket = isAutomationCommit(commit) ? attribution.agent : attribution.people;
    bucket.files = Math.max(bucket.files, 1);
    bucket.lines += 1;
    if (contentLines[index].trim().length > 0) bucket.nonBlank += 1;
  }
  return attribution;
}

function row(label, totals) {
  return `| ${label} | ${totals.files} | ${totals.lines} | ${totals.nonBlank} |`;
}

function createReport() {
  ensureReleaseCheckout();
  const commit = git(['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const categoryTotals = Object.fromEntries(categoryOrder.map(([key]) => [key, emptyTotals()]));
  const exclusionTotals = Object.fromEntries(exclusionOrder.map(([key]) => [key, 0]));
  const attributionTotals = { agent: emptyTotals(), people: emptyTotals() };
  const isAutomationCommit = automationCommitClassifier();
  const tracked = git(['ls-files', '-z']).toString('utf8').split('\0').filter(Boolean);

  for (const trackedPath of tracked) {
    const path = normalizePath(trackedPath);
    const exclusion = exclusionFor(path);
    if (exclusion) {
      exclusionTotals[exclusion] += 1;
      continue;
    }

    const text = decodeText(path);
    if (text === null) {
      exclusionTotals.binary += 1;
      continue;
    }

    const counts = lineCounts(text);
    const category = categoryFor(path);
    const fileTotals = { files: 1, ...counts };
    addTotals(categoryTotals[category], fileTotals);

    const attribution = blameAttribution(path, counts.lines, isAutomationCommit);
    addTotals(attributionTotals.agent, attribution.agent);
    addTotals(attributionTotals.people, attribution.people);
  }

  const projectTotal = emptyTotals();
  for (const [key] of categoryOrder) {
    if (key !== 'generated') addTotals(projectTotal, categoryTotals[key]);
  }
  const grandTotal = emptyTotals();
  for (const [key] of categoryOrder) addTotals(grandTotal, categoryTotals[key]);

  if (attributionTotals.agent.lines + attributionTotals.people.lines !== grandTotal.lines ||
      attributionTotals.agent.nonBlank + attributionTotals.people.nonBlank !== grandTotal.nonBlank) {
    throw new Error('Surviving-line attribution does not equal the grand total.');
  }

  const output = [
    '## Project line count',
    '',
    `Source commit: \`${commit}\``,
    'Command: `node scripts/release-line-count.mjs`',
    '',
    '| Category | Files | Total lines | Non-blank lines |',
    '| --- | ---: | ---: | ---: |',
    ...categoryOrder.map(([key, label]) => row(label, categoryTotals[key])),
    row('**Project total (non-generated)**', projectTotal),
    row('**Grand total counted**', grandTotal),
    '',
    '### Surviving-line attribution',
    '',
    'Attribution uses `git blame` for every counted line. A line is agent-authored when its blamed commit has an automation author identity or an automation co-author trailer; all other surviving lines are people-authored.',
    '',
    '| Attribution | Files with attributed lines | Total lines | Non-blank lines |',
    '| --- | ---: | ---: | ---: |',
    row('Agent-authored surviving lines', attributionTotals.agent),
    row('People-authored surviving lines', attributionTotals.people),
    row('**Attribution total**', grandTotal),
    '',
    '### Excluded material',
    '',
    '| Excluded category | Files | Reason |',
    '| --- | ---: | --- |',
    ...exclusionOrder.map(([key, label]) => `| ${label} | ${exclusionTotals[key]} | Excluded from source-line totals. |`),
    '',
    'Excluded classes are dependency/vendor trees, build or packaging outputs, package-manager lockfiles, and binary or non-UTF-8 files. Generated tracked text remains visible in its own counted row.',
    '',
  ].join('\n');

  return output;
}

try {
  const outputPath = parseOutputPath(process.argv.slice(2));
  const report = createReport();
  if (outputPath) writeFileSync(outputPath, report, 'utf8');
  process.stdout.write(report);
} catch (error) {
  process.stderr.write(`release-line-count: ${error.message}\n`);
  process.exitCode = 1;
}
