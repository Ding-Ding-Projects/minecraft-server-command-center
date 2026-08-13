# Server Configuration Writer Foundation

`src/main/server-configuration-writer.cjs` is the local, privileged foundation
for applying a deliberately small set of reviewed server-configuration edits.
It is not a general text editor, YAML serializer, server launcher, remote
control client, or credential writer.

The foundation accepts only a controlled server root, a safe workspace ID, a
matching configuration-schema revision and runtime context, and typed patches.
It never accepts a user-provided destination path, raw `key=value` document,
raw YAML fragment, shell command, or arbitrary configuration key.

## Public contract

The module exposes the following application-facing operations:

| Export | Role | Write behavior |
| --- | --- | --- |
| `resolveConfigurationWorkspace` | Resolves a previously controlled server root, safe workspace ID, matching schema revision, and runtime context into a bounded workspace view. | Read-only. |
| `prepareConfigurationPatch` | Validates typed patches, resolves their allowlisted document targets, checks the current file states, and prepares a reviewable write plan. | Read-only; returns an opaque `reviewToken` only after preparation succeeds. |
| `applyConfigurationPatch` | Applies the exact prepared plan after an explicit matching review confirmation. | Writes only the reviewed allowlisted changes. |
| `rollbackConfigurationPatch` | Restores the retained backup associated with a successful managed write. | Requires a separate explicit rollback confirmation and writes only the managed document selected by the prior result. |
| `ConfigurationWriteError` | Provides a typed failure boundary for callers without exposing paths, document bodies, or secrets. | No write by itself. |
| `MAX_CONFIGURATION_DOCUMENT_BYTES` | Bounds each managed configuration document before it is parsed, previewed, or rewritten. | Constant. |
| `MANAGED_DOCUMENT_IDS` | Lists the only document identities that the writer may target. Callers cannot invent an additional identity. | Constant. |

`applyConfigurationPatch` requires the confirmation object below. A preview,
button click, or re-created request without the matching opaque token is not a
write authorization.

```js
{ kind: 'reviewed-configuration-patch', token: reviewToken }
```

Rollback is also a write. It requires the exact backup ID returned by the
successful apply result and this separate confirmation shape; a stale document
is rejected rather than overwritten.

```js
{ kind: 'reviewed-configuration-rollback', backupId }
```

The token is bound to the prepared workspace, patch set, and observed file
state. If any of those facts no longer match at apply time, the operation is
rejected and the caller must prepare a new review.

## Controlled inputs and mapping

The only accepted planning shape is:

```js
{
  controlledServerRoot,
  workspaceId,
  schemaRevision,
  runtime,
  patches,
}
```

`controlledServerRoot` is a host-controlled directory selection rather than a
path emitted by a renderer or an arbitrary patch. `workspaceId` is a bounded
safe identifier, not a file path or a lookup expression. `schemaRevision` and
`runtime` must match the version-aware configuration schema; the writer does
not guess support, migrate a stale draft, or enable a field simply because its
name resembles a known option.

Each patch contains only a known `fieldId`, its typed `value`, and an optional
structured `target`. The field ID resolves through the selected schema and the
target resolves through `MANAGED_DOCUMENT_IDS`; neither can select a different
file, key, schema revision, or server root.

### Managed documents

The writer maps only the following document classes. The mapping is fixed in
source and remains within the controlled server root:

| Document class | Applicable server family | Managed purpose |
| --- | --- | --- |
| `server.properties` | Paper and Spigot | Allowlisted Java-properties scalar fields. |
| `bukkit.yml` | Paper and Spigot | Narrow allowlisted YAML-like scalar fields. |
| `spigot.yml` | Paper and Spigot | Narrow allowlisted YAML-like scalar fields, including selected default or discovered-world leaf values, while excluding server-managed and unsupported structures. |
| `config/paper-global.yml` | Paper | Narrow allowlisted Paper-global scalar fields. |
| `config/paper-world-defaults.yml` | Paper | Narrow allowlisted global world-default scalar fields. |
| Discovered Paper `paper-world.yml` leaf | Paper | One allowlisted per-world scalar leaf for one discovered world mapping. |

The writer handles `server.properties` as a bounded set of ordinary scalar
`key=value` entries. Its YAML-like support is intentionally narrower than YAML:
only the schema-mapped scalar leaves in the listed documents may be changed.
It is not a generic YAML parser, formatter, converter, or object merger.

Where the managed format can be safely round-tripped, unrelated lines, comments,
blank lines, ordering, and untouched fields stay in place. If a requested
operation would require rewriting an unsupported construct or cannot preserve
the document safely, it fails closed instead of normalizing the whole file.

## Explicit rejection boundaries

The following input remains outside this writer's authority:

- raw properties text, raw YAML, arbitrary YAML paths, arbitrary file paths,
  arbitrary keys, document IDs, shell syntax, and command fragments;
- plaintext credentials, credential-shaped values, and vault-reference
  credential writes; credential handling needs its own protected workflow;
- YAML maps, arrays, anchors, tags, multiline/block scalar forms, dynamic
  registries, plugin-generated structures, and other unsupported structured
  values;
- values that are not valid for the selected `fieldId`, runtime, build, or
  schema revision;
- server-managed fields, legacy migration files, and values the selected
  schema declares read-only or unavailable; and
- a world target that was not discovered and mapped during workspace
  resolution.

An unsupported control remains an honest unavailable state in the application;
it is never silently downgraded to a free-form file editor.

## Write safety and recovery

Before a write is prepared or applied, the foundation verifies the workspace
identity, the selected runtime/schema context, the managed document identity,
and the expected on-disk state. It bounds each document with
`MAX_CONFIGURATION_DOCUMENT_BYTES`, refuses a changed file between preparation
and apply, and rejects a missing, malformed, oversized, or otherwise unsafe
managed document.

Path resolution is containment-first: every destination must resolve beneath
the controlled server root. The writer rejects root escape and symbolic-link or
reparse-point traversal rather than following a path into another location.
Patch values cannot alter this resolution because they never carry arbitrary
paths.

For a confirmed write, the foundation uses a controlled temporary file and
rename sequence, retains a bounded backup for the managed result, and has a
rollback record before it reports completion. It reparses the written document
after replacement. A post-write parse or state failure is a failed operation:
the retained backup supports rollback rather than an unverified partial result.

Results expose only opaque workspace, review, write, backup, or rollback IDs
and factual status values. They do not return server-root paths, document
contents, secret material, credentials, or raw configuration text.

## Per-world overrides

Paper per-world changes are not free-form paths and do not clone
`paper-world-defaults.yml`. Spigot per-world changes likewise remain one leaf
beneath a discovered world identifier in `spigot.yml`; they do not accept a raw
YAML path. `resolveConfigurationWorkspace` must first provide a discovered,
safe world mapping. A matching typed patch may then address one known leaf in
that world's mapped target.

For Paper, the writer changes that one leaf only and may create the missing
`paper-world.yml` leaf document through the reviewed transaction. Unspecified
values continue to inherit from Paper's world-default document. For Spigot,
the selected known leaf inherits from `world-settings.default` when no
world-specific value is written. A request to create a whole world document,
copy defaults, select an unknown world, or write arbitrary leaves is rejected.

## Scope and verification status

This is a source-level configuration-write foundation. It does not claim that a
complete desktop editor, installer, server startup workflow, remote-management
flow, credential flow, or production deployment has been completed. No server
operation is implied by a prepared or applied configuration patch.

Under the active rapid-delivery scope, no automated check, build, package,
runtime launch, or screen capture was run for this documentation change. That
absence is not a success claim; downstream integration must add its own
verification evidence before presenting a complete product workflow.

## Related references

- [Server Configuration Schema](server-configuration-schema.md) — version-aware
  field catalog, validation, provenance, safety classes, and world inheritance.
- [Server lifecycle service](server-lifecycle.md) — separate bounded launch and
  process-state foundation; it does not write configuration files.
- [Paper and Spigot CLI catalog](paper-spigot-cli-catalog.md) — typed launch
  metadata; it does not grant arbitrary file-writing authority.
