import { z } from "zod"

export function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  try {
    return schema.parse(body)
  } catch (err) {
    if (err instanceof z.ZodError) {
      const messages = err.issues.map((e) => e.message || `${e.path.join(".")} 校验失败`).join("；")
      throw new Error(messages)
    }
    throw err
  }
}

export const loginSchema = z.object({
  phone: z.string().min(1, "手机号不能为空"),
  password: z.string().min(1, "密码不能为空"),
})

export const registerSchema = z.object({
  phone: z.string().min(1, "手机号不能为空"),
  password: z.string().min(6, "密码至少6位"),
  name: z.string().min(1, "姓名不能为空"),
})
