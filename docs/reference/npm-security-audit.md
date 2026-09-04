# npm security audit

This record covers the root desktop package's pre-existing npm advisories. It is intentionally
limited to the direct Electron package and its extractor path; it does not authorize unrelated
package updates or application changes.

## Baseline

The root package now carries `package-lock.json`. Fresh source builds and the
root build entry point therefore use the committed dependency graph:

```text
npm ci --no-audit --no-fund
```

The committed lock was generated from the reviewed `package.json` with npm
10.9.8 under Node.js 22.23.2. It makes the source-build contract deterministic;
it does not by itself prove the packaged application or installer lifecycle.

The pre-existing installed tree resolved:

- direct `devDependencies.electron` range `^34.0.0` to `electron@34.5.8`;
- `electron@34.5.8` to transitive `extract-zip@2.0.1`.

The temporary-lock baseline audit reported two high-severity findings: the direct Electron
advisories and `GHSA-jmr9-qjv8-65gv` for `extract-zip`.

## Remediation

`devDependencies.electron` now uses `^42.4.0`. Electron 42.4.0 is the first release in the
queried supported Electron lines whose package metadata replaces the vulnerable
`extract-zip` dependency with `@electron-internal/extract-zip`. The range avoids an unnecessary
move to the newer 43 line while keeping the package manager on the supported 42 line.

The advisory has no patched `extract-zip` release. The safe remediation is therefore to remove
that package from the resolved Electron install rather than add a direct override to an unpatched
package. The advisory is [GHSA-jmr9-qjv8-65gv](https://github.com/advisories/GHSA-jmr9-qjv8-65gv).

Electron's supported-line policy and current release status are documented by [Electron
Versioning](https://www.electronjs.org/docs/latest/tutorial/electron-versioning) and the
[Electron Releases dashboard](https://releases.electronjs.org/).

## Reproducible verification

Run:

```text
npm run test:security-audit
```

The focused check copies the current manifest into a temporary directory, resolves an isolated
lockfile with `npm install --package-lock-only --ignore-scripts --no-audit --no-fund`, and runs
`npm audit --json` there. It fails unless the resolved Electron version is at least 42.4.0, the
vulnerable `node_modules/extract-zip` path is absent, `@electron-internal/extract-zip` is present,
and npm reports zero vulnerabilities. The temporary lockfile is removed after the check.

This check proves the current manifest's package resolution and audit result. It does not claim that the
desktop application has been packaged or that an installer has been executed.

## Failure and residual boundaries

The focused advisory check requires registry access because it deliberately re-resolves the current
manifest in isolation. The ordinary source build uses the committed lockfile instead. A registry
outage, an npm failure, or a future deliberate lock refresh that reintroduces the
unpatched package fails closed with the exact local reason. The upstream `extract-zip` advisory
remains open with no patched package release; the repository is safe only when the resolved
Electron tree continues to omit that package.
