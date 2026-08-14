import type { PersonalVocabularyState } from "./desktop-api";

export interface PersonalVocabularyRecoveryProjection {
  readonly status: PersonalVocabularyState["status"];
  readonly entryCount: number;
  readonly retryAvailable: boolean;
}

/**
 * Turns a failed malformed-cache cleanup into an explicit, retryable empty
 * display state. The recovery marker is deliberately not persisted as secret
 * or file metadata; it only controls the local recovery affordance.
 */
export function projectPersonalVocabularyRecovery(
  state: Pick<PersonalVocabularyState, "status" | "entryCount" | "recovery">,
): PersonalVocabularyRecoveryProjection {
  if (state.recovery === "malformed-cache-removal-failed") {
    return { status: "empty", entryCount: 0, retryAvailable: true };
  }
  return { status: state.status, entryCount: state.entryCount, retryAvailable: false };
}
