import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prismaIp } from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

const TEMP_DIR = join(process.cwd(), ".tmp", "uploads")

async function ensureTempDir() {
  if (!existsSync(TEMP_DIR)) {
    await mkdir(TEMP_DIR, { recursive: true })
  }
}

/**
 * POST /api/corpus-feed/upload — async file upload.
 * Files are saved to a temp directory and DB records created with status="pending".
 * Returns immediately — frontend then calls /api/corpus-feed/process to trigger extraction.
 */
export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  await ensureTempDir()

  const formData = await req.formData()
  const files = formData.getAll("files") as File[]
  const ipId = formData.get("ipId") as string | null

  if (files.length === 0) {
    return NextResponse.json({ error: "没有文件" }, { status: 400 })
  }

  const MAX_SIZE = 5 * 1024 * 1024 // 5MB

  const feeds: { id: string; fileName: string; status: string }[] = []

  for (const file of files) {
    if (file.size > MAX_SIZE) {
      feeds.push({ id: "", fileName: file.name, status: "rejected" })
      continue
    }

    // Save file to temp directory
    const fileId = `${user.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const tempPath = join(TEMP_DIR, fileId)
    const bytes = await file.arrayBuffer()
    await writeFile(tempPath, Buffer.from(bytes))

    // Create DB record (suggestion field stores temp path for processing)
    const feed = await prismaIp.corpusFeed.create({
      data: {
        userId: user.id,
        ipId: ipId || null,
        feedType: "file",
        fileName: file.name,
        title: file.name,
        content: null,
        suggestion: tempPath,
        status: "pending",
      },
    })

    feeds.push({ id: feed.id, fileName: feed.fileName!, status: feed.status })
  }

  return NextResponse.json({ feeds })
}

/**
 * GET /api/corpus-feed/upload — check status of recent uploads.
 */
export async function GET(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const ipId = searchParams.get("ipId")

  const where: any = { userId: user.id }
  if (ipId) where.ipId = ipId

  const feeds = await prismaIp.corpusFeed.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      fileName: true,
      title: true,
      status: true,
      content: true,
      suggestion: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ feeds })
}
