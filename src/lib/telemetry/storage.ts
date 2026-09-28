/**
 * localStorage access that cannot throw.
 *
 * Separate from the telemetry module so the failure handling is one small
 * thing tested on its own rather than a try/catch repeated at every call site.
 *
 * Every one of these calls can throw in a real browser: Safari in private
 * mode, a user who blocked site data, a quota that is already full, an
 * extension that replaced the storage object. A study tool must not care, and
 * a *telemetry* module must care least of all — so failure reads as "no
 * telemetry" rather than as an exception reaching a render.
 */

export function getFlag(key: string): string | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Pass `null` to remove. Silently does nothing when storage is unavailable. */
export function setFlag(key: string, value: string | null): void {
  try {
    if (typeof localStorage === "undefined") return;
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* Storage unavailable or full. Telemetry is never worth an error. */
  }
}
