# Server lifecycle service

## Status and scope

This reference describes the planned reusable lifecycle foundation for Minecraft servers in Minecraft Server Command Center. It is a boundary document, not a claim that the complete product runtime, download flow, configuration editor, or server-management UI is already available.

The foundation is intended to let the desktop application validate a selected Paper or Spigot server profile, produce a controlled direct-process launch plan, supervise the resulting process, and expose safe, bounded console events. It is deliberately not a general command executor.

The planned module exports these integration points:

```text
ServerLifecycleService
LifecycleValidationError
LifecycleStateError
validateServerProfile
buildServerLaunchPlan
resolveProfileWorkspace
sanitizeConsoleText
SERVER_KINDS
SERVER_STATES
```

Consumers should use the exported server-kind and state collections instead of duplicating their values in a user interface.

## Profile boundary

The lifecycle service accepts a structured profile rather than a raw command line. The application should collect each field with a purpose-built control: a server-kind picker, approved Java picker, workspace chooser, JAR picker, memory steppers, and a separate EULA acknowledgement. A generated command preview is read-only information, never an editable execution field.

| Field | Required boundary | Intended UI control |
| --- | --- | --- |
| `id` | Stable profile identifier used to associate lifecycle state with a saved profile. | Read-only identifier or managed profile record. |
| `serverKind` | Exactly `paper` or `spigot`. | Segmented control or select. |
| `javaExecutable` | Absolute path to a pre-approved Java binary. | Detected-runtime picker plus a validated browse action. |
| `workspaceId` | One safe directory segment under the application-controlled server root. It is not an arbitrary filesystem path. | Profile-name field with inline validation. |
| `jarFileName` | One safe file name ending in `.jar`; it is resolved only inside the controlled workspace. | JAR-file picker filtered to the resolved workspace. |
| `minimumMemoryMiB` | Positive memory amount in MiB. | Numeric stepper with unit label. |
| `maximumMemoryMiB` | Positive memory amount in MiB and not lower than the minimum. | Numeric stepper with inline relationship feedback. |
| `eulaAccepted` | Explicit boolean acknowledgement required before a start operation. | Separate acknowledgement control linked to the Mojang EULA. |

`validateServerProfile` rejects malformed, incomplete, or unsafe input with `LifecycleValidationError`. UI code should present the returned validation fact near the originating control and must not replace it with a generic "launch failed" message.

## Controlled path resolution

`resolveProfileWorkspace` derives the effective workspace from an application-owned server root and the validated `workspaceId`. The profile does not select a free-form working directory. This separation is important because it makes the lifecycle boundary responsible for rejecting path traversal, separators, and other attempts to leave the configured server root.

The selected JAR is similarly constrained to the resolved workspace through the validated `jarFileName`. The lifecycle foundation does not turn a profile into a shell snippet, a script path, or an arbitrary executable path.

## Direct launch plan

`buildServerLaunchPlan` produces a direct executable invocation for a validated profile. Its command shape is:

```text
<approved Java executable>
  -Xms<minimumMemoryMiB>M
  -Xmx<maximumMemoryMiB>M
  -jar <controlled workspace JAR>
  nogui
```

The service starts that plan directly with an argument vector and `shell: false`. It does not use a command interpreter, concatenate a user-supplied command string, expand shell variables, or accept arbitrary extra flags. This makes the generated preview useful for inspection while keeping the preview separate from the execution authority.

The service does not download a server JAR, retrieve credentials, contact a network service, or write server configuration files. Those operations require their own explicit, separately documented workflows. Accepting `eulaAccepted` is a launch precondition; it is not a hidden `eula.txt` writer.

## Lifecycle state and process controls

`ServerLifecycleService` owns the transition between a validated profile and a supervised child process. `SERVER_STATES` is the canonical state vocabulary, and UI controls should be enabled from service state rather than guessed from button labels.

| User intent | Lifecycle boundary |
| --- | --- |
| Start | Validates the profile and EULA acknowledgement, constructs the direct launch plan, then starts only when the current state permits it. |
| Stop | Requests an orderly stop only for a currently active process. |
| Force stop | Ends an active process when orderly shutdown is unavailable; the UI must make the consequence clear before requesting it. |
| Repeated or invalid action | Rejects the transition with `LifecycleStateError` rather than silently starting another process or pretending a stop succeeded. |

The foundation is responsible for process supervision, not for deciding whether a Paper or Spigot installation is complete. A caller must treat a rejected transition, missing controlled input, or process exit as a truthful state change and preserve the prior profile rather than inventing a successful result.

## Console events and input

Console handling is designed for an application surface, not an unrestricted terminal.

- Output is passed through `sanitizeConsoleText` before it is retained or emitted to UI consumers.
- Console history and individual events are bounded. When information is shortened or evicted, the user interface should report that history is incomplete instead of implying it is a full server transcript.
- Retained console content is redacted before it reaches ordinary application history or logs. Credential-like material must not be intentionally captured, exported, or re-rendered.
- Console input is a bounded, single-line server-console command. Multi-line payloads, shell syntax, and command-interpreter behavior are outside this boundary.
- Console actions are associated with an active supervised server process; they do not open a general local command prompt.

The exact size limits belong to the service implementation so that every consumer receives the same safety envelope. UI code should expose the current truncation or redaction state rather than duplicating limits in a renderer.

## Failure and recovery expectations

| Situation | Expected application behavior |
| --- | --- |
| Unsafe or incomplete profile | Keep the profile editable, identify the invalid field, and do not attempt process launch. |
| EULA not acknowledged | Explain that start is unavailable until the explicit acknowledgement is supplied; do not create or alter files as a side effect. |
| Disallowed state transition | Keep the current state visible and surface the `LifecycleStateError` factually. |
| Console event exceeds a bound or contains sensitive material | Keep only the safe, bounded representation and indicate redaction or truncation where relevant. |
| Server process exits | Report the observed state and available bounded console context; do not infer a successful stop or start from the absence of an exception. |

## Privacy and security boundaries

- Profiles contain only the controlled launch information needed by this foundation. They are not a credential store.
- The lifecycle service must not log credentials, secrets, raw environment values, or arbitrary user-entered command lines.
- Direct process spawning remains limited to the validated Java executable, controlled workspace, controlled JAR filename, and generated argument vector.
- No network, server download, plugin download, remote control, configuration write, or arbitrary shell feature is implied by this service.
- A richer server-configuration workflow may build on this foundation, but it must document its own write paths, confirmation behavior, validation, and recovery rules.

## Verification status

This reference was added with the lifecycle foundation lane. Under the active rapid-delivery scope, no automated checks, build, runtime launch, or screen capture were performed for this documentation change. Implementation verification must establish that the exported interface and behavior match this boundary before the service is represented as a completed server-management feature.

## Suggested articles

- [Paper and Spigot command catalog](paper-spigot-cli-catalog.md) — typed server-option metadata for configuration controls.
- [Reference index](README.md) — other reusable technical contracts.
