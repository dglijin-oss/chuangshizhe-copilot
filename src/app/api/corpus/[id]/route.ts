import { NextRequest, NextResponse } from "next/server";
import { getSessionUserOrThrow } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUserOrThrow();
  const { id } = await params;

  const entry = await prisma.corpusEntry.findFirst({
    where: {
      id,
      profile: { userId: user.id },
    },
  });

  if (!entry) {
    return NextResponse.json({ error: "无权操作" }, { status: 403 });
  }

  await prisma.corpusEntry.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
