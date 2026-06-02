/**
 * Map icon name strings to Lucide React components.
 * Used by the module system to convert string icon names (stored in config)
 * into actual React components for the sidebar.
 */
import * as Icons from "lucide-react"

export type IconName = keyof typeof Icons

/**
 * Resolve a string icon name to a Lucide React component.
 * Returns a fallback icon if the name is not found.
 */
export function resolveIcon(name: string, fallback = Icons.FileQuestion) {
  const icon = (Icons as Record<string, unknown>)[name]
  return typeof icon === "function" ? (icon as React.ComponentType<{ className?: string }>) : fallback
}
