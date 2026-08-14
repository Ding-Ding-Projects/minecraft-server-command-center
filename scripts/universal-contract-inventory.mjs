const INVENTORY_DOCUMENTATION = "docs/verification/completeness-inventory.md";
const INVENTORY_GUARD = "scripts/test-universal-contract-inventory.mjs";

export const UNIVERSAL_CONTRACT_SURFACE_KEYS = Object.freeze([
  "desktop",
  "companionSite",
]);

export const UNIVERSAL_CONTRACT_EVIDENCE_KEYS = Object.freeze([
  "implementation",
  "documentation",
  "localization",
  "persistence",
  "focusedCheck",
  "builtArtifactInteraction",
  "captureEvidence",
]);

function evidence(status, paths, assertion) {
  return { status, paths, assertion };
}

function persistentEvidence(status, paths, assertion) {
  return { applicable: true, ...evidence(status, paths, assertion) };
}

function surfaceEvidence(surfaceKey, status, paths) {
  return Object.freeze({
    status,
    paths: Object.freeze([...paths]),
    assertion: `${surfaceKey} evidence is recorded independently for this row; ${surfaceKey} status is ${status}.`,
  });
}

function surfacePair(desktopStatus, desktopPaths, companionSiteStatus, companionSitePaths) {
  return Object.freeze({
    desktop: surfaceEvidence("desktop", desktopStatus, desktopPaths),
    companionSite: surfaceEvidence("companion-site", companionSiteStatus, companionSitePaths),
  });
}

function notApplicableEvidence(reason) {
  return {
    applicable: false,
    status: "not-applicable",
    paths: [INVENTORY_DOCUMENTATION],
    assertion: "The row must keep an explicit reason whenever this evidence slot does not apply.",
    reason,
  };
}

const UNIVERSAL_CONTRACT_SURFACE_EVIDENCE = Object.freeze({
  "language-modes-and-school-mode": surfacePair("partial", ["src/shared/desktop-presentation.ts"], "partial", ["site/app/page.tsx"]),
  "spoken-narrator": surfacePair("not-implemented", ["src/renderer/index.html"], "not-implemented", ["site/app/page.tsx"]),
  "scheduled-settings-and-external-sources": surfacePair("not-implemented", ["src/renderer/index.html"], "not-implemented", ["site/app/page.tsx"]),
  "personal-vocabulary-json": surfacePair("not-implemented", ["src/renderer/index.html"], "partial", ["site/app/personal-vocabulary-boundary.tsx"]),
  "startup-dim-sum-surprise": surfacePair("not-implemented", ["src/renderer/index.html"], "not-implemented", ["site/app/page.tsx"]),
  "anchored-regex-builder": surfacePair("partial", ["src/renderer/regex-builder.ts"], "partial", ["site/app/page.tsx"]),
  "notifications-and-bulk-notification-actions": surfacePair("partial", ["src/renderer/notification-center.ts"], "partial", ["site/app/notification-center.ts"]),
  "appearance-editor-and-logo-customization": surfacePair("partial", ["src/renderer/styles.css"], "partial", ["site/app/page.tsx"]),
  "app-display-name": surfacePair("partial", ["src/shared/desktop-presentation.ts", "src/renderer/index.html"], "partial", ["site/app/page.tsx"]),
  "browser-style-tabs": surfacePair("partial", ["src/renderer/index.html"], "partial", ["site/app/page.tsx"]),
  "toy-locks-and-recovery": surfacePair("not-implemented", ["src/renderer/index.html"], "not-implemented", ["site/app/page.tsx"]),
  "built-in-authenticator-and-secret-history": surfacePair("not-implemented", ["src/renderer/index.html"], "not-implemented", ["site/app/page.tsx"]),
  "support-tickets": surfacePair("not-implemented", ["src/renderer/index.html"], "not-implemented", ["site/app/page.tsx"]),
  "command-palette": surfacePair("partial", ["src/renderer/main.ts"], "partial", ["site/app/page.tsx"]),
  "destructive-action-super-confirmation": surfacePair("not-implemented", ["src/renderer/index.html"], "not-implemented", ["site/app/page.tsx"]),
  "local-git-backed-version-history": surfacePair("partial", ["src/main/universal-settings-store.ts"], "partial", ["site/app/page.tsx"]),
  "changelog-viewer": surfacePair("not-implemented", ["src/renderer/index.html"], "partial", ["site/app/changelog-data.ts"]),
  "external-editor-handoff": surfacePair("not-implemented", ["src/renderer/index.html"], "not-implemented", ["site/app/page.tsx"]),
  "complete-exports-and-reimports": surfacePair("partial", ["src/shared/planner-handoff.ts"], "partial", ["site/app/page.tsx"]),
  "bulk-actions-everywhere": surfacePair("partial", ["src/renderer/notification-center.ts"], "partial", ["site/app/notification-center.ts"]),
  "local-file-converter": surfacePair("not-implemented", ["src/renderer/index.html"], "not-implemented", ["site/app/page.tsx"]),
  "local-ollama-suite-manager": surfacePair("not-implemented", ["src/renderer/index.html"], "not-implemented", ["site/app/page.tsx"]),
  "browser-extension-download-surfaces": surfacePair("not-implemented", ["src/renderer/index.html"], "not-implemented", ["site/app/page.tsx"]),
  "offline-documentation-and-landing-site": surfacePair("partial", ["src/renderer/offline-documentation.ts"], "partial", ["site/app/page.tsx"]),
  "accessibility-responsive-sizing-and-captures": surfacePair("partial", ["src/renderer/styles.css"], "partial", ["site/app/page.tsx"]),
  "shared-live-status-hub": surfacePair("not-implemented", ["src/renderer/index.html"], "not-implemented", ["site/app/page.tsx"]),
  "complete-inventory-negative-regression": surfacePair("verified", ["scripts/universal-contract-inventory.mjs"], "verified", [INVENTORY_GUARD]),
});

const UNIVERSAL_CONTRACT_ROWS = [
  {
    id: "language-modes-and-school-mode",
    title: "English, playful Cantonese, bilingual modes; independent funny levels; emoji toggle; renameable School mode",
    evidence: {
      implementation: evidence("partial", ["src/shared/desktop-presentation.ts", "src/main/universal-settings-store.ts", "src/renderer/index.html", "src/renderer/main.ts", "site/app/page.tsx"], "Keep the partial desktop and companion-site implementation references explicit; full app-wide localization and credential-factor behavior remain incomplete."),
      documentation: evidence("partial", ["docs/reference/universal-settings.md", "docs/reference/desktop-presentation-settings.md", INVENTORY_DOCUMENTATION], "Keep the schema, local persistence, localized settings copy, failure behavior, and remaining contract gap documented."),
      localization: evidence("partial", ["src/shared/desktop-presentation.ts", "site/app/page.tsx"], "Keep the localized settings-copy boundary and the incomplete app-wide localization state explicit."),
      persistence: persistentEvidence("partial", ["src/main/universal-settings-store.ts", "site/app/page.tsx"], "Keep the shared local settings persistence references and the incomplete cross-surface propagation state explicit."),
      focusedCheck: evidence("verified", ["scripts/test-desktop-presentation-settings.mjs", "scripts/test-universal-contracts.mjs"], "Keep the focused presentation and universal-contract checks named without treating them as full app-wide proof."),
      builtArtifactInteraction: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of packaged interaction evidence explicit."),
      captureEvidence: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of real capture evidence explicit."),
    },
  },
  {
    id: "spoken-narrator",
    title: "Spoken narrator, language choice, voice pickers, rate, pitch, queue, and accessibility coexistence",
    evidence: {
      implementation: evidence("not-implemented", ["src/renderer/index.html", "site/app/page.tsx"], "Keep the explicit not-implemented state for both user-facing surfaces."),
      documentation: evidence("not-implemented", [INVENTORY_DOCUMENTATION], "Keep the explicit absence of a narrator article or persisted contract visible."),
      localization: evidence("not-implemented", [INVENTORY_DOCUMENTATION], "Keep the explicit absence of narrator-localized copy visible."),
      persistence: persistentEvidence("not-implemented", [INVENTORY_DOCUMENTATION], "Keep the explicit absence of persisted narrator and voice selections visible."),
      focusedCheck: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of a narrator-focused check explicit rather than inventing one."),
      builtArtifactInteraction: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of narrator packaged interaction evidence explicit."),
      captureEvidence: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of narrator capture evidence explicit."),
    },
  },
  {
    id: "scheduled-settings-and-external-sources",
    title: "Scheduled settings and validated external/Home Assistant sources",
    evidence: {
      implementation: evidence("not-implemented", ["src/renderer/index.html", "site/app/page.tsx"], "Keep the explicit not-implemented state for schedule and external-source behavior."),
      documentation: evidence("not-implemented", [INVENTORY_DOCUMENTATION], "Keep the explicit absence of a schedule schema article visible."),
      localization: evidence("not-implemented", [INVENTORY_DOCUMENTATION], "Keep the explicit absence of schedule-localized copy visible."),
      persistence: persistentEvidence("not-implemented", [INVENTORY_DOCUMENTATION], "Keep the explicit absence of versioned schedule persistence visible."),
      focusedCheck: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of a schedule-focused check explicit rather than inventing one."),
      builtArtifactInteraction: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of schedule packaged interaction evidence explicit."),
      captureEvidence: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of schedule capture evidence explicit."),
    },
  },
  {
    id: "personal-vocabulary-json",
    title: "Local personal-vocabulary JSON upload, validation, cache, replace, and clear",
    evidence: {
      implementation: evidence("partial", ["site/app/page.tsx", "site/app/personal-vocabulary-boundary.tsx", "src/shared/personal-vocabulary.ts"], "Keep the companion implementation, bounded parser, private text boundary, and absent desktop picker distinction explicit."),
      documentation: evidence("partial", ["docs/reference/universal-settings.md", INVENTORY_DOCUMENTATION], "Keep the neutral schema, local-only boundary, protected text classes, and fail-closed recovery documented."),
      localization: evidence("partial", ["site/app/page.tsx", "docs/reference/universal-settings.md"], "Keep the companion control copy and the absent desktop/localization boundary explicit."),
      persistence: persistentEvidence("partial", ["site/app/page.tsx", "site/app/personal-vocabulary-boundary.tsx"], "Keep the local cache, atomic replace, clear behavior, and absent desktop persistence boundary explicit."),
      focusedCheck: evidence("verified", ["scripts/test-personal-vocabulary-boundary.mjs", "scripts/test-universal-contracts.mjs"], "Keep the payload-free parser and universal-settings checks named without claiming a desktop picker proof."),
      builtArtifactInteraction: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of packaged vocabulary-control interaction evidence explicit."),
      captureEvidence: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of vocabulary-control capture evidence explicit."),
    },
  },
  {
    id: "startup-dim-sum-surprise",
    title: "Startup dim-sum surprise with bundled/public-catalog asset boundary",
    evidence: {
      implementation: evidence("not-implemented", ["src/renderer/index.html", "site/app/page.tsx"], "Keep the explicit not-implemented state and the public-catalog boundary visible."),
      documentation: evidence("not-implemented", [INVENTORY_DOCUMENTATION], "Keep the explicit absence of a runtime surprise article visible."),
      localization: evidence("not-implemented", [INVENTORY_DOCUMENTATION], "Keep the explicit absence of bilingual dish and surrounding copy visible."),
      persistence: notApplicableEvidence("The startup draw is not a user preference and has no persisted opt-out state."),
      focusedCheck: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of a dim-sum-focused check explicit rather than inventing one."),
      builtArtifactInteraction: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of startup-surprise packaged interaction evidence explicit."),
      captureEvidence: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of startup-surprise capture evidence explicit."),
    },
  },
  {
    id: "anchored-regex-builder",
    title: "Full anchored regex builder on every search, menu, dropdown, and settings surface",
    evidence: {
      implementation: evidence("partial", ["src/shared/regex-search.ts", "src/renderer/regex-builder.ts", "site/app/page.tsx"], "Keep the existing bounded search paths and the missing per-menu, dropdown, and settings coverage explicit."),
      documentation: evidence("partial", ["docs/reference/offline-documentation-browser.md", "docs/reference/universal-settings.md", "docs/architecture/desktop-foundation.md"], "Keep the plain-text default, explicit regex mode, bounds, and incomplete surface coverage documented."),
      localization: evidence("partial", ["src/renderer/index.html", "site/app/page.tsx"], "Keep the localized labels for existing builders and the incomplete universal coverage explicit."),
      persistence: notApplicableEvidence("Current search and pattern state is transient input rather than persisted user data."),
      focusedCheck: evidence("verified", ["scripts/test-desktop-search-foundation.mjs", "scripts/test-offline-documentation.mjs"], "Keep the exact builder registrations, bounds, and removal regressions named."),
      builtArtifactInteraction: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of complete packaged builder interaction evidence explicit."),
      captureEvidence: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of complete builder capture evidence explicit."),
    },
  },
  {
    id: "notifications-and-bulk-notification-actions",
    title: "Non-blocking notifications, notification centre, and bulk notification actions",
    evidence: {
      implementation: evidence("partial", ["src/renderer/notification-center.ts", "src/renderer/index.html", "src/renderer/main.ts", "site/app/notification-center.ts", "site/app/page.tsx"], "Keep the desktop and browser-local notification foundations and their incomplete app-wide coverage explicit."),
      documentation: evidence("partial", ["docs/reference/notification-centre.md", "src/renderer/offline-documentation-registry.ts"], "Keep the local bounded persistence, accessible state, and no-remote-delivery boundary documented."),
      localization: evidence("partial", ["src/renderer/index.html", "site/app/page.tsx", "docs/reference/notification-centre.md"], "Keep the current English-only or partial copy boundary explicit."),
      persistence: persistentEvidence("partial", ["src/renderer/notification-center.ts", "site/app/notification-center.ts"], "Keep the versioned local notification records and the incomplete app-wide record coverage explicit."),
      focusedCheck: evidence("verified", ["scripts/test-site-notification-center.mjs", "scripts/test-desktop-notification-center.mjs"], "Keep the focused notification schema, review, selection, and bulk-action checks named."),
      builtArtifactInteraction: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of packaged notification interaction evidence explicit."),
      captureEvidence: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of notification capture evidence explicit."),
    },
  },
  {
    id: "appearance-editor-and-logo-customization",
    title: "Material 3 appearance system, every-element editor, infinite color translator, presets, import/export, and app-logo customization",
    evidence: {
      implementation: evidence("partial", ["src/renderer/styles.css", "src/shared/universal-contracts.ts", "site/app/page.tsx"], "Keep the partial visual foundation, persisted appearance basics, presets, and missing editor/translator boundaries explicit."),
      documentation: evidence("partial", ["docs/reference/universal-settings.md", INVENTORY_DOCUMENTATION], "Keep the shipped appearance settings and the remaining editor, translator, and logo gaps documented."),
      localization: evidence("partial", ["src/renderer/index.html", "site/app/page.tsx"], "Keep the existing appearance labels and incomplete full-surface localization explicit."),
      persistence: persistentEvidence("partial", ["src/main/universal-settings-store.ts", "site/app/page.tsx"], "Keep the local appearance settings, logo preset, and incomplete full editor persistence boundary explicit."),
      focusedCheck: evidence("verified", ["scripts/test-desktop-presentation-settings.mjs", "scripts/test-universal-contracts.mjs"], "Keep the focused persisted appearance and schema checks named without inflating them into full editor proof."),
      builtArtifactInteraction: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of packaged appearance-editor interaction evidence explicit."),
      captureEvidence: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of appearance-editor capture evidence explicit."),
    },
  },
  {
    id: "app-display-name",
    title: "User-renamable application display name with stable application identity",
    evidence: {
      implementation: evidence("partial", ["src/shared/universal-contracts.ts", "src/shared/desktop-presentation.ts", "src/renderer/index.html", "src/renderer/main.ts", "site/app/page.tsx"], "Keep the current bounded display-name setting and visible desktop/site labels distinct from the complete app-wide identity contract."),
      documentation: evidence("partial", ["docs/reference/universal-settings.md", INVENTORY_DOCUMENTATION], "Keep the display-name behavior, stable package identity boundary, and incomplete full-surface coverage documented."),
      localization: evidence("partial", ["src/shared/desktop-presentation.ts", "site/app/page.tsx"], "Keep the current localized display-name settings copy and incomplete app-wide localization boundary explicit."),
      persistence: persistentEvidence("partial", ["src/main/universal-settings-store.ts", "site/app/page.tsx"], "Keep the bounded local display-name persistence and the incomplete cross-surface propagation state explicit."),
      focusedCheck: evidence("verified", ["scripts/test-desktop-presentation-settings.mjs", "scripts/test-universal-contracts.mjs"], "Keep the focused display-name schema, presentation, and negative-registration checks named without claiming complete app identity proof."),
      builtArtifactInteraction: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of packaged display-name interaction evidence explicit."),
      captureEvidence: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of real display-name capture evidence explicit."),
    },
  },
  {
    id: "browser-style-tabs",
    title: "Complete browser-style tabs: docking, overflow, reorder, pin, groups, four searches, bulk close, and per-element appearance",
    evidence: {
      implementation: evidence("partial", ["src/renderer/index.html", "src/renderer/main.ts", "site/app/page.tsx"], "Keep the partial tab shells and the absent complete tab model explicit."),
      documentation: evidence("partial", ["docs/reference/universal-settings.md", INVENTORY_DOCUMENTATION], "Keep the persisted docking setting and the missing tab/group article and behavior documented."),
      localization: evidence("partial", ["src/renderer/index.html", "site/app/page.tsx"], "Keep the current tab labels and incomplete localized tab/group coverage explicit."),
      persistence: persistentEvidence("partial", ["src/main/universal-settings-store.ts", "site/app/page.tsx"], "Keep the docking persistence and the absent order, pin, group, and search persistence boundary explicit."),
      focusedCheck: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of a complete tab-focused check explicit rather than treating the settings contract as tab proof."),
      builtArtifactInteraction: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of complete packaged tab interaction evidence explicit."),
      captureEvidence: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of complete tab capture evidence explicit."),
    },
  },
  {
    id: "toy-locks-and-recovery",
    title: "Toy locks on every element, tab/group locks, independent credentials, QR pairing, and recovery",
    evidence: {
      implementation: evidence("not-implemented", ["src/renderer/index.html", "site/app/page.tsx"], "Keep the explicit absence of element, tab, group, and property lock implementations visible."),
      documentation: evidence("not-implemented", [INVENTORY_DOCUMENTATION], "Keep the explicit absence of lock, credential, and recovery documentation visible."),
      localization: evidence("not-implemented", [INVENTORY_DOCUMENTATION], "Keep the explicit absence of lock and recovery localized copy visible."),
      persistence: persistentEvidence("not-implemented", [INVENTORY_DOCUMENTATION], "Keep the explicit absence of per-lock persisted state visible."),
      focusedCheck: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of a lock-focused check explicit rather than inventing one."),
      builtArtifactInteraction: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of lock packaged interaction evidence explicit."),
      captureEvidence: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of lock capture evidence explicit."),
    },
  },
  {
    id: "built-in-authenticator-and-secret-history",
    title: "Built-in authenticator, TOTP/HOTP standards, secret-safe history, and protected history manager",
    evidence: {
      implementation: evidence("not-implemented", ["src/renderer/index.html", "site/app/page.tsx"], "Keep the explicit absence of authenticator and protected history implementations visible."),
      documentation: evidence("not-implemented", [INVENTORY_DOCUMENTATION], "Keep the explicit absence of authenticator and secret-history documentation visible."),
      localization: evidence("not-implemented", [INVENTORY_DOCUMENTATION], "Keep the explicit absence of authenticator-localized copy visible."),
      persistence: persistentEvidence("not-implemented", [INVENTORY_DOCUMENTATION], "Keep the explicit absence of vault-backed authenticator and append-only history persistence visible."),
      focusedCheck: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of an authenticator-focused check explicit rather than inventing one."),
      builtArtifactInteraction: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of authenticator packaged interaction evidence explicit."),
      captureEvidence: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of authenticator capture evidence explicit."),
    },
  },
  {
    id: "support-tickets",
    title: "Support Tickets local recovery desk",
    evidence: {
      implementation: evidence("not-implemented", ["src/renderer/index.html", "site/app/page.tsx"], "Keep the explicit absence of the local fictional recovery desk visible."),
      documentation: evidence("not-implemented", [INVENTORY_DOCUMENTATION], "Keep the explicit absence of a Support Tickets feature article visible."),
      localization: evidence("not-implemented", [INVENTORY_DOCUMENTATION], "Keep the explicit absence of Support Tickets localized copy visible."),
      persistence: persistentEvidence("not-implemented", [INVENTORY_DOCUMENTATION], "Keep the explicit absence of a local ticket list and ticket-state persistence visible."),
      focusedCheck: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of a Support Tickets-focused check explicit rather than inventing one."),
      builtArtifactInteraction: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of Support Tickets packaged interaction evidence explicit."),
      captureEvidence: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of Support Tickets capture evidence explicit."),
    },
  },
  {
    id: "command-palette",
    title: "Command palette on `Ctrl+Shift+F`, rich controls, and exact teleport targets",
    evidence: {
      implementation: evidence("partial", ["src/renderer/main.ts", "src/renderer/index.html", "site/app/page.tsx"], "Keep the bounded existing palette route and the absent complete command, destination, setting, and rich-control registry explicit."),
      documentation: evidence("partial", ["docs/architecture/desktop-foundation.md", INVENTORY_DOCUMENTATION], "Keep the existing shortcut route and incomplete command-registry coverage documented."),
      localization: evidence("partial", ["src/renderer/index.html", "site/app/page.tsx"], "Keep the localized existing palette labels and incomplete full-registry copy boundary explicit."),
      persistence: persistentEvidence("not-implemented", [INVENTORY_DOCUMENTATION], "Keep the explicit absence of persisted palette-size choice visible."),
      focusedCheck: evidence("verified", ["scripts/test-desktop-search-foundation.mjs"], "Keep the exact shortcut, registration, and removal regressions named."),
      builtArtifactInteraction: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of packaged teleport interaction evidence explicit."),
      captureEvidence: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of palette capture evidence explicit."),
    },
  },
  {
    id: "destructive-action-super-confirmation",
    title: "Destructive-action super confirmation and emergency exit",
    evidence: {
      implementation: evidence("not-implemented", ["src/renderer/index.html", "site/app/page.tsx"], "Keep the explicit absence of the native two-key and slider confirmation surface visible."),
      documentation: evidence("not-implemented", [INVENTORY_DOCUMENTATION], "Keep the explicit absence of destructive-action documentation visible."),
      localization: evidence("not-implemented", [INVENTORY_DOCUMENTATION], "Keep the explicit absence of destructive-action localized copy visible."),
      persistence: persistentEvidence("not-implemented", [INVENTORY_DOCUMENTATION], "Keep the explicit absence of destructive-action history and preference persistence visible."),
      focusedCheck: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of a destructive-confirmation-focused check explicit rather than inventing one."),
      builtArtifactInteraction: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of destructive-confirmation packaged interaction evidence explicit."),
      captureEvidence: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of destructive-confirmation capture evidence explicit."),
    },
  },
  {
    id: "local-git-backed-version-history",
    title: "Local Git-backed version history for every user-managed record",
    evidence: {
      implementation: evidence("partial", ["src/main/draft-store.ts", "src/main/universal-settings-store.ts", "site/app/page.tsx"], "Keep the partial local JSON persistence references and the absent local history repository explicit."),
      documentation: evidence("not-implemented", [INVENTORY_DOCUMENTATION], "Keep the explicit absence of a complete history schema, export, and retention article visible."),
      localization: evidence("not-implemented", [INVENTORY_DOCUMENTATION], "Keep the explicit absence of history-manager localized copy visible."),
      persistence: persistentEvidence("partial", ["src/main/draft-store.ts", "src/main/universal-settings-store.ts", "site/app/page.tsx"], "Keep the current local persistence references distinct from the absent Git-backed history manager."),
      focusedCheck: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of a complete history-focused check explicit rather than treating JSON persistence as history proof."),
      builtArtifactInteraction: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of history packaged interaction evidence explicit."),
      captureEvidence: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of history capture evidence explicit."),
    },
  },
  {
    id: "changelog-viewer",
    title: "Changelog viewer with date picker, search, commit links, copy, and export",
    evidence: {
      implementation: evidence("partial", ["site/app/changelog-data.ts", "site/app/page.tsx"], "Keep the companion changelog implementation and intentionally absent desktop viewer explicit."),
      documentation: evidence("partial", ["docs/site/changelog-viewer.md", "site/README.md"], "Keep the article, site index, factual records, filters, links, copy, and Markdown export documented."),
      localization: evidence("partial", ["site/app/page.tsx", "docs/site/changelog-viewer.md"], "Keep the current companion copy and incomplete three-mode localization boundary explicit."),
      persistence: notApplicableEvidence("The current viewer's search and date filters are transient view state, not persisted records."),
      focusedCheck: evidence("verified", ["scripts/test-site-changelog-viewer.mjs"], "Keep the factual records, date filtering, search, commit links, copy, and export check named."),
      builtArtifactInteraction: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of changelog packaged interaction evidence explicit."),
      captureEvidence: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of changelog capture evidence explicit."),
    },
  },
  {
    id: "external-editor-handoff",
    title: "External-editor handoff, especially Visual Studio Code workspace opening",
    evidence: {
      implementation: evidence("not-implemented", ["src/renderer/index.html", "site/app/page.tsx"], "Keep the explicit absence of editor detection, selection, and workspace-opening implementations visible."),
      documentation: evidence("not-implemented", [INVENTORY_DOCUMENTATION], "Keep the explicit absence of an external-editor feature article visible."),
      localization: evidence("not-implemented", [INVENTORY_DOCUMENTATION], "Keep the explicit absence of editor-handoff localized copy visible."),
      persistence: persistentEvidence("not-implemented", [INVENTORY_DOCUMENTATION], "Keep the explicit absence of a persisted editor selection visible."),
      focusedCheck: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of an editor-focused check explicit rather than inventing one."),
      builtArtifactInteraction: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of editor packaged interaction evidence explicit."),
      captureEvidence: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of editor capture evidence explicit."),
    },
  },
  {
    id: "complete-exports-and-reimports",
    title: "Complete export formats and re-importable records",
    evidence: {
      implementation: evidence("partial", ["src/shared/planner-handoff.ts", "site/app/page.tsx"], "Keep the bounded Planner Handoff JSON path distinct from the absent universal format matrix."),
      documentation: evidence("partial", ["docs/site/planner-handoff-v1.md", INVENTORY_DOCUMENTATION], "Keep the bounded schema, selected-file boundary, and absent complete format/loss matrix documented."),
      localization: evidence("partial", ["site/app/page.tsx", "docs/site/planner-handoff-v1.md"], "Keep the current planner copy and incomplete universal export localization boundary explicit."),
      persistence: notApplicableEvidence("Export is an operation over existing records; the current partial path does not add a separate export preference."),
      focusedCheck: evidence("verified", ["scripts/test-planner-handoff.mjs"], "Keep the selected-file, schema, validation, and prohibited-route checks named without inflating them into universal export proof."),
      builtArtifactInteraction: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of complete export packaged interaction evidence explicit."),
      captureEvidence: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of complete export capture evidence explicit."),
    },
  },
  {
    id: "bulk-actions-everywhere",
    title: "Bulk actions on every list, table, grid, history, and notification surface",
    evidence: {
      implementation: evidence("partial", ["src/renderer/notification-center.ts", "site/app/notification-center.ts", "site/app/page.tsx"], "Keep the notification bulk-selection foundations and the absent all-collection coverage explicit."),
      documentation: evidence("partial", ["docs/reference/notification-centre.md", INVENTORY_DOCUMENTATION], "Keep the current selection scope, inverse selection, dismissal boundary, and incomplete app-wide coverage documented."),
      localization: evidence("partial", ["src/renderer/index.html", "site/app/page.tsx", "docs/reference/notification-centre.md"], "Keep the current English-only or partial bulk-action copy boundary explicit."),
      persistence: persistentEvidence("partial", ["src/renderer/notification-center.ts", "site/app/notification-center.ts"], "Keep the local notification records and incomplete bulk-action persistence boundary explicit."),
      focusedCheck: evidence("verified", ["scripts/test-site-notification-center.mjs", "scripts/test-desktop-notification-center.mjs"], "Keep the focused notification selection and bulk-action checks named without claiming every collection is covered."),
      builtArtifactInteraction: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of complete bulk-action packaged interaction evidence explicit."),
      captureEvidence: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of complete bulk-action capture evidence explicit."),
    },
  },
  {
    id: "local-file-converter",
    title: "Local categorized file converter with bundled adapters, PDF operations, queue, cancellation, and output validation",
    evidence: {
      implementation: evidence("not-implemented", ["src/renderer/index.html", "site/app/page.tsx"], "Keep the explicit absence of converter and bundled-adapter implementations visible."),
      documentation: evidence("not-implemented", [INVENTORY_DOCUMENTATION], "Keep the explicit absence of converter catalog and adapter documentation visible."),
      localization: evidence("not-implemented", [INVENTORY_DOCUMENTATION], "Keep the explicit absence of converter-localized copy visible."),
      persistence: persistentEvidence("not-implemented", [INVENTORY_DOCUMENTATION], "Keep the explicit absence of queue, history, and resumable conversion persistence visible."),
      focusedCheck: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of a converter-focused check explicit rather than inventing one."),
      builtArtifactInteraction: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of converter packaged interaction evidence explicit."),
      captureEvidence: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of converter capture evidence explicit."),
    },
  },
  {
    id: "local-ollama-suite-manager",
    title: "Complete local Ollama suite manager, exhaustive model catalog, hardware fit, chat, and allowlisted harness",
    evidence: {
      implementation: evidence("not-implemented", ["src/renderer/index.html", "site/app/page.tsx"], "Keep the explicit absence of the local Ollama suite manager visible."),
      documentation: evidence("not-implemented", [INVENTORY_DOCUMENTATION], "Keep the explicit absence of Ollama catalog, hardware, chat, and harness documentation visible."),
      localization: evidence("not-implemented", [INVENTORY_DOCUMENTATION], "Keep the explicit absence of Ollama-localized copy visible."),
      persistence: persistentEvidence("not-implemented", [INVENTORY_DOCUMENTATION], "Keep the explicit absence of local model, chat, cart, and harness state persistence visible."),
      focusedCheck: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of an Ollama-focused check explicit rather than inventing one."),
      builtArtifactInteraction: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of Ollama packaged interaction evidence explicit."),
      captureEvidence: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of Ollama capture evidence explicit."),
    },
  },
  {
    id: "browser-extension-download-surfaces",
    title: "Browser-extension Start download, Downloading, and Download complete surfaces",
    evidence: {
      implementation: evidence("not-implemented", ["src/renderer/index.html", "site/app/page.tsx"], "Keep the explicit absence of browser-extension capture and download surfaces visible."),
      documentation: evidence("not-implemented", [INVENTORY_DOCUMENTATION], "Keep the explicit absence of extension integration and capture inventory documentation visible."),
      localization: evidence("not-implemented", [INVENTORY_DOCUMENTATION], "Keep the explicit absence of download-dialog localized copy visible."),
      persistence: persistentEvidence("not-implemented", [INVENTORY_DOCUMENTATION], "Keep the explicit absence of durable download queue and result persistence visible."),
      focusedCheck: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of an extension-download-focused check explicit rather than inventing one."),
      builtArtifactInteraction: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of extension packaged interaction evidence explicit."),
      captureEvidence: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of Start, Downloading, and completion capture evidence explicit."),
    },
  },
  {
    id: "offline-documentation-and-landing-site",
    title: "Offline in-app documentation browser and complete landing/documentation site",
    evidence: {
      implementation: evidence("partial", ["src/shared/offline-documentation.ts", "src/renderer/offline-documentation-registry.ts", "src/renderer/offline-documentation.ts", "site/app/page.tsx"], "Keep the desktop Markdown bundle foundation, companion documentation surface, and incomplete full-contract site boundary explicit."),
      documentation: evidence("partial", ["docs/reference/offline-documentation-browser.md", "docs/site/README.md", INVENTORY_DOCUMENTATION], "Keep the bundle, renderer, link, search, and incomplete landing-site contract documented."),
      localization: evidence("partial", ["src/renderer/index.html", "site/app/page.tsx"], "Keep the existing documentation labels and incomplete three-mode site coverage explicit."),
      persistence: notApplicableEvidence("The current offline article bundle is build-time content; article search state is transient."),
      focusedCheck: evidence("verified", ["scripts/test-offline-documentation.mjs"], "Keep the hand-written article registry, renderer, search, link, and removal regressions named."),
      builtArtifactInteraction: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of complete offline-browser packaged interaction evidence explicit."),
      captureEvidence: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of offline-browser and landing-site capture evidence explicit."),
    },
  },
  {
    id: "accessibility-responsive-sizing-and-captures",
    title: "Accessibility, responsive sizing, high-scale layout, reduced motion, and real captures for every surface",
    evidence: {
      implementation: evidence("partial", ["src/renderer/styles.css", "src/renderer/index.html", "site/app/page.tsx"], "Keep the existing source declarations distinct from complete surface-by-surface proof."),
      documentation: evidence("partial", [INVENTORY_DOCUMENTATION], "Keep the cross-cutting accessibility, sizing, motion, and capture gap documented."),
      localization: evidence("partial", ["src/renderer/index.html", "site/app/page.tsx"], "Keep the current localized surfaces and incomplete longest-string coverage explicit."),
      persistence: notApplicableEvidence("This row records cross-cutting quality evidence rather than a user-managed setting."),
      focusedCheck: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of a complete accessibility and sizing-focused check explicit rather than inventing one."),
      builtArtifactInteraction: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of complete built-artifact accessibility interaction evidence explicit."),
      captureEvidence: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of approved real capture evidence explicit."),
    },
  },
  {
    id: "shared-live-status-hub",
    title: "Shared live Status Hub registration and app-owned status surface",
    evidence: {
      implementation: evidence("not-implemented", ["src/renderer/index.html", "site/app/page.tsx"], "Keep the explicit absence of shared Status Hub registration and app-owned status surfaces visible."),
      documentation: evidence("not-implemented", [INVENTORY_DOCUMENTATION], "Keep the explicit absence of Status Hub documentation visible."),
      localization: evidence("not-implemented", [INVENTORY_DOCUMENTATION], "Keep the explicit absence of Status Hub localized copy visible."),
      persistence: persistentEvidence("not-implemented", [INVENTORY_DOCUMENTATION], "Keep the explicit absence of registered status records and app-owned status persistence visible."),
      focusedCheck: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of a Status Hub-focused check explicit rather than inventing one."),
      builtArtifactInteraction: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of Status Hub packaged interaction evidence explicit."),
      captureEvidence: evidence("unverified", [INVENTORY_DOCUMENTATION], "Keep the absence of Status Hub capture evidence explicit."),
    },
  },
  {
    id: "complete-inventory-negative-regression",
    title: "Negative regression guard for the complete inventory",
    evidence: {
      implementation: evidence("verified", ["scripts/universal-contract-inventory.mjs", INVENTORY_GUARD], "Keep the explicit metadata registry and fail-closed guard implementation references visible."),
      documentation: evidence("verified", [INVENTORY_DOCUMENTATION], "Keep the guard command, exact row count, evidence-slot contract, and mutation proof documented."),
      localization: evidence("unverified", [INVENTORY_DOCUMENTATION], "This verification-only row has no product localization surface; keep that absence explicit."),
      persistence: notApplicableEvidence("The source inventory is repository metadata, not user-managed state."),
      focusedCheck: evidence("verified", [INVENTORY_GUARD], "Keep the focused command and its intentional remove/restore mutation proof visible."),
      builtArtifactInteraction: evidence("unverified", [INVENTORY_DOCUMENTATION], "This verification-only row has no product artifact interaction; keep that absence explicit."),
      captureEvidence: evidence("unverified", [INVENTORY_DOCUMENTATION], "No product surface exists for this verification-only row; keep the absence of capture evidence explicit."),
    },
  },
];

export const UNIVERSAL_CONTRACT_INVENTORY = Object.freeze(
  UNIVERSAL_CONTRACT_ROWS.map((row) => {
    const surfaces = UNIVERSAL_CONTRACT_SURFACE_EVIDENCE[row.id];
    if (!surfaces) {
      throw new Error(`missing desktop/companion-site surface evidence for ${row.id}`);
    }
    return Object.freeze({ ...row, surfaces });
  }),
);

function formatPaths(paths) {
  return paths.map((path) => `\`${path}\``).join(", ");
}

function formatEvidenceSlot(slot) {
  const applicability = Object.hasOwn(slot, "applicable") ? `; applicable=${slot.applicable}` : "";
  const reason = slot.reason ? `; reason=${slot.reason}` : "";
  return `status=${slot.status}; paths=${formatPaths(slot.paths)}; assertion=${slot.assertion}${applicability}${reason}`;
}

function formatSurfaceEvidence(surface) {
  return `status=${surface.status}; paths=${formatPaths(surface.paths)}; assertion=${surface.assertion}`;
}

export function projectUniversalContractMarkdownRow(row) {
  return Object.freeze([
    row.title,
    formatSurfaceEvidence(row.surfaces.desktop),
    formatSurfaceEvidence(row.surfaces.companionSite),
    ["implementation", "documentation", "localization", "persistence"]
      .map((key) => `${key}=${formatEvidenceSlot(row.evidence[key])}`)
      .join("; "),
    ["focusedCheck", "builtArtifactInteraction", "captureEvidence"]
      .map((key) => `${key}=${formatEvidenceSlot(row.evidence[key])}`)
      .join("; "),
  ]);
}

export const UNIVERSAL_CONTRACT_MARKDOWN_ROWS = Object.freeze(
  UNIVERSAL_CONTRACT_INVENTORY.map(projectUniversalContractMarkdownRow),
);
