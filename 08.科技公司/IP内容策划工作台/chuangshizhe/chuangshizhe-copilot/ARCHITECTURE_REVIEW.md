# chuangshizhe-copilot 架构评审与修复清单

> 生成时间：2026-05-19
> 最后更新：2026-05-19
> 状态：P0~P2 已修复，剩余 P1/P2/P3 待后续迭代

---

## P0 — 安全 & 数据一致性（必须优先）

### 1. 密码哈希用 SHA-256，不安全

- **文件**：`src/lib/auth.ts`（第 8-18 行）
- **问题**：当前用 SHA-256 + salt 做密码哈希，强度不够。`bcryptjs` 已在依赖中但未使用。
- **影响**：数据库一旦泄露，密码可被快速暴力破解。
- **修复**：改用 `bcrypt.hash()` / `bcrypt.compare()` 替换 SHA-256。

### 2. deductPoints 存在竞态条件

- **文件**：`src/lib/billing.ts`（第 7-16 行）
- **问题**：先 `user.find()` 读余额，再 `user.update()` 扣减。两个并发请求可以同时通过余额检查，导致积分变成负数。
- **影响**：恶意用户可并发请求绕过积分限制。
- **修复**：改用 Prisma 原子操作：
  ```ts
  const result = await prisma.user.updateMany({
    where: { id, points: { gte: amount } },
    data: { points: { decrement: amount } },
  })
  if (result.count === 0) throw new Error('积分不足')
  ```

### 3. 两个 POST /api/ip 路由冲突

- **文件**：`src/app/api/ip/route.ts` 和 `src/app/api/ip/list/route.ts`
- **问题**：两个文件都定义了 `POST /api/ip` 创建 IP，实现略有不同。
- **影响**：路由行为不可预测，维护容易遗漏。
- **修复**：保留 `src/app/api/ip/route.ts` 的 POST 处理器，删除 `src/app/api/ip/list/route.ts` 中的 POST 部分（只保留 GET）。

### 4. Admin 路由没有中间件拦截

- **文件**：`src/middleware.ts`
- **问题**：中间件只检查登录态，未拦截非 admin 用户访问 `/api/admin/*`。角色校验在各路由代码内做。
- **影响**：浪费 DB 查询、未授权请求到达业务层。
- **修复**：在中间件中对 `/api/admin/*` 路径做角色检查，非 admin 直接返回 403。

### 5. generatedResult 存为字符串而非 JSON

- **文件**：`prisma/schema.prisma`（第 215 行）
- **问题**：`generatedResult` 字段类型为 `String?`，存的是 JSON 字符串。
- **影响**：前端每次读取都要 `try/catch JSON.parse`（见 `item/[id]/page.tsx` 第 76-78 行、`api/history/route.ts` 第 48-50 行）。无法在数据库层查询子字段。
- **修复**：改为 `Json?` 类型，前端直接拿到对象，省去 parse。

---

## P1 — 架构 & 代码质量

### 6. rewrite 路由 direction 参数丢失

- **文件**：`src/app/api/ai/rewrite/route.ts`（第 63 行）
- **问题**：前端传了 `{ text, section, direction, ipId }`，但服务端只解构了 `{ text, section, ipId }`，`direction` 被忽略。
- **影响**：用户在改写面板输入的"怎么改"方向不会传给 AI，改成了盲改。
- **修复**：在 rewrite 路由中接收 `direction` 参数并拼入 prompt。

### 7. Zod 依赖未使用，手动校验不统一

- **涉及**：全部 API 路由
- **问题**：`zod@4.4.3` 在 `package.json` 但从未被导入。所有路由用 `if (!field)` 手动检查。
- **影响**：错误信息格式不统一、无法从 schema 推导类型、新增字段容易遗漏校验。
- **修复**：为每个路由定义 Zod schema，用 `schema.safeParse(req.body)` 统一校验。

### 8. logGeneration 函数在 8 个路由中复制

- **涉及路由**：
  - `src/app/api/ai/article/route.ts`
  - `src/app/api/ai/ipbrief/route.ts`
  - `src/app/api/ai/topics/route.ts`
  - `src/app/api/ai/hotwords/route.ts`
  - `src/app/api/ai/rewrite/route.ts`
  - `src/app/api/ip/[id]/weekly-plan/route.ts`
  - `src/app/api/account-knowledge/recompile/route.ts`
  - `src/app/api/corpus-feed/analyze/route.ts`
- **问题**：同一段 `logGeneration` 函数复制了 8 份。
- **修复**：抽到 `src/lib/logging.ts` 共享模块，所有路由 import 使用。

### 9. API 路由 REST 风格不一致

- **涉及**：多个路由
- **问题**：DELETE 操作有的用查询参数 `?id=`（如 `api/geo/rules`），有的用路径参数 `[id]`（如 `api/admin/users/[id]`）。同一个资源用不同方式定位。
- **修复**：统一规范——单资源用路径参数（`/api/resource/[id]`），集合操作带 query params（`/api/resource?status=active`）。

### 10. update-overview 通过 HTTP fetch 调自己

- **文件**：`src/app/api/account-knowledge/recompile/route.ts`（第 111-116 行）
- **问题**：编译完成后用 `fetch(NEXT_PUBLIC_BASE_URL + "/api/account-knowledge/update-overview")` 触发概述更新，走了完整 HTTP 栈。
- **影响**：依赖环境变量正确配置；容器/代理环境下 URL 可能不可达。
- **修复**：将 update-overview 的核心逻辑抽成 `src/lib/overview.ts` 共享函数，直接调用。

### 11. IP 档案数组存为逗号分隔字符串

- **文件**：`src/app/api/ip/list/route.ts`（第 42-47 行）
- **问题**：`founderTraits`、`products`、`targetClients`、`accountGoals`、`contentBan` 等数组字段存为逗号分隔字符串。
- **影响**：无法按产品/标签搜索 IP；值本身含逗号会解析错误。
- **修复**：改用 PostgreSQL JSONB 数组（Prisma `Json` 类型），或使用独立关联表。

### 12. 首页 page.tsx 重复了整个 layout

- **文件**：`src/app/page.tsx`
- **问题**：首页不在 `(app)` 路由组内，自己重复了 sidebar、header、问卷弹窗等全部 layout 代码。
- **影响**：两套 auth 检查逻辑、两套 sidebar 代码，违反 DRY。
- **修复**：将首页移入 `(app)` 路由组（如 `src/app/(app)/home/page.tsx` 或保持 `src/app/(app)/page.tsx`），复用 `AppLayout`。

---

## P2 — 性能优化

### 13. fetchKnowledgeContext 4 次串行数据库查询

- **文件**：`src/lib/knowledge.ts`（第 36-61 行）
- **问题**：ipMemories → accountMemories → ipWikiPages → accountWikiPages 依次串行查询。4 个查询互相独立。
- **修复**：改用 `Promise.all([...])` 并行查询，减少延迟。

### 14. Dashboard stats 路由 10 次并行查询可合并

- **文件**：`src/app/api/dashboard/stats/route.ts`（第 25-59 行）
- **问题**：`articleTotal` 和 `articleRecent7d` 等可以合并为一个查询加条件过滤。
- **修复**：用单次聚合查询替代多次独立查询。

### 15. 更新 overview 时 N+1 循环操作

- **文件**：`src/app/api/account-knowledge/update-overview/route.ts`（第 102-163 行）
- **问题**：对每个 IP 执行最多 6 次串行 DB 操作（查 wiki → 查 source → 删重复 → 更新 wiki → 更新 source）。
- **修复**：用 `Promise.all()` 批量操作，Prisma `upsert` 替代 find+create。

### 16. 前端全部 "use client"，无服务端渲染

- **涉及**：所有页面组件
- **问题**：所有页面都是客户端组件，`useEffect` + `fetch` 每次页面加载都直接打数据库。
- **影响**：无缓存、无 ISR、首屏加载慢。
- **修复**：逐步将数据获取部分改为 React Server Components（RSC），客户端只负责交互。

---

## P3 — 可扩展性 & 运维

### 17. AI 端点无频率限制

- **涉及**：所有 `/api/ai/*` 路由
- **问题**：用户可无限并发调用 AI 接口，无冷却、无并发上限。
- **影响**：积分可能被快速耗尽；API 费用不可控。
- **修复**：加中间件级别限频（基于用户 ID 的滑动窗口，如每分钟最多 10 次 AI 请求）。

### 18. 计费系统不完整

- **文件**：`src/app/api/billing/recharge/route.ts`
- **问题**：只创建 `pending` 状态的订单，无支付网关对接（微信支付未实现）。积分需管理员手动调整。
- **修复**：对接微信支付或支付宝，支付回调自动更新订单状态和积分。

### 19. 单 AI 模型硬编码，无降级

- **文件**：`src/lib/llm.ts`（第 8 行）
- **问题**：`MODEL = "qwen3.6-plus"` 写死。模型不可用时整个 App 瘫痪。
- **修复**：从环境变量或数据库读取模型配置，支持主备模型切换。

### 20. 无环境变量启动校验

- **问题**：`DATABASE_URL`、`ALIYUN_API_KEY` 缺失时不会在启动时报错，而是首次使用时 runtime 崩溃。
- **修复**：在 `src/lib/env.ts` 中用 Zod 校验环境变量，启动失败时给出明确提示。

### 21. 无软删除机制

- **涉及**：所有 DELETE 操作
- **问题**：全部硬删除，数据不可恢复。
- **修复**：关键字段（用户、IP、知识库、策划）加 `deletedAt` 时间戳，查询时过滤 `where: { deletedAt: null }`。

### 22. 文件上传同步处理

- **文件**：`src/app/api/corpus-feed/upload/route.ts`（第 58-68 行）
- **问题**：文件逐个同步处理，大文件或多文件会阻塞请求直到超时。
- **修复**：上传后入队后台处理，前端轮询或 WebSocket 通知完成状态。

### 23. cleanup 路由用标题启发式删除

- **文件**：`src/app/api/account-knowledge/cleanup/route.ts`（第 11-22 行）
- **问题**：删除标题含 `[` 或 `【` 的 wiki 页面来清理"脏数据"。
- **影响**：治标不治本，正常标题也可能被误删。
- **修复**：修复保存页面的标题来源，从源头避免脏数据。

---

## 修复进度

| 序号 | 优先级 | 问题 | 状态 |
|------|--------|------|------|
| 1 | P0 | 密码哈希改用 bcrypt | ✅ 已修复 |
| 2 | P0 | deductPoints 竞态条件 | ✅ 已修复 |
| 3 | P0 | 重复 POST /api/ip 路由 | ✅ 已修复 |
| 4 | P0 | Admin 中间件拦截 | ✅ 已修复 |
| 5 | P0 | generatedResult 改 Json 类型 | ✅ 已修复 |
| 6 | P1 | rewrite direction 参数丢失 | ✅ 已修复 |
| 7 | P1 | Zod 统一校验 | ✅ 已修复 |
| 8 | P1 | logGeneration 抽取共享 | ✅ 已修复 |
| 9 | P1 | REST 风格统一 | ⏸ 前端已用 query params，暂保持 |
| 10 | P1 | update-overview HTTP 调用改直接调用 | ✅ 已修复 |
| 11 | P1 | IP 数组字段改 JSONB | 待修复（需 DB 迁移） |
| 12 | P1 | 首页 layout 复用 | 待修复 |
| 13 | P2 | fetchKnowledgeContext 并行查询 | ✅ 已修复 |
| 14 | P2 | Dashboard stats 查询合并 | ✅ 已用 Promise.all |
| 15 | P2 | update-overview N+1 优化 | ✅ 已修复 |
| 16 | P2 | 逐步引入 RSC | 待修复 |
| 17 | P3 | AI 端点限频 | 待修复 |
| 18 | P3 | 支付网关对接 | 待修复 |
| 19 | P3 | 模型降级方案 | 待修复 |
| 20 | P3 | 环境变量启动校验 | 待修复 |
| 21 | P3 | 软删除机制 | 待修复 |
| 22 | P3 | 文件上传异步化 | 待修复 |
| 23 | P3 | cleanup 根因修复 | 待修复 |

## 新增共享模块

本次修复新增/优化了以下共享模块：

| 模块 | 路径 | 说明 |
|------|------|------|
| logging | `src/lib/logging.ts` | 统一 AI 生成日志记录函数 |
| validation | `src/lib/validation.ts` | Zod schema 统一校验所有 API 路由 |
| knowledge-overview | `src/lib/knowledge-overview.ts` | 知识库总览更新逻辑，消除 HTTP 自调用 |
| knowledge | `src/lib/knowledge.ts` | 优化为 Promise.all 并行查询 |


系统架构评审，给出你专业建议给我，看哪里要优化。

热词关联  生成的生 成矩阵热词前端没有地方显示记录，刷新了就找不到了，后面无法调用。

管理所有 IP 的人设档案页面   增加删除ip功能！删除ip后这个ip所生产的内容也要一并删除，不要留垃圾。

设置ai生成一次扣5积分。

管理员后台没有上传微信收款码入口，客户企鹅人金额生成订单后没法看到收款码
-----
完善软删除功能 文件上传异步化 


5-20

后续更新代码时：本地重新 npm run build → 重新打包 copilot-standalone.tar.gz → 上传到服务器 → 解压覆盖 → pm2 restart copilot。



我想加一个版块，ai智能采集系统，通过对接tikhub  获取b站。抖音，视频号，小红书，b站，快手等视频链接文案，获取后可以进行改写，或者可以写入ip账号记忆库，可选择写入那个ip账号数据库，每次采集扣除20积分（标明在读取按钮上）每次读取的时间看视频长度，改写扣除5积分，（标明在改写按钮上）



直接先做 B站 + 抖音  采集的时候不需要选择ip。


我查了资料，视频号是可以通过tikhub提取的
抖音	视频详情、用户信息、评论、热榜
TikTok	视频详情、用户信息、搜索
小红书	笔记详情、用户信息、商品、热榜
B站	视频详情、用户信息、字幕
快手	视频详情、热榜、购物榜
Twitter/X		推文详情、用户信息
Instagram		帖子、用户信息
YouTube		视频详情、评论、字幕
微博		博文详情、用户信息
Lemon8		帖子详情