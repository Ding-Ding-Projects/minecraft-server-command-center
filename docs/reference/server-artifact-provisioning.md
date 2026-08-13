# Server artifact provisioning foundation

`src/main/server-artifact-provisioning-service.cjs` is a planning-only main-process service for a future guided provisioning flow. It intentionally does **not** make a network request, write a file, start Java, invoke a shell, or create a server. Its role is to turn rich, validated GUI choices into bounded plans that a later privileged executor can carry out.

## Scope and boundaries

The service covers two distinct setup routes:

| Route | Plan | What the foundation does | What it deliberately does not do |
| --- | --- | --- | --- |
| Paper | Fill v3 version/build metadata and an artifact download plan | Validates version/build selection, exact server filename, official origin, metadata size/checksum, destination, byte limit, cancellation, and no-overwrite staging instructions | Fetch metadata, download a JAR, follow a redirect, create a folder, or start a server |
| Spigot | Local BuildTools launch plan | Requires a user-selected local BuildTools JAR, Java executable, separate workspace, and separate output folder; returns direct process arguments | Download BuildTools, invent a Spigot download URL, run a shell, or launch BuildTools |

All functions return ordinary data structures or raise a `ProvisioningPlanError`. The later Electron main-process executor owns the actual operating-system and network actions, and must revalidate every plan immediately before acting.

## Paper: official metadata then a bounded artifact plan

Paper's current downloads service is Fill v3. The planner permits exactly two HTTPS origins:

| Purpose | Allowed origin | Allowed path shape |
| --- | --- | --- |
| Version and build metadata | `https://fill.papermc.io` | `/v3/projects/paper` and `/v3/projects/paper/versions/<version>/builds` |
| Selected server artifact | `https://fill-data.papermc.io` | `/v1/objects/<sha256>/paper-<version>-<build>.jar` |

This follows the official Paper downloads documentation: the Fill v3 metadata endpoint supplies the `server:default` download's name, URL, SHA-256 checksum, and size. The planner does not construct a CDN object URL from a version or build. It accepts the URL only after it validates the official metadata value against the fixed Paper artifact origin and expected object-path shape. Every Paper request includes an application-specific User-Agent with the project contact URL, as the Paper service requires.

### Intended GUI flow

1. Call `createPaperVersionChoicesPlan({ applicationVersion, signal })` and let the future main-process executor request its metadata plan.
2. Show the returned Paper versions in a picker. After a version is selected, call `createPaperBuildChoicesPlan({ applicationVersion, minecraftVersion, signal })`.
3. The executor obtains the official build list. Use `selectPaperStableBuild({ minecraftVersion, build, builds })` to select one `STABLE` record from the response. Non-stable channels are intentionally rejected by this foundation.
4. Pass the selected record and a native-folder-picker result to `createPaperArtifactDownloadPlan(...)`.

The path argument is deliberately structured rather than a free-text field:

```js
const serverRoot = {
  source: 'native-folder-picker',
  path: 'D:\\Minecraft\\paper-1.21.10',
};
```

The planner accepts local absolute Windows drive paths only. It rejects roots, UNC/device paths, alternate data streams, and traversal that would place a file outside the chosen server folder.

### Paper transport and integrity contract

The resulting plan requires the future executor to:

- use `GET`, `redirect: 'error'`, no credentials, a bounded timeout, and only the exact planned URL;
- reject a final response URL that differs from the plan, including every redirect;
- check the exact expected filename across metadata, URL path, and final destination;
- reject a metadata size or streamed byte count above the user-selected bounded transfer limit;
- compare byte count and SHA-256 to the official metadata whenever those values are supplied;
- stage the download as an exclusive (`wx`) temporary file in the destination folder;
- revalidate that the root and target are local non-reparse-point filesystem entries;
- promote only a fully verified file through a no-overwrite hard-link procedure, failing if the destination already exists; and
- honor an `AbortSignal` by stopping transfer and removing only the planner-owned temporary file, never an existing final JAR.

`verifyPaperArtifactResult(...)` is pure validation logic for a later executor. It checks the final response URL, filename, counted bytes, and computed SHA-256 without reading a file or calling the network itself.

The transfer limit defaults to 512 MiB and can only be chosen between 16 MiB and 2 GiB. A plan is rejected before network activity if official metadata already exceeds the selected cap.

## Spigot: local BuildTools only

The service deliberately does not expose a direct Spigot server-JAR download route. Spigot's supported BuildTools workflow builds the server locally; its documented command-line flags include `--rev`, `--output-dir`, and `--final-name`.

`createSpigotBuildToolsPlan(...)` accepts typed native-picker values only:

```js
const buildToolsJar = {
  source: 'native-file-picker',
  path: 'D:\\Tools\\BuildTools.jar',
};

const javaExecutable = {
  source: 'native-file-picker',
  path: 'C:\\Program Files\\Java\\jdk-21\\bin\\java.exe',
};

const workspace = {
  source: 'native-folder-picker',
  path: 'D:\\Minecraft\\buildtools-workspace',
};

const outputDirectory = {
  source: 'native-folder-picker',
  path: 'D:\\Minecraft\\spigot-output',
};
```

The returned process plan is an argument array, not a shell string:

```text
java.exe
  -jar <selected BuildTools.jar>
  --rev <selected Minecraft version>
  --output-dir <selected output directory>
  --final-name spigot-<selected Minecraft version>.jar
```

Its future executor must use `shell: false`, keep BuildTools' workspace separate from the output directory, reject an existing target JAR, and validate that the selected BuildTools path is a regular local JAR before launch. The planner does not claim that choosing a file proves its provenance; byte/signature validation and the user's explicit start action remain mandatory at execution time.

BuildTools may obtain its own upstream build inputs when a user starts the future plan. That behavior is part of BuildTools, not a direct server-JAR download performed by this application. The plan neither disables certificate validation nor provides flags such as `--disable-certificate-check` or `--disable-java-check`.

## Failure behavior

| Condition | Planning behavior |
| --- | --- |
| A Paper version, build ID, channel, URL, artifact name, size, or checksum is malformed | Reject the plan before a request or filesystem action |
| A Paper artifact is not a stable build | Reject the plan; the UI must show a clear explanation rather than silently substituting a different build |
| Paper metadata points outside the two allowlisted official origins | Reject the plan and do not follow it |
| Expected size exceeds the selected cap | Reject before transfer |
| The cancellation signal is already aborted | Raise `AbortError` without starting work |
| A folder or file path came from raw text, is a root, UNC/device path, or is outside the selected local drive context | Reject the plan; request a new native picker selection |
| BuildTools, Java, workspace, or output folder is missing at execution time | The later executor must stop with a specific preflight message; this planner does not guess paths or create them |
| The final JAR already exists | The later executor must fail closed; it must not overwrite the existing server artifact |

## Security notes

- The planner accepts no free-form command, executable argument, URL, destination filename, header, or shell expression.
- Every provider route is constructed from validated values and an explicit origin allowlist.
- HTTP redirects are rejected rather than accepted on faith or rechecked after a cross-origin hop.
- Paper download verification combines expected name, allowed object path, byte count, and SHA-256 when official metadata provides them.
- A later executor must use a low-privilege main-process boundary, bounded response streaming, reparse-point checks, and only planner-owned temporary-file cleanup.
- No credentials, authentication headers, custom proxy configuration, or secret values belong in these plans.

## References

- [PaperMC Downloads Service](https://docs.papermc.io/misc/downloads-service/)
- [Spigot BuildTools](https://www.spigotmc.org/wiki/buildtools/)

## Verification status

This Yum Lerng Cha lane intentionally ran no unit tests, lint, static analysis, runtime download, BuildTools launch, package build, or user-interface capture. The module is a source-only foundation pending integration with the desktop application's privileged executor and its later focused verification.
