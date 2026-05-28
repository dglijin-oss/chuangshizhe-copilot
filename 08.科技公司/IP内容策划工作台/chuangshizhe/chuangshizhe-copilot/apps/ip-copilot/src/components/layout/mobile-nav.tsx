"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  LayoutDashboard,
  FolderOpen,
  Globe,
  BookOpen,
  Settings,
  Menu,
  Brain,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MobileDrawer } from "./mobile-drawer"

const tabs = [
  { label: "工作区", href: "/", icon: LayoutDashboard, group: "workspace" },
  { label: "IP 档案", href: "/ip/manage", icon: FolderOpen, group: "content" },
  { label: "GEO", href: "/geo", icon: Globe, group: "geo" },
  { label: "AI 工具箱", href: "/ai-arsenal/project", icon: Brain, group: "ai-arsenal" },
  { label: "资产", href: "/assets/knowledge", icon: BookOpen, group: "assets" },
  { label: "账户", href: "/account/profile", icon: Settings, group: "account" },
]

export function MobileNav({
  user,
  onLogout,
}: {
  user: { name: string; points: number; role?: string }
  onLogout: () => void
}) {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const activeTab = tabs.find((tab) => {
    if (tab.href === "/") return pathname === "/"
    return pathname === tab.href || pathname.startsWith(tab.href + "/")
  })

  return (
    <>
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 md:hidden bg-white border-b border-gray-200 flex items-center justify-between px-4 pt-safe-top min-h-[56px]">
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-2 -ml-1 rounded-lg hover:bg-gray-100 active:bg-gray-200 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
        >
          <Menu className="w-6 h-6" />
        </button>
        <span className="text-sm font-medium text-title">创世者Copilot</span>
        <div className="flex items-center gap-1 text-xs text-body">
          <span>{user.points}</span>
          <span className="text-primary font-medium">积分</span>
        </div>
      </div>

      {/* Bottom tab bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden h-16 bg-white border-t border-gray-200 flex items-center justify-around safe-area-bottom">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive =
            tab.group === activeTab?.group ||
            (tab.href === "/" && pathname === "/")
          return (
            <Link
              key={tab.group}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] px-2 transition-colors",
                isActive ? "text-primary" : "text-gray-400"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{tab.label}</span>
            </Link>
          )
        })}
      </div>

      {/* Drawer */}
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={user}
        onLogout={onLogout}
      />
    </>
  )
}
