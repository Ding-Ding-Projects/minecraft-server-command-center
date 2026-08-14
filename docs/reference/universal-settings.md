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

The companion surface currently records and validates the private cache but
does not yet apply replacements across every user-facing text boundary. The
desktop surface does not yet expose the file picker. Those are explicit
remaining implementation items, not implied by the shared parser.

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
