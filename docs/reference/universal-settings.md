# Universal settings foundation

The desktop and companion site now share a bounded schema for the first part
of the universal settings contract. This is an implementation foundation, not
a claim that every application-wide feature in the shared contract has shipped.

## What is implemented

The shared TypeScript contract is in
`src/shared/universal-contracts.ts`. It defines schema version 1, the English,
playful Hong Kong-style Cantonese, and bilingual language modes, independent
English and Cantonese funny levels from 1 through 5, the dialog-emoji toggle,
the user-renamable School mode, display name, light/dark theme, density, seed
color, logo preset, tab-docking position, and personal-vocabulary status.

The desktop renderer exposes the settings surface in
`src/renderer/index.html` and `src/renderer/main.ts`. The privileged process
persists the normalized record through
`src/main/universal-settings-store.ts`, `src/main/index.ts`, and the
context-isolated bridge in `src/preload/index.ts` and
`src/shared/desktop-api.ts`. The companion site implements its own browser-local
record in `site/app/page.tsx`, with the same schema normalization and a
browser-storage boundary.

## Desktop presentation settings slice

The desktop renderer's presentation settings are implemented in
`src/shared/desktop-presentation.ts` and are applied to the real Universal
settings surface rather than to a detached sample. English, playful Hong
Kong-style Cantonese, and bilingual modes update the settings headings,
descriptions, search and regex-builder labels, options, control accessible
names, and local status copy. The English and Cantonese funny-level sliders
select five bounded variants independently, and bilingual mode uses each
language's own level.

The dialog/message-box emoji toggle decorates the desktop snackbar/message
surface and selected live settings-status messages only. It does not alter
buttons, action labels, field labels, slider names, or accessible names. The
settings store already persists each value independently in
`universal-settings.v1.json`; this slice wires those stored values to the
desktop copy and keeps failed saves visibly local without touching server
drafts or processes. See [Desktop presentation settings](desktop-presentation-settings.md)
for the full behavior, privacy, failure, accessibility, and focused-check
record.

## Desktop settings search boundary

The desktop Universal settings surface uses the shared matcher in
`src/shared/regex-search.ts` and the anchored DOM binding in
`src/renderer/regex-builder.ts`. Plain-text filtering is the default; the
adjacent Regex control is an explicit opt-in builder that synchronizes query,
pattern, flags, validation, and mode for this settings field only. Search text
and patterns are capped at 160 characters, candidate evaluation at 8,192
characters, results at 64 items, and flags to local JavaScript `i` and `m`.
Invalid patterns produce an accessible status message and hide no unrelated
surface state beyond the current filter's no-match result.

`Ctrl+Shift+F` opens the desktop command palette. Its current command set
focuses Universal settings search or opens that field's anchored builder; it
does not claim the complete app-wide command, settings, menu, dropdown, or
appearance inventory required by the larger universal contract. Escape closes
the builder first and restores the originating field; closing the palette
restores the control that opened it.

Both surfaces keep display-name changes separate from package identity, data
locations, executable names, installer identity, and update-feed identity.
Theme, density, and seed color apply to the companion site immediately. The
desktop renderer applies its stored theme and density to the live shell.

## Personal-vocabulary file contract

The companion settings surface always shows a local JSON file picker, including
when no file has been supplied. The accepted neutral payload is:

```json
{
  "schemaVersion": 1,
  "entries": [
    { "source": "original text", "replacement": "user text" }
  ]
}
```

Validation is performed before caching or applying a payload. The current
limits are 64 KiB for the complete file, 128 entries, 160 characters per
string, four nesting levels, unique source keys, known object fields only,
safe object keys, and no duplicate JSON keys. Malformed JSON, unsupported
schema versions, unexpected fields, duplicate keys, unsafe keys, over-limit
payloads, and partial records are rejected without replacing the last valid
cache. Clearing the control removes the local cache. The cache is not sent to
a server and this source does not place real private vocabulary values in
tests, documentation, logs, exports, or public records.

The companion surface applies a validated entry set through its private
user-facing text boundary. Replacement is one-pass over the original copy, so
replacement output is not fed back through another entry. The boundary also
leaves code-like elements and protected URLs, paths, identifiers, commands,
and factual external values unchanged. The desktop surface does not yet expose
the file picker. Complete app-wide localization and desktop application remain
explicit implementation items, not implied by this companion-only slice.

Selecting a new file validates the complete payload before the cache or active
entry set changes. A read, validation, or local-storage failure leaves the
previous valid cache and displayed wording intact. Clearing the control removes
the private cache, drops the active entry set, and restores the original
shipped wording; an invalid cache is removed and fails closed to that same
empty state during restoration.

## School mode and recovery

School mode is stored in the same normalized record and has a user-selected
display name. When enabled on the companion site, English is forced and the
language, funny-level, emoji, and personal-vocabulary controls are omitted
from the visible settings surface. Turning it off requires the locally stored
unlock digest. This is a user-experience lock, not a security boundary; clearing
the site's browser storage resets it. The desktop renderer currently provides
the shared setting and hides the optional language controls while the mode is
enabled, but its full cross-application propagation and credential-factor
contract are not yet verified.

## Logo and appearance boundary

The companion site provides three shipped logo presets and a local PNG/JPEG
selection. It validates the signature, bounds the file to 512 KiB and 4096
pixels per axis, decodes it locally, and keeps the preview in browser storage.
No upload or remote conversion is used. The complete per-element appearance
editor, Word-depth typography controls, infinite color translator, export and
import, and packaged desktop logo rendering remain unimplemented or
unverified.

## Failure and privacy behavior

- Invalid settings values normalize to the documented defaults rather than
  entering the renderer.
- Settings writes use a temporary file followed by an atomic replacement in
  the desktop application-data directory.
- Browser storage failures leave the shipped defaults active and do not create
  a network fallback.
- Unlock values are hashed locally; the entered value is not rendered back,
  exported, logged, or included in the vocabulary cache.
- The display name never changes installed identity or the location holding
  settings.
- The current implementation does not provide a cloud sync path, account
  service, analytics, or server-control route.

## Verification record

The focused source contract check is:

```text
npm run test:universal-contracts
```

The desktop search foundation additionally uses:

```text
npm run test:desktop-search
npm run build:main
npm run build:renderer
```

Those commands verify the exact search registrations, shortcut, negative
removals, shared bounds, and desktop source builds. They do not prove packaged
runtime interaction, screen-reader interaction, or a real capture.

It validates default normalization, bounded vocabulary acceptance and
rejection, duplicate-key and unsafe-key rejection, pattern bounds, and
deliberate negative regressions for the exact source registrations. The root
`npm run build`, `npm --prefix site run build`, and
`npx tsc --noEmit -p site/tsconfig.json` completed for the desktop and
companion artifacts. `npm --prefix site run lint` completed with two
`@next/next/no-img-element` warnings. Packaged runtime interaction,
accessibility interaction, and real captures remain unverified because the
required approved headless route is not available in this session. This
implementation and verification record are carried by
[`130f2b1`](https://github.com/Ding-Ding-Projects/minecraft-server-command-center/commit/130f2b1b45586c16c07efc1957b3cb150f67e922).

## Related articles

- [Desktop foundation architecture](../architecture/desktop-foundation.md)
- [Desktop completeness inventory](../verification/completeness-inventory.md)
- [Planner Handoff v1](../site/planner-handoff-v1.md)
- [Unsigned automatic updates](unsigned-automatic-updates.md)
