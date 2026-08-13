# Configuration Planner

## Purpose

The configuration planner is the companion site's local, browser-based place
to prepare a Minecraft server plan before applying anything in a desktop
manager. It is designed to help a person understand values, dependencies,
trade-offs, and restart requirements. It does not operate a server or execute
commands.

The source-only companion must retain this distinction in its labels, empty
states, exports, and documentation. A generated command preview or configuration
plan is guidance for review; it is not a request sent to a server.

## Planned pages

| Page | What it helps plan | What it must not do |
| --- | --- | --- |
| Overview | Show local plan status, incomplete choices, and next planning steps. | Claim a server is online or connected. |
| Configure | Edit typed server, world, network, gameplay, and plugin planning values. | Write `server.properties`, YAML, JSON, or plugin files. |
| Paper CLI | Search and assemble documented Paper launch and administration drafts with clear targets and consequences. | Start Paper or send a console, RCON, management-protocol, or shell command. |
| Spigot setup | Review Spigot-specific planning choices, restart expectations, and compatibility notes. | Write `spigot.yml`, install a plugin, or restart a process. |
| Runtime | Select a server flavor, Minecraft version, Java requirement, memory range, and user-provided local reference. | Browse arbitrary machine files, install software, or start a process. |
| Safety | Review consequential plan items, warnings, and desktop-manager boundaries. | Confirm an irreversible server action or change live server state. |
| Docs | Read local guidance and planner explanations. | Fetch remote documentation or imply third-party service access. |
| Release status | Show one source-embedded, verified immutable release record and direct installer handoff. | Invent a release, fetch a release feed, start or observe a download, or claim deployment or installation. |

The implementation may present these pages through persistent tabs, but each
page must remain independently keyboard-accessible and easy to locate.

## Structured configuration model

The planner uses typed fields instead of treating configuration as an opaque
text editor. Each setting record should contain at least:

| Field | Meaning |
| --- | --- |
| Stable key | A versioned planner identifier; never a raw path or secret. |
| Category | Server, world, network, gameplay, command, runtime, or plugin planning. |
| Value | A bounded value of the setting's declared type. |
| Default | The known baseline value or an explicit unavailable state. |
| Source | Whether the value is a shipped baseline, user plan, inherited plan, or local draft. |
| Effective value | The value that the planner resolves after precedence rules. |
| Validation | A clear valid, incomplete, or invalid result with corrective guidance. |
| Impact | Restart requirement, compatibility note, or safety consequence. |

The planner must distinguish a baseline/default value from a user choice and
must not fabricate a discovered runtime value. A browser-only source companion
does not have authority to inspect a server's files, active configuration, Java
installation, process state, or network ports.

## Value groups

### Configure and Runtime

- Server flavor and Minecraft version.
- Java version requirement and memory target.
- Startup preferences and non-secret launch-plan options.
- A user-labelled local reference that stays display-only unless a separately
  authorized local desktop integration exists.

### World and gameplay

- World name, seed handling policy, difficulty, game mode, view distance,
  simulation distance, and game-rule drafts.
- World-specific overrides presented beside the relevant baseline so a person
  can see what would inherit and what would diverge.
- Explicit warnings for irreversible or high-cost plans such as world upgrade,
  cache removal, or broad terrain changes.

### Network and access

- Non-secret planning values such as bind-mode intent, port number, online-mode
  choice, allowlist policy, and player-capacity target.
- Loopback and private-network guidance may be shown as general advice, but the
  companion must not scan networks, open ports, expose an address, or store
  credentials.
- RCON passwords, management credentials, keystore passwords, and account
  material are excluded completely.

### Paper CLI and Spigot setup

- Plugin names, compatibility notes, and declared dependencies as reviewable
  planning records only.
- Searchable command descriptions with argument guidance, command previews,
  target review, and clear risk labels.
- A raw command draft can be copied as text, but it must never be executed or
  handed to a server by this site.

## Validation and safety

Validation must run locally and return useful next steps. Examples include a
port number range, memory minimum/maximum relationship, a selected Java
requirement, an empty required world name, or a command missing a target.

For consequential plans, the UI should describe the exact affected plan item,
the local-only nature of the action, and the separate desktop-manager step that
would be required to apply it. It must not substitute a spinner, false success,
or a simulated server result for a real connection.

## Local storage and exports

The persistent state contract is deliberately narrow:

- Store only bounded, versioned, non-secret planner records in browser-local
  storage for the current origin.
- Give people a visible status, replace/import route, reset action, and clear
  explanation of what is retained.
- Exports contain only the selected non-secret plan and must identify the schema
  version and active planner scope.
- Never persist or export passwords, tokens, keystores, private addresses,
  server logs, player data, file contents, file handles, browser history, or
  opaque machine identifiers.
- A malformed, outdated, oversized, or unknown record must fail closed to an
  honest local draft or empty state rather than partially applying data.

No synchronization, analytics, telemetry, remote backup, or external API is
part of this contract.

## Planner Handoff v1

The planner's optional v1 handoff is a user-mediated, local JSON exchange with
the Windows desktop draft boundary. It does not create a browser-to-desktop
service channel. A user may choose a non-secret planner export or import in the
browser; the desktop separately opens a user-selected .json file, parses it
through its privileged bounded boundary, shows normalized values for review,
and requires an explicit apply or save action.

The handoff is deliberately smaller than the planner's display state. It may
contain only recognized, bounded planning fields. It excludes paths, URLs,
private server addresses, credentials, secrets, raw command or argument text,
file contents, remote transfer, server operation, configuration-file writes,
and arbitrary filesystem read or execution. A rejected file must leave the
existing local draft intact; importing a file alone must not apply it.

See [Planner Handoff v1](planner-handoff-v1.md) for the full contract,
validation boundary, and evidence status.

## Privacy and service boundary

The companion is not a server management endpoint. It must not create a
network request to configure a server, download runtimes or plugins, query a
remote catalog, authenticate a user, contact a desktop service, or fetch
third-party assets. Local source and browser-local planning state are the
complete boundary until a separately scoped change establishes otherwise.

## Verification boundary

This article records the planner contract as source-design evidence. The documentation-only
foundation lane did not run a build, test suite, lint, browser interaction,
accessibility audit, deployment, publication, or release. Future feature work
must add focused verification for the exact planner behavior it implements,
including validation, local-storage recovery, keyboard access, narrow layouts,
and no-network behavior.

## Suggested next articles

- [Companion Site Documentation index](README.md)
- [Planner Handoff v1](planner-handoff-v1.md)
- [Repository roadmap](../../ROADMAP.md)
- [Current handoff](../../HANDOFF.md)
