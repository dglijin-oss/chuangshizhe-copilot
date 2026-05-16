import { NextRequest, NextResponse } from "next/server";
import { getSessionUserOrThrow } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import mammoth from "mammoth";

const ALLOWED_TYPES = [".txt", ".md", ".json", ".csv", ".docx", ".pdf"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_CONTENT_LENGTH = 30000;

const FILE_TYPE_MAP: Record<string, string> = {
  ".txt": "script",
  ".md": "script",
  ".docx": "script",
  ".pdf": "interview",
  ".json": "account",
  ".csv": "other",
};

async function extractText(file: File, ext: string): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());

  switch (ext) {
    case ".txt":
    case ".md":
    case ".json":
    case ".csv":
      return file.text();
    case ".docx":
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    case ".pdf": {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      const pdfResult = await parser.getText();
      return pdfResult.text;
    }
    default:
      throw new Error(`不支持的文件格式: ${ext}`);
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUserOrThrow();

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const profileId = formData.get("profileId") as string;
  const fileType = (formData.get("fileType") as string) || "";

  if (!file || !profileId) {
    return NextResponse.json({ error: "缺少文件或 profileId" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "文件大小不能超过 10MB" }, { status: 400 });
  }

  // 验证 profile 归属
  const profile = await prisma.iPProfile.findFirst({
    where: { id: profileId, userId: user.id },
  });
  if (!profile) {
    return NextResponse.json({ error: "无权访问该 IP 档案" }, { status: 403 });
  }

  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  if (!ALLOWED_TYPES.includes(ext)) {
    return NextResponse.json({ error: `不支持的文件格式，支持: ${ALLOWED_TYPES.join(", ")}` }, { status: 400 });
  }

  try {
    let fileContent = await extractText(file, ext);

    // 截断超长内容
    if (fileContent.length > MAX_CONTENT_LENGTH) {
      fileContent = fileContent.slice(0, MAX_CONTENT_LENGTH) + "\n...（内容已截断）";
    }

    const entry = await prisma.corpusEntry.create({
      data: {
        profileId,
        fileName: file.name,
        fileType: fileType || FILE_TYPE_MAP[ext] || "other",
        fileSize: file.size,
        fileContent,
        status: "pending",
      },
    });

    return NextResponse.json({
      ...entry,
      tags: [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "文件解析失败" }, { status: 500 });
  }
}
