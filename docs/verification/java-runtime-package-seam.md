# Java runtime manager package seam

This record verifies the required CommonJS Java runtime manager in the built
main-process output and in the supported unsigned Windows Squirrel.Windows
package. It covers the bounded repair at commit
`4017a9d8fb814580bc466e709eb77f2c3f1913b3`, based on
`b941447aab6a3ec41d143ad5c3c512c57162321c`. It does not publish a release,
merge a task branch, launch the installed application, or claim accessibility
or capture evidence.

## Source repair

TypeScript compilation emits `dist/main/java-runtime-controller.js`, but the
controller requires the checked-in `src/main/java-runtime-manager.cjs`.
`build:main` now runs `scripts/copy-java-runtime-manager.mjs` after TypeScript
compilation and the existing catalog copy. The required copy fails the build
if its source or destination cannot be read.

`scripts/test-java-runtime-package-seam.mjs` checks the build registration,
the source and destination markers, byte identity, and the built output path.
It also removes a staged manager, proves that the assertion turns red, restores
the file, and proves the assertion returns green.

## Focused verification

| Check | Result | Evidence |
| --- | --- | --- |
| `npm run test:java-runtime-guidance` | Verified | Java picker normalization, bounded metadata, direct probe, Paper assessment, review-only plan, and side-effect regressions passed. |
| `npm run test:java-runtime-package-seam` | Verified | The manager byte-match and absent-output negative regression passed. |
| `git diff --check` | Verified | No whitespace errors after the source commit. |
| `build-installer.bat /s` | Verified | The supported bootstrap, main build, renderer build, Squirrel.Windows package, and unsigned verification returned exit code 0. |
| Packaged `app.asar` inspection | Verified | `\dist\main\java-runtime-manager.cjs` and `\dist\main\java-runtime-controller.js` are present. The extracted manager SHA-256 matches the source. |

The supported package command was:

```text
cmd /c "cd /d C:\Users\Administrator\Documents\GitHub\_puppy-java-runtime-package-copy-20260814 && C:\Users\Administrator\Documents\GitHub\_puppy-java-runtime-package-copy-20260814\build-installer.bat /s"
```

## Local package artifacts

The local package used version `0.1.0` from the checked-in package manifest. It
was not published or presented as a release.

| Artifact | Bytes | SHA-256 | Verification |
| --- | ---: | --- | --- |
| `release/squirrel-windows/squirrel-windows/Setup.exe` | 140701696 | `f2ae14e2e45024553ac142de74fcffadf01ce323d42e9a74336636108680ee4a` | `verify:unsigned` passed; `Get-AuthenticodeSignature` reported `NotSigned`. |
| `release/squirrel-windows/squirrel-windows/RELEASES` | 102 | `16a6da4b87761bcb6b4c44acd9c78525c1387cbdd5d49509efe2dd4f6aff4928` | Contains the full-package entry for the 139636917-byte `.nupkg`. |
| `release/squirrel-windows/squirrel-windows/minecraft-server-command-center-0.1.0-full.nupkg` | 139636917 | `01dbb6008344aa0290a7dbf749ecb4373622290c6df8bd80ca01a87506d50166` | Extracted `app.asar` contains the required manager and controller entries. |

The checked-in source and extracted packaged manager both have SHA-256
`92bc6c16d2f5325de0b603b17e0aeffafa816e08fd4582377ae4b739a51f6df1`.

## Limits and warnings

The build emitted existing npm deprecation and install-script approval warnings,
electron-builder repository-metadata warnings, and the existing Node
deprecation warning. They did not fail the build or packaging command. Code
signing remained disabled and no signing material was requested or used.

This record does not claim packaged application launch, installer execution,
screen-reader interaction, accessibility review, runtime screenshots, release
publication, or remote CI evidence.

## Suggested articles

- [Java runtime discovery and review-only setup](../reference/java-runtime-setup.md)
- [Windows artifact-path verification](artifact-path-verification.md)
- [Verification index](README.md)
