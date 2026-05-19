"use client"

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react"

type State = "idle" | "generating" | "success" | "error"

interface AiGenContextValue {
  state: State
  progress: number
  errorMessage: string
  start: (opId?: number) => void
  success: () => void
  error: (msg: string) => void
  reset: () => void
  withProgress: <T>(promise: Promise<T>) => Promise<T>
}

const AiGenContext = createContext<AiGenContextValue | null>(null)

export function AiGenerationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>("idle")
  const [progress, setProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState("")
  const rafRef = useRef<number | null>(null)
  const opIdRef = useRef(0)
  const autoCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancelProgress = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (autoCloseRef.current != null) {
      clearTimeout(autoCloseRef.current)
      autoCloseRef.current = null
    }
  }, [])

  const start = useCallback((opId?: number) => {
    cancelProgress()
    setState("generating")
    setProgress(0)
    setErrorMessage("")

    const duration = 3000
    const startTime = performance.now()

    const tick = (now: number) => {
      const elapsed = now - startTime
      const t = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setProgress(eased * 90)
      if (t < 1 && (opId === undefined || opIdRef.current === opId)) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [cancelProgress])

  const success = useCallback(() => {
    cancelProgress()
    setState("success")
    setProgress(100)
    autoCloseRef.current = setTimeout(() => {
      setState("idle")
      setProgress(0)
    }, 800)
  }, [cancelProgress])

  const fail = useCallback((msg: string) => {
    cancelProgress()
    setState("error")
    setProgress(100)
    setErrorMessage(msg)
  }, [cancelProgress])

  const reset = useCallback(() => {
    cancelProgress()
    setState("idle")
    setProgress(0)
    setErrorMessage("")
  }, [cancelProgress])

  const withProgress = useCallback(
    async <T,>(promise: Promise<T>): Promise<T> => {
      const currentOpId = ++opIdRef.current
      start(currentOpId)
      try {
        const result = await promise
        if (opIdRef.current === currentOpId) success()
        return result
      } catch (err: any) {
        if (opIdRef.current === currentOpId) fail(err?.message || "操作失败")
        throw err
      }
    },
    [start, success, fail]
  )

  useEffect(() => {
    return () => cancelProgress()
  }, [cancelProgress])

  return (
    <AiGenContext.Provider value={{ state, progress, errorMessage, start, success, error: fail, reset, withProgress }}>
      {children}
    </AiGenContext.Provider>
  )
}

export function useAiGeneration() {
  const ctx = useContext(AiGenContext)
  if (!ctx) throw new Error("useAiGeneration must be used within AiGenerationProvider")
  return ctx
}
