import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserOrThrow } from "@/lib/auth";

async function verifyOwnership(scriptId: string, userId: string) {
  return prisma.script.findFirst({
    where: { id: scriptId, profile: { userId } },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUserOrThrow();
  const { id } = await params;

  const script = await verifyOwnership(id, user.id);
  if (!script) {
    return NextResponse.json({ error: "脚本不存在" }, { status: 404 });
  }

  return NextResponse.json(script);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUserOrThrow();
  const { id } = await params;
  const body = await req.json();

  const script = await verifyOwnership(id, user.id);
  if (!script) {
    return NextResponse.json({ error: "脚本不存在" }, { status: 404 });
  }

  const updated = await prisma.script.update({
    where: { id },
    data: {
      ...(body.content !== undefined ? { content: body.content } : {}),
      ...(body.version !== undefined ? { version: body.version } : {}),
      ...(body.isSavedToKnowledge !== undefined ? { isSavedToKnowledge: body.isSavedToKnowledge } : {}),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUserOrThrow();
  const { id } = await params;

  const script = await verifyOwnership(id, user.id);
  if (!script) {
    return NextResponse.json({ error: "脚本不存在" }, { status: 404 });
  }

  await prisma.script.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
