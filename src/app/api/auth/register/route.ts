import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { getDailyQuota, addCredit } from "@/lib/credits";

export async function POST(req: NextRequest) {
  try {
    const { username, password, name } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "用户名和密码不能为空" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "密码至少 6 位" }, { status: 400 });
    }

    if (username.length < 2 || username.length > 20) {
      return NextResponse.json({ error: "用户名长度为 2-20 个字符" }, { status: 400 });
    }

    // 只允许中文、英文字母、数字
    const usernameRegex = /^[一-龥a-zA-Z0-9]+$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json({ error: "用户名只能包含中文、英文字母和数字" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: "该用户名已注册" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const isAdmin = username === process.env.ADMIN_USERNAME;

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        name: name || username,
        role: isAdmin ? "ADMIN" : "USER",
      },
    });

    await addCredit(user.id, getDailyQuota(), "daily_reset");

    await createSession(user.id);

    return NextResponse.json({
      user: { id: user.id, username: user.username, name: user.name, role: user.role },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "注册失败" }, { status: 500 });
  }
}
