#!/usr/bin/env node

import { strict as assert } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const blameArgs = ['blame', '--line-porcelain', '--root', '--', 'site/app/page.tsx'];
const blame = execFileSync('git', blameArgs, {
  cwd: repositoryRoot,
  encoding: 'utf8',
  maxBuffer: 8 * 1024 * 1024,
});
const blameBytes = Buffer.byteLength(blame, 'utf8');
const headers = blame.match(/^([0-9a-f]{40}) \d+ \d+(?: \d+)?$/gmi) ?? [];
const contentLines = blame.split(/\r?\n/).filter((line) => line.startsWith('\t'));

assert.ok(
  blameBytes > 1024 * 1024,
  `site/app/page.tsx blame output must stay above the default 1 MiB child-process buffer; got ${blameBytes} bytes`,
);
assert.ok(headers.length > 0, 'the large blame fixture must contain porcelain headers');
assert.equal(headers.length, contentLines.length, 'the blame fixture headers and content must stay aligned');

const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repositoryRoot, encoding: 'utf8' }).trim();
const report = execFileSync(process.execPath, ['scripts/release-line-count.mjs'], {
  cwd: repositoryRoot,
  encoding: 'utf8',
  maxBuffer: 4 * 1024 * 1024,
});

assert.ok(report.includes('Source commit: `' + head + '`'), 'the report must identify the current source commit');
const grandTotal = report.match(/^\| \*\*Grand total counted\*\* \| (\d+) \| (\d+) \| (\d+) \|$/m);
const attributionTotal = report.match(/^\| \*\*Attribution total\*\* \| (\d+) \| (\d+) \| (\d+) \|$/m);
assert.ok(grandTotal, 'the counter must publish a grand-total row');
assert.ok(attributionTotal, 'the counter must publish an attribution-total row');
assert.deepEqual(attributionTotal.slice(1), grandTotal.slice(1), 'attribution arithmetic must equal the grand total');

process.stdout.write(`release-line-count regression: ${blameBytes} blame bytes; streamed counter completed with matching totals\n`);
