import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prismaIp } from "@/lib/prisma"

/**
 * Resolve agent identifier to database ID.
 * Returns:
 *   - { found: true, id: string } when agentId is provided and resolved
 *   - { found: false } when no agentId is provided (project assistant)
 * Throws error when agentId is provided but cannot be resolved
 */
async function resolveAgentIdOrFail(rawAgentId: string | undefined): Promise<{ found: true; id: string } | { found: false }> {
  if (!rawAgentId) return { found: false }

  // Decode URL-encoded agentId (e.g. seed-%E5%85%AB%E6%99%BA... → seed-八智破局官)
  let agentId: string
  try {
    agentId = decodeURIComponent(rawAgentId)
  } catch {
    agentId = rawAgentId
  }

  let lookupId: string = agentId
  // Seed ID pattern: "seed-<name>"
  if (agentId.startsWith("seed-")) {
    const name = agentId.replace("seed-", "")
    const agent = await prismaIp.agent.findFirst({
      where: { name, isActive: true },
    })
    if (!agent) {
      throw new Error(`智能体 "${name}" 不存在或已下线`)
    }
    lookupId = agent.id
  }

  // Direct lookup to verify the agent exists and is active
  const agent = await prismaIp.agent.findFirst({
    where: { id: lookupId, isActive: true },
  })
  if (!agent) {
    throw new Error(`智能体 ID "${lookupId}" 无效`)
  }
  return { found: true, id: agent.id }
}

export async function GET(req: Request) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const rawAgentId = searchParams.get("agentId") || undefined
    const result = await resolveAgentIdOrFail(rawAgentId)

    // Distinguish: agentId not provided (project assistant) vs resolved (squad agent)
    const sessions = await prismaIp.chatSession.findMany({
      where: result.found
        ? { userId: user.id, agentId: result.id }
        : { userId: user.id, agentId: null },
      orderBy: { updatedAt: "desc" },
      take: 50,
    })

    return NextResponse.json({
      sessions: sessions.map((s) => ({
        id: s.id,
        title: s.title || "新对话",
        updatedAt: s.updatedAt,
      })),
    })
  } catch (err: any) {
    console.error("[ai-arsenal/sessions] GET error:", err)
    // If agent resolution fails, return empty sessions with error
    if (err.message && err.message.includes("智能体")) {
      return NextResponse.json({ error: err.message, sessions: [] }, { status: 404 })
    }
    return NextResponse.json({ error: "加载对话失败" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 })

    const { title, agentId: rawAgentId } = (await req.json()) as { title?: string; agentId?: string }
    const result = await resolveAgentIdOrFail(rawAgentId)

    const session = await prismaIp.chatSession.create({
      data: {
        userId: user.id,
        title: title || "新对话",
        agentId: result.found ? result.id : null,
      },
    })

    return NextResponse.json({ session: { id: session.id, title: session.title, updatedAt: session.updatedAt, agentId: session.agentId } })
  } catch (err: any) {
    console.error("[ai-arsenal/sessions] POST error:", err)
    if (err.message && err.message.includes("智能体")) {
      return NextResponse.json({ error: err.message }, { status: 404 })
    }
    return NextResponse.json({ error: "创建对话失败: " + (err.message || err) }, { status: 500 })
  }
}
