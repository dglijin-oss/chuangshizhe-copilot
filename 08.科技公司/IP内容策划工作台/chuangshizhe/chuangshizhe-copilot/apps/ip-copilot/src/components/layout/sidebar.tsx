"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import Image from "next/image"
import {
  LayoutDashboard,
  FolderOpen,
  Globe,
  BookOpen,
  Settings,
  Shield,
  FolderKanban,
  KeyRound,
  Coins,
  FileText,
  ChevronRight,
  ChevronDown,
  FilePlus,
  Hash,
  Send,
  FileCheck,
  BarChart3,
  Download,
  User,
  Archive,
  Bot,
  Image as ImageIcon,
  Video,
  Users,
  FolderCog,
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
      { label: "创建 IP", href: "/ip/create", icon: FilePlus },
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
      { label: "GEO 文章", href: "/geo/article", icon: FileText },
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
      { label: "AI 智能采集", href: "/scrape", icon: Download },
      { label: "账号知识库", href: "/assets/knowledge", icon: BookOpen },
      { label: "关键词库", href: "/assets/keywords", icon: Hash },
      { label: "接入配置", href: "/assets/integrations", icon: Settings },
    ],
  },
  {
    id: "ai-assistant",
    label: "AI 助手",
    icon: Bot,
    children: [
      { label: "项目助手", href: "/ai-arsenal/project", icon: FolderCog },
      { label: "图片生成", href: "/ai-arsenal/image", icon: ImageIcon },
      { label: "视频生成", href: "/ai-arsenal/video", icon: Video },
      { label: "AI 小队", href: "/ai-arsenal/squad", icon: Users },
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
      { label: "积分充值", href: "/account/recharge", icon: Coins },
      { label: "个人中心", href: "/account/profile", icon: User },
    ],
  },
]

const adminNavItems = [
  { label: "数据看板", href: "/admin/dashboard", icon: BarChart3 },
  { label: "用户管理", href: "/admin/users", icon: User },
  { label: "积分管理", href: "/admin/points", icon: Shield },
  { label: "系统配置", href: "/admin/config", icon: Settings },
  { label: "IP 档案", href: "/admin/ips", icon: FolderKanban },
  { label: "登录记录", href: "/admin/sessions", icon: KeyRound },
  { label: "充值记录", href: "/admin/recharges", icon: Coins },
  { label: "操作日志", href: "/admin/logs", icon: FileText },
]

/* ---- 3D Tilt Nav Item ---- */

function TiltNavItem({
  icon: Icon,
  label,
  href,
  active,
}: {
  icon: any
  label: string
  href: string
  active: boolean
}) {
  const [transform, setTransform] = useState("")
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 })

  const handleMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    const rotateX = (0.5 - y) * 6
    const rotateY = (x - 0.5) * 6
    setTransform(`perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`)
    setGlare({ x: x * 100, y: y * 100, opacity: 1 })
  }

  const handleLeave = () => {
    setTransform("")
    setGlare((g) => ({ ...g, opacity: 0 }))
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ease-out will-change-transform relative overflow-hidden",
        active
          ? "bg-primary text-white shadow-md shadow-primary/20"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-700",
      )}
      style={{ transform }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <Icon className={cn("w-4 h-4 shrink-0", active ? "text-white" : "")} />
      <span className="font-medium">{label}</span>
      {active && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" />}
      {active && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.15), transparent 60%)`,
            opacity: glare.opacity,
          }}
        />
      )}
    </Link>
  )
}

/* ---- Group Header ---- */

function GroupHeader({
  icon: Icon,
  label,
  isOpen,
  hasActive,
  onClick,
}: {
  icon: any
  label: string
  isOpen: boolean
  hasActive: boolean
  onClick: () => void
}) {
  const [transform, setTransform] = useState("")

  const handleMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    setTransform(`perspective(600px) rotateX(${(0.5 - y) * 4}deg) rotateY(${(x - 0.5) * 4}deg)`)
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ease-out will-change-transform",
        hasActive
          ? "bg-primary text-white"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-700",
      )}
      style={{ transform }}
      onMouseMove={handleMove}
      onMouseLeave={() => setTransform("")}
    >
      <div className="flex items-center gap-2.5">
        <Icon className="w-4 h-4" />
        <span className="font-medium">{label}</span>
      </div>
      {isOpen ? (
        <ChevronDown className="w-3.5 h-3.5" />
      ) : (
        <ChevronRight className="w-3.5 h-3.5" />
      )}
    </button>
  )
}

/* ---- Child Nav Item ---- */

function ChildNavItem({
  icon: Icon,
  label,
  href,
  active,
}: {
  icon: any
  label: string
  href: string
  active: boolean
}) {
  const [transform, setTransform] = useState("")

  const handleMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    setTransform(`perspective(600px) rotateX(${(0.5 - y) * 3}deg) rotateY(${(x - 0.5) * 3}deg)`)
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all duration-200 ease-out will-change-transform",
        active
          ? "bg-primary/10 text-primary font-semibold"
          : "text-gray-400 hover:bg-gray-100 hover:text-gray-600",
      )}
      style={{ transform }}
      onMouseMove={handleMove}
      onMouseLeave={() => setTransform("")}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
    </Link>
  )
}

/* ---- Admin Nav Item ---- */

function AdminNavItem({
  icon: Icon,
  label,
  href,
  active,
}: {
  icon: any
  label: string
  href: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors",
        active
          ? "bg-primary/10 text-primary font-semibold"
          : "text-gray-400 hover:bg-gray-100 hover:text-gray-600",
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
    </Link>
  )
}

export function Sidebar({
  user,
  onLogout,
}: {
  user: { name: string; points: number; role?: string }
  onLogout: () => void
}) {
  const isAdmin = user.role === "admin"
  const pathname = usePathname()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    content: false,
    geo: false,
    assets: false,
    account: false,
  })
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname === href || pathname.startsWith(href + "/")
  }

  // Remember expanded state
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-expanded")
    if (saved) {
      try {
        setExpanded(JSON.parse(saved))
      } catch {}
    }
  }, [])

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      localStorage.setItem("sidebar-expanded", JSON.stringify(next))
      return next
    })
  }

  return (
    <>
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed md:relative z-50 h-screen w-60 bg-white border-r border-gray-200 flex flex-col shrink-0 transition-transform duration-300",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Logo */}
        <div className="px-4 py-4 border-b border-gray-200">
          <Image src="/logo.png" alt="创世者Copilot" width={160} height={34} />
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto scrollbar-hide">
          {navGroups.map((group) => {
            if (group.single) {
              return (
                <TiltNavItem
                  key={group.id}
                  icon={group.icon}
                  label={group.label}
                  href={group.href}
                  active={isActive(group.href)}
                />
              )
            }

            const GroupIcon = group.icon!
            const isGroupOpen = expanded[group.id]
            const hasActiveChild = group.children!.some((c) => isActive(c.href))

            return (
              <div key={group.id} className="mb-1">
                <GroupHeader
                  icon={GroupIcon}
                  label={group.label}
                  isOpen={isGroupOpen}
                  hasActive={hasActiveChild}
                  onClick={() => toggle(group.id)}
                />

                {isGroupOpen && (
                  <div className="ml-4 mt-0.5 space-y-0.5">
                    {group.children!.map((child) => (
                      <ChildNavItem
                        key={child.href}
                        icon={child.icon}
                        label={child.label}
                        href={child.href}
                        active={isActive(child.href)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Admin Section */}
        {isAdmin && (
          <div className="px-2 py-2 border-t border-gray-200">
            <div className="flex items-center gap-2 px-3 py-1.5 mb-1">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] font-semibold text-primary tracking-wider">管理后台</span>
            </div>
            <div className="space-y-0.5">
              {adminNavItems.map((item) => (
                <AdminNavItem
                  key={item.href}
                  icon={item.icon}
                  label={item.label}
                  href={item.href}
                  active={isActive(item.href)}
                />
              ))}
            </div>
          </div>
        )}

        {/* User Info */}
        <div className="px-3 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{user.name}</span>
            <span className="text-primary font-semibold">{user.points} 积分</span>
          </div>
          <button
            onClick={onLogout}
            className="w-full text-xs text-gray-400 hover:text-red-500 transition-colors mt-1 text-left"
          >
            退出登录
          </button>
        </div>
      </aside>

      {/* Mobile menu button */}
      <button
        className="fixed top-3 left-3 z-50 md:hidden p-2 rounded-lg bg-white shadow-sm border border-gray-200"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        <LayoutDashboard className="w-5 h-5 text-gray-600" />
      </button>
    </>
  )
}
