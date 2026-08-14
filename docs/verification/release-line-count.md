# Release line-count report

Every release workflow generates its line-count table with the committed
`scripts/release-line-count.mjs` command. The workflow checks out the complete
Git history (`fetch-depth: 0`) before it runs the command, then appends that
exact Markdown table to the release notes.

## Counted categories

The report lists total and non-blank lines for own source, tests,
styles/markup, tracked generated files, and other project text. Its **Project
total** excludes tracked generated files; its **Grand total counted** includes
them. This keeps generated output visible instead of silently inflating the
hand-authored project total.

The report also derives surviving-line attribution from `git blame`. A line is
counted as agent-authored when its blamed commit uses a configured automation
identity or carries a configured automation co-author trailer; all remaining
surviving lines are counted as people-authored. The two attribution rows must
sum to the report's grand total.

## Explicit exclusions

The command does not count dependency/vendor trees, build and packaging
outputs, package-manager lockfiles, or binary/non-UTF-8 files. The release
table lists each exclusion class and the number of tracked files excluded, so a
reader can distinguish a project total from uncounted repository material.

## Failure behavior

The command operates only on tracked files at the release commit. It rejects
unsupported arguments and fails rather than publishing an incomplete or
unattributed table when the required Git history or line ownership cannot be
read. Blame records are consumed incrementally from the Git child process, so a
large file cannot exhaust a fixed Node output buffer. The parser still requires
one porcelain header and one content line for every counted line and retains
the same agent/people attribution arithmetic. The focused regression command
`node scripts/test-release-line-count.mjs` keeps `site/app/page.tsx` as a
large-output fixture and verifies that the full report's attribution total
matches its grand total. It is a release-metadata command, not a test or lint
gate; the workflow continues to state truthfully that it builds and packages
without running tests or lint.

## Verification boundary

This document records the source contract. No local invocation, package,
installer, runtime interaction, test, lint, or capture result is claimed by
this change.
