# Desktop presentation settings

## Scope

The Windows desktop renderer now has one local presentation contract for the
settings it actually exposes: English, playful Hong Kong-style Cantonese, and
bilingual language modes; independent English and Cantonese funny-level
sliders from 1 through 5; and a persisted dialog/message-box emoji toggle.
This slice changes desktop copy and its controls only. It does not add School
mode, narration, tabs, locks, file conversion, Ollama management, or companion
site behavior. The related desktop personal-vocabulary control is documented
in [Universal settings](universal-settings.md) and is limited to local JSON
selection, validation, cache replacement, and clear behavior.

## Behavior

The language selector changes the settings surface's headings, descriptions,
search labels, regex-builder labels, control labels, option labels, and local
status messages. English mode renders the English copy, Cantonese mode renders
the Hong Kong-style Cantonese copy, and bilingual mode renders both in a compact
English-plus-Cantonese form.

The English and Cantonese funny-level sliders are independent. Each selects one
of five bounded voice variants for its language. The variants change tone only:
the affected copy continues to state the same action, affected state, recovery
route, and no-server boundary. In bilingual mode each language uses its own
slider, so changing the English level does not change Cantonese wording and
vice versa.

When enabled, the emoji toggle adds decorative emoji to the desktop's
non-blocking message-box/snackbar content and selected live settings-status
messages. Emoji are never inserted into buttons, action labels, form labels,
slider accessible names, or other control text. Turning the toggle off removes
the decoration while preserving the factual copy.

## Configuration and persistence

The renderer reads and writes the existing schema-version-1 record through the
typed preload bridge. The values remain separate fields:

- `languageMode`: `english`, `cantonese`, or `bilingual`;
- `funnyLevelEnglish`: integer 1 through 5;
- `funnyLevelCantonese`: integer 1 through 5; and
- `showEmojisInDialogs`: boolean.

The main process stores the normalized record as
`universal-settings.v1.json` under Electron's `userData` directory. Writes use
a temporary file followed by an atomic replacement. A failed load uses bounded
in-window defaults. A failed save keeps the current values visible, reports the
failure in the local status surface and notification, and does not touch the
server draft, server files, or a process.

## Privacy and security

Presentation settings are local-only. The renderer receives only the normalized
settings record through the narrow context-isolated bridge. No language copy,
funny-level value, emoji preference, credential, private vocabulary value,
server path, or message payload is sent over a network or placed in a shell,
process, or server-control route. Emoji are decoration, not semantic state.

## Accessibility and responsive behavior

Language and funny-level changes update visible labels and the document language
tag. Sliders retain native range semantics, expose their current `aria-valuenow`
and localized `aria-valuetext`, and remain keyboard-operable. The emoji toggle
does not alter control names. The settings grid collapses to one column and
stacks search/actions at narrow widths; the anchored regex builder remains
bounded and scrollable.

## Related local vocabulary control

The settings surface includes a keyboard- and screen-reader-operable native
JSON picker for a local personal-vocabulary file. Its status, entry count,
replace action, and clear action are localized through the same presentation
contract. The complete file is validated before an atomic cache replacement;
an invalid file leaves the prior valid cache and wording active, while clear
purges the cache and restores the original shipped wording. The settings
search and command palette focus these controls without exposing source paths
or file contents. The persisted settings record carries status and count only.

This related control is a local-only source slice. It does not claim packaged
runtime interaction, screen-reader interaction, or real capture evidence.

## Verification

The focused payload-free check is:

```text
npm run test:desktop-presentation-settings
npm run test:desktop-personal-vocabulary
```

It exercises all three language modes, independent funny-level changes,
emoji-on/emoji-off rendering, the local persistence registrations, and an
exact negative regression for every required presentation or control
registration. The renderer and privileged TypeScript builds remain:

```text
npm run build:renderer
npm run build:main
```

These checks do not claim packaged-runtime interaction, screen-reader
interaction, installer execution, or real capture evidence. Those remain a
separate verification boundary for the parent release task.

## Suggested articles

- [Universal settings foundation](universal-settings.md)
- [Desktop foundation architecture](../architecture/desktop-foundation.md)
- [Notification centre foundation](notification-centre.md)
