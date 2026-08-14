# Verified Installer Handoff

## Purpose

The companion site's **Release status** destination can offer one direct,
user-activated handoff to a published Windows installer. It is a static link
to one published, version-pinned GitHub Release asset, not a release feed, update service, or
background download manager.

## Embedded release record

The site source carries the whole verified record together so its browser code
does not need to discover or request release information:

| Field | Embedded value |
| --- | --- |
| Release tag | `v0.1.38` |
| Source commit | `fbd75307e14bbe049adf73c40bb74fc375f970c3` |
| Release record | <https://github.com/Ding-Ding-Projects/minecraft-server-command-center/releases/tag/v0.1.38> |
| Installer asset | `Setup.exe` |
| Exact asset URL | <https://github.com/Ding-Ding-Projects/minecraft-server-command-center/releases/download/v0.1.38/Setup.exe> |
| Published asset size | `115224576` bytes |
| Release published at | `2026-08-14T08:12:36Z` |
| Signing state | Unsigned |

The source uses these fields only for visible copy and ordinary anchor targets.
It has no `latest` URL, no browser release lookup, no release-data parser, no
timer, and no background asset request. The browser contacts GitHub only if a
person activates one of the explicit links.

## User-facing behavior

- Home and **Release status** each provide a clearly labelled direct
  `Setup.exe` link.
- The release card shows the exact tag, source commit, asset name, published
  size, and a separate link to the published release record.
- The unsigned state is explicit: the installer can trigger an
  unknown-publisher or SmartScreen warning.
- The site never claims that a transfer, installation, update, application
  startup, or Minecraft server action completed. GitHub owns any transfer
  after the user activates the link.

## Updating the record safely

Update the embedded record only after reading a published, non-draft release
record through the repository's approved release tooling. Replace the tag,
source commit, release URL, asset URL, and published asset size together.
Never infer a newer version, substitute a moving URL, guess an asset name, or
change only part of the record. If a release cannot be verified, keep the
existing verified record or remove the handoff rather than inventing a target.

## Boundaries and failure modes

- A static source record can become stale when a newer release exists; it is
  intentionally not refreshed in the browser.
- A GitHub asset can be unavailable after publication due to external service
  state; this site does not retry, mirror, cache, or claim recovery.
- The direct link is not proof that the installer works on a particular
  computer, and it does not implement automatic updates.
- The site uses no external assets, APIs, analytics, accounts, secrets, or
  remote client fetches for this handoff.

## Verification boundary

The embedded values were read from the published release record. This source
integration does not itself build the site, exercise a browser, download the
installer, execute it, or prove installation behavior. Those are separate
evidence activities.

## Suggested next articles

- [Static Pages export](static-pages-export.md)
- [Configuration planner](configuration-planner.md)
- [Companion Site Documentation index](README.md)
