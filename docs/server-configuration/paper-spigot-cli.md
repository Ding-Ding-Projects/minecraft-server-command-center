# Paper and Spigot CLI guidance

## Scope

The desktop foundation turns guided selections into a tokenized argument-vector preview. It does not launch that vector, execute shell text, start a server, or edit a live server process.

Paper and Spigot options vary by server version and installed software. The preview is therefore an aid for reviewing a planned configuration, not a claim that the selected target accepts every option.

## Current mapped preview tokens

The inspected shared draft collects bounded values. A main-process adapter uses
only the versioned Paper/Spigot registry's typed direct-array emitters when the
registry is available; the desktop foundation does not retain a second
raw-flag list. When that registry is unavailable, a bounded catalog fallback
remains visible and the detailed preview is unavailable rather than
synthesizing unchecked tokens.

| Category | Current direct token mapping or availability | Notes |
| --- | --- | --- |
| Java and JAR | Non-executable `java` placeholder; `-Xms`, `-Xmx`, `-jar` | The selected Java executable remains in the privileged runtime-review controller; the preview is a list of direct argument tokens, not a process request. |
| Server overrides | `-h`, `-p`, `-o`, `-w` | The draft bounds host text and port values before producing preview tokens. |
| Paper configuration and plugins | `-P`, `-c`, `-b`, `-S`, `-C`, `--paper-dir` | These are emitted only for a Paper draft. |
| Console and UI | `--nogui`, `--noconsole`, `--nojline` | These affect a later server launch and remain preview-only here. |
| World preparation | `--safeMode`, `--initSettings`, `--demo`, `--bonusChest` | The current draft maps them as preview-only selections. |
| Detailed Paper catalog | Visible fallback marks it unavailable if the optional versioned catalog module is absent. | Unsupported values cannot be passed through as raw text. |
| Spigot-specific pass-through | Visible fallback marks it unavailable. | The foundation does not provide arbitrary Spigot arguments or raw command entry. |

The canonical option spelling, availability, and deprecation status must be checked against the exact Paper version selected by a future runtime-aware feature. See the [Paper CLI reference](https://docs.papermc.io/paper/reference/cli-arguments/) for current upstream documentation.

## Native selection boundary

The generic privileged desktop picker accepts only three kinds: server folder, server JAR, and configuration file. Java selection is a separate Runtime-tab route that sends the native result directly to the main-process Java runtime controller and returns only an opaque candidate summary to the renderer. The file-picker filters are source-level implementation detail, not proof that an eventual selected file is valid for a selected server version.

## Spigot availability boundary

The bounded fallback visibly marks Spigot-specific pass-through unavailable. The foundation must not pretend to provide a generic Spigot process executor or guarantee that a Paper flag is accepted by Spigot. Server restart, timings, and other administrative operations need separate version-aware, confirmed lifecycle support before they can become actions in the application.

For current upstream context, consult the [Spigot command documentation](https://www.spigotmc.org/wiki/spigot-commands/) and the exact server version's documentation.

## Argument preview safety

The preview should show a sequence such as:

```text
java | -Xms2048M | -Xmx4096M | -jar | server.jar | --nogui | -p | 25565
```

Each segment is a distinct argument token from the typed registry. The
foundation must not concatenate these values into a shell expression, evaluate
metacharacters, or use the preview as an implicit launch request. Copying a
preview is not a lifecycle operation.

## Configuration precedence and future validation

CLI overrides can take precedence over values in server configuration files. A future version-aware configuration editor should make the effective source, restart requirement, compatibility status, and risk visible for every setting. That editor is not delivered by the current foundation.

## Verification boundary

This article is based on source inspection of the shared draft and catalog adapter plus public upstream references. It is not evidence of a successful Paper or Spigot launch, file mutation, network operation, build, package, or runtime interaction.

## Related documentation

- [Desktop foundation architecture](../architecture/desktop-foundation.md)
- [Java runtime setup](../reference/java-runtime-setup.md)
- [Completeness inventory](../verification/completeness-inventory.md)
