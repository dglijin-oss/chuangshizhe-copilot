import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import mammoth from "mammoth"

async function extractText(file: File): Promise<string> {
  const bytes = await file.arrayBuffer()
  const ext = file.name.split(".").pop()?.toLowerCase()

  switch (ext) {
    case "docx": {
      const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) })
      return result.value
    }
    case "doc": {
      throw new Error("不支持 .doc 格式，请将文件另存为 .docx 后上传")
    }
    case "pdf": {
      const { PDFParse } = await import("pdf-parse")
      const parser = new PDFParse({ data: new Uint8Array(bytes) })
      const data = await parser.getText()
      await parser.destroy()
      return data.text
    }
    case "ppt": {
      throw new Error("不支持 .ppt 格式，请将文件另存为 .pptx 后上传")
    }
    case "pptx": {
      // PPTX 也是 ZIP+XML 结构，用 mammoth 尝试提取
      const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) })
      return result.value || ""
    }
    case "txt":
    case "md": {
      return new TextDecoder().decode(bytes)
    }
    default:
      throw new Error(`不支持 .${ext} 格式`)
  }
}

// POST /api/corpus-feed/upload - accept file(s), extract text server-side, return text
// Files are NOT persisted — text is extracted and returned for immediate analysis.
export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const formData = await req.formData()
  const files = formData.getAll("files") as File[]

  if (files.length === 0) {
    return NextResponse.json({ error: "没有文件" }, { status: 400 })
  }

  const MAX_SIZE = 5 * 1024 * 1024 // 5MB

  const results: { fileName: string; text: string; error?: string }[] = []

  for (const file of files) {
    try {
      if (file.size > MAX_SIZE) {
        throw new Error("文件超过 5MB，请压缩后重试")
      }
      const text = await extractText(file)
      results.push({ fileName: file.name, text })
    } catch (err: any) {
      results.push({ fileName: file.name, text: "", error: err.message })
    }
  }

  return NextResponse.json({ files: results })
}
