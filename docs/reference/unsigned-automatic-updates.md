# Unsigned automatic-update foundation

## Status and scope

This reference defines the safety and integration boundary for a future Squirrel.Windows automatic-update service in Minecraft Server Command Center. It is deliberately a foundation, not a claim that an update is currently checked, downloaded, installed, or applied.

At this stage, the product has no live release-feed request, no automatic background schedule, no package transfer, no `Update.exe` invocation, no installer mutation, no restart request, and no renderer or IPC wiring for updates. The foundation exists so that those later additions have one narrow, reviewable contract instead of several ad-hoc update paths.

Squirrel.Windows distributes an update directory containing `RELEASES` and versioned packages. Its documented updater compares the distribution `RELEASES` file with the local release state, verifies packages against metadata in that file, and has no built-in rollback mechanism. This foundation intentionally chooses a smaller initial subset: it plans only a newer **full** package and never constructs or applies delta packages. See [Squirrel.Windows Update Process](https://github.com/Squirrel/Squirrel.Windows/blob/develop/docs/using/update-process.md) and [Squirrel.Windows distribution guidance](https://github.com/Squirrel/Squirrel.Windows/blob/develop/docs/getting-started/3-distributing.md).

## Feed identity is fixed, not user-entered

The update service must receive a release-feed policy from trusted application configuration. A settings field, environment variable, renderer value, release-note link, or arbitrary URL must never choose the feed at runtime.

The policy consists of an allowlisted HTTPS origin and one exact release-directory path. Its normalised form has these requirements:

| Requirement | Foundation rule |
| --- | --- |
| Scheme | `https:` only. Plain HTTP, `file:`, `data:`, custom schemes, and mixed-content routes are rejected. |
| Authority | Host, port, and user-info are compared against the configured allowlist. Credentials embedded in a URL are rejected. |
| Directory | The configured path names one release directory, not a broad site root. `RELEASES` is resolved only as `<release-directory>/RELEASES`. |
| Package URL | A package is resolved only from a validated simple filename underneath that exact directory. It cannot contain a separator, dot segment, query, fragment, percent-encoded separator, or alternate origin. |
| Redirects | A transport adapter must not follow an unapproved redirect. If an approved deployment needs a redirecting asset host, each final origin and exact directory must be independently allowlisted before release. |
| Release metadata | A JSON release API, release-notes page, or "latest" browser redirect is not a substitute for the approved Squirrel release directory. |

This is intentionally stricter than accepting a general download URL. The application should be unable to fetch an unrelated file merely because a string resembles a release link.

## Privileged transport adapter

Only a native or main-process adapter may eventually perform release-feed I/O. A renderer receives state snapshots and user intents through a narrow IPC contract; it never receives an unrestricted network primitive, an update URL, authentication material, or a package path.

The foundation accepts an injected, capability-limited fetch adapter so deterministic parsing and selection logic can be reused without granting the logic ambient network access. The adapter contract must provide only the data needed by the update operation:

- request a validated URL using a bounded timeout and cancellation signal;
- return the final validated URL, status, bounded response bytes, and any trustworthy reported length;
- reject rather than silently broaden redirects, schemes, hosts, or paths;
- avoid credentials, cookies, bearer headers, persisted response bodies, request-body logging, and renderer-controlled request options; and
- surface cancellation, timeout, malformed response, and transport failure as distinct facts.

The initial foundation does not call that adapter. It must not send a network request simply because the application starts. A later owner may add a bounded startup and user-requested schedule only after the main-process implementation, UI disclosure, IPC boundary, and installer boundary are present.

## Bounded `RELEASES` handling

The Squirrel documentation describes a `RELEASES` file containing package SHA-1, filename, and file-size metadata. The foundation treats that file as untrusted input and accepts a deliberately small canonical subset:

```text
<40 hexadecimal SHA-1 characters> <safe-package-filename> <positive-decimal-byte-count>
```

An implementation must enforce all of these parser bounds before selection:

| Input | Required bound and outcome |
| --- | --- |
| Manifest body | A finite maximum byte count before decoding; an oversized response is rejected without partial selection. |
| Lines and entries | Finite maximum line and entry counts; an entry beyond either bound rejects the manifest rather than trimming it. |
| Individual line | A finite maximum UTF-8 byte count; overlong lines are rejected before tokenisation. |
| Filename | A finite maximum length and a strict basename-only grammar. Any path separator, traversal sequence, control character, percent escape, query, fragment, or unsupported extension is rejected. |
| SHA-1 | Exactly forty hexadecimal characters, normalised to lowercase only after validation. Missing or malformed hash metadata is not treated as a successful verification value. |
| Length | A positive base-10 integer within the configured package-size ceiling. Negative, zero, fractional, scientific-notation, or overflowing values are rejected. |
| Extra syntax | Blank lines may be ignored. Comments, rollout annotations, duplicate filenames, duplicate normalized versions, and unrecognised fourth fields are rejected until an explicit, separately tested compatibility policy is added. |

The concrete byte and count constants belong in one shared main-process module and must be exported or documented beside that implementation. Renderers must display a factual failure state instead of duplicating limits or attempting their own parser.

## Strict Squirrel package and version normalization

The foundation accepts only a selected application package name ending in `-full.nupkg`. It does not infer an application identity from an arbitrary archive, treat a delta package as a full package, or execute a package merely because it was listed in `RELEASES`.

After the approved package prefix and `-full.nupkg` suffix are removed, the remaining version must parse as a complete Squirrel-compatible semantic version:

- stable versions use all three numeric components: `major.minor.patch`;
- an explicitly supported prerelease suffix may follow the stable version, with nonempty dot-separated identifiers; and
- leading `v`, omitted components, whitespace, path syntax, build metadata that the selected adapter cannot compare, leading-zero numeric components, and ambiguous separators are rejected.

Comparison uses the normalized version tuple, never a lexical filename sort. A candidate must be strictly newer than the currently installed normalized version. Equal and lower versions are not downloads, and an unparseable installed or remote version produces an honest unavailable or failed state rather than a guessed update.

## Full-package selection and no rollback

Squirrel.Windows can select deltas and can build a full package from them. The initial product foundation does neither. Given valid entries, it selects at most one newest compatible `-full.nupkg` whose version is greater than the current version.

| Situation | Result |
| --- | --- |
| No valid newer full package | `up-to-date`; no transfer is requested. |
| One or more valid newer full packages | Select only the highest normalized version. |
| Delta-only release or incompatible package identity | Do not construct a full package or fall back to an arbitrary archive; report no supported candidate. |
| Installed version is newer than the feed | Do not downgrade. |
| A staged package later fails verification or staging | Keep the installed version. Do not select a lower package as a rollback substitute. |

The native Squirrel updater itself has no built-in rollback support. A later recovery feature must be designed and documented independently; this foundation never calls a downgrade path "rollback."

## Metadata validation is conditional and honest

The `RELEASES` format supplies a SHA-1 and length for a package. Those fields are integrity metadata, not a publisher signature and not proof of a trusted identity.

When a selected entry contains valid expected metadata, a future privileged transfer adapter must compare the downloaded package's observed length and computed SHA-1 with those exact expected values before it reports the package ready. If expected hash or length metadata is absent, malformed, or unavailable, the service must not invent a value, substitute a filename comparison, or call the package verified. The candidate stays unavailable or fails with the missing-metadata fact.

This rule is intentionally conditional: a comparator may compare a hash or length only when there is an expected, validated value to compare against. A missing expected value is not a match, and an observed value alone is not verification.

## State, cancellation, and restart intent

The later UI should render the main-process state machine rather than infer update status from button labels. The core state vocabulary is:

| State | Meaning | Allowed next user intent |
| --- | --- | --- |
| `idle` | No check is in progress and no candidate is selected. | Check for updates. |
| `checking` | The privileged adapter is evaluating the approved manifest. | Cancel. |
| `up-to-date` | The approved manifest yielded no supported newer full package. | Check again. |
| `available` | A newer supported full-package plan exists but no transfer has begun. | Download, dismiss, or check again. |
| `downloading` | An approved package transfer is active and bounded. | Cancel. |
| `cancelled` | The current operation ended by cancellation; no installation result is claimed. | Retry. |
| `ready-to-restart` | The native adapter has independently confirmed a staged package is ready for user-chosen installation. | Restart to install or Later. |
| `failed` | A checked fact prevented completion. | Retry after showing the exact recoverable failure. |

`ready-to-restart` is not permission to restart automatically. A later native integration must retain the user's active work, show the exact target version, explain that the package is unsigned, and provide a persistent **Restart to install update** action plus **Later**. Cancellation stops the current bounded operation and preserves the existing installed version; it must not fabricate a completion result.

## Unsigned-artifact disclosure

Every update surface must state plainly that Squirrel packages for this product are unsigned. An unsigned package can trigger an unknown-publisher or SmartScreen warning. HTTPS and matching `RELEASES` metadata do not make that warning disappear and do not establish code-signing identity.

The product must not request, discover, generate, store, renew, or use a code-signing certificate, private signing key, timestamp credential, signing service, or browser-extension signing key. No user interface, documentation, log, release note, or success state may imply that the updater verified a signature when it compared only release metadata.

## Native installation boundary

Only a future native main-process adapter may hand an already-approved update decision to Squirrel's updater. Its input must be a typed plan: the allowlisted feed identity, selected normalized version, validated package filename, and expected metadata. It must not accept a renderer-provided command string, arbitrary executable path, shell syntax, uncontrolled environment expansion, or an unvalidated URL.

The adapter must report only observed state transitions: planning, transfer progress, cancellation, verification failure, staging failure, ready-to-restart, or native-process failure. It must not claim an update installed until the native updater has reported that fact after the user chose restart.

This foundation does not invoke `Update.exe`, write to an installation directory, change shortcuts, remove old versions, or alter the system. Those are later, separately verified native-adapter responsibilities.

## Privacy and operational boundaries

- No token, account, credential, cookie, authorization header, or private URL belongs in update settings, logs, renderer state, exports, history, screenshots, or source control.
- Release-manifest and package input is bounded, validated, and retained only when a later explicit product feature needs it. Raw network payloads are not ordinary diagnostics.
- Update checks must not expose a local server, perform port forwarding, launch a Minecraft server, install Java, install a plugin, or modify a server configuration.
- The update foundation has no interaction with Paper, Spigot, RCON, server-management credentials, or user game data.

## Verification status

Under the active rapid-delivery scope, this documentation records a source-level contract only. No automated checks, network request, package transfer, installer invocation, restart, build, package, release, runtime launch, or screen capture ran for this updater foundation. UI and IPC wiring are explicitly deferred to a later dedicated integration.

## Sources

- [Squirrel.Windows — Update Process](https://github.com/Squirrel/Squirrel.Windows/blob/develop/docs/using/update-process.md) — `RELEASES` comparison, package verification, full/delta behavior, and lack of built-in rollback.
- [Squirrel.Windows — Distribution](https://github.com/Squirrel/Squirrel.Windows/blob/develop/docs/getting-started/3-distributing.md) — required `RELEASES`, full-package, and optional delta distribution assets.
- [Squirrel.Windows — GitHub distribution and updating](https://github.com/Squirrel/Squirrel.Windows/blob/develop/docs/using/github.md) — release-asset distribution context; this foundation still requires one approved release directory rather than an arbitrary API response.

## Suggested articles

- [Java runtime setup](java-runtime-setup.md) — controlled Java selection before a server process can start.
- [Server lifecycle service](server-lifecycle.md) — constrained server-process lifecycle and console boundary.
- [Paper and Spigot CLI catalog](paper-spigot-cli-catalog.md) — typed server argument metadata, separate from application updates.
- [Reference index](README.md) — other reusable technical contracts.
