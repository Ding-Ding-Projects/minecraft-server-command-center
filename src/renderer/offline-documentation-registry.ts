import architectureDesktopFoundation from "../../docs/architecture/desktop-foundation.md?raw";
import architectureReadme from "../../docs/architecture/README.md?raw";
import docsReadme from "../../docs/README.md?raw";
import referenceJavaRuntime from "../../docs/reference/java-runtime-setup.md?raw";
import referenceNotificationCentre from "../../docs/reference/notification-centre.md?raw";
import referenceNpmSecurityAudit from "../../docs/reference/npm-security-audit.md?raw";
import referenceDesktopPresentationSettings from "../../docs/reference/desktop-presentation-settings.md?raw";
import referencePaperSpigotCatalog from "../../docs/reference/paper-spigot-cli-catalog.md?raw";
import referenceReadme from "../../docs/reference/README.md?raw";
import referenceReleaseDimSum from "../../docs/reference/release-dim-sum-metadata.md?raw";
import referenceServerArtifact from "../../docs/reference/server-artifact-provisioning.md?raw";
import referenceServerConfigurationSchema from "../../docs/reference/server-configuration-schema.md?raw";
import referenceServerConfigurationWriter from "../../docs/reference/server-configuration-writer.md?raw";
import referenceServerLifecycle from "../../docs/reference/server-lifecycle.md?raw";
import referenceUniversalSettings from "../../docs/reference/universal-settings.md?raw";
import referenceUnsignedUpdates from "../../docs/reference/unsigned-automatic-updates.md?raw";
import referenceOfflineDocumentation from "../../docs/reference/offline-documentation-browser.md?raw";
import serverConfigurationPaperSpigot from "../../docs/server-configuration/paper-spigot-cli.md?raw";
import serverConfigurationReadme from "../../docs/server-configuration/README.md?raw";
import verificationCompleteness from "../../docs/verification/completeness-inventory.md?raw";
import verificationReadme from "../../docs/verification/README.md?raw";
import verificationArtifactPath from "../../docs/verification/artifact-path-verification.md?raw";
import verificationReleaseLineCount from "../../docs/verification/release-line-count.md?raw";
import verificationReleaseTiming from "../../docs/verification/release-publication-timing.md?raw";
import {
  createOfflineDocumentationRegistry,
  type OfflineDocumentationArticle,
} from "../shared/offline-documentation";

const articles: readonly OfflineDocumentationArticle[] = [
  { id: "docs-readme", title: "Documentation", sourcePath: "docs/README.md", markdown: docsReadme },
  { id: "architecture-desktop-foundation", title: "Desktop foundation architecture", sourcePath: "docs/architecture/desktop-foundation.md", markdown: architectureDesktopFoundation },
  { id: "architecture-readme", title: "Architecture documentation", sourcePath: "docs/architecture/README.md", markdown: architectureReadme },
  { id: "reference-java-runtime-setup", title: "Java runtime discovery and review-only setup", sourcePath: "docs/reference/java-runtime-setup.md", markdown: referenceJavaRuntime },
  { id: "reference-notification-centre", title: "Notification centre foundation", sourcePath: "docs/reference/notification-centre.md", markdown: referenceNotificationCentre },
  { id: "reference-npm-security-audit", title: "npm security audit", sourcePath: "docs/reference/npm-security-audit.md", markdown: referenceNpmSecurityAudit },
  { id: "reference-desktop-presentation-settings", title: "Desktop presentation settings", sourcePath: "docs/reference/desktop-presentation-settings.md", markdown: referenceDesktopPresentationSettings },
  { id: "reference-paper-spigot-cli-catalog", title: "Paper and Spigot launch catalog", sourcePath: "docs/reference/paper-spigot-cli-catalog.md", markdown: referencePaperSpigotCatalog },
  { id: "reference-readme", title: "Runtime reference", sourcePath: "docs/reference/README.md", markdown: referenceReadme },
  { id: "reference-release-dim-sum-metadata", title: "Release dim sum metadata", sourcePath: "docs/reference/release-dim-sum-metadata.md", markdown: referenceReleaseDimSum },
  { id: "reference-server-artifact-provisioning", title: "Server artifact provisioning foundation", sourcePath: "docs/reference/server-artifact-provisioning.md", markdown: referenceServerArtifact },
  { id: "reference-server-configuration-schema", title: "Server Configuration Schema", sourcePath: "docs/reference/server-configuration-schema.md", markdown: referenceServerConfigurationSchema },
  { id: "reference-server-configuration-writer", title: "Server Configuration Writer Foundation", sourcePath: "docs/reference/server-configuration-writer.md", markdown: referenceServerConfigurationWriter },
  { id: "reference-server-lifecycle", title: "Server lifecycle service", sourcePath: "docs/reference/server-lifecycle.md", markdown: referenceServerLifecycle },
  { id: "reference-universal-settings", title: "Universal settings foundation", sourcePath: "docs/reference/universal-settings.md", markdown: referenceUniversalSettings },
  { id: "reference-unsigned-automatic-updates", title: "Unsigned automatic-update foundation", sourcePath: "docs/reference/unsigned-automatic-updates.md", markdown: referenceUnsignedUpdates },
  { id: "reference-offline-documentation-browser", title: "Offline documentation browser foundation", sourcePath: "docs/reference/offline-documentation-browser.md", markdown: referenceOfflineDocumentation },
  { id: "server-configuration-paper-spigot-cli", title: "Paper and Spigot CLI guidance", sourcePath: "docs/server-configuration/paper-spigot-cli.md", markdown: serverConfigurationPaperSpigot },
  { id: "server-configuration-readme", title: "Server configuration documentation", sourcePath: "docs/server-configuration/README.md", markdown: serverConfigurationReadme },
  { id: "verification-completeness-inventory", title: "Desktop foundation completeness inventory", sourcePath: "docs/verification/completeness-inventory.md", markdown: verificationCompleteness },
  { id: "verification-readme", title: "Verification documentation", sourcePath: "docs/verification/README.md", markdown: verificationReadme },
  { id: "verification-artifact-path-verification", title: "Windows artifact-path verification", sourcePath: "docs/verification/artifact-path-verification.md", markdown: verificationArtifactPath },
  { id: "verification-release-line-count", title: "Release line-count report", sourcePath: "docs/verification/release-line-count.md", markdown: verificationReleaseLineCount },
  { id: "verification-release-publication-timing", title: "Release publication timing", sourcePath: "docs/verification/release-publication-timing.md", markdown: verificationReleaseTiming },
];

export const OFFLINE_DOCUMENTATION_REGISTRY = createOfflineDocumentationRegistry(articles);
