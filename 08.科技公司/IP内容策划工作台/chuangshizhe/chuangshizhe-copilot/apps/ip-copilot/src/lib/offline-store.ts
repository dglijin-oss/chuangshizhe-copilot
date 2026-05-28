// IndexedDB wrapper for offline caching of key data.
// Stores JSON-serializable data with optional TTL metadata.

const DB_NAME = "chuangshizhe-offline"
const DB_VERSION = 1
const STORE_NAME = "cache"

interface CacheEntry<T> {
  data: T
  cachedAt: number
  ttl: number // milliseconds
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function offlineGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly")
      const store = tx.objectStore(STORE_NAME)
      const request = store.get(key)
      request.onsuccess = () => {
        const entry: CacheEntry<T> | undefined = request.result
        if (!entry) { resolve(null); return }
        if (Date.now() - entry.cachedAt > entry.ttl) {
          // Expired — clear it
          const writeTx = db.transaction(STORE_NAME, "readwrite")
          writeTx.objectStore(STORE_NAME).delete(key)
          resolve(null)
          return
        }
        resolve(entry.data)
      }
      request.onerror = () => reject(request.error)
    })
  } catch {
    return null
  }
}

export async function offlineSet<T>(key: string, data: T, ttlMs: number): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite")
      const store = tx.objectStore(STORE_NAME)
      const entry: CacheEntry<T> = { data, cachedAt: Date.now(), ttl: ttlMs }
      const request = store.put(entry, key)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch {
    // Silently fail — offline caching is non-critical
  }
}

export async function offlineDelete(key: string): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite")
      const store = tx.objectStore(STORE_NAME)
      const request = store.delete(key)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch {
    // silently fail
  }
}

export async function offlineClear(): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite")
      const store = tx.objectStore(STORE_NAME)
      const request = store.clear()
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch {
    // silently fail
  }
}
