# Planner Handoff v1

## Purpose

Planner Handoff v1 defines a deliberately narrow, local exchange of a selected
Minecraft setup plan from the browser-local companion to the Windows desktop
application. It is a planning-data contract, not a server-management protocol,
not a remote synchronization service, and not a command channel.

The user remains the transport boundary. In the browser, they explicitly export
or import a local JSON file. In the desktop application, they explicitly choose
a local .json file through the native picker, inspect the normalized result,
and choose whether to apply or save it. No automatic browser-to-desktop
connection, file discovery, network transfer, or background import is part of
v1.

## Allowed v1 planning data

The envelope may contain only a bounded, versioned selection of non-secret
planning fields already represented by the guided planner. The v1 plan contains
only a server name and kind, selected Minecraft and Java presets, a memory
target, a world preset, EULA acknowledgement, online-mode intent, server port,
and RCON enabled and port planning values. It carries no RCON password.

### Current v1 field rules

| Planning value | Bounded v1 rule |
| --- | --- |
| Server name | A short non-empty label; it cannot be a path, URL, or command-like value. |
| Server kind | Paper or Spigot only. |
| Minecraft version | One of 1.21.4, 1.20.6, or 1.20.4. |
| Java runtime | Java 21 for 1.21.4 and 1.20.6; Java 17 for 1.20.4. |
| Memory plan | An integer from 1024 through 32768 MiB in whole-GiB increments. |
| World preset | world, creative-lab, or adventure-hub only. |
| EULA, online mode, and RCON | Boolean planning choices only; no credentials are attached. |
| Server and RCON ports | Integers from 1 through 65535; they must differ when RCON planning is enabled. |

Every accepted record must have:

| Requirement | Meaning |
| --- | --- |
| Explicit schema version | The reader knows which bounded contract it is evaluating. |
| Recognized complete field set | Unknown, duplicate, malformed, or unsupported fields do not become implicit settings. |
| Bounded values | Strings, numbers, arrays, and nested data must stay within declared limits. |
| Non-secret content | The record can be previewed and retained locally without carrying credentials or private server material. |
| Deterministic normalization | A valid record is reduced to the desktop application's supported planning shape before preview or application. |

The complete JSON payload is limited to 12 KiB before parsing. Duplicate member
names, unsafe object keys, omitted required values, unrecognized fields, and
invalid relationships are rejected rather than defaulted or partially applied.

The current documentation describes the contract rather than an interchangeable
configuration-file format. A record is not a server.properties, YAML, JSON, or
plugin configuration file and must never be treated as one.

## Explicitly excluded data and actions

Planner Handoff v1 rejects or omits all of the following:

- local paths, file handles, folder references, and filesystem metadata;
- URLs, hostnames, private server addresses, and remote endpoints;
- passwords, tokens, keys, certificates, keystores, player data, or other
  credentials and secrets;
- raw argument vectors, command text, scripts, shell fragments, or arbitrary
  execution instructions;
- file contents, server logs, configuration-file bytes, and opaque uploaded
  blobs;
- remote transfer, browser-to-desktop messaging, remote API calls, analytics,
  telemetry, synchronization, or cloud backup;
- server operation, process launch, download, plugin installation, RCON,
  management-protocol activity, or lifecycle control;
- configuration-file writes, arbitrary filesystem reads, or arbitrary
  filesystem execution.

The presence of a planning value must not authorize any excluded action. The
desktop preview remains planning data even when a later, separately scoped
feature can use a similar value.

## Browser-local flow

The companion planner retains only a bounded, versioned, non-secret local
draft in browser storage for the current origin. It provides user-activated
local JSON export and import; it does not scan folders, retain file handles,
read arbitrary local files, or contact the desktop application.

On import, the browser must validate the complete selected JSON payload before
it changes the local draft. Malformed, unknown-version, oversized, duplicate,
or out-of-bound data fails closed to an honest unchanged draft or empty state.
The browser must not partially apply an invalid file.

An export identifies its schema version and planning scope. It carries only the
approved selected planning values, never browser history, local paths, private
machine identifiers, file contents, or sensitive fields.

## Desktop-local import flow

The desktop application accepts a handoff only through an explicit native
.json file-picker choice. Its privileged main process owns bounded file reading
and complete parsing of that selected file. The renderer receives a safe, typed
result rather than unrestricted filesystem access or raw file content.

For a valid exact v1 payload, the desktop surface presents only a safe preview
of the normalized supported values. An invalid, unknown, or rejected payload
receives an honest generic rejection without raw file-content disclosure and
does not receive a preview. Importing a file alone does not apply it. Applying
or saving requires a separate explicit user action, and that action may persist
only the already normalized local draft through the existing bounded
persistence route.
Applying the v1 plan overlays only its approved planning values; local-only
paths, executable locations, seed information, and other desktop-local draft
state remain local.

The v1 reader must fail closed when the selected input is missing, unreadable,
not JSON, too large, a wrong schema version, structurally invalid, contains a
prohibited field, or cannot be normalized into the supported desktop draft.
It must leave the current draft intact rather than writing a partial
configuration or attempting a recovery by executing data from the file.

## Relationship to the desktop bridge

The sequence is strictly local:

1. The browser-local planner exports selected JSON only when the user asks.
2. The user chooses that local .json file in the desktop native picker.
3. The desktop main process performs a bounded complete parse and
   deterministic normalization.
4. The renderer presents only safe typed preview data.
5. The user separately chooses whether to apply or save the normalized local
   draft.

This is not a runtime bridge between the browser and desktop application. The
desktop preload API must expose only the typed operations needed for
selected-file import, preview, explicit apply, and local save; it must not
become a generic filesystem, process, shell, command, or server-control API.

## Failure, privacy, and recovery boundary

Failures are local and visible. A rejected handoff communicates the category of
problem and a safe next step, without exposing private file contents,
credentials, paths, or machine information. The existing valid local draft
remains available for review, reset, or a deliberate replacement.

No handoff content is sent off-device. Browser storage, a user-selected JSON
file, and the desktop's normalized local draft are separate local states with
their own reset behavior. An export or import must not imply a live server
connection, a remotely synchronized plan, or a successfully configured
Minecraft server.

## Evidence status

This article is source-design documentation only. It records the required safe
v1 boundary and does not claim that source code, a browser UI, a desktop UI, or
a local file flow has been exercised.

No tests, linting, review, accessibility assessment, browser interaction,
screen capture, build, package, release, website publication, or source-control
publication was performed for this documentation record. A later
implementation task must provide focused evidence for schema validation,
prohibited-field rejection, user-selected export/import, normalizing preview,
explicit apply/save, local-storage behavior, keyboard and screen-reader use,
narrow layouts, and the absence of network and execution routes.

## Suggested next articles

- [Configuration planner](configuration-planner.md)
- [Desktop foundation architecture](../architecture/desktop-foundation.md)
- [Desktop completeness inventory](../verification/completeness-inventory.md)
- [Repository roadmap](../../ROADMAP.md)
- [Current handoff](../../HANDOFF.md)
