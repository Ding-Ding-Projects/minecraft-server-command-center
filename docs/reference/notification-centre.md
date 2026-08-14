# Notification centre foundation

The browser-local companion now gives its existing non-blocking toast path a
bounded local review surface. Informational, success, warning, and
non-decision error notices remain useful after the corner toast is gone without
becoming a server feed, account feature, or delivery claim.

This is a site-only foundation. The desktop application does not gain a
notification centre from this change, and the companion does not invent remote
delivery.

## Behavior

- Informational and success toasts remain non-blocking and auto-dismiss after
  5.2 seconds. Warnings and errors remain visible until the person dismisses
  them.
- Every toast created by the planner's existing notice path gets a local
  record. The toast's **Review** action opens this centre, and **Dismiss** marks
  a dismissible record as dismissed without removing it from review history.
- The centre offers **Active**, **Dismissed**, and **All** views. A dismissed
  record keeps its title, detail, tone, creation time, and dismissal time.
- Search is plain text by default and uses the site's anchored regex-builder
  route only when regex is deliberately enabled.

## Bounded schema and persistence

Records are stored only in browser-local storage under
`minecraft-server-command-center.site.notifications.v1`. The schema version is
`1` and each record contains a tone, bounded title and detail, an ISO
timestamp, a dismissible flag, and a nullable `dismissedAt` value.

The parser fails closed. It rejects unknown schema versions, unexpected fields,
malformed records, duplicate IDs, overlong values, and more than 100 records.
The serialized collection is bounded to 128 KiB. IDs are limited to 96
characters, titles to 180 characters, and details to 1,200 characters.

A rejected stored value is removed and the centre returns to an honest empty
state. A browser-storage exception shows **Local persistence unavailable**
rather than claiming that a notice was saved. Persistence is independent of the
planner draft and universal-settings records, so resetting those settings does
not silently erase notification review history.

The centre is a local review trail for this planner's toast notices, not a
complete application-wide event log. Derived inline validation rows are not
retroactively presented as persisted events.

## Selection and bulk dismissal

The list supports keyboard-reachable checkbox selection and a stated
select-all scope:

- **Current view only** selects records matching the active Active, Dismissed,
  or All view.
- **Every matching record** selects matching records across all three statuses.

**Invert selection** applies to the same bounded filtered collection, and
**Clear selection** removes only the current selection. **Dismiss selected**
changes only selected active, dismissible records. Already dismissed records and
non-dismissible review-only records remain in place and are reported as
excluded rather than silently treated as changed.

This foundation does not add bulk deletion. Dismissal is reviewable because the
record remains available; an irreversible delete path is outside this scope.

## Failure, accessibility, and security boundaries

The centre uses named view buttons with pressed states, a fieldset for
select-all scope, named checkboxes per record, live status text for bulk
results, a labelled list, and a named dismiss action for each dismissible
record. The corner toast remains a polite live region and returns to the centre
through a real **Review** action. The responsive list and action row wrap at
narrow widths rather than clipping controls.

Records contain no credentials, paths, server data, telemetry, analytics,
account information, or remote request payloads. No record is sent anywhere.
The current notification-centre strings are English source copy; full
English/Cantonese/bilingual localization for this surface remains partial and
unverified, so this row is not a complete universal notification contract.

## Verification boundary

The implementation and focused negative regression are in
[`eab9433`](https://github.com/Ding-Ding-Projects/minecraft-server-command-center/commit/eab94338fbb0f75621213f2b66cd569478853c3e); the warning/error persistence
correction is in
[`7b37bd6`](https://github.com/Ding-Ding-Projects/minecraft-server-command-center/commit/7b37bd6332924bf0d2c13fd59bd154a256af9139).
The focused test removes exact notification-centre registration and
bulk-action markers one at a time and turns red for each removal before
restoring them.

The local verification record is:

- `npm run test:site-notification-center` passed.
- TypeScript passed via the primary checkout's installed `tsc`.
- The site build passed via the existing Vinext toolchain.
- Site lint passed with 0 errors and 2 existing `img` warnings at
  `site/app/page.tsx` lines 2150 and 2217.

No packaged-runtime interaction or capture, deployment, or CI verdict is
claimed for this source-only lane.

## Suggested articles

- [Runtime reference index](README.md)
- [Companion site documentation index](../site/README.md)
- [Universal settings foundation](universal-settings.md)
