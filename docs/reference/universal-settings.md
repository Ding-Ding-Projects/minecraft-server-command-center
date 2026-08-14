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
payloads, and partial records are rejected before replacement. Clearing the
control removes the local cache. The cache is not sent to a server and this
source does not place real private vocabulary values in tests, documentation,
logs, exports, or public records.

The companion surface applies a validated entry set through its private
user-facing text boundary. Replacement is one-pass over the original copy, so
replacement output is not fed back through another entry. The boundary also
leaves code-like elements and protected URLs, paths, identifiers, commands,
and factual external values unchanged. The desktop settings surface now
exposes the same contract through a native JSON picker, a typed main/preload
bridge, and a main-process cache at `personal-vocabulary.v1.json` under
Electron's `userData` directory.

## Desktop local file control

The desktop picker never sends a source path to the renderer. The main process
reads the selected file through a bounded byte reader, decodes it as strict
UTF-8, validates the complete payload with `parsePersonalVocabularyJson`, and
only then atomically replaces the cache. The renderer receives the validated
entry set for the active private text boundary plus status and count; the
persisted universal-settings record stores status and count only. A cancelled
selection leaves the active state unchanged.

Cache restoration revalidates the complete bytes on every load and classifies
the result before choosing a recovery path. A missing cache is the explicit
empty state. Malformed JSON, invalid UTF-8, empty or oversized bytes, duplicate
or unsafe keys, unsupported schema, unexpected fields, and other bound
violations are corruption: the cache is removed and the renderer returns to
original wording. An open, permission, or read failure is transient
unavailability: the main process rejects the load with a distinct error, and
the renderer preserves the persisted status and any already-active validated
entries instead of claiming that the cache is empty. If a corrupt cache cannot
be removed, that removal failure takes the same preserve-and-report path.

Clear is a separate explicit action. Its `personal-vocabulary:clear` IPC route
removes the local cache, drops active entries, persists the empty status, and
restores original shipped wording only after the removal succeeds. The
`personal-vocabulary:load` and `personal-vocabulary:clear` routes stay in the
typed preload/main bridge; file contents, source paths, and raw bytes are not
logged, exported, placed in settings JSON, or sent over a network.

The native picker title and JSON filter are presentation resources selected by
the current language mode and passed through the typed preload/IPC boundary;
invalid or missing mode input falls back to English. Bilingual accessible
names and copy use distinct `English: ... · Cantonese: ...` segments, so the
two exact language records are not blended into one unlabeled string.

The settings search and `Ctrl+Shift+F` command palette index the upload,
replace, status, and clear controls only when their actual target is present,
visible, and enabled. Palette execution repeats that availability check before
focusing, so a filtered, hidden, disabled, aria-disabled, inert, or stale
result cannot focus or advertise an unavailable control. The companion
palette uses localized page labels and semantic bilingual spans. School mode
omits the personal-vocabulary card and its palette commands together with the
other language and personalization controls.

The desktop presentation boundary applies presentation resources first and
the personal-vocabulary replacement exactly once at the final user-facing
boundary. Notification details, accessible names, palette status, and regex
builder status use the same single-application rule. Code, commands, URLs,
paths, identifiers, quoted or fenced code, shell transcript lines, versions,
timestamps, and factual external records remain protected beyond simple
whitespace token matching.

This bounded repair starts from target commit
`59c18dce6f23ba37ac07e7893300632084023373`. It remains a bounded source
slice, not a claim of complete app-wide localization or packaged desktop
behavior.

## School mode and recovery

School mode is stored in the same normalized record and has a user-selected
display name. When enabled on the companion site, English is forced and the
language, funny-level, emoji, and personal-vocabulary controls are omitted
from the visible settings surface; the root text boundary receives an empty
entry set. Turning it off requires the locally stored unlock digest. This is a
user-experience lock, not a security boundary; clearing the site's browser
storage resets it.

On desktop, the effective presentation settings force English, serious level-1
copy, and no dialog emoji while School mode is active. The personal-vocabulary
card and its palette commands are hidden, the active replacement set is empty,
and the stored language, funny levels, emoji choice, vocabulary status, and
entries remain available for restoration after unlock. The complete
cross-application propagation and credential-factor contract are not yet
verified.

On the companion site, the active School-mode page names only the user's
chosen mode name and its local recovery route. It does not repeat the hidden
language, tone, emoji, or vocabulary feature names in the active message or
palette. The site root uses `en` while the mode is active; outside that mode it
uses `zh-Hant-HK` for Cantonese and `mul` with explicit language-tagged spans
for bilingual copy.

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
- Browser storage read/write/removal failures leave the current in-memory
  settings, vocabulary, or logo active where it is safe to do so, show a
  local warning, and do not create a network fallback. A reset reports failure
  without claiming that records were removed.
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

The desktop local-file slice additionally uses:

```text
npm run test:desktop-personal-vocabulary
```

That payload-free check covers the native bridge registrations, bounded
atomic cache, valid replacement, invalid and oversized replacement rollback,
corrupt-cache fail-closed loading, clear/reset behavior, no-network source
boundary, and exact negative regressions.

The desktop search foundation additionally uses:

```text
npm run test:desktop-search
npm run build:main
npm run build:renderer
```

Those commands verify the exact search registrations, shortcut, negative
removals, shared bounds, and desktop source builds. The companion boundary
check also asserts the no-network path and transient-storage preservation.
They do not prove packaged runtime interaction, screen-reader interaction, or
a real capture.

It validates default normalization, bounded vocabulary acceptance and
rejection, duplicate-key and unsafe-key rejection, pattern bounds, and
deliberate negative regressions for the exact source registrations. The root
`npm run build`, `npm --prefix site run build`, and
`npx tsc --noEmit -p site/tsconfig.json` completed for the desktop and
companion artifacts. `npm --prefix site run lint` completed with two
`@next/next/no-img-element` warnings. Packaged runtime interaction,
accessibility interaction, and real captures remain unverified because the
required approved headless route is not available in this session. This
implementation and verification record start at target commit
`59c18dce6f23ba37ac07e7893300632084023373` and continue in the bounded repair
commit that carries this article's update.

## Related articles

- [Desktop foundation architecture](../architecture/desktop-foundation.md)
- [Desktop completeness inventory](../verification/completeness-inventory.md)
- [Planner Handoff v1](../site/planner-handoff-v1.md)
- [Unsigned automatic updates](unsigned-automatic-updates.md)
