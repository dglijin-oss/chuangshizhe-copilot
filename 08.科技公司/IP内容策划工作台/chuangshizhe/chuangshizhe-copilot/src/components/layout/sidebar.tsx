"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import Image from "next/image"
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Archive,
  Globe,
  FilePlus,
  Hash,
  Send,
  FileCheck,
  BarChart3,
  BookOpen,
  List,
  Link2,
  Settings,
  User,
  Shield,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navGroups = [
  {
    id: "workspace",
    label: "工作区总览",
    icon: LayoutDashboard,
    href: "/",
    single: true,
  },
  {
    id: "content",
    label: "内容生产",
    icon: FolderOpen,
    children: [
      { label: "创建 IP", href: "/ip/create", icon: FileText },
      { label: "IP 档案管理", href: "/ip/manage", icon: Shield },
      { label: "发布归档", href: "/ip/archive", icon: Archive },
    ],
  },
  {
    id: "geo",
    label: "GEO 增长",
    icon: Globe,
    children: [
      { label: "GEO 总览", href: "/geo", icon: BarChart3 },
      { label: "GEO 文章", href: "/geo/article", icon: FilePlus },
      { label: "热词关联", href: "/geo/hotwords", icon: Hash },
      { label: "发布库", href: "/geo/publish", icon: Send },
      { label: "规则模板", href: "/geo/rules", icon: FileCheck },
      { label: "GEO 统计", href: "/geo/stats", icon: BarChart3 },
    ],
  },
  {
    id: "assets",
    label: "账号资产",
    icon: BookOpen,
    children: [
      { label: "账号知识库", href: "/assets/knowledge", icon: BookOpen },
      { label: "关键词库", href: "/assets/keywords", icon: List },
      { label: "接入配置", href: "/assets/integrations", icon: Link2 },
    ],
  },
  {
    id: "account",
    label: "账户运营",
    icon: Settings,
    children: [
      { label: "生成记录", href: "/account/logs", icon: FileText },
      { label: "积分充值", href: "/account/recharge", icon: Hash },
      { label: "个人中心", href: "/account/profile", icon: User },
    ],
  },
]

export function Sidebar({
  user,
  onLogout,
}: {
  user: { name: string; points: number; role?: string }
  onLogout: () => void
}) {
  const isAdmin = user.role === "admin"
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    content: false,
    geo: false,
    assets: false,
    account: false,
  })

  const toggle = (id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <div className="w-[240px] bg-gray-50 border-r border-gray-200 h-screen flex flex-col overflow-y-auto flex-shrink-0">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-gray-200">
        <Image src="/logo.png" alt="创世者Copilot" width={160} height={34} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 px-2">
        {navGroups.map((group) => {
          if (group.single) {
            return (
              <Link
                key={group.id}
                href={group.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm mb-1 transition-colors",
                  isActive(group.href)
                    ? "bg-primary text-white"
                    : "text-gray-500 hover:bg-gray-200"
                )}
              >
                <group.icon className="w-4 h-4" />
                <span>{group.label}</span>
              </Link>
            )
          }

          const GroupIcon = group.icon!
          const isGroupOpen = !collapsed[group.id]
          const hasActiveChild = group.children!.some((c) => isActive(c.href))

          return (
            <div key={group.id} className="mb-1">
              <button
                onClick={() => toggle(group.id)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors",
                  hasActiveChild
                    ? "bg-primary text-white"
                    : "text-gray-500 hover:bg-gray-200"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <GroupIcon className="w-4 h-4" />
                  <span>{group.label}</span>
                </div>
                {isGroupOpen ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {isGroupOpen && (
                <div className="ml-4 mt-1 space-y-0.5">
                  {group.children!.map((child) => {
                    const ChildIcon = child.icon
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors",
                          isActive(child.href)
                            ? "bg-primary-mid/20 text-primary"
                            : "text-gray-500 hover:bg-gray-200"
                        )}
                      >
                        <ChildIcon className="w-3.5 h-3.5" />
                        <span>{child.label}</span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Admin section */}
      {isAdmin && (
        <div className="px-2 py-2 border-t border-gray-200">
          <div className="flex items-center gap-2 px-3 py-1.5 mb-1">
            <Shield className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">管理后台</span>
          </div>
          <Link href="/admin/dashboard" className={cn("flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors mb-0.5", isActive("/admin/dashboard") ? "bg-primary-mid/20 text-primary" : "text-gray-500 hover:bg-gray-200")}>
            <BarChart3 className="w-3.5 h-3.5" />
            <span>数据看板</span>
          </Link>
          <Link href="/admin/users" className={cn("flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors mb-0.5", isActive("/admin/users") ? "bg-primary-mid/20 text-primary" : "text-gray-500 hover:bg-gray-200")}>
            <User className="w-3.5 h-3.5" />
            <span>用户管理</span>
          </Link>
          <Link href="/admin/points" className={cn("flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors mb-0.5", isActive("/admin/points") ? "bg-primary-mid/20 text-primary" : "text-gray-500 hover:bg-gray-200")}>
            <Shield className="w-3.5 h-3.5" />
            <span>积分管理</span>
          </Link>
          <Link href="/admin/config" className={cn("flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors mb-0.5", isActive("/admin/config") ? "bg-primary-mid/20 text-primary" : "text-gray-500 hover:bg-gray-200")}>
            <Settings className="w-3.5 h-3.5" />
            <span>系统配置</span>
          </Link>
        </div>
      )}

      {/* User info */}
      <div className="px-3 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{user.name}</span>
          <span className="text-primary font-medium">{user.points} 积分</span>
        </div>
        <button
          onClick={onLogout}
          className="w-full text-xs text-gray-400 hover:text-red-500 transition-colors mt-1 text-left"
        >
          退出登录
        </button>
      </div>
    </div>
  )
}
