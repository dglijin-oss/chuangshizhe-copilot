import { NextRequest, NextResponse } from "next/server";
import { getSessionUserOrThrow } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const user = await getSessionUserOrThrow();

  const body = await req.json();
  const { actions } = body;

  if (!actions || !Array.isArray(actions)) {
    return NextResponse.json({ error: "缺少 actions 数组" }, { status: 400 });
  }

  const results: any[] = [];

  for (const action of actions) {
    const { corpusId, action: actionType } = action;

    if (!corpusId || !["confirm", "reject"].includes(actionType)) {
      results.push({ corpusId, error: "参数无效" });
      continue;
    }

    // 验证归属
    const entry = await prisma.corpusEntry.findFirst({
      where: {
        id: corpusId,
        profile: { userId: user.id },
      },
    });

    if (!entry) {
      results.push({ corpusId, error: "无权操作" });
      continue;
    }

    await prisma.corpusEntry.update({
      where: { id: corpusId },
      data: { status: actionType === "confirm" ? "confirmed" : "rejected" },
    });

    results.push({ corpusId, status: actionType === "confirm" ? "confirmed" : "rejected" });
  }

  return NextResponse.json({ results });
}
