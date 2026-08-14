# Release dim sum metadata

## Behaviour

The Windows release workflow resolves one dim sum code name immediately after
assigning the release version. It reads only the public
[`Ding-Ding-Projects/dim-sum-photos`](https://github.com/Ding-Ding-Projects/dim-sum-photos)
catalog JSON and published `catalog-v1*` release-asset metadata. The first
catalog-order dish with a published PNG asset and an unused `Dim sum code
name:` release-note value is selected.

The published release notes record the exact English and Traditional Chinese
dish names plus the version-pinned public GitHub Release asset URL. The code name
is a label beside the version; it does not replace the version number.

## Reservation and fallback

Before selecting a dish, the resolver paginates this project's existing
release records and reserves every prior `Dim sum code name:` value found in a
release-note body, including a draft release's value. This keeps a selected
dish name from being reused by a later release.

If the catalog, catalog schema, GitHub metadata, or an eligible published
`catalog-v1*` image cannot be resolved within the resolver's bounds, the
workflow still publishes its normal release. Its notes explicitly state that
the dim sum code name is unavailable for that release.

## Privacy and asset boundary

The resolver fetches metadata only. It never downloads, copies, vendors,
bundles, caches, or attaches a photo to this repository or its releases. The
release note links directly to the public catalog asset. The workflow token is
used only as request authentication and is never written to workflow output,
release notes, logs, or repository files.

## Bounds and verification

Catalog and GitHub API responses have byte, page, and record limits. Only
HTTPS links that point at a published asset owned by
`Ding-Ding-Projects/dim-sum-photos` are eligible. This source change was made
under an ultra-speed delivery pass; no test, lint, build, package, runtime
interaction, capture, release, or workflow dispatch was run in this lane.

## Suggested next articles

- [Unsigned automatic-update foundation](unsigned-automatic-updates.md)
- [Verification documentation](../verification/README.md)
