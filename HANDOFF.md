# Handoff

## Current snapshot

The repository currently records two source-only foundations:

- a browser-local companion-site planner under `site/`; and
- a Windows desktop configuration foundation under `src/`.

Neither record proves a deployment, publication, release, installer operation,
external-service integration, live server connection, or server-process action.

## Companion-site record

The companion site is a browser-local planning and documentation surface. Its
source documents the exact destinations Overview, Configure, Paper CLI, Spigot
setup, Runtime, Safety, Docs, and Release status. It must not retain secrets,
private server data, file contents, logs, player data, or browser information
outside its bounded non-secret planner contract.

Read `docs/site/README.md` and
`docs/site/configuration-planner.md` before changing companion behavior.

## Desktop foundation record

The desktop source contains:

- a normalized schema-version-1 server draft stored under Electron user data;
- narrow native folder, JAR, Java, and configuration picker requests;
- a frameless, sandboxed, context-isolated Material Design 3 renderer with
  seven vertical setup tabs;
- typed Paper/Spigot registry projection and direct argument-array preview;
- explicit no-launch IPC and automatic-update-unavailable boundaries;
- Windows Squirrel.Windows packaging configuration, unsigned-only settings,
  root build scripts, and an SVG icon master generated to an ICO during build.

The following desktop paths are source-only evidence:

```text
package.json
electron-builder.yml
vite.renderer.config.ts
tsconfig.json
tsconfig.main.json
build.bat
build-installer.bat
.github/workflows/release.yml
scripts/verify-unsigned.mjs
assets/app-mark.svg
src/shared/server-draft.ts
src/shared/desktop-api.ts
src/main/index.ts
src/main/draft-store.ts
src/main/argv-preview.ts
src/main/cli-catalog.ts
src/main/update-boundary.ts
src/preload/index.ts
src/renderer/index.html
src/renderer/main.ts
src/renderer/styles.css
```

The desktop renderer has no process-start IPC, shell command field, RCON
transport, arbitrary-command execution route, or update transport. It should
continue to render those facts honestly until separately implemented and
verified.

## Verification boundary

No build, lint, automated test, browser/desktop interaction, accessibility
audit, deployment, publishing action, external-service call, package, release,
or server-process action is claimed by this handoff. Source paths and scripts
are not proof that they ran.

## Safe continuation

1. Preserve the companion site's browser-local, non-secret contract.
2. Keep desktop changes behind the narrow bridge and typed registry seam.
3. Exercise the built desktop application through the approved headless route
   before claiming visual or interaction behavior.
4. Record exact command, artifact, version, and capture evidence when a future
   authorized verification or release lane performs it.
5. Obtain explicit scope before adding secrets, live server control, updater
   transport, deployment, or external integration.
