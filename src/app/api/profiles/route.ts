import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserOrThrow } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUserOrThrow();

  const profiles = await prisma.iPProfile.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(profiles.map((p: any) => ({
    id: p.id,
    name: p.name,
    founder: p.founder,
    personas: JSON.parse(p.personas || "[]"),
    personaExtra: p.personaExtra,
    industry: p.industry,
    products: JSON.parse(p.products || "[]"),
    customers: JSON.parse(p.customers || "[]"),
    customerExtra: p.customerExtra,
    goals: JSON.parse(p.goals || "[]"),
    goalExtra: p.goalExtra,
    forbidden: JSON.parse(p.forbidden || "[]"),
    forbiddenExtra: p.forbiddenExtra,
    mix: { traffic: p.mixTraffic, persona: p.mixPersona, product: p.mixProduct },
    createdAt: p.createdAt.toISOString(),
  })));
}

export async function POST(req: NextRequest) {
  const user = await getSessionUserOrThrow();
  const body = await req.json();

  const profile = await prisma.iPProfile.create({
    data: {
      userId: user.id,
      name: body.name || "未命名 IP",
      founder: body.founder || "",
      personas: JSON.stringify(body.personas || []),
      personaExtra: body.personaExtra || "",
      industry: body.industry || "",
      products: JSON.stringify(body.products || []),
      customers: JSON.stringify(body.customers || []),
      customerExtra: body.customerExtra || "",
      goals: JSON.stringify(body.goals || []),
      goalExtra: body.goalExtra || "",
      forbidden: JSON.stringify(body.forbidden || []),
      forbiddenExtra: body.forbiddenExtra || "",
      mixTraffic: body.mix?.traffic ?? 4,
      mixPersona: body.mix?.persona ?? 2,
      mixProduct: body.mix?.product ?? 1,
    },
  });

  return NextResponse.json({
    id: profile.id,
    name: profile.name,
    founder: profile.founder,
    personas: JSON.parse(profile.personas || "[]"),
    personaExtra: profile.personaExtra,
    industry: profile.industry,
    products: JSON.parse(profile.products || "[]"),
    customers: JSON.parse(profile.customers || "[]"),
    customerExtra: profile.customerExtra,
    goals: JSON.parse(profile.goals || "[]"),
    goalExtra: profile.goalExtra,
    forbidden: JSON.parse(profile.forbidden || "[]"),
    forbiddenExtra: profile.forbiddenExtra,
    mix: { traffic: profile.mixTraffic, persona: profile.mixPersona, product: profile.mixProduct },
    createdAt: profile.createdAt.toISOString(),
  }, { status: 201 });
}
