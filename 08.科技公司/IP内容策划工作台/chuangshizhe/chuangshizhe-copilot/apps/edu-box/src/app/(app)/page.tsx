"use client"

import { useContext } from "react"
import { UserContext } from "@/lib/user-context"
import { BookOpen, Users, Backpack, FileText, ClipboardList, Building2 } from "lucide-react"
import Link from "next/link"

const quickLinks = [
  { label: "教案管理", href: "/lesson-plans", icon: FileText, desc: "AI 生成教案、查看历史教案", color: "bg-blue-50 text-blue-600" },
  { label: "作业管理", href: "/homework", icon: ClipboardList, desc: "布置作业、查看提交情况", color: "bg-green-50 text-green-600" },
  { label: "学情档案", href: "/profiles", icon: Users, desc: "学生学情和心理档案", color: "bg-purple-50 text-purple-600" },
  { label: "AI 对话", href: "/ai-chat", icon: BookOpen, desc: "与 8 大智能体协同工作", color: "bg-orange-50 text-orange-600" },
  { label: "学校管理", href: "/schools", icon: Building2, desc: "学校信息和教师管理", color: "bg-cyan-50 text-cyan-600" },
  { label: "研学项目", href: "/tours", icon: Backpack, desc: "研学产品和报名管理", color: "bg-pink-50 text-pink-600" },
]

export default function DashboardPage() {
  const user = useContext(UserContext)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-900">
          你好，{user?.name}
        </h1>
        <p className="text-sm text-gray-500 mt-1">欢迎使用启明盒子教育 AI 协同平台</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">教案总数</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">作业总数</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-green-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">学生总数</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">研学产品</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
            <div className="w-10 h-10 bg-pink-50 rounded-lg flex items-center justify-center">
              <Backpack className="w-5 h-5 text-pink-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <h2 className="text-base font-bold text-gray-900 mb-4">快捷入口</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickLinks.map((link) => {
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              className="bg-white rounded-xl border border-gray-200 p-5 card-hover block"
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${link.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">{link.label}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{link.desc}</p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Empty state hint */}
      <div className="mt-8 bg-primary-light rounded-xl p-6 border border-primary-mid/10">
        <h3 className="text-sm font-bold text-primary mb-2">开始使用启明盒子</h3>
        <p className="text-xs text-primary-mid">
          首先前往「学校管理」添加学校信息，然后就可以在「AI 协同平台」中生成教案、布置作业了。
          研学项目管理需要先配置研学产品，再接受学生报名。
        </p>
      </div>
    </div>
  )
}
