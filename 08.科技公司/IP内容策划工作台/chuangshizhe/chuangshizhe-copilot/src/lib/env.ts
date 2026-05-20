import { z } from "zod"

const envSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL 必须为有效的数据库连接字符串"),
  ALIYUN_API_KEY: z.string().min(1, "ALIYUN_API_KEY 不能为空"),
})

export const env = typeof process.env.SKIP_ENV_VALIDATION === "undefined"
  ? envSchema.parse(process.env)
  : (process.env as unknown as z.infer<typeof envSchema>)
