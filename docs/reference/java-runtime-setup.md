# Java runtime discovery and review-only setup

## Purpose

Minecraft Server Command Center uses `src/main/java-runtime-manager.cjs` and the narrow `src/main/java-runtime-controller.ts` bridge to make Java runtime selection a guided, reviewable desktop step. The Runtime tab discovers a deliberately bounded set of Java executable candidates, binds selection to opaque candidate IDs, validates one selected executable with a fixed direct process invocation, and renders structured compatibility and review-only-plan status.

The service and its current desktop integration do **not** install Java, alter package-manager state, launch a terminal, launch a server, write credentials, download a catalog, write server configuration, or assume a proposed runtime was installed. The renderer receives no Java executable path, raw version output, shell text, or generic filesystem/process capability. A later installation feature would need its own explicit user confirmation and separately reviewed privileged route.

## Guided selection model

The UI should expose Java through a candidate picker, not a generic command or CLI text field.

1. A person can choose a Java executable with the native file picker, or request bounded discovery from the Runtime tab.
2. `discoverJavaCandidates()` adds that explicit selection first, then checks only bounded conventional locations.
3. The picker binds to candidate IDs returned by the discovery result and calls `selectDiscoveredJavaCandidate()`.
4. `probeJavaExecutable()` validates the selected candidate with direct process arguments equivalent to `java -version` and returns a structured status.
5. `assessSelectedJavaRuntime()` combines the selected Paper target, an official Paper catalog result when one has been supplied by a separate bounded adapter, the Java probe, and a review-only plan.

Discovery intentionally does **not** scan `PATH`, disks, the registry, arbitrary user folders, or locations recursively. The bounded locations are:

| Scope | Locations checked |
| --- | --- |
| Explicit selection | An absolute Java executable, a `bin` directory, or a Java home selected through the UI |
| Environment homes | `JAVA_HOME` and `JDK_HOME`, when set |
| Current-user locations | `.jdks`, plus platform-specific Java vendor locations below the current user's application-data area |
| System locations | Conventional Java vendor folders below the operating-system program-files location on Windows, `/usr/lib/jvm` and `/opt/java` on Linux, and `/Library/Java/JavaVirtualMachines` on macOS |

Only direct children of a known root are considered, and the service enforces root, child, and overall candidate limits. An unavailable directory is a normal absence, not an invitation to broaden the search.

The current Runtime tab deliberately offers only an actual Java executable in
its native picker. The underlying manager can normalize a Java home or `bin`
directory when used by a future privileged caller, but no such raw-path input
is exposed to the renderer.

## Probe safety and status

`probeJavaExecutable()` accepts only an absolute path whose final filename is the platform Java binary (`java.exe` on Windows, `java` elsewhere). It uses Node's direct child-process API with an exact argument array and `shell: false`; it never constructs a shell command.

The probe has bounded defaults:

| Limit | Default | Hard range |
| --- | ---: | ---: |
| Process timeout | 8 seconds | 0.5–30 seconds |
| Captured version output | 16 KiB | 1–128 KiB |

Java commonly writes version information to standard error, so the service reads both output streams in memory only. It extracts a normalized version and then discards the raw process text; raw output must not be logged, exported, or displayed. Possible results include `valid`, `missing`, `invalid-executable-path`, `timeout`, `output-limit-exceeded`, `launch-failed`, `nonzero-exit`, and `unrecognized-version`.

The normalizer recognizes current and legacy Java forms including `25`, `17.0.12+7-LTS`, and `1.8.0_432`. Legacy `1.8` is normalized to Java major 8.

## Paper Java requirements

The resolver uses the current official [Paper getting started requirements table](https://docs.papermc.io/paper/getting-started/). The table calls these **Recommended Java Version** values. Command Center preserves that terminology instead of presenting historical rows as a universal hard-minimum claim.

| Paper/Minecraft target | Recommended Java major |
| --- | ---: |
| `1.7.10` through `1.11.x` | 8 |
| `1.12` through `1.16.4` | 11 |
| `1.16.5` exactly | 16 |
| `1.17` through `1.19.x` | 17 |
| `1.20` through `1.21.11` | 21 |
| `26.1+` | 25 |

The selected target must first be present in the official Paper catalog supplied by the downloads layer. `resolvePaperJavaRequirement()` fails closed as `unverified` for malformed versions, a target absent from that catalog, pre-`1.7.10` targets, known numeric gaps such as `1.16.6`, values between `1.21.11` and `26.1`, and any future range not covered by the table. The rich recovery action is to refresh or choose an official Paper target; there is no raw override field.

This mapping is Paper-specific. A Spigot target returns `unverified` until a separately sourced Spigot compatibility resolver exists; Paper documentation is never silently applied to Spigot.

### Current catalog boundary

The Runtime tab currently has **no bundled verified Paper Downloads target catalog**. The existing CLI catalog and planner presets are not substituted for that evidence. The main-process controller therefore supplies no target entries to the requirement resolver and shows an explicit `unavailable` catalog row; a Paper assessment remains `unverified` even if the Java probe itself succeeds. This source path makes no network request to Paper or any other service.

Spigot remains separately unverified. The controller labels that state explicitly and does not apply the Paper recommendation matrix to a Spigot target.

For version-scheme context, Paper's [project setup documentation](https://docs.papermc.io/paper/dev/project-setup/) explains that versions before `26.1` correspond to `1.21.11` and below. The official [downloads service documentation](https://docs.papermc.io/misc/downloads-service/) describes its catalog keys and recommends stable builds.

## Compatibility states

The service communicates the runtime state without guessing:

| State | Meaning | Guided next step |
| --- | --- | --- |
| `compatible` | The selected, successfully probed Java major exactly matches Paper's documented recommendation | Keep the selected runtime |
| `mismatch` | The selected Java major is older than the recommendation | Review the Java setup plan |
| `missing` | No Java runtime was selected or the selected binary is unavailable | Choose a runtime or review the setup plan |
| `needs-review` | The selected Java major is newer than the documented recommendation | Choose a documented runtime or explicitly investigate compatibility later |
| `unverified` | The Paper target or Java probe could not be verified | Refresh/select a verified target or runtime; do not start the server |

Newer Java is not automatically treated as compatible. Paper's [FAQ](https://docs.papermc.io/paper/faq/) warns that unsupported, early-access, or internal Java versions may be problematic.

## Review-only installation plans

`createJavaSetupPlan()` only creates data for an accessible UI to show. A plan states that no process has run and no system state has changed. It includes:

- the Paper target and recommended Java major;
- the reason a new runtime is being considered;
- Paper's [Java installation guidance](https://docs.papermc.io/misc/java-install/);
- on Windows, a **Windows Package Manager** route that must be availability-checked only after explicit confirmation, plus an official runtime-guide route; and
- an instruction that a later integration must present a rich route selector and an independent confirmation control before attempting an install.

No plan contains a shell command string, a password, a token, a package-manager invocation, or an assertion that installation succeeded. The plan's `executionState` remains `not-executed`, its `mutationState` remains `no-system-state-changed`, and it cannot perform installation itself.

Paper's installation guidance recommends a full Java runtime rather than a `-headless` variant. The UI should present that as an informed default, while preserving the explicit user decision before any external installer is opened or invoked.

## Desktop integration boundary

The Runtime tab calls only these narrow bridge operations:

| Bridge operation | Privileged behavior | Renderer result |
| --- | --- | --- |
| `runtime.discover()` | Uses bounded conventional discovery only. | Opaque candidate IDs, source labels, bounded diagnostics, and search-boundary facts. |
| `runtime.choose()` | Opens the native Java-executable picker, then feeds the selected path directly into bounded discovery. | The same safe candidate summaries; no selected path. |
| `runtime.select(id)` | Resolves an ID only from the current main-process discovery result. | Selected safe candidate summary only. |
| `runtime.assess(...)` | Calls the manager's fixed `java -version` probe for the selected candidate and projects its structured result. | Parsed Java-major/status data, compatibility state, explicit catalog-unavailable state, and review-only plan facts. |
| `runtime.clear()` | Drops the in-memory discovery and selection state. | No local server or configuration mutation. |

The main process owns candidate paths and probing. The renderer cannot supply a raw Java path to the new runtime bridge, cannot supply raw command text, and cannot invoke an installer, package manager, download, server lifecycle action, configuration writer, or credential route. The existing direct-argument preview deliberately renders `java` as a non-executable placeholder rather than treating a renderer-held custom path as a process target.

## Security and failure boundaries

- The native picker is the only intended source of an explicit Java path; relative paths are rejected before a candidate can be listed.
- Candidate discovery is bounded and shallow to avoid unexpected filesystem traversal.
- Java version probing uses direct argv, a timeout, and a maximum captured-output size. It uses no shell.
- Raw output is not retained after version parsing, which reduces the risk of leaking unexpected program output through application logs or exports.
- Discovery, probing, and plan projection are local-only. They make no network request and do not write a server setting, secret, installer state, runtime file, or configuration file. Selecting a candidate may update the local planning preference only after the existing draft-save path runs; it never writes a selected Java path into the renderer-controlled preview.
- A failed or unknown result remains unknown. It does not silently fall back to `PATH`, mark a runtime as compatible, install anything, or start a server.

## Verification boundary

This source implementation intentionally did not run tests, lint, review, a build, a package, a runtime Java installation, a server launch, or a screen capture during the active ultra-speed delivery pass. Follow-up work must add focused automated coverage for the bridge's opaque-ID ownership, native-picker cancellation, bounded discovery, version parsing, catalog-unavailable state, officially sourced Paper catalog resolution, Spigot non-mapping, probe timeout/output-limit behavior, and review-only plan invariants before broad release assurance is claimed.
