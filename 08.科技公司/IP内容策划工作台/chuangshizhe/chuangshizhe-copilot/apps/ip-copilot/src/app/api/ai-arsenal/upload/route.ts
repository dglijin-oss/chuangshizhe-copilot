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
    case "doc":
      throw new Error("不支持 .doc 格式，请另存为 .docx")
    case "pdf": {
      const { PDFParse } = await import("pdf-parse")
      const parser = new PDFParse({ data: new Uint8Array(bytes) })
      const data = await parser.getText()
      await parser.destroy()
      return data.text
    }
    case "ppt":
      throw new Error("不支持 .ppt 格式，请另存为 .pptx")
    case "pptx": {
      const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) })
      return result.value || ""
    }
    case "txt":
    case "md":
    case "csv": {
      return new TextDecoder().decode(bytes)
    }
    case "xlsx":
    case "xls": {
      const { read } = await import("xlsx")
      const wb = read(bytes, { type: "buffer", cellText: true })
      return wb.SheetNames.map((name) => {
        const sheet = wb.Sheets[name]
        if (!sheet) return ""
        return `## ${name}\n${sheet["!data"] ? "" : ""}`
      }).join("\n")
    }
    default:
      throw new Error(`不支持 .${ext} 格式`)
  }
}

// POST /api/ai-arsenal/upload - extract text from file, do NOT persist
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
      results.push({ fileName: file.name, text: text.slice(0, 10000) }) // cap at 10k chars
    } catch (err: any) {
      results.push({ fileName: file.name, text: "", error: err.message })
    }
  }

  return NextResponse.json({ files: results })
}
