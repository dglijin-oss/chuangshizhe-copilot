// Detects the runtime environment and returns the base API URL for native apps.
// - Tauri / Capacitor: uses NEXT_PUBLIC_API_URL env var
// - Browser dev: returns empty string (relative paths, same origin)
export function getApiBase(): string {
  if (typeof window === "undefined") return ""

  // Tauri 2.x
  if ("__TAURI__" in window) {
    return process.env.NEXT_PUBLIC_API_URL || ""
  }

  // Capacitor
  if ("Capacitor" in window) {
    return process.env.NEXT_PUBLIC_API_URL || ""
  }

  // Browser — use relative paths
  return ""
}

export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false
  return "__TAURI__" in window || "Capacitor" in window
}
