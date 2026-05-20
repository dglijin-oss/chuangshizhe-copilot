# 创世者 Copilot — IP 内容策划工作台

> AI 驱动的自媒体内容策划与管理系统，为 IP 账号提供从人设建立、选题策划、文章生成、热词矩阵到发布追踪的完整工作流。

**版本**: v1.0.5 (2026-05-18)

---

## v1.0.5 更新日志

### 新增
- **发布包生成页** (`/item/[id]`) — 点击周策划选题的"生成完整发布包"进入，AI 基于 IP 档案和知识库生成标题+钩子+口播脚本+简介+标签+发布建议，支持逐项编辑、AI 改写、一键复制
- **AI 改写接口** — `POST /api/ai/rewrite` 支持对标题钩子、口播脚本、简介标签、发布建议四个维度进行 AI 改写

### 修复
- **周策划页面导航** — 修复"生成完整发布包"按钮无跳转问题，点击后正确进入发布包页面

---

## v1.0.4 更新日志

### 修复
- **账号知识库页面重设计** — 完全对齐参考站布局：Wiki 页采用双栏（左侧页面列表+右侧 Markdown 编辑器/预览），导入资料采用双栏（左侧表单+右侧分析结果），标签页改为胶囊式切换
- **注册问卷自动同步知识库** — 提交问卷后自动生成"账号画像" Wiki 页面（overview 分类），写入编译日志

---

## v1.0.3 更新日志

### 新增
- **账号知识库系统** (`/assets/knowledge`) — 5 标签页完整工作流：Wiki 页面、原始来源、导入资料、全库搜索、编译日志
- **知识来源管理** — 支持 IP 档案自动同步、文本/文件导入、手动录入 4 种来源类型
- **Wiki 页面管理** — 支持新建/编辑/删除 Wiki 页面，3 种分类：总览、IP 子页、信任资产（Markdown 格式）
- **AI 知识库编译** — 点击「编译知识库」自动汇总所有知识来源，AI 生成结构化 Wiki 页面
- **全库搜索** — 跨 Wiki 页面和知识来源进行全文搜索，结果按类型分类展示
- **编译日志** — 完整记录所有知识操作事件（IP 创建、来源导入、Wiki 编译、页面更新/删除）
- **IP 创建自动同步** — 创建 IP 时自动生成 KnowledgeSource 和 WikiPage，写入编译日志

### API
- `GET /api/account-knowledge/overview` — 知识库统计概览（来源数/Wiki 数/IP 子页数/检索片段数）
- `GET/POST/PUT/DELETE /api/account-knowledge/wiki-pages` — Wiki 页面 CRUD
- `GET/POST/DELETE /api/account-knowledge/sources` — 知识来源 CRUD
- `POST /api/account-knowledge/import` — 导入资料（文本/文件/手动）
- `POST /api/account-knowledge/search` — 全库搜索
- `POST /api/account-knowledge/recompile` — AI 编译知识库
- `GET /api/account-knowledge/events` — 编译日志列表

### 数据库
- 新增 `KnowledgeSource` 模型（来源条目，支持 IP 档案/导入文件/导入文本/手动录入）
- 新增 `WikiPage` 模型（编译后的 Wiki 页面，Markdown 内容，3 种分类）
- 新增 `CompileEvent` 模型（编译事件日志，6 种动作类型）
- 总计 18 个数据库模型

---

## v1.0.2 更新日志

### 新增
- **周策划生成页** (`/ip/[id]/weekly-plan`) — 点击账号看板的"生成周策划"按钮进入，支持输入本周方向描述，AI 根据 IP 档案和知识库自动生成本周选题清单（按流量型/人设型/产品型配比）
- **周策划 API** — `GET/POST/PUT /api/ip/[id]/weekly-plan` 支持获取、AI 生成、保存周策划
- **单 IP 详情 API** — `GET /api/ip/[id]` 获取单个 IP 档案详情
- **WeeklyPlanItem 数据模型** — 独立的周策划条目表，支持按类型分类存储选题

### 修复
- **账号看板表格化** — 从卡片列表改为表格布局，新增 IP/行业/内容配比/周策划/最近更新/操作 6 列，操作列含"生成周策划"按钮

---

## v1.0.1 更新日志

### 修复
- **工作区总览页** — 4 个指标卡片、产出趋势柱状图、资产分布进度条、账号看板全部对接真实数据，不再硬编码为 0
- **发布归档页** — 修复 `GET /api/ip/list` 缺少 GET handler 导致的 405 错误，页面可正常加载 IP 列表
- **GEO 总览页** — 4 个统计卡片现在调用 `/api/geo/stats` 获取实时数据
- **GEO 文章页** — "资料完善度" 和 "知识库状态" 根据实际知识库条数动态显示；"套用生成规则" 下拉框从 `/api/geo/rules` 拉取真实规则列表
- **GEO 统计页** — "信任资产" 指标关联知识库实际条目数
- **积分充值页** — 新增 `POST /api/billing/recharge` 接口，支付按钮现在可创建订单并展示支付状态页
- **IP 创建页** — 补全 POST handler，支持从前端表单创建 IP 并保存到数据库

### 新增
- `GET /api/dashboard/stats` — 仪表盘聚合数据接口（指标、趋势、IP 列表）
- `POST /api/billing/recharge` — 充值订单创建接口
- `GET /api/billing/recharge` — 充值订单列表接口
- 工作区总览页 Hero Panel — 顶部品牌区含 GEO 工作台和发布归档快捷入口

---

## 系统架构

| 层级 | 技术 |
|------|------|
| 前端框架 | Next.js 16.2.6 (App Router + Turbopack) |
| 样式 | Tailwind CSS v4 |
| 数据库 | PostgreSQL (京东云 111.228.45.216) |
| ORM | Prisma v7.8.0 + @prisma/adapter-pg |
| AI 模型 | 阿里通义千问 qwen3.6-plus (DashScope Coding Plan) |
| AI SDK | Anthropic SDK（兼容 Anthropic 协议） |
| 认证 | Session + httpOnly Cookie |
| 部署 | 跨平台兼容 Windows / Ubuntu |

---

## 功能模块总览

### 1. 工作区总览 (`/`)
首页仪表盘，展示账号运营核心指标：
- **4 个指标卡片**：已生成文案数（含近 7 天数据）、周策划覆盖（已覆盖账号数）、IP 账号数（待策划数）、积分余额
- **产出趋势图**：近 7 天每日生成记录数的柱状图，有数据自动渲染
- **资产分布**：发布包、周策划、IP 账号的数值和进度条
- **账号看板**：最近 10 个 IP 账号列表，显示文案数和策划数；无数据时引导创建
- **快捷动作**：创建 IP、GEO 工作台、发布归档、积分充值
- **Hero Panel**：顶部品牌引导区，含 GEO 工作台和发布归档快捷按钮
- 新用户首次登录自动弹出问卷

### 2. 内容生产模块

#### 2.1 创建 IP (`/ip/create`)
建立 IP 账号的人设知识库，是整个系统的核心基础：
- **AI 自动填充**：用一段话描述 IP，AI 自动分析并提取行业、创始人特点、产品、目标客户、账号目标
- 手动选择：创始人人设特点、行业、产品服务、目标客户、账号目标、内容禁区
- 标签选择后填充至下方文本框，支持手动编辑补充
- 内容配比：流量型 / 人设型 / 产品型周内容条数
- 创建后自动保存到数据库，显示成功页面

#### 2.2 发布归档 (`/ip/archive`)
查看已创建的 IP 账号及其内容产出统计：
- 每个 IP 显示周策划数、文章数、发布数
- 无 IP 时引导创建

### 3. GEO 增长模块（核心工作流，7 步闭环）

#### 3.1 GEO 总览 (`/geo`)
- **4 个核心指标**（实时数据）：发布记录、已发布、AI 引用、信任资产
- 7 步工作流引导卡片（可点击跳转）
- 快捷入口：开始生成文章

#### 3.2 智能选题 + GEO 文章 (`/geo/article`)
核心内容创作页面，支持两种模式：

**AI 选题模式**：
- 输入行业/产品描述 → AI 生成 5 个选题
- 每个选题包含标题、关键词、问句
- 点击选题自动填入文章表单

**手动创作模式**：
- 文章类型选择：品宣文章 / 数据图表 / 榜单评测 / 攻略指南 / 深度专题 / 问答 QA / 客户案例
- 必填：文章主题、关键词、发布平台、目标问句
- 可选：语气风格（专业/亲和/幽默/权威/接地气）、目标字数（800/1200/1500/2000/3000字）
- **AI 生成** → 调用通义千问生成完整文章
- **保存数据库** → 文章保存到 GEO 文章表

**侧边栏**：
- 资料完善度：根据知识库条目数动态计算（每条 +20%，最高 100%）
- 知识库状态：显示当前知识库条目数
- 套用生成规则：下拉选择已配置的规则模板

#### 3.3 热词关联 (`/geo/hotwords`)
SEO 关键词矩阵生成器：
- 输入：核心词 + 行业 + 地域
- AI 按 11 个维度生成 33 个搜索问句：
  1. 价格相关 2. 品牌推荐 3. 对比评测 4. 购买攻略 5. 避坑指南 6. 质量辨别 7. 地域搜索 8. 用途效果 9. 售后服务 10. 排名榜单 11. 新品趋势
- 结果以网格展示，可直接用于 GEO 文章

#### 3.4 发布库 (`/geo/publish`)
- 表格展示所有发布记录
- 每行显示：标题、平台、状态、浏览量、AI 引用数、咨询量、发布时间
- 数据来自数据库 PublishRecord 表

#### 3.5 规则模板 (`/geo/rules`)
- 保存常用的文章生成规则（名称、类型、语气、字数、目标问句、额外规则）
- 列表展示已保存的规则，支持"套用"和删除
- 数据来自数据库 GenerationRule 表

#### 3.6 GEO 统计 (`/geo/stats`)
- 6 项核心指标：发布记录、已发布、浏览量、咨询量、AI 引用、信任资产（关联知识库）
- 平台分布统计 / 文章类型分布

### 4. 账号资产模块

#### 4.1 账号知识库 (`/assets/knowledge`)
- **Wiki 页面** — 双栏布局：左侧页面列表（支持按分类筛选）+ 右侧 Markdown 编辑器/实时预览，支持新建/编辑/删除/复制
- **原始来源** — 搜索过滤 + 卡片式来源列表，显示来源类型标签
- **导入资料** — 双栏布局：左侧输入表单（标题+内容+文件拖拽）+ 右侧分析结果预览，支持确认保存
- **全库搜索** — 搜索目的选择 + 关键词搜索，跨 Wiki 和来源检索
- **编译日志** — 时间线式事件记录
- 顶部 4 个统计卡片：来源数、Wiki 页面数、IP 子页数、检索片段数

#### 4.2 关键词库 (`/assets/keywords`)
- GEO 热词池：展示热词标签，支持添加和删除
- 分组管理：创建关键词分组，查看分组下的关键词数量

#### 4.3 接入配置 (`/assets/integrations`)
- 管理各自媒体平台（头条号、知乎、小红书、公众号、抖音、快手、视频号、百家号）
- 配置状态：待配置 / 已配置 / 已停用
- 表格展示所有已配置的接入

### 5. 账户运营模块

#### 5.1 生成记录 (`/account/logs`)
- AI 调用历史记录：类型、模型、状态、Tokens、耗时、成本、时间
- 汇总统计：总 Tokens、总成本、记录数

#### 5.2 积分充值 (`/account/recharge`)
- 查看当前积分余额（动态同步）
- 选择充值套餐（10元~200元 6 档）
- 确认金额后创建充值订单，展示支付状态页和订单号

#### 5.3 个人中心 (`/account/profile`)
- 查看用户信息（用户名、手机号、角色、积分）
- 动态同步用户数据

### 6. 管理后台（仅 admin 角色可见）

| 页面 | 路径 | 功能 |
|------|------|------|
| 数据看板 | `/admin/dashboard` | 全局统计、最近用户、最近充值 |
| 用户管理 | `/admin/users` | 用户列表、在线编辑、删除 |
| 积分管理 | `/admin/points` | 给用户加减积分，不低于 0 |
| 系统配置 | `/admin/config` | 充值套餐、AI 模型配置 |

---

## API 接口清单

### AI 接口（调用通义千问 qwen3.6-plus）
| 方法 | 路径 | 功能 |
|------|------|------|
| POST | `/api/ai/topics` | AI 生成 5 个文章选题 |
| POST | `/api/ai/article` | AI 生成完整文章 |
| POST | `/api/ai/hotwords` | AI 生成 11 维关键词矩阵 |
| POST | `/api/ai/ipbrief` | AI 分析描述自动填充 IP 档案 |
| POST | `/api/ai/rewrite` | AI 改写发布包内容（标题/脚本/简介/建议） |

### GEO 接口
| 方法 | 路径 | 功能 |
|------|------|------|
| GET/POST/PATCH | `/api/geo/articles` | GEO 文章 CRUD |
| GET/POST/DELETE | `/api/geo/rules` | 生成规则 CRUD |
| GET/POST | `/api/geo/publish` | 发布记录 CRUD |
| GET | `/api/geo/stats` | GEO 统计数据 |

### 资产接口
| 方法 | 路径 | 功能 |
|------|------|------|
| GET/POST/DELETE | `/api/assets/keywords` | 关键词分组/热词 CRUD |
| GET/POST/DELETE | `/api/assets/knowledge` | 知识条目 CRUD |
| GET/POST/DELETE | `/api/assets/integrations` | 接入配置 CRUD |

### 账号知识库接口
| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/api/account-knowledge/overview` | 知识库统计概览 |
| GET/POST/PUT/DELETE | `/api/account-knowledge/wiki-pages` | Wiki 页面 CRUD |
| GET/POST/DELETE | `/api/account-knowledge/sources` | 知识来源 CRUD |
| POST | `/api/account-knowledge/import` | 导入资料 |
| POST | `/api/account-knowledge/search` | 全库搜索 |
| POST | `/api/account-knowledge/recompile` | AI 编译知识库 |
| GET | `/api/account-knowledge/events` | 编译日志列表 |

### IP 接口
| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/api/ip/[id]` | 获取单个 IP 档案详情 |
| POST | `/api/ip` | 创建 IP 档案 |
| GET | `/api/ip/list` | IP 列表（含周策划/文章统计） |
| GET/POST/PUT | `/api/ip/[id]/weekly-plan` | 周策划获取/AI 生成/保存 |

### 发布包接口
| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/api/weekly-plan-items/[id]` | 获取选题发布包详情 |
| POST | `/api/weekly-plan-items/[id]` | AI 生成发布包（标题+钩子+脚本+简介+标签+建议） |
| PATCH | `/api/weekly-plan-items/[id]` | 更新发布包结果 |

### 计费接口
| 方法 | 路径 | 功能 |
|------|------|------|
| POST | `/api/billing/recharge` | 创建充值订单 |
| GET | `/api/billing/recharge` | 充值订单列表 |

### 其他接口
| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/api/dashboard/stats` | 仪表盘聚合数据（指标/趋势/IP 列表） |
| POST | `/api/auth/*` | 登录/注册/登出/用户信息 |
| GET/POST | `/api/account/logs` | 生成记录 CRUD |
| GET/POST/PATCH/DELETE | `/api/admin/users` | 用户管理 CRUD |
| POST | `/api/admin/points` | 积分调整 |
| GET | `/api/admin/stats` | 全局统计 |
| GET/PUT | `/api/admin/config` | 系统配置 |

---

## 数据库模型（18 个表）

| 模型 | 说明 | 关键字段 |
|------|------|---------|
| `User` | 用户 | phone, password, role, points |
| `Ip` | IP 档案 | name, industry, products, founderTraits, contentMixFlow/Persona/Product |
| `KnowledgeBase` | 知识库 | title, content, sourceType |
| `KnowledgeSource` | 知识来源 | sourceType (ip_profile/imported_file/imported_text/manual), content, fileName |
| `WikiPage` | Wiki 页面 | title, category (overview/ip_subpage/trust_asset), content (markdown), sourceId |
| `CompileEvent` | 编译日志 | action (ip_created/source_imported/wiki_compiled/page_updated等), detail |
| `KeywordGroup` | 关键词分组 | name |
| `Keyword` | 关键词 | content, isHot, groupId |
| `GeoArticle` | GEO 文章 | topic, keywords, platform, tone, content, articleType, status |
| `PublishRecord` | 发布记录 | platform, title, status, views, aiQuotes, consultations |
| `GenerationRule` | 生成规则 | name, articleType, tone, targetLength |
| `Questionnaire` | 调研问卷 | industry, teamSize, primaryPlatform, contentPain |
| `IntegrationConfig` | 接入配置 | platform, configName, status |
| `WeeklyPlan` | 周策划 | weekStart, weekEnd, userDirection, articleCount |
| `WeeklyPlanItem` | 周策划条目 | contentType, title, reason, generatedResult |
| `GenerationLog` | 生成日志 | type, model, tokens, duration, cost |
| `PointsRecharge` | 充值记录 | amount, points, bonus, status |
| `Session` | 登录会话 | token, expiresAt |

---

## 开发指南

### 启动开发服务器
```bash
cd chuangshizhe-copilot
npm install
npx prisma generate
npx next dev -p 5178
```

### 环境变量 (.env)
```env
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
ALIYUN_API_KEY="sk-sp-xxxxx"
```

### 数据库同步
```bash
npx prisma db push
```

### 构建生产版本
```bash
npx next build
npx next start
```

### 跨平台部署
- Windows 开发和 Ubuntu 部署完全兼容
- 路径使用正斜杠（`/`），兼容所有平台
- 环境变量通过 `.env` 文件管理，部署时替换

---

## 核心工作流

```
1. 创建 IP 档案 → 可用 AI 自动分析描述提取人设
2. 录入知识库 → 沉淀公司和 IP 相关资料
3. 建立关键词库 → 用热词矩阵生成搜索问句
4. 设置生成规则 → 配置语气、字数、平台模板
5. AI 选题/手动输入 → 生成 GEO 文章
6. 保存到数据库 → 文章可发布可追踪
7. 统计追踪 → 浏览、AI 引用、咨询数据
```

---

## 技术亮点

- **AI 深度集成**：4 个 AI 端点覆盖选题、写作、关键词、人设分析
- **完整 CRUD**：所有页面都有真实数据库读写，无硬编码数据
- **角色权限**：admin 与普通用户权限隔离
- **Session 认证**：httpOnly cookie 安全认证
- **实时同步**：React Context 全局用户状态
- **SEO 矩阵**：11 维度 33 问句关键词体系
- **DashScope 兼容**：通过 Anthropic SDK 协议调用阿里通义千问 qwen3.6-plus



