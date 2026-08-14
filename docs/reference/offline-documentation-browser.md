# Offline documentation browser foundation

The desktop Docs tab bundles a typed registry of the repository's desktop
Markdown articles. It is a local reference surface for setup and architecture
guidance, not a web browser and not a replacement for a separately published
documentation site.

## Local bundle contract

`src/renderer/offline-documentation-registry.ts` is the hand-written registry.
Each entry names a stable article id, display title, repository source path,
and raw Markdown import. The registry excludes `docs/site/` so the desktop
foundation does not silently become a companion-site loader. Vite includes the
raw Markdown in the renderer bundle at build time; the running desktop does
not read a path, request a URL, or fetch an article.

The shared contract in `src/shared/offline-documentation.ts` applies these
bounds:

| Value | Limit |
| --- | ---: |
| Articles | 64 |
| One article | 64 KiB of Markdown characters |
| Complete bundle | 256 KiB of Markdown characters |
| Article id | 96 characters |
| Search query or regex | 160 characters |
| Candidate text evaluated per match | 8,192 characters |
| Search results | 64 articles |
| Article link | 512 characters |

An invalid registry fails during module construction instead of producing a
partially loaded reader.

## One isolated Markdown path

`renderOfflineMarkdown` is the only renderer entry point used by the Docs tab.
It escapes text and attributes before producing the bounded HTML subset needed
by the bundled articles: headings, paragraphs, lists, blockquotes, fenced code,
inline code, emphasis, strikethrough, local article links, and horizontal
rules. Raw HTML is displayed as text. Images are described as unavailable
offline instead of loading a file or remote asset.

This is intentionally not a full CommonMark or GitHub-Flavored Markdown
implementation. Tables, nested list structure, HTML widgets, embedded media,
footnotes, and arbitrary extensions remain visible as escaped or simplified
content until a separately scoped renderer upgrade defines and tests them.
The renderer never executes provider-authored markup and never grants it
filesystem, process, or network access.

## Shared anchored search path

The Docs search uses the shared matcher in
`src/shared/regex-search.ts` and the shared DOM binding in
`src/renderer/regex-builder.ts`. The same bounded, bidirectional search path
is also used by Universal settings and the desktop command palette. Each
surface owns its own query, pattern, flag, validation, and mode state; opening
one builder never changes another search field.

The builder is anchored directly below the originating field. `Ctrl+Shift+F`
opens the desktop command palette, whose current command set can focus the Docs
search or open that field's anchored builder. Escape closes the builder first
and returns focus to the originating search field; closing the palette returns
focus to the control that opened it.

## Local search and article links

The article list searches the title and Markdown body with plain text as the
default. The adjacent Regex control is an explicit opt-in builder. Its query
and pattern are bounded to 160 characters, candidate evaluation is capped at
8,192 characters per article, results are capped at 64 articles, and only the
local JavaScript `i` and `m` flags are accepted. Query, pattern, flags,
validation, and mode synchronize bidirectionally; invalid patterns stay local
to the search surface and produce an accessible status message without
changing the current article.

Relative links ending in `.md` resolve against the registry's repository source
paths. A resolved link navigates to the matching bundled article and optional
heading fragment through an in-app click handler. `http:`, `https:`, protocol-
relative, `mailto:`, data, script, query-bearing, missing, and `docs/site/`
targets never become navigable links; the reader labels them unavailable
offline instead. Hash-only links can target a heading in the current article.

## Privacy and lifecycle boundary

The browser is bundle-only and makes no network request. It has no analytics,
telemetry, credentials, private vocabulary data, user file access, or external
editor handoff. It does not add a preload or main-process operation. Article
source content is repository-owned public documentation compiled into the
renderer; it is not copied into application settings or user history.

## Focused verification

The hand-written `scripts/test-offline-documentation.mjs` check enumerates the
desktop Markdown set, rejects site articles, verifies every registry source
entry, and deliberately removes an exact registry marker to prove the
completeness assertion turns red. It also covers registry bounds, plain and
regex search, relative-link resolution, network-link rejection, escaping, and
the supported Markdown subset.

`scripts/test-desktop-search-foundation.mjs` separately checks the shared
matcher bounds, the Docs/settings/palette registrations, the `Ctrl+Shift+F`
shortcut, and exact negative removals of each registration and shortcut.

Run the focused check with:

```text
npm run test:offline-documentation
npm run test:desktop-search
```

The renderer build is the proportional bundle proof:

```text
npm run build:renderer
npm run build:main
```

These checks do not prove a packaged desktop launch, screen-reader behavior,
or a rendered built-artifact capture. Those remain explicit limits for a later
desktop verification lane; the source-level focus and accessible-label paths
are recorded, but not runtime-exercised here.

## Suggested articles

- [Desktop foundation architecture](../architecture/desktop-foundation.md)
- [Desktop foundation completeness inventory](../verification/completeness-inventory.md)
- [Universal settings foundation](universal-settings.md)
