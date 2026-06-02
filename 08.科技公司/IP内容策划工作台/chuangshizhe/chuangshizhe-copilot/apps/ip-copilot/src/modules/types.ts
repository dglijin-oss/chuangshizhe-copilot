export interface ModuleConfig {
  id: string
  name: string
  icon: string
  description: string
  version: string
  enabled: boolean
  requiredProducts: string[]
  dbSchema?: string
  pricing?: Record<string, { points: number }>
}

export interface NavItem {
  path: string
  label: string
  icon?: string
  adminOnly?: boolean
}

export interface NavGroup {
  label: string
  items: NavItem[]
  adminOnly?: boolean
}

export interface ModuleRoutes {
  navGroups: NavGroup[]
}

export interface Module {
  config: ModuleConfig
  routes: ModuleRoutes
}
