# npm security audit

This record covers the root desktop package's pre-existing npm advisories. It is intentionally
limited to the direct Electron package and its extractor path; it does not authorize unrelated
package updates or application changes.

## Baseline

The root package has no `package-lock.json`, `npm-shrinkwrap.json`, `yarn.lock`, or `pnpm-lock.yaml`.
The release workflow therefore follows the repository's normal range-based install path:

```text
npm install --no-audit --no-fund
```

Running `npm audit --json` directly in the repository is not reproducible without a lockfile. npm
returns `ENOLOCK` with `This command requires an existing lockfile` and suggests creating one with
`npm i --package-lock-only`. That generated lockfile is used only in the disposable verification
project described below; it is not committed as a new repository-wide lockfile policy.

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

The focused check copies the current manifest into a temporary directory, creates a temporary
lockfile with `npm install --package-lock-only --ignore-scripts --no-audit --no-fund`, and runs
`npm audit --json` there. It fails unless the resolved Electron version is at least 42.4.0, the
vulnerable `node_modules/extract-zip` path is absent, `@electron-internal/extract-zip` is present,
and npm reports zero vulnerabilities. The temporary lockfile is removed after the check.

This check proves the range-based package resolution and audit result. It does not claim that the
desktop application has been packaged or that an installer has been executed.

## Failure and residual boundaries

The check requires registry access because this repository deliberately does not commit a root
lockfile. A registry outage, an npm failure, or a future Electron release that reintroduces the
unpatched package fails closed with the exact local reason. The upstream `extract-zip` advisory
remains open with no patched package release; the repository is safe only when the resolved
Electron tree continues to omit that package.
