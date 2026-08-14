# Changelog viewer

The companion site's **Changelog** destination is a browser-local viewer for
released versions that have factual repository records. It is a documentation
surface, not a release feed: the page does not fetch release data, query an
external API, start a transfer, or treat `Unreleased` notes as shipped.

## Records and commit provenance

The checked-in `site/app/changelog-data.ts` contains all 26 non-draft,
non-prerelease release records currently available to this companion:

- The categorized `CHANGELOG.md` records are used for `v0.1.38`, `v0.1.33`,
  `v0.1.32`, `v0.1.31`, and `v0.1.30`.
- The published release records supply `v0.1.39`, `v0.1.37` through `v0.1.34`,
  `v0.1.29` through `v0.1.19`, and `v0.1.16` through `v0.1.12`.

Versions absent from both factual sources are not invented. Where a published
record contains no categorized change text, the entry says so explicitly.

Every record carries its version, ISO release date, source-record label,
categorized changes, release target SHA, exact commit links, and available
release or workflow links. The focused guard validates every commit object and
tag target with Git before the site can claim that a link is valid. It also
checks that the hand-written record list and the Changelog destination remain
registered together.

## Search and date filtering

Search is plain text by default and matches version, date, category, change
text, source label, commit label, and commit SHA. The **Regex** control is
anchored beside the search field and opens the site's shared bounded regex
builder. Regex is explicit opt-in; its pattern, flags, validation, and mode are
owned by this field and do not change other searches.

The start and end fields accept a typed `YYYY-MM-DD` ISO date or the local
`MM/DD/YYYY` form. Partial values remain visible and do not change the result
set; invalid dates and an inverted range are reported inline. A valid range is
inclusive at both ends, and search and date filtering compose. Presets provide
all releases, the latest release, the latest 30 days, the current release year,
and custom typed values.

## Copy and Markdown export

**Copy filtered Markdown** writes the currently visible records to the browser
clipboard. **Export filtered Markdown** creates a durable local
`companion-changelog-filtered.md` download. Both actions include the active
search and date-range summary, the exact visible count, categories, full commit
SHAs and links, and release-record links. An empty result disables both actions
and reports the no-match state instead of exporting a misleading empty release
history.

## Accessibility, responsive behavior, and failure modes

The destination is one of the site's browser-style tab destinations and uses
the existing Material 3 surface, focus, button, search, status, and link
patterns. The release list uses headings, articles, lists, `time` elements,
live status text, keyboard-reachable date controls, and visible focus. Long
commit URLs and SHAs wrap instead of clipping. The category grid collapses to a
single column at narrow widths, and the search builder remains attached to its
field while it scrolls within the viewport.

If a date is partial or invalid, the typed value is preserved and no date
filter is applied. If the range is inverted, the result set is empty until the
range is corrected. If no record matches, the page says so and disables copy
and export. If clipboard permission is unavailable, a non-blocking warning
explains the failure while Markdown export remains available. Export uses a
local object URL and does not upload or persist the release records.

## Verification boundary

Run the focused guard from the repository root:

```text
npm run test:site-changelog-viewer
```

Run the companion build and lint from `site/` when validating the site source:

```text
npm run build
npm run lint
```

These checks prove source structure, record provenance, and the static build.
This lane does not claim a packaged desktop runtime, browser interaction,
headless capture, or Pages deployment.

## Suggested articles

- [Verified installer handoff](verified-installer-handoff.md) — understand the
  separate fixed installer link and why it is not a release feed.
- [Static Pages export](static-pages-export.md) — review the source-only static
  output boundary without treating a local build as deployment evidence.
- [Notification centre](../reference/notification-centre.md) — compare the
  site's browser-local status and review surface patterns.
