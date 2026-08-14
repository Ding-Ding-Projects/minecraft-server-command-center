import { REGEX_SEARCH_LIMITS, type RegexSearchMode } from "../shared/regex-search.ts";

export interface RegexBuilderState {
  readonly mode: RegexSearchMode;
  readonly query: string;
  readonly pattern: string;
  readonly flags: string;
}

export interface AnchoredRegexBuilderOptions {
  readonly id: string;
  readonly searchInput: HTMLInputElement;
  readonly toggle: HTMLButtonElement;
  readonly builder: HTMLElement;
  readonly pattern: HTMLInputElement;
  readonly ignoreCase: HTMLInputElement;
  readonly status: HTMLElement;
  readonly onStateChange: (state: RegexBuilderState) => void;
}

export interface AnchoredRegexBuilderBinding {
  readonly getState: () => RegexBuilderState;
  readonly setRegexMode: (enabled: boolean, focus?: boolean) => void;
}

function boundedValue(value: string): string {
  return value.slice(0, REGEX_SEARCH_LIMITS.maxPatternCharacters);
}

export function bindAnchoredRegexBuilder(
  options: AnchoredRegexBuilderOptions,
): AnchoredRegexBuilderBinding {
  let regexMode = false;
  options.builder.dataset.regexBuilderSurface = options.id;

  const getState = (): RegexBuilderState => ({
    mode: regexMode ? "regex" : "plain",
    query: options.searchInput.value,
    pattern: options.pattern.value,
    flags: options.ignoreCase.checked ? "i" : "",
  });

  const notify = (): void => options.onStateChange(getState());

  const setRegexMode = (enabled: boolean, focus = true): void => {
    const wasRegexMode = regexMode;
    regexMode = enabled;
    if (regexMode && (!wasRegexMode || options.pattern.value.length === 0)) {
      options.pattern.value = boundedValue(options.searchInput.value);
    }
    options.toggle.setAttribute("aria-expanded", String(regexMode));
    options.builder.hidden = !regexMode;
    if (regexMode) {
      options.status.textContent = options.pattern.value.length === 0
        ? "Regex mode is ready. Add a bounded pattern or choose a token."
        : "Regex mode is active. Evaluation stays local and bounded.";
      if (focus) options.pattern.focus();
    } else {
      options.status.textContent = "Plain text search is active. Regex is an explicit local opt-in.";
      if (focus) options.searchInput.focus();
    }
    notify();
  };

  options.searchInput.addEventListener("input", () => {
    if (regexMode) options.pattern.value = boundedValue(options.searchInput.value);
    notify();
  });
  options.searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") event.preventDefault();
  });
  options.pattern.addEventListener("input", () => {
    if (regexMode) options.searchInput.value = boundedValue(options.pattern.value);
    notify();
  });
  options.pattern.addEventListener("keydown", (event) => {
    if (event.key === "Enter") event.preventDefault();
  });
  options.ignoreCase.addEventListener("change", notify);
  options.toggle.addEventListener("click", () => setRegexMode(!regexMode));
  options.builder.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    setRegexMode(false);
  });
  for (const token of options.builder.querySelectorAll<HTMLButtonElement>("[data-regex-token]")) {
    token.addEventListener("click", () => {
      setRegexMode(true, false);
      options.pattern.value = boundedValue(`${options.pattern.value}${token.dataset.regexToken ?? ""}`);
      options.searchInput.value = options.pattern.value;
      notify();
      options.pattern.focus();
    });
  }

  options.toggle.setAttribute("aria-expanded", "false");
  options.builder.hidden = true;
  options.status.textContent = "Plain text search is active. Regex is an explicit local opt-in.";
  return { getState, setRegexMode };
}
