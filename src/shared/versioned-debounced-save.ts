export interface DebouncedSaveTimerApi {
  readonly set: (callback: () => void, delayMs: number) => ReturnType<typeof setTimeout>;
  readonly clear: (handle: ReturnType<typeof setTimeout>) => void;
}

export interface VersionedDebouncedSave<T> {
  readonly schedule: (value: T) => void;
  readonly invalidate: () => void;
}

const DEFAULT_TIMER_API: DebouncedSaveTimerApi = {
  set: (callback, delayMs) => globalThis.setTimeout(callback, delayMs),
  clear: (handle) => globalThis.clearTimeout(handle),
};

/**
 * Debounces writes while invalidating an older in-flight write immediately
 * when a newer value is scheduled. A late result can therefore never restore
 * state that was superseded during the debounce window.
 */
export function createVersionedDebouncedSave<T>(
  save: (value: T) => Promise<T>,
  onSaved: (value: T) => void,
  onError: (error: unknown) => void,
  delayMs = 350,
  timerApi: DebouncedSaveTimerApi = DEFAULT_TIMER_API,
): VersionedDebouncedSave<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let version = 0;

  const invalidate = (): void => {
    version += 1;
    if (timer !== undefined) timerApi.clear(timer);
    timer = undefined;
  };

  return {
    schedule(value: T): void {
      if (timer !== undefined) timerApi.clear(timer);
      const requestedVersion = ++version;
      timer = timerApi.set(() => {
        timer = undefined;
        void save(value).then((saved) => {
          if (requestedVersion !== version) return;
          onSaved(saved);
        }).catch((error) => {
          if (requestedVersion === version) onError(error);
        });
      }, delayMs);
    },
    invalidate,
  };
}
