import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = resolve(repositoryRoot, "site/app/page.tsx");
const source = await readFile(sourcePath, "utf8");

function assertSiteTabKeyboardContract(candidate) {
  const markers = [
    'role="tablist" aria-orientation="vertical" aria-label="Planner pages"',
    'const handlePageTabKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, pageId: PageId) => {',
    '["ArrowDown", "ArrowUp", "Home", "End"]',
    'const currentIndex = matchingPages.findIndex((page) => page.id === pageId);',
    'const timerId = window.setTimeout(() => {',
    'document.getElementById(`tab-${activePage}`)?.focus();',
    'return () => window.clearTimeout(timerId);',
    '}, [activePage]);',
    'onKeyDown={(event) => handlePageTabKeyDown(event, page.id)}',
  ];
  for (const marker of markers) {
    assert.ok(candidate.includes(marker), `Missing site tab keyboard marker: ${marker}`);
  }
}

assert.doesNotThrow(() => assertSiteTabKeyboardContract(source));

const removedHandler = source.replace(
  '                onKeyDown={(event) => handlePageTabKeyDown(event, page.id)}\n',
  "",
);
assert.notEqual(removedHandler, source, "The negative mutation must remove the live handler registration.");
assert.throws(
  () => assertSiteTabKeyboardContract(removedHandler),
  /Missing site tab keyboard marker: onKeyDown=/,
  "Removing the site tab handler must turn this check red.",
);

const removedFocusEffect = source.replace(
  '      document.getElementById(`tab-${activePage}`)?.focus();\n',
  '',
);
assert.notEqual(removedFocusEffect, source, "The negative mutation must remove active-tab focus restoration.");
assert.throws(
  () => assertSiteTabKeyboardContract(removedFocusEffect),
  /Missing site tab keyboard marker: document\.getElementById/,
  "Removing active-tab focus restoration must turn this check red.",
);

console.log("PASS: companion-site vertical tab keyboard contract and negative registration regression");
