import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prismaIp } from "@/lib/prisma"
import { readFileSync, unlinkSync, existsSync } from "fs"
import mammoth from "mammoth"

async function extractTextFromPath(filePath: string, fileName: string): Promise<string> {
  const ext = fileName.split(".").pop()?.toLowerCase()
  const buffer = readFileSync(filePath)

  switch (ext) {
    case "docx": {
      const result = await mammoth.extractRawText({ buffer })
      return result.value
    }
    case "doc": {
      throw new Error("不支持 .doc 格式，请将文件另存为 .docx 后上传")
    }
    case "pdf": {
      const { PDFParse } = await import("pdf-parse")
      const parser = new PDFParse({ data: new Uint8Array(buffer) })
      const data = await parser.getText()
      await parser.destroy()
      return data.text
    }
    case "pptx": {
      const result = await mammoth.extractRawText({ buffer })
      return result.value || ""
    }
    case "txt":
    case "md": {
      return buffer.toString("utf-8")
    }
    default:
      throw new Error(`不支持 .${ext} 格式`)
  }
}

/**
 * POST /api/corpus-feed/process — process all pending corpus feeds.
 * Reads temp files, extracts text, updates DB, and cleans up temp files.
 */
export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const pending = await prismaIp.corpusFeed.findMany({
    where: { userId: user.id, status: "pending" },
    orderBy: { createdAt: "asc" },
    take: 10,
  })

  if (pending.length === 0) {
    return NextResponse.json({ processed: 0 })
  }

  const results: { id: string; fileName: string; status: string; error?: string }[] = []

  for (const feed of pending) {
    if (!feed.suggestion || !feed.fileName) {
      await prismaIp.corpusFeed.update({
        where: { id: feed.id },
        data: { status: "error", suggestion: "文件信息缺失" },
      })
      results.push({ id: feed.id, fileName: feed.fileName || "", status: "error", error: "文件信息缺失" })
      continue
    }

    const tempPath = feed.suggestion

    try {
      if (!existsSync(tempPath)) {
        throw new Error("临时文件已过期")
      }

      const text = await extractTextFromPath(tempPath, feed.fileName)

      // Update with extracted text
      await prismaIp.corpusFeed.update({
        where: { id: feed.id },
        data: {
          content: text,
          status: "analyzed",
          suggestion: null, // clear temp path
        },
      })

      // Clean up temp file
      try {
        unlinkSync(tempPath)
      } catch {
        // ignore cleanup errors
      }

      results.push({ id: feed.id, fileName: feed.fileName, status: "analyzed" })
    } catch (err: any) {
      await prismaIp.corpusFeed.update({
        where: { id: feed.id },
        data: { status: "error", suggestion: err.message },
      })
      results.push({ id: feed.id, fileName: feed.fileName, status: "error", error: err.message })
    }
  }

  return NextResponse.json({ processed: results.length, results })
}

/**
 * GET /api/corpus-feed/process — check processing status of specific feeds.
 */
export async function GET(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const ids = searchParams.getAll("id")

  if (ids.length === 0) {
    return NextResponse.json({ feeds: [] })
  }

  const feeds = await prismaIp.corpusFeed.findMany({
    where: { id: { in: ids }, userId: user.id },
    select: { id: true, status: true, fileName: true, content: true, suggestion: true },
  })

  return NextResponse.json({ feeds })
}
