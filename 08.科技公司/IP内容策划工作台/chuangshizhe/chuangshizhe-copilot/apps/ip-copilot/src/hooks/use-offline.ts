// Offline-aware fetch hook with TTL-based caching.
// Use for data that should be available when disconnected.

import { useState, useEffect, useCallback } from "react"
import { offlineGet, offlineSet } from "@/lib/offline-store"
import { getApiBase } from "@/lib/api-config"
import { getAuthToken } from "@/lib/api-client"

interface UseOfflineFetchOptions<T> {
  ttl?: number // cache TTL in milliseconds, default 5 minutes
  enabled?: boolean
  initialData?: T | null
}

export function useOfflineFetch<T = unknown>(
  url: string,
  cacheKey: string,
  options: UseOfflineFetchOptions<T> = {}
) {
  const { ttl = 5 * 60 * 1000, enabled = true, initialData = null } = options

  const [data, setData] = useState<T | null>(initialData)
  const [loading, setLoading] = useState(true)
  const [fromCache, setFromCache] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!enabled) { setLoading(false); return }
    setLoading(true)
    setError(null)

    // Try cached data first (show immediately if available)
    const cached = await offlineGet<T>(cacheKey)
    if (cached) {
      setData(cached)
      setFromCache(true)
    }

    // Always try to fetch fresh data if online
    if (navigator.onLine) {
      try {
        const apiBase = getApiBase()
        const fullUrl = apiBase ? `${apiBase}${url}` : url
        const token = getAuthToken()

        const headers: Record<string, string> = { "Content-Type": "application/json" }
        if (token) {
          headers["Authorization"] = `Bearer ${token}`
        }

        const res = await fetch(fullUrl, {
          headers,
          credentials: "omit",
        })

        if (res.ok) {
          const freshData = await res.json()
          setData(freshData)
          setFromCache(false)
          await offlineSet(cacheKey, freshData, ttl)
        } else {
          setError(`HTTP ${res.status}`)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Network error")
        // Keep showing cached data if available
      }
    }

    setLoading(false)
  }, [url, cacheKey, ttl, enabled])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Refetch on reconnect
  useEffect(() => {
    const handler = () => {
      if (navigator.onLine) fetchData()
    }
    window.addEventListener("online", handler)
    return () => window.removeEventListener("online", handler)
  }, [fetchData])

  return { data, loading, fromCache, error, refetch: fetchData }
}
