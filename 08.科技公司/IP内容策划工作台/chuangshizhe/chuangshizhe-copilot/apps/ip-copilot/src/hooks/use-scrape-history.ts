"use client"

import { useState, useEffect } from "react"

export interface ScrapeHistoryItem {
  id: string
  fnId: number
  fnLabel: string
  input: string
  output: string
  timestamp: string
}

const STORAGE_KEY = "scrape_history"
const MAX_ITEMS = 50

export function useScrapeHistory() {
  const [history, setHistory] = useState<ScrapeHistoryItem[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      setHistory(raw ? JSON.parse(raw) : [])
    } catch {
      setHistory([])
    }
    setLoaded(true)
  }, [])

  const addItem = (item: Omit<ScrapeHistoryItem, "id" | "timestamp">) => {
    const newItem: ScrapeHistoryItem = {
      ...item,
      id: `h_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
    }
    setHistory((prev) => {
      const updated = [newItem, ...prev].slice(0, MAX_ITEMS)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }

  const removeItem = (id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((h) => h.id !== id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }

  const clearAll = () => {
    setHistory([])
    localStorage.removeItem(STORAGE_KEY)
  }

  return { history, addItem, removeItem, clearAll, loaded }
}
