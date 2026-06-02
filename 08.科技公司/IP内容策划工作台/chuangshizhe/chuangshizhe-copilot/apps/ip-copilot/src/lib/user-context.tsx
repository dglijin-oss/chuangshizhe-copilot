"use client"

import { createContext, useContext } from "react"

type UserContextType = {
  id: string
  name: string
  phone: string
  role: string
  points: number
  products: string[]  // 已开通的产品权限
  hasQuestionnaire: boolean
  refresh: () => Promise<void>
}

export const UserContext = createContext<UserContextType | null>(null)

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error("useUser must be used within UserProvider")
  return ctx
}
