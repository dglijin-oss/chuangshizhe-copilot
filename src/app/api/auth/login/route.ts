import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { getCreditBalance, addCredit } from "@/lib/credits";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "用户名和密码不能为空" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return NextResponse.json({ error: "用户名或密码不正确" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "用户名或密码不正确" }, { status: 401 });
    }

    const balance = await getCreditBalance(user.id);
    if (balance <= 0) {
      await addCredit(user.id, parseInt(process.env.DAILY_AI_CREDITS || "10", 10), "daily_reset");
    }

    await createSession(user.id);

    return NextResponse.json({
      user: { id: user.id, username: user.username, name: user.name, role: user.role },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "登录失败" }, { status: 500 });
  }
}
