"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import Image from "next/image"
import {
  LayoutDashboard,
  School,
  Users,
  BookOpen,
  FileText,
  BarChart3,
  Shield,
  User,
  Settings,
  Coins,
  ChevronDown,
  ChevronUp,
  Backpack,
  ClipboardList,
  Building2,
  FileCheck,
  Wallet,
  MessageSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navGroups = [
  {
    id: "dashboard",
    label: "工作台",
    icon: LayoutDashboard,
    href: "/",
    single: true,
  },
  {
    id: "ai",
    label: "AI 协同平台",
    icon: BookOpen,
    children: [
      { label: "教案管理", href: "/lesson-plans", icon: FileText },
      { label: "作业管理", href: "/homework", icon: ClipboardList },
      { label: "学情档案", href: "/profiles", icon: BarChart3 },
      { label: "AI 对话", href: "/ai-chat", icon: MessageSquare },
    ],
  },
  {
    id: "school",
    label: "学校管理",
    icon: School,
    children: [
      { label: "学校信息", href: "/schools", icon: Building2 },
      { label: "教师管理", href: "/teachers", icon: Users },
      { label: "班级管理", href: "/classes", icon: School },
      { label: "学生管理", href: "/students", icon: Users },
    ],
  },
  {
    id: "tour",
    label: "研学项目",
    icon: Backpack,
    children: [
      { label: "研学产品", href: "/tours", icon: Backpack },
      { label: "报名管理", href: "/bookings", icon: ClipboardList },
      { label: "供应商管理", href: "/suppliers", icon: Building2 },
      { label: "安全文档", href: "/safety-docs", icon: FileCheck },
      { label: "财务结算", href: "/settlements", icon: Wallet },
    ],
  },
  {
    id: "account",
    label: "账户",
    icon: Settings,
    children: [
      { label: "个人中心", href: "/profile", icon: User },
      { label: "积分充值", href: "/recharge", icon: Coins },
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
    ai: false,
    school: false,
    tour: false,
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
        <span className="text-xs text-primary font-medium mt-1 block">启明盒子</span>
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
          <Link href="/admin" className={cn("flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors mb-0.5", isActive("/admin") ? "bg-primary-mid/20 text-primary" : "text-gray-500 hover:bg-gray-200")}>
            <Settings className="w-3.5 h-3.5" />
            <span>系统管理</span>
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
