# Paper and Spigot launch catalog

## Scope

This document defines the launch-facing catalog boundary for the desktop UI. It is a typed argument catalog, not a text box for arbitrary shell syntax and not a promise that every historical Spigot argument is available on every target.

The authoritative Paper source says that Paper CLI arguments are placed after the server JAR and that their values override corresponding entries in server.properties. The normal Paper launch shape is therefore:

~~~text
<java executable> <JVM arguments> -jar <Paper JAR> <Paper CLI arguments>
~~~

For example, Paper documents memory options before the JAR and the no-GUI flag after it in its [Getting started guide](https://docs.papermc.io/paper/getting-started/). The full Paper post-JAR list and aliases below come from [Paper CLI Arguments](https://docs.papermc.io/paper/reference/cli-arguments/).

## Typed UI boundary

The UI keeps launch information in separate typed groups:

| Group | Position | Accepted representation | Catalog rule |
| --- | --- | --- | --- |
| Java executable | First token | Validated executable path | Spawn directly; never insert it into a shell string. |
| JVM options | Before -jar | Reviewed memory fields and reviewed Paper system-property records | JVM options never appear in the Paper CLI picker. |
| JAR selector | Immediately after -jar | One selected, regular Paper JAR file | The JAR is a single argv token, not a user-written command fragment. |
| Paper CLI options | After the JAR | Catalog ID plus a typed value where required | Only the Paper rows in this document can emit a post-JAR token. |

The launch service emits an argv array such as:

~~~text
[
  java,
  -Xms4G,
  -Xmx4G,
  -jar,
  paper.jar,
  --nogui
]
~~~

It must not create a command string and pass it to cmd.exe, PowerShell, sh, or another command interpreter. A UI value is one argv element, so quotes, whitespace, ampersands, pipes, substitutions, and redirection syntax are data rather than executable syntax.

### JVM flags and system properties are not Paper CLI flags

Paper documents -Xms and -Xmx as Java memory arguments before -jar. It documents Java system properties as -Dname=value forms that also belong before -jar, and warns that JVM flags can change Java and server behavior. See [Getting started](https://docs.papermc.io/paper/getting-started/) and [System properties](https://docs.papermc.io/paper/reference/system-properties/).

The catalog therefore:

- represents initial and maximum heap as typed JVM-memory fields, not as post-JAR flags;
- keeps each reviewed Paper system property as its own record, rather than accepting arbitrary -D text;
- never writes a secret-bearing JVM property into a profile preview, local history, log, or diagnostic; and
- treats a property not explicitly represented by the chosen profile as unavailable instead of appending it as free-form text.

Paper uses the documented com.mojang.eula.agree example as a system property before -jar. It must remain an explicit user decision, never a generated default. Paper also documents a TLS-keystore-password environment-variable path in its [server.properties reference](https://docs.papermc.io/paper/reference/server-properties/); secret handoff belongs in a protected environment/credential route rather than visible argv.

## Current Paper post-JAR catalog

The canonical emission form below uses long options. Aliases are displayed for recognition and import only; new profiles emit the canonical form. Repeated entries produce one flag/value pair per selected value.

### Preflight-only rows

| Catalog ID | Canonical emission | Recognized alias | Value | Status |
| --- | --- | --- | --- | --- |
| paper.help | --help | -? | None | Available only as a non-starting diagnostic. |
| paper.version | --version | -v | None | Available only as a non-starting diagnostic. |

Paper states that both flags prevent the server from starting. Help prints the accepted CLI reference; version prints the CraftBukkit version. They are never added to a normal Start plan. Source: [Paper CLI Arguments](https://docs.papermc.io/paper/reference/cli-arguments/).

### Configuration path rows

| Catalog ID | Canonical emission | Recognized alias | Typed value | Paper status |
| --- | --- | --- | --- | --- |
| paper.commands-settings | --commands-settings | -C | YAML file path | Defaults to commands.yml. |
| paper.bukkit-settings | --bukkit-settings | -b | YAML file path | Defaults to bukkit.yml. |
| paper.server-properties | --config | -c | Properties-file path | Defaults to server.properties. |
| paper.spigot-settings | --spigot-settings | -S | YAML file path | Defaults to spigot.yml. |
| paper.settings-directory | --paper-dir | --paper-settings-directory | Directory path | Defaults to config. |
| paper.legacy-paper-settings | --paper-settings | --paper | YAML file path | Unavailable for new servers; Paper documents this only for migration of legacy paper.yml. |

These rows select configuration locations; they do not convert arbitrary configuration keys into CLI options. If a setting is documented only in server.properties or a Paper configuration file, its UI belongs in that file editor rather than in the command catalog. For example, the [Paper server.properties reference](https://docs.papermc.io/paper/reference/server-properties/) documents configuration values independently of CLI emission.

### Plugin path rows

| Catalog ID | Canonical emission | Recognized alias | Typed value | Cardinality |
| --- | --- | --- | --- | --- |
| paper.plugins-directory | --plugins | -P | Directory path | One |
| paper.extra-plugin-directory | --add-extra-plugin-dir | --add-plugin-dir | Directory path | Repeatable |
| paper.extra-plugin-jar | --add-extra-plugin-jar | --add-plugin | JAR file path | Repeatable |

### World and initial-creation rows

| Catalog ID | Canonical emission | Recognized alias | Typed value | Status |
| --- | --- | --- | --- | --- |
| paper.world-container | --world-dir | -W, --universe, --world-container | Directory path | Available; Paper defaults this container to the current directory. |
| paper.world-name | --level-name | -w, --world | World-name text | Available. |
| paper.demo | --demo | None | Boolean flag | Available. |
| paper.bonus-chest | --bonusChest | None | Boolean flag | Available. |
| paper.initialize-settings | --initSettings | None | Boolean flag | Available; creates settings and exits before worlds are created. |
| paper.safe-mode | --safeMode | None | Boolean flag | Available; limits world loading to the Vanilla datapack. |

### Network and identity rows

| Catalog ID | Canonical emission | Recognized alias | Typed value | Status |
| --- | --- | --- | --- | --- |
| paper.host | --host | -h, --server-ip | Hostname or IP address | Available. |
| paper.port | --port | -p, --server-port | TCP port | Available. |
| paper.online-mode | --online-mode | -o | Boolean true or false | Available. |
| paper.max-players | --max-players | -s, --size | Integer value | Available. |
| paper.server-name | --server-name | None | Name text | Available. |
| paper.server-id | --serverId | None | Identifier text | Available. |

### Console and UI rows

| Catalog ID | Canonical emission | Recognized alias | Value | Status |
| --- | --- | --- | --- | --- |
| paper.no-console | --noconsole | None | Boolean flag | Disables the console. |
| paper.no-gui | --nogui | None | Boolean flag | Disables the graphical interface. |
| paper.no-jline | --nojline | None | Boolean flag | Uses the Vanilla-style console instead of JLine. |

### Process, profiling, and upgrade rows

| Catalog ID | Canonical emission | Typed value | Status |
| --- | --- | --- | --- |
| paper.pid-file | --pidFile | File path | Available. |
| paper.jfr-profile | --jfrProfile | Boolean flag | Available. |
| paper.force-upgrade | --forceUpgrade | Boolean flag | Upgrade-only and confirmation-required. Paper advises that it should rarely be used. |
| paper.erase-cache | --eraseCache | Boolean flag | Upgrade-only and confirmation-required because it removes upgrade-cache data. |
| paper.recreate-region-files | --recreateRegionFiles | Boolean flag | Upgrade-only and confirmation-required. |

All current-Paper rows above are derived from [Paper CLI Arguments](https://docs.papermc.io/paper/reference/cli-arguments/). The catalog must keep unknown options unavailable. In particular, it must not create unverified post-JAR rows for a seed, RCON, MOTD, resource pack, query, or arbitrary server.properties key merely because the setting exists in a configuration file.

## Non-launching administrative-command metadata

Administrative-command metadata is a separate, informational catalog. It does not share the process-launch emitter above and it must not offer a Run, Send, Console, command-block, or raw command-text control.

Each record has these typed fields:

| Field | Meaning |
| --- | --- |
| Stable ID | A fixed Paper, Spigot, or bounded-vanilla metadata key. |
| Target family | Paper current, Spigot legacy-reference, or vanilla article-reference. |
| Display syntax | A source-bound display string; it is not executable input. |
| Permission metadata | Exact official node and default only when the cited source publishes both; otherwise marked unspecified. |
| Version status | Current-reference, legacy-reference, or version-caveated reference. |
| Safety class | Informational, diagnostic, artifact-producing, operational, or unsupported. |
| Runtime status | Metadata-only, plugin-discovery pending, or target-version validation pending. |
| Source URL | Direct official documentation URL. |

The catalog stores logical fields and source provenance. It does not store a shell fragment, command-line string, copied console history, arbitrary argument tree, or an invented third-party plugin command. A later runtime integration must be separately designed and source-validated before any command can cross a server boundary.

### Plugin-command discovery is runtime/pending

Paper documents that the built-in help command can display registered commands, including commands added by plugins. That makes plugin-command names, syntax, aliases, and permissions runtime data rather than a static Paper or Spigot schema. The static catalog therefore exposes:

| Metadata ID | Value |
| --- | --- |
| plugin-command-discovery | Runtime/pending |
| static third-party plugin commands | None |
| plugin command execution | Unavailable |
| source for the boundary | [Paper Commands](https://docs.papermc.io/paper/reference/commands/) |

No plugin JAR scan, copied plugin wiki, blog post, help output, or guessed permission node may create a static command record. A future discovery feature must present results as observed runtime data with the source server, timestamp, selected version, and unavailable execution status until separately authorized.

### Paper current-reference records

The [Paper Commands](https://docs.papermc.io/paper/reference/commands/) page is written for Paper 1.21.8 and states that it is the earliest version for which the page is fully accurate. All Paper command records must show that version caveat rather than being presented as universal across older Paper targets.

#### Bukkit and operational roots

| Metadata ID | Display syntax | Permission metadata | Status |
| --- | --- | --- | --- |
| paper.bukkit.version | /version; aliases /ver and /about | bukkit.command.version; default granted | Metadata-only version information. |
| paper.bukkit.plugins | /plugins; alias /pl | bukkit.command.plugins; default granted | Metadata-only plugin-list information. |
| paper.bukkit.help | /help; alias /? | bukkit.command.help; default granted | Metadata-only command-reference information. |
| paper.bukkit.reload | /reload; alias /spigot reload | bukkit.command.reload; not granted by default | Deprecated for removal; no execution surface. |
| paper.restart | /restart | bukkit.command.restart; not granted by default | Operational metadata only. |
| paper.timings | /timings | bukkit.command.timings; not granted by default | Deprecated for removal; present only as metadata. |
| paper.performance.spark | /spark | Permission unspecified by the cited Paper command and permission references | Current Paper documentation recommends this performance command; metadata-only. |
| paper.performance.tps | /tps | Permission unspecified by the cited Paper command and permission references | Superseded by /spark in the cited Paper guidance. |
| paper.performance.mspt | /mspt | Permission unspecified by the cited Paper command and permission references | Superseded by /spark in the cited Paper guidance. |

The permission values come from [Paper Permissions](https://docs.papermc.io/paper/reference/permissions/). An unspecified value never becomes a guessed permission node.

#### Paper root and subcommands

The current Paper metadata records the Paper root as /paper with bukkit.command.paper, not granted by default. The Paper permissions reference supplies the following explicit subcommand nodes, all not granted by default:

| Metadata ID | Display syntax | Permission node | Safety class |
| --- | --- | --- | --- |
| paper.command.chunkinfo | /paper chunkinfo [world] | bukkit.command.paper.chunkinfo | Diagnostic |
| paper.command.debug | /paper debug &lt;chunks&gt; | bukkit.command.paper.debug | Artifact-producing diagnostic |
| paper.command.dumpitem | /paper dumpitem [all] | bukkit.command.paper.dumpitem | Diagnostic |
| paper.command.dumplisteners | /paper dumplisteners tofile or &lt;className&gt; | bukkit.command.paper.dumplisteners | Artifact-producing diagnostic |
| paper.command.dumpplugins | /paper dumpplugins | bukkit.command.paper.dumpplugins | Diagnostic |
| paper.command.entity | /paper entity list [filter] [world] | bukkit.command.paper.entity | Diagnostic |
| paper.command.fixlight | /paper fixlight | bukkit.command.paper.fixlight | Operational |
| paper.command.heap | /paper heap | bukkit.command.paper.heap | Artifact-producing diagnostic |
| paper.command.holderinfo | /paper holderinfo [world] | bukkit.command.paper.holderinfo | Diagnostic |
| paper.command.mobcaps | /paper mobcaps [world] | bukkit.command.paper.mobcaps | Diagnostic |
| paper.command.playermobcaps | /paper playermobcaps [player] | bukkit.command.paper.playermobcaps | Diagnostic |
| paper.command.reload | /paper reload | bukkit.command.paper.reload | Unsupported operational metadata |
| paper.command.syncloadinfo | /paper syncloadinfo [clear] | bukkit.command.paper.syncloadinfo | Debug metadata with a JVM-property prerequisite |
| paper.command.version | /paper version | bukkit.command.paper.version | Metadata-only version information |

The cited Paper command documentation marks /paper reload unsupported and says it does not reload non-Paper configuration such as spigot.yml. It also documents a JVM-property prerequisite for /paper syncloadinfo and describes its underlying mechanism as unused. Those facts are warnings on metadata cards, never reasons to generate or execute an admin command.

### Spigot legacy-reference records

[Spigot Commands and Permissions](https://www.spigotmc.org/wiki/spigot-commands/) is retained as a legacy reference, not an executable modern-target catalog. Every Spigot row below is metadata-only and unavailable for direct command emission:

| Metadata ID | Display syntax | Permission metadata | Legacy caveat |
| --- | --- | --- | --- |
| spigot.restart | /restart | bukkit.command.restart; default Operator | Requires a restart-script entry in spigot.yml. |
| spigot.tps | /tps | bukkit.command.tps; default Operator | Reference-only performance information. |
| spigot.timings.on-off | /timings on and /timings off | bukkit.command.timings; default Operator | The official page lists disabled build ranges. |
| spigot.timings.merged | /timings merged | bukkit.command.timings; default Operator | Writes a timings report file. |
| spigot.timings.separate | /timings separate | bukkit.command.timings; default Operator | Writes per-plugin timing reports. |
| spigot.timings.paste | /timings paste | bukkit.command.timings; default Operator | External upload behavior; no launch or network action is exposed. |
| spigot.timings.reset | /timings reset | bukkit.command.timings; default Operator | Reference-only reset behavior. |

The Spigot page is not used to create a Paper row, to infer a current Paper permission, or to discover plugin commands.

### Bounded vanilla-command cards

The only vanilla-command source for this catalog is the official [How to Use Commands in Minecraft](https://www.minecraft.net/en-us/article/minecraft-commands) article. That article presents handy examples and explains that commands and execution contexts vary by platform. It is not a complete, version-pinned Java-server command specification.

These cards use the article's displayed forms and remain metadata-only. They deliberately carry permission metadata as unspecified and target-version validation as pending:

| Metadata ID | Display syntax | Broad article purpose | Availability |
| --- | --- | --- | --- |
| vanilla.teleport | /teleport [target player] &lt;destination&gt; | Move a player to a destination | Version-caveated reference only |
| vanilla.give | /give &lt;player&gt; &lt;item&gt; [amount] | Give an item | Version-caveated reference only |
| vanilla.weather | /weather &lt;clear/rain/thunder&gt; | Change weather | Version-caveated reference only |
| vanilla.time-set | /time set &lt;time&gt; | Change time | Version-caveated reference only |
| vanilla.summon | /summon &lt;entity&gt; [x] [y] [z] | Create an entity | Version-caveated reference only |
| vanilla.kill | /kill [player] | Remove a target player | Version-caveated reference only |
| vanilla.setworldspawn | /setworldspawn [x] [y] [z] | Set world spawn | Version-caveated reference only |
| vanilla.locate | /locate &lt;category&gt; &lt;thing&gt; | Find a structure or biome | Version-caveated reference only |
| vanilla.op | /op &lt;playername&gt; | Grant operator status | Version-caveated reference only |
| vanilla.kick | /kick &lt;playername&gt; | Remove a player from a server | Version-caveated reference only |
| vanilla.ban | /ban &lt;playername&gt; | Ban a player from a server | Version-caveated reference only |

No further vanilla entries are implied. A command that is absent from this bounded official article has no static card. The article says that multiplayer command use requires sufficient permission, but this catalog does not translate that general statement into a server-specific permission node or an execution route.

## Direct argv emission and validation boundary

### Option identity

- A control stores a catalog ID, not a user-entered flag spelling.
- The launch service maps that ID to a fixed canonical option token from this document.
- Import may recognize the listed aliases and normalize them to the catalog ID. Export and new launches use the canonical form.
- No Raw arguments, Extra flags, Custom JVM flags, shell snippet, or command-line-text field is available in this catalog.

### Typed values

- File and directory rows use a native picker plus a canonical-path validation step. The service verifies the expected object kind, resolves it against the selected server root or another explicitly approved root, rejects NUL and control characters, and does not turn a path into more than one argv token.
- Config rows check their expected file kind. Plugin-directory rows check directories; extra-plugin-JAR rows check a regular JAR file; the PID row is a permitted output file location.
- Host values use a hostname/IP parser. Port values use a TCP-port parser. Boolean rows emit only their catalog value or no token. Maximum-player and other numeric entries receive syntax validation only unless Paper publishes a tighter bound.
- A world name, server name, and server ID are kept as opaque nonempty text after basic transport-safety validation. The catalog does not invent Paper naming restrictions that its official CLI reference does not publish.
- Repeatable plugin rows preserve item order and emit one option token plus one value token for each item. The UI bounds list size and total serialized length to protect the launcher without changing Paper semantics.

### High-risk rows

The upgrade flags are not part of an ordinary Start preset. Before they can be emitted, the UI must show the exact operation and affected server root, require an explicit confirmation, retain no automatically reusable approval, and omit them from --help and --version preflights. This is a launch-risk confirmation, not a claim that every use damages a world.

## Paper --help and --version preflight

Before enabling a selected Paper JAR for an ordinary launch profile, the launcher should run two separate direct child processes:

~~~text
<java executable> <safe preflight JVM arguments> -jar <selected JAR> --help
<java executable> <safe preflight JVM arguments> -jar <selected JAR> --version
~~~

The Paper reference guarantees that these flags do not start the server. The preflight therefore:

1. uses the selected Java executable and JAR but never a shell;
2. does not append the planned runtime Paper flags, plugins, world paths, upgrade flags, or secret values;
3. captures bounded stdout and stderr plus an exit status for diagnosis;
4. surfaces a mismatch or launch failure without interpreting arbitrary output as executable configuration; and
5. retains the source-governed catalog as the emission allowlist even if a JAR help screen contains another option.

The preflight is a compatibility diagnostic, not an EULA acceptance, world-migration, server-start, or plugin-loading workflow. This documentation task does not execute either preflight.

## Modern Paper and legacy Spigot boundary

Paper documents itself as a drop-in replacement for CraftBukkit and Spigot in [Getting started](https://docs.papermc.io/paper/getting-started/). That compatibility statement does not make every historical Spigot startup option a Paper option. The modern catalog is Paper-first: its supported rows are the current Paper rows above.

The official [Spigot Start-up Parameters](https://www.spigotmc.org/wiki/start-up-parameters/) page records a mix of current-looking options and explicitly historical conditions. The following entries remain visible as legacy-reference facts but are unavailable for direct emission by this catalog:

| Legacy Spigot entry | Official historical condition | Catalog disposition |
| --- | --- | --- |
| --online-mode | Marked removed on the Spigot page | Do not emit for a Spigot target. Paper has a separate current Paper row. |
| --date-format and -d | Listed by Spigot, absent from the Paper CLI reference | No Paper emission; no automatic Spigot emission. |
| --log-strip-color | Limited to build 1138 and below | Unavailable without a separately verified historical-target profile. |
| -Dorg.spigotmc.netty.disabled=true | Limited to build 1138 and below | Unavailable; never translate it into a Paper row. |
| -DconvertLegacySigns=true | Limited to Spigot 1.8 | Unavailable; no Paper translation. |
| -Djline.terminal=jline.UnsupportedTerminal | Historical environment workaround | Unavailable; use the current Paper console rows only when selected. |
| -DIReallyKnowWhatIAmDoingISwear | Spigot labels it unsupported and warns of future errors | Unavailable. |
| -nogui | Alias listed on the Spigot page | Recognition-only for a verified legacy importer; Paper emits only --nogui. |

For an explicit legacy Spigot target, this document is a reference, not a support matrix. A future version-specific implementation may enable a legacy row only after it has an independently maintained target-version contract and non-starting help/version evidence for that exact JAR. It must never infer support from the name of a flag, an old pasted launch script, or the fact that Paper accepts a similar option.

## Official sources

1. [Paper CLI Arguments](https://docs.papermc.io/paper/reference/cli-arguments/)
2. [Paper Getting started](https://docs.papermc.io/paper/getting-started/)
3. [Paper System properties](https://docs.papermc.io/paper/reference/system-properties/)
4. [Paper server.properties](https://docs.papermc.io/paper/reference/server-properties/)
5. [Spigot Start-up Parameters](https://www.spigotmc.org/wiki/start-up-parameters/)
6. [Paper Commands](https://docs.papermc.io/paper/reference/commands/)
7. [Paper Permissions](https://docs.papermc.io/paper/reference/permissions/)
8. [Spigot Commands and Permissions](https://www.spigotmc.org/wiki/spigot-commands/)
9. [How to Use Commands in Minecraft](https://www.minecraft.net/en-us/article/minecraft-commands)
