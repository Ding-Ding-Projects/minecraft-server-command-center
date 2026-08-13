# Release publication timing

The Windows release workflow records timing from the earliest actual job start
for the current GitHub Actions run attempt. Before checkout, it reads the
attempt-scoped workflow-jobs API through the job token with `actions: read`,
collects every non-empty `started_at` value, and selects the earliest timestamp.
The endpoint and least-privilege permission are documented by GitHub in its
[workflow-jobs REST reference](https://docs.github.com/en/rest/actions/workflow-jobs#list-jobs-for-a-workflow-run-attempt)
and [workflow permissions reference](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#permissions).

The workflow does not substitute a local clock sample, a run-level start time,
or a previous retry attempt. The API listing can arrive slightly after a runner
starts, so the workflow retries within a bounded 45-second window. If no valid
job timestamp can be obtained, publication fails rather than recording an
approximate value.

## Release-note fields

The final release note records:

- **Workflow started** — earliest actual job `started_at` for the current run
  attempt.
- **Workflow completed** — the UTC timestamp captured immediately after
  `gh release create` returns successfully. This means release publication
  completed, not that the GitHub Actions workflow has reached its terminal
  state.
- **Workflow duration** — elapsed time from the actual first job start through
  the successful release-publication command, formatted as `HH:mm:ss`.

The safe packaging-output upload happens after release publication. It is
evidence-only, remains outside the elapsed duration, and is not described as a
release asset. GitHub Actions records its terminal workflow completion only
after any remaining steps finish, so the release note states that boundary
instead of inventing a terminal timestamp.

## Verification boundary

This document describes the release-workflow source contract. The timing repair
was prepared under an ultra-speed delivery pass; no test, lint, build, package,
runtime interaction, capture, release, or workflow dispatch was run in this
lane.
