# Runtime reference

This directory holds source-governed launch-reference material for the Paper and legacy Spigot portions of Minecraft Server Command Center.

| Document | Purpose |
| --- | --- |
| [Paper and Spigot CLI catalog](paper-spigot-cli-catalog.md) | Defines the typed Paper launch catalog, non-launching administrative-command metadata, argument placement, preflight behavior, validation boundaries, and the legacy Spigot boundary. |

## Source policy

- The current Paper command catalog is derived only from [Paper CLI Arguments](https://docs.papermc.io/paper/reference/cli-arguments/), with JVM placement and configuration context from [Paper Getting started](https://docs.papermc.io/paper/getting-started/), [Paper System properties](https://docs.papermc.io/paper/reference/system-properties/), and [Paper server.properties](https://docs.papermc.io/paper/reference/server-properties/).
- Administrative-command metadata is sourced only from [Paper Commands](https://docs.papermc.io/paper/reference/commands/), [Paper Permissions](https://docs.papermc.io/paper/reference/permissions/), and [Spigot Commands and Permissions](https://www.spigotmc.org/wiki/spigot-commands/).
- The bounded vanilla-command cards use only the official [How to Use Commands in Minecraft](https://www.minecraft.net/en-us/article/minecraft-commands) article. They are a version-caveated reference subset, not a complete command registry.
- [Spigot Start-up Parameters](https://www.spigotmc.org/wiki/start-up-parameters/) is an official historical reference. It is not evidence that a legacy option belongs in a modern Paper launch.
- An option is emitted only when the selected target and this reference explicitly permit it. Absence from the catalog is intentional: it prevents a free-form command field from becoming an undocumented compatibility claim.

## Maintenance rule

When Paper or Spigot release behavior changes, update the catalog from the linked official source and preserve the support status of every affected row. Do not extend the list from blog posts, forum replies, copied launch scripts, or an unverified JAR help output.
