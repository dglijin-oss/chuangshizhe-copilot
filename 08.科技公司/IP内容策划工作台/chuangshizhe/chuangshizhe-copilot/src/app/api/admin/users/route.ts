import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"

// GET /api/admin/users - list all users
export async function GET() {
  const admin = await getSessionUser()
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "无权限" }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      phone: true,
      role: true,
      points: true,
      createdAt: true,
      _count: {
        select: {
          ips: true,
          questionnaires: true,
          pointsRecharges: true,
          generationLogs: true,
        },
      },
    },
  })

  return NextResponse.json({ users })
}

// PATCH /api/admin/users/[id] - edit user
export async function PATCH(req: Request) {
  const admin = await getSessionUser()
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "无权限" }, { status: 403 })
  }

  const url = new URL(req.url)
  const id = url.pathname.split("/").pop()
  if (!id) return NextResponse.json({ error: "参数错误" }, { status: 400 })

  const body = await req.json()
  const { name, role, points } = body

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(role !== undefined && { role }),
        ...(points !== undefined && { points }),
      },
      select: { id: true, name: true, phone: true, role: true, points: true },
    })

    return NextResponse.json({ user: updated })
  } catch {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 })
  }
}

// DELETE /api/admin/users/[id] - delete user
export async function DELETE(req: Request) {
  const admin = await getSessionUser()
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "无权限" }, { status: 403 })
  }

  const url = new URL(req.url)
  const id = url.pathname.split("/").pop()
  if (!id) return NextResponse.json({ error: "参数错误" }, { status: 400 })

  try {
    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "删除失败" }, { status: 500 })
  }
}
