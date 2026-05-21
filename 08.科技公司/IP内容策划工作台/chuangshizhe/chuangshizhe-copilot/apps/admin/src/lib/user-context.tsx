export interface UserContextType {
  id: string
  name: string
  phone: string
  role: string
  points: number
  hasQuestionnaire: boolean
  refresh: () => Promise<void>
}
