"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
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
  FolderKanban,
  KeyRound,
  Coins,
  ChevronDown,
  ChevronUp,
  X,
  LogOut,
  Brain,
  Image as ImageIcon,
  Video,
  Users,
  Bot,
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
    label: "IP 内容运营",
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
    id: "ai-arsenal",
    label: "AI 工具箱",
    icon: Brain,
    children: [
      { label: "项目助手", href: "/ai-arsenal/project", icon: FolderKanban },
      { label: "图片助手", href: "/ai-arsenal/image", icon: ImageIcon },
      { label: "视频助手", href: "/ai-arsenal/video", icon: Video },
      { label: "AI 智囊团", href: "/ai-arsenal/squad", icon: Users },
      { label: "图片智能体", href: "/ai-arsenal/image-agent", icon: Bot },
      { label: "视频智能体", href: "/ai-arsenal/video-agent", icon: Bot },
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

export function MobileDrawer({
  open,
  onClose,
  user,
  onLogout,
}: {
  open: boolean
  onClose: () => void
  user: { name: string; points: number; role?: string }
  onLogout: () => void
}) {
  const pathname = usePathname()
  const isAdmin = user.role === "admin"
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    content: true,
    geo: true,
    "ai-arsenal": true,
    assets: true,
    account: true,
  })

  const toggle = (id: string) => {
    setCollapsed((prev) => {
      const next: Record<string, boolean> = {}
      navGroups.forEach((g) => {
        if (!g.single) next[g.id] = true
      })
      next[id] = !prev[id]
      return next
    })
  }

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer panel */}
      <div
        className={cn(
          "fixed top-0 left-0 bottom-0 w-[280px] bg-white z-50 md:hidden transform transition-transform duration-200 ease-in-out flex flex-col overflow-y-auto",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <span className="text-base font-bold text-title">导航菜单</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2 px-3">
          {navGroups.map((group) => {
            if (group.single) {
              return (
                <Link
                  key={group.id}
                  href={group.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-lg text-sm mb-1 min-h-[48px]",
                    isActive(group.href)
                      ? "bg-primary text-white"
                      : "text-gray-500 hover:bg-gray-100"
                  )}
                >
                  <group.icon className="w-5 h-5" />
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
                    "w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm min-h-[48px]",
                    hasActiveChild
                      ? "bg-primary text-white"
                      : "text-gray-500 hover:bg-gray-100"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <GroupIcon className="w-5 h-5" />
                    <span>{group.label}</span>
                  </div>
                  {isGroupOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {isGroupOpen && (
                  <div className="ml-5 mt-1 space-y-0.5">
                    {group.children!.map((child) => {
                      const ChildIcon = child.icon
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onClose}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm min-h-[44px]",
                            isActive(child.href)
                              ? "bg-primary-light/20 text-primary"
                              : "text-gray-500 hover:bg-gray-100"
                          )}
                        >
                          <ChildIcon className="w-4 h-4" />
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
          <div className="px-3 py-3 border-t border-gray-200">
            <div className="flex items-center gap-2 px-3 py-2 mb-1">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-primary">管理后台</span>
            </div>
            {[
              { href: "/admin/dashboard", icon: BarChart3, label: "数据看板" },
              { href: "/admin/users", icon: User, label: "用户管理" },
              { href: "/admin/points", icon: Shield, label: "积分管理" },
              { href: "/admin/config", icon: Settings, label: "系统配置" },
              { href: "/admin/ips", icon: FolderKanban, label: "IP 档案" },
              { href: "/admin/sessions", icon: KeyRound, label: "登录记录" },
              { href: "/admin/recharges", icon: Coins, label: "充值记录" },
              { href: "/admin/logs", icon: FileText, label: "操作日志" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs min-h-[44px]",
                  isActive(item.href)
                    ? "bg-primary-light/20 text-primary"
                    : "text-gray-500 hover:bg-gray-100"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        )}

        {/* User info */}
        <div className="px-4 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{user.name}</span>
            <span className="text-primary font-medium">{user.points} 积分</span>
          </div>
          <button
            onClick={() => {
              onLogout()
              onClose()
            }}
            className="w-full flex items-center gap-3 px-3 py-3 mt-2 text-sm text-gray-400 hover:text-red-500 min-h-[44px]"
          >
            <LogOut className="w-4 h-4" />
            <span>退出登录</span>
          </button>
        </div>
      </div>
    </>
  )
}
