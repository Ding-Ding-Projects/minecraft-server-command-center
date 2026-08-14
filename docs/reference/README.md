# Runtime reference

This directory holds source-governed reusable technical contracts for Minecraft Server Command Center.

| Document | Purpose |
| --- | --- |
| [Paper and Spigot CLI catalog](paper-spigot-cli-catalog.md) | Defines the typed Paper launch catalog, non-launching administrative-command metadata, argument placement, preflight behavior, validation boundaries, and the legacy Spigot boundary. |
| [Java runtime setup](java-runtime-setup.md) | Defines bounded native Java selection, opaque candidate IDs, direct version probing, bundled Paper target-catalog validation and projection, explicit Spigot non-mapping, and review-only setup-plan boundaries. |
| [Server lifecycle service](server-lifecycle.md) | Defines the implemented validation, direct launch, process-state, and bounded console-handling foundation. |
| [Server Configuration Schema](server-configuration-schema.md) | Defines version-aware typed configuration controls, provenance, validation, safety classes, and leaf-only world overrides for Paper and Spigot. |
| [Unsigned automatic-update foundation](unsigned-automatic-updates.md) | Defines the future Squirrel.Windows update-feed, parsing, package-selection, unsigned-artifact, and native-adapter boundaries without claiming a live update flow. |
| [Server Configuration Writer Foundation](server-configuration-writer.md) | Defines the controlled, review-token-confirmed local writer for allowlisted scalar configuration patches, bounded atomic writes, redacted outcomes, rollback records, and leaf-only Paper world overrides. |
| [Release dim sum metadata](release-dim-sum-metadata.md) | Defines bounded public-catalog resolution, per-project code-name reservation, release-note linking, and an honest no-asset fallback without copying a photo. |
| [Universal settings foundation](universal-settings.md) | Defines the shared schema, local persistence, bounded personal-vocabulary loader, School mode boundary, logo selection, privacy behavior, and current verification limits. |
| [Desktop presentation settings](desktop-presentation-settings.md) | Defines the desktop language modes, independent funny-level controls, dialog/message-box emoji behavior, local persistence, accessibility, responsive limits, and focused verification. |
| [Offline documentation browser foundation](offline-documentation-browser.md) | Defines the desktop-only typed Markdown bundle, isolated renderer subset, local search and regex hook, article-link resolution, and offline/privacy limits. |
| [Notification centre foundation](notification-centre.md) | Defines the companion site's and desktop renderer's bounded local notice records, non-blocking review and bulk-dismiss behavior, accessibility/security boundaries, and current verification limits. |
| [npm security audit](npm-security-audit.md) | Records the root package's lockfile policy, Electron remediation, extractor advisory boundary, and reproducible temporary-lock audit check. |

## Source policy

- The current Paper command catalog is derived only from [Paper CLI Arguments](https://docs.papermc.io/paper/reference/cli-arguments/), with JVM placement and configuration context from [Paper Getting started](https://docs.papermc.io/paper/getting-started/), [Paper System properties](https://docs.papermc.io/paper/reference/system-properties/), and [Paper server.properties](https://docs.papermc.io/paper/reference/server-properties/).
- Administrative-command metadata is sourced only from [Paper Commands](https://docs.papermc.io/paper/reference/commands/), [Paper Permissions](https://docs.papermc.io/paper/reference/permissions/), and [Spigot Commands and Permissions](https://www.spigotmc.org/wiki/spigot-commands/).
- The bounded vanilla-command cards use only the official [How to Use Commands in Minecraft](https://www.minecraft.net/en-us/article/minecraft-commands) article. They are a version-caveated reference subset, not a complete command registry.
- [Spigot Start-up Parameters](https://www.spigotmc.org/wiki/start-up-parameters/) is an official historical reference. It is not evidence that a legacy option belongs in a modern Paper launch.
- An option is emitted only when the selected target and this reference explicitly permit it. Absence from the catalog is intentional: it prevents a free-form command field from becoming an undocumented compatibility claim.

## Maintenance rule

When Paper or Spigot release behavior changes, update the catalog from the linked official source and preserve the support status of every affected row. Do not extend the list from blog posts, forum replies, copied launch scripts, or an unverified JAR help output. Keep lifecycle behavior in the separate lifecycle reference, and do not use catalog metadata to imply a server launch occurred.
