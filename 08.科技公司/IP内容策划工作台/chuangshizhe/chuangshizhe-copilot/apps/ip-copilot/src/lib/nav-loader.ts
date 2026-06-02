/**
 * Sidebar navigation group — icon is already a React component.
 * Produced by loadNavGroups() after resolving string icon names.
 */
export interface SidebarNavGroup {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  href?: string
  single?: boolean
  adminOnly?: boolean
  children?: {
    href: string
    label: string
    icon: React.ComponentType<{ className?: string }>
  }[]
}

/**
 * Module-level nav item — icon is a string name matching a Lucide icon.
 */
export interface ModuleNavItem {
  path: string
  label: string
  icon?: string
}

export interface ModuleNavGroup {
  label: string
  items: ModuleNavItem[]
  adminOnly?: boolean
}

/**
 * Convert module nav groups (string icons) into sidebar-ready nav groups (React components).
 */
export function loadNavGroups(
  moduleGroups: ModuleNavGroup[],
  resolveIcon: (name: string) => React.ComponentType<{ className?: string }>
): SidebarNavGroup[] {
  return moduleGroups.map((group, idx) => ({
    id: `group-${idx}-${group.label}`,
    label: group.label,
    adminOnly: group.adminOnly,
    // If single-item group (first item only), treat as single link
    ...(group.items.length === 1
      ? {
          single: true,
          href: group.items[0].path,
          icon: group.items[0].icon ? resolveIcon(group.items[0].icon) : undefined,
        }
      : {
          icon: resolveIcon(group.items[0]?.icon ?? 'FolderOpen'),
          children: group.items.map(item => ({
            href: item.path,
            label: item.label,
            icon: item.icon ? resolveIcon(item.icon) : resolveIcon('FileText'),
          })),
        }),
  }))
}
