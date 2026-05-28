// Unified fetch wrapper for native apps.
// - Stores and injects Bearer token for API requests
// - Falls back to cookie-based auth in browser

import { getApiBase, isNativeApp } from "@/lib/api-config"

const TOKEN_KEY = "chuangshizhe_token"

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function storeToken(token: string) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // storage full or unavailable
  }
}

function clearToken() {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(TOKEN_KEY)
  } catch {
    // ignore
  }
}

interface NativeFetchOptions extends RequestInit {
  // When true, expects { user, token } response and auto-stores token
  auth?: boolean
}

/**
 * Fetch wrapper for native apps (Tauri / Capacitor).
 * Automatically attaches Bearer token to requests.
 * For login calls with auth: true, stores the returned token.
 */
export async function nativeFetch(
  url: string,
  options: NativeFetchOptions = {}
): Promise<Response> {
  const { auth, ...fetchOptions } = options
  const apiBase = getApiBase()
  const fullUrl = apiBase ? `${apiBase}${url}` : url

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  }

  // Attach Bearer token if available
  const token = getStoredToken()
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  // Mark as native app for login route to return token
  if (auth) {
    headers["X-Native-App"] = "true"
  }

  const res = await fetch(fullUrl, {
    ...fetchOptions,
    headers,
    credentials: "omit", // Don't send cookies in native apps
  })

  // Auto-store token on login response
  if (auth && res.ok) {
    try {
      const data = await res.clone().json()
      if (data?.token) {
        storeToken(data.token)
      }
    } catch {
      // not JSON — ignore
    }
  }

  return res
}

/** Store a token manually (e.g., from Capacitor Preferences or Tauri Store) */
export function setAuthToken(token: string) {
  storeToken(token)
}

/** Clear stored token (on logout) */
export function clearAuthToken() {
  clearToken()
}

/** Get current token (for native integrations like Tauri/Capacitor) */
export function getAuthToken(): string | null {
  return getStoredToken()
}
