# Static Pages Export

## Purpose

The companion planner can be built as a static GitHub Pages site. This is a
publishing format for the existing browser-local planner, not a server-control
feature, external service, or assertion that a particular deployment has
succeeded.

## Static output contract

The root `site/next.config.ts` sets Vinext's `output: "export"` option. The
raw Vinext client output is `site/dist/client`, but it is not itself the
GitHub Pages publish root. The build's `assetPrefix` places `_next` below a
directory named for the repository project path, while GitHub Pages strips that
project path before resolving a request against the branch root. Run
`npm run stage:github-pages` after the static build. It creates
`site/dist/github-pages`, copying the browser document and local root assets
there while placing the emitted `_next` directory at that staging root.

A Pages publishing route must publish the *contents* of
`site/dist/github-pages` at the branch root, rather than publish `site/dist`,
`site/dist/client`, the nested project-prefix directory, attempt to run
`dist/server`, or deploy a Worker. The staging command also writes `.nojekyll`
so GitHub Pages serves the `_next` directory unchanged.

The root layout and planner route explicitly declare static rendering after
removing the layout's former request-header metadata dependency. This keeps the
planner's only route eligible for a build-time HTML file instead of asking a
static host to supply runtime request context.

The configured static asset prefix is the project path:

```text
/minecraft-server-command-center
```

Static paths use trailing slashes so a project Pages host can resolve directory
indexes without a runtime rewrite. Vinext's static exporter renders the root
route at `/`, so the Pages path is represented by the emitted asset prefix
rather than a runtime `basePath`; this preserves the build-time root document
while placing scripts and styles below the repository project path. The
configuration also disables image optimization because a static host does not
provide an image-optimization endpoint.

## Metadata and local assets

`public/og.png` remains a checked-in local asset. The root layout resolves its
Open Graph and X metadata against the full GitHub Pages project URL, so the
image stays below `/minecraft-server-command-center/og.png` instead of using a
root-relative `/og.png` path that would point outside this project.

No remote image, CDN, request header, analytics script, token, or hosted
configuration is added by the static export route. The static page may contain
the documented user-activated version-pinned GitHub Release and installer-asset
anchors from [Verified installer handoff](verified-installer-handoff.md); those
links do not make a client-side request until the person activates one.

## Failure modes

- Publishing `site/dist`, `site/dist/client`, or only the nested
  `site/dist/client/minecraft-server-command-center` directory leaves the
  document and its prefixed asset URLs at different roots. The visible result
  is an unstyled or partially functional page because
  `/minecraft-server-command-center/_next/...` resolves to `_next/...` at the
  Pages branch root.
- Omitting `.nojekyll` can cause a Pages host to skip `_next` even when the
  directory is correctly staged at the publish root.
- Publishing a root-relative social image path sends unfurlers to the owner
  site's root, where this project does not own an image.
- Replacing the static asset prefix with a runtime `basePath` requires new
  artifact evidence: the current Vinext exporter prerenders the root route at
  `/`, and an unmatched base path causes it to omit the root document.
- Reintroducing request-scoped metadata or a Worker binding makes the source
  unsuitable for a static Pages host and requires a separately reviewed
  deployment design.
- The static export proves only that the source can emit static files. It does
  not prove a Pages deployment, server connectivity, installer operation,
  transfer completion, application startup, or live Minecraft operation. A
  hard-coded installer record can describe a separately verified release asset
  without changing those boundaries.

## Verification boundary

An authorized build should report Vinext static export and create
`site/dist/client/index.html` along with the local `og.png` asset. The staging
command then verifies that every project-prefixed `href` or `src` reference in
the emitted document maps to an existing file below `site/dist/github-pages`.
Publishing and browser interaction are separate activities with their own
evidence.

## Suggested next articles

- [Configuration planner](configuration-planner.md)
- [Verified installer handoff](verified-installer-handoff.md)
- [Companion Site Documentation index](README.md)
- [Repository handoff](../../HANDOFF.md)
