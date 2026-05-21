import { createContext } from "react"

export interface UserContextType {
  id: string
  name: string
  phone: string
  role: string
  points: number
  refresh: () => Promise<void>
  hasQuestionnaire?: boolean
}

export const UserContext = createContext<UserContextType | null>(null)
