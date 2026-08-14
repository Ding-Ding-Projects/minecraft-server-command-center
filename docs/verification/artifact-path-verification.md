# Windows artifact-path verification

This record verifies the root Windows build and installer entry points at
commit `052144ce44c7daf068170375d448b2da001a052a`. It covers the supported
Squirrel.Windows packaging path and local artifact measurements only. It does
not publish, tag, release, execute, or install the produced files.

## Scope

- `build.bat /s`
- `build-installer.bat /s`
- `npm run verify:unsigned`
- `electron-builder.yml`, `package.json`, and the release workflow's output
  directory declaration

No script or packaging configuration change was necessary. The existing path
contract is consistent:

```text
build-installer.bat /s
  -> build.bat /s
  -> npm run dist
       -> npm run build
       -> electron-builder --win squirrel --publish never
  -> npm run verify:unsigned
  -> certutil SHA256 Setup.exe
```

`electron-builder.yml` declares `release/squirrel-windows` as its output and
the Squirrel.Windows target creates the nested
`release/squirrel-windows/squirrel-windows` directory. The verification script,
batch script, and release workflow all use that same nested directory.

## Execution evidence

| Check | Result | Evidence |
| --- | --- | --- |
| Cold repository-path packaging | Verified | `build-installer.bat /s` started with `node_modules`, `dist`, `release`, and the generated `package-lock.json` absent from the checkout. `npm install` added 300 packages, the build and packaging stages completed, and the command returned `EXIT=0`. |
| Warm root build | Verified | A foreground `build.bat /s` rerun completed main and renderer builds and returned `EXIT=0`. |
| Independent unsigned check | Verified | `npm run verify:unsigned` returned `EXIT=0` and reported no embedded Authenticode certificate table. |
| Source selection | Verified for this local run | `HEAD` was `052144ce44c7daf068170375d448b2da001a052a` before and after packaging, with no tracked source change. The artifacts do not embed a source commit identifier, so this is not a reproducible-provenance claim about the binary contents. |

The cold-path result is repository-local: Node.js and npm were already
available on the host, so the `winget` fallback in `build.bat` was not
exercised. The result therefore proves the dependency/output bootstrap from a
cold checkout, not a fresh operating-system toolchain installation.

## Produced artifacts

All paths below are relative to the repository root.

| Artifact | Bytes | SHA-256 | Additional verification |
| --- | ---: | --- | --- |
| `release/squirrel-windows/squirrel-windows/Setup.exe` | 140395520 | `d14aef84af7463ec19ec3f993983a1a4b01776012b2d87be7e8bfacb1df96292` | `Get-AuthenticodeSignature` reported `NotSigned`; the PE certificate-table file offset and size were both `0`. |
| `release/squirrel-windows/squirrel-windows/RELEASES` | 102 | `4124924a6c906fba0de042258c1fb332056e15cbf73c2dbe9af089971f3a5cc7` | Contains one full-package entry. |
| `release/squirrel-windows/squirrel-windows/minecraft-server-command-center-0.1.0-full.nupkg` | 139330314 | `e45716f43c683433cc006efd8028420af98dd08208436baadce46b8dd0c1acb1` | `RELEASES` SHA-1 `5fbe1e64d7d8dc70f53c769abc0ee616c222e1a8` and length `139330314` match the file. |

The output directory contained exactly one full package and no delta package.
The `Setup.exe` PE headers were `MZ` and `PE\0\0`, with PE32 optional-header
magic `0x10b`; the unsigned assertion was independently checked from the
certificate-table directory as well as by `scripts/verify-unsigned.mjs`.
The packaging log also reported signing skipped for the Squirrel bootstrap,
the execution stub, the application executable, and `Setup.exe`.

## Warnings and limits

The run emitted npm deprecation and install-script approval warnings for
transitive packages, plus an electron-builder warning that repository metadata
was not declared in `package.json`. None changed the output location or caused
the focused checks to fail; this lane made no unrelated dependency or metadata
change.

This record does not claim installer execution, desktop runtime interaction,
accessibility interaction, update behavior, release publication, remote asset
downloadability, or code-signing verification. Code signing was intentionally
not used.

## Conclusion

The existing scripts produce the intended unsigned Windows Squirrel.Windows
artifact set from the supported path, both from a cold repository checkout and
on a warm rerun. No script defect was found, and no source or packaging change
was required for this verification.

## Suggested articles

- [Unsigned automatic updates](../reference/unsigned-automatic-updates.md) —
  runtime feed and package-metadata boundaries.
- [Release line-count report](release-line-count.md) — reproducible release
  metadata generation.
- [Verification index](README.md) — related source and release evidence.
