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
  FolderKanban,
  KeyRound,
  Coins,
  ChevronDown,
  ChevronUp,
  Bot,
  ImageIcon,
  Video,
  Users,
  PanelLeftClose,
  PanelLeftOpen,
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
    id: "ai-assistant",
    label: "AI 助手",
    icon: Bot,
    children: [
      { label: "项目助手", href: "/ai-arsenal/project", icon: FolderKanban },
      { label: "图片生成", href: "/ai-arsenal/image", icon: ImageIcon },
      { label: "视频生成", href: "/ai-arsenal/video", icon: Video },
      { label: "AI智囊团", href: "/ai-arsenal/squad", icon: Users },
      { label: "图片 Agent", href: "/ai-arsenal/image-agent", icon: ImageIcon },
      { label: "视频 Agent", href: "/ai-arsenal/video-agent", icon: Video },
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
  className,
}: {
  user: { name: string; points: number; role?: string }
  onLogout: () => void
  className?: string
}) {
  const isAdmin = user.role === "admin"
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [groupCollapsed, setGroupCollapsed] = useState<Record<string, boolean>>({
    content: true,
    geo: true,
    assets: true,
    "ai-assistant": true,
    account: true,
  })

  const toggleSidebar = () => setSidebarCollapsed((v) => !v)
  const toggleGroup = (id: string) => setGroupCollapsed((prev) => ({ ...prev, [id]: !prev[id] }))

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <div
      className={cn(
        "bg-gray-50 border-r border-gray-200 h-screen flex flex-col flex-shrink-0 transition-all duration-200",
        sidebarCollapsed ? "w-[64px]" : "w-[240px]",
        className
      )}
    >
      {/* Logo + Toggle */}
      <div className={cn(
        "px-4 py-4 border-b border-gray-200 flex items-center",
        sidebarCollapsed ? "justify-center" : "justify-between"
      )}>
        {!sidebarCollapsed && (
          <Image src="/logo.png" alt="创世者Copilot" width={160} height={34} />
        )}
        <button
          onClick={toggleSidebar}
          className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors",
            sidebarCollapsed && "mx-auto"
          )}
        >
          {sidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 px-2 overflow-y-auto">
        {navGroups.map((group) => {
          if (group.single) {
            if (sidebarCollapsed) {
              return (
                <div key={group.id} className="flex justify-center mb-1 group relative">
                  <Link
                    href={group.href}
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                      isActive(group.href)
                        ? "bg-primary text-white"
                        : "text-gray-500 hover:bg-gray-200"
                    )}
                  >
                    <group.icon className="w-4 h-4" />
                  </Link>
                  <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                    {group.label}
                  </span>
                </div>
              )
            }
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
          const isGroupOpen = !groupCollapsed[group.id] && !sidebarCollapsed
          const hasActiveChild = group.children!.some((c) => isActive(c.href))

          if (sidebarCollapsed) {
            return (
              <div key={group.id} className="flex justify-center mb-1 group relative">
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                    hasActiveChild
                      ? "bg-primary text-white"
                      : "text-gray-500 hover:bg-gray-200"
                  )}
                >
                  <GroupIcon className="w-4 h-4" />
                </button>
                {/* Tooltip */}
                <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                  {group.label}
                </span>
                {/* Popover for children */}
                {groupCollapsed[group.id] === false && (
                  <div className="absolute left-full ml-2 top-0 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[140px] z-40">
                    {group.children!.map((child) => {
                      const ChildIcon = child.icon
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 text-xs transition-colors",
                            isActive(child.href)
                              ? "bg-primary/10 text-primary"
                              : "text-gray-600 hover:bg-gray-50"
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
          }

          return (
            <div key={group.id} className="mb-1">
              <button
                onClick={() => toggleGroup(group.id)}
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
        <div className={cn(
          "border-t border-gray-200",
          sidebarCollapsed ? "px-1 py-2" : "px-2 py-2"
        )}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2 px-3 py-1.5 mb-1">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">管理后台</span>
            </div>
          )}
          {sidebarCollapsed ? (
            <div className="flex flex-col gap-1 items-center">
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
                <div key={item.href} className="group relative">
                  <Link href={item.href} className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                    isActive(item.href)
                      ? "bg-primary/20 text-primary"
                      : "text-gray-500 hover:bg-gray-200"
                  )}>
                    <item.icon className="w-4 h-4" />
                  </Link>
                  <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <>
              <Link href="/admin/dashboard" className={cn("flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors mb-0.5", isActive("/admin/dashboard") ? "bg-primary-mid/20 text-primary" : "text-gray-500 hover:bg-gray-200")}>
                <BarChart3 className="w-3.5 h-3.5" /><span>数据看板</span>
              </Link>
              <Link href="/admin/users" className={cn("flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors mb-0.5", isActive("/admin/users") ? "bg-primary-mid/20 text-primary" : "text-gray-500 hover:bg-gray-200")}>
                <User className="w-3.5 h-3.5" /><span>用户管理</span>
              </Link>
              <Link href="/admin/points" className={cn("flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors mb-0.5", isActive("/admin/points") ? "bg-primary-mid/20 text-primary" : "text-gray-500 hover:bg-gray-200")}>
                <Shield className="w-3.5 h-3.5" /><span>积分管理</span>
              </Link>
              <Link href="/admin/config" className={cn("flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors mb-0.5", isActive("/admin/config") ? "bg-primary-mid/20 text-primary" : "text-gray-500 hover:bg-gray-200")}>
                <Settings className="w-3.5 h-3.5" /><span>系统配置</span>
              </Link>
              <Link href="/admin/ips" className={cn("flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors mb-0.5", isActive("/admin/ips") ? "bg-primary-mid/20 text-primary" : "text-gray-500 hover:bg-gray-200")}>
                <FolderKanban className="w-3.5 h-3.5" /><span>IP 档案</span>
              </Link>
              <Link href="/admin/sessions" className={cn("flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors mb-0.5", isActive("/admin/sessions") ? "bg-primary-mid/20 text-primary" : "text-gray-500 hover:bg-gray-200")}>
                <KeyRound className="w-3.5 h-3.5" /><span>登录记录</span>
              </Link>
              <Link href="/admin/recharges" className={cn("flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors mb-0.5", isActive("/admin/recharges") ? "bg-primary-mid/20 text-primary" : "text-gray-500 hover:bg-gray-200")}>
                <Coins className="w-3.5 h-3.5" /><span>充值记录</span>
              </Link>
              <Link href="/admin/logs" className={cn("flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors mb-0.5", isActive("/admin/logs") ? "bg-primary-mid/20 text-primary" : "text-gray-500 hover:bg-gray-200")}>
                <FileText className="w-3.5 h-3.5" /><span>操作日志</span>
              </Link>
            </>
          )}
        </div>
      )}

      {/* User info */}
      <div className={cn(
        "border-t border-gray-200",
        sidebarCollapsed ? "px-2 py-3" : "px-3 py-3"
      )}>
        {sidebarCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
              {user.name?.[0]}
            </div>
            <button
              onClick={onLogout}
              className="text-[10px] text-gray-400 hover:text-red-500 transition-colors"
            >
              退出
            </button>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  )
}
