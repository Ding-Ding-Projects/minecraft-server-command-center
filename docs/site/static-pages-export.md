# Static Pages Export

## Purpose

The companion planner can be built as a static GitHub Pages site. This is a
publishing format for the existing browser-local planner, not a server-control
feature, external service, or assertion that a particular deployment has
succeeded.

## Static output contract

The root `site/next.config.ts` sets Vinext's `output: "export"` option. The
build output intended for publication is `site/dist/client`. A Pages publishing
route must publish the contents of that directory at the repository project
path, rather than publish `site/dist`, attempt to run `dist/server`, or deploy
a Worker.

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
the documented user-activated immutable GitHub Release and installer-asset
anchors from [Verified installer handoff](verified-installer-handoff.md); those
links do not make a client-side request until the person activates one.

## Failure modes

- Publishing `site/dist` instead of `site/dist/client` can expose an incomplete
  build layout rather than the browser-ready static site.
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
`site/dist/client/index.html` along with the local `og.png` asset. Publishing
and browser interaction are separate activities with their own evidence.

## Suggested next articles

- [Configuration planner](configuration-planner.md)
- [Verified installer handoff](verified-installer-handoff.md)
- [Companion Site Documentation index](README.md)
- [Repository handoff](../../HANDOFF.md)
