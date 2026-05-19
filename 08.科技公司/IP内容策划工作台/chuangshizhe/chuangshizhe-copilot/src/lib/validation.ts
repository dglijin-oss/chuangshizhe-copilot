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

// Auth schemas
export const loginSchema = z.object({
  phone: z.string().min(1, "手机号不能为空"),
  password: z.string().min(1, "密码不能为空"),
})

export const registerSchema = z.object({
  phone: z.string().min(1, "手机号不能为空"),
  password: z.string().min(6, "密码至少6位"),
  name: z.string().min(1, "姓名不能为空"),
})

// IP schemas
export const createIpSchema = z.object({
  name: z.string().min(1, "IP名称不能为空"),
  founderName: z.string().optional(),
  founderTraits: z.union([z.string(), z.array(z.string())]).optional(),
  industry: z.string().optional(),
  products: z.union([z.string(), z.array(z.string())]).optional(),
  targetClients: z.union([z.string(), z.array(z.string())]).optional(),
  accountGoals: z.union([z.string(), z.array(z.string())]).optional(),
  contentBan: z.union([z.string(), z.array(z.string())]).optional(),
  contentMixFlow: z.union([z.number(), z.string()]).optional(),
  contentMixPersona: z.union([z.number(), z.string()]).optional(),
  contentMixProduct: z.union([z.number(), z.string()]).optional(),
})

export const updateIpSchema = createIpSchema.partial()

// AI generation schemas
export const rewriteSchema = z.object({
  text: z.string().min(1, "原文不能为空"),
  section: z.enum(["title", "hook", "script", "description"]).optional(),
  ipId: z.string().optional(),
  direction: z.string().optional(),
})

export const articleSchema = z.object({
  topic: z.string().min(1, "主题不能为空"),
  keywords: z.string().optional(),
  platform: z.string().optional(),
  tone: z.string().optional(),
  length: z.string().optional(),
  targetQuestions: z.string().optional(),
  ipInfo: z.string().optional(),
  wikiContent: z.string().optional(),
})

export const topicsSchema = z.object({
  industry: z.string().min(1, "行业不能为空"),
  productDesc: z.string().optional(),
})

export const hotwordsSchema = z.object({
  coreWord: z.string().min(1, "核心词不能为空"),
  industry: z.string().optional(),
  region: z.string().optional(),
})

export const ipbriefSchema = z.object({
  description: z.string().min(1, "描述不能为空"),
})

// Weekly plan schemas
export const weeklyPlanGenerateSchema = z.object({
  userDirection: z.string().optional(),
})

export const weeklyPlanSaveSchema = z.object({
  items: z.array(z.object({
    contentType: z.enum(["traffic", "persona", "product"]),
    title: z.string().min(1),
    reason: z.string().min(1),
    generatedResult: z.any().optional(),
  })),
  userDirection: z.string().optional(),
})

// Knowledge schemas
export const knowledgeSourceSchema = z.object({
  title: z.string().min(1, "标题不能为空"),
  subtitle: z.string().optional(),
  content: z.string().optional(),
  sourceType: z.string().min(1, "来源类型不能为空"),
  ipId: z.string().optional(),
  fileName: z.string().optional(),
})

export const wikiPageSchema = z.object({
  title: z.string().min(1, "标题不能为空"),
  content: z.string().min(1, "内容不能为空"),
  category: z.enum(["ip_subpage", "trust_asset"]),
  sourceId: z.string().optional(),
  ipId: z.string().optional(),
})

export const recompileSchema = z.object({
  ipId: z.string().optional(),
})

// Corpus schemas
export const corpusAnalyzeSchema = z.object({
  content: z.string().min(1, "内容不能为空"),
})

export const corpusFeedSchema = z.object({
  ipId: z.string().optional(),
  feedType: z.string().min(1, "类型不能为空"),
  title: z.string().optional(),
  fileName: z.string().optional(),
  content: z.string().min(1, "内容不能为空"),
})

// Account memory schemas
export const createMemorySchema = z.object({
  ipId: z.string().optional(),
  category: z.enum(["fact_correction", "writing_preference", "expression_restriction", "customer_insight"]).optional(),
  content: z.string().min(1, "内容不能为空"),
})

export const updateMemorySchema = z.object({
  content: z.string().min(1, "内容不能为空"),
  category: z.enum(["fact_correction", "writing_preference", "expression_restriction", "customer_insight"]).optional(),
})

// Billing schema
export const rechargeSchema = z.object({
  amount: z.number().positive("金额必须大于0"),
  points: z.number().int().positive("积分必须为正整数"),
})

// Questionnaire schema
export const questionnaireSchema = z.object({
  // Add fields as needed
}).passthrough()

// Account logs schema
export const generationLogSchema = z.object({
  type: z.string().optional(),
  model: z.string().optional(),
  status: z.string().optional(),
  tokens: z.number().optional(),
  duration: z.number().optional(),
  cost: z.number().optional(),
  error: z.string().optional(),
})

// Weekly plan item update schema
export const weeklyPlanItemUpdateSchema = z.object({
  generatedResult: z.any().optional(),
})

// Context schema
export const contextSchema = z.object({
  purpose: z.string().optional(),
  ipId: z.string().optional(),
})

// Search schema
export const searchSchema = z.object({
  query: z.string().min(1, "搜索词不能为空"),
})
