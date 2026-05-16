# 创世者 Copilot — IP 内容策划工作台

## 项目概览

面向本地商家和创业者的短视频内容策划平台。先建一个 IP 档案，再让 AI 基于完整的账号知识库（记忆库 + 语料库）生成本周选题池，每条选题自带完整脚本、发布文案和拍摄建议。

技术栈：Next.js 16 + Prisma + PostgreSQL + DashScope AI

---

## 功能清单

### 1. 用户系统

| 功能 | 说明 |
|------|------|
| 注册 / 登录 | httpOnly Cookie 认证，30 天会话 |
| 积分系统 | 每日 10 次免费 AI 调用，用尽为止 |
| 管理员面板 | 用户管理、角色切换（USER/ADMIN）、手动调整积分 |
| 本地数据迁移 | 首次登录自动从 localStorage 迁移旧版数据到数据库 |

### 2. IP 档案创建

用户通过表单录入一个 IP 的完整信息，创建后作为所有策划的上下文基础：

| 字段 | 类型 | 说明 |
|------|------|------|
| IP 名称 | 文本 | 账号名称，如"老韦的广西餐饮号" |
| 创始人 | 文本 | 创始人姓名/称呼 |
| 创始人人设 | 多选标签 + 自由补充 | 说话直、懂门店经营、会算账、有江湖气等 8 项预设 |
| 行业 | 单选标签 | 餐饮、家装建材、本地生活服务、美业、教育、农产品等 8 项 |
| 产品/服务 | 多选标签 | 到店消费、套餐团购、会员卡、私域服务等 8 项 |
| 目标客户 | 多选标签 + 自由补充 | 本地老板、同城消费者、宝妈群体等 8 项 |
| 账号目标 | 多选标签 + 自由补充 | 涨粉、建人设、引私域、提信任等 7 项 |
| 内容禁区 | 多选标签 + 自由补充 | 不要专家腔、不要硬广、不要攻击同行等 7 项 |
| 内容配比 | 数值调节（+/-） | 流量型 : 人设型 : 产品型，默认 4:2:1 |

创建后自动进入该 IP 的工作台。

### 3. 工作台 — 周选题生成

基于 IP 档案自动生成一周选题池：

| 功能 | 说明 |
|------|------|
| 一键生成 | 按 IP 的配比要求（如 4:2:1）生成对应数量的选题 |
| 选题列表 | 按流量型/人设型/产品型分类展示，点击展开详情 |
| 完整脚本 | 每条选题含口播脚本（开头钩子 + 正文 + 结尾引导） |
| 发布文案 | 含话题标签的社交平台发布文案 |
| 拍摄建议 | 场景、镜头、灯光等实操建议 |
| 复制脚本 | 一键复制到剪贴板 |
| 上下文注入 | 生成时自动注入账号记忆 + 已入库语料摘要到 AI prompt |

### 4. 账号记忆库（Account Memory）

每个 IP 档案独立维护一个记忆库，用于沉淀 AI 写作偏好和业务规则：

| 类别 | 说明 | 示例 |
|------|------|------|
| 事实纠错 | 纠正 AI 对业务事实的错误理解 | "创始人在南宁不在梧州" |
| 写作偏好 | 语气、风格、格式偏好 | "发布文案要更像老板本人说话" |
| 表达禁区 | 补充禁区规则 | "不要虚构门店数量" |
| 客户洞察 | 目标客户特征和需求 | "老客户更关心复购优惠" |

功能：
- 选择类别后输入内容，点击"加入账号记忆库"
- 支持按类别筛选查看
- 单条删除
- AI 生成选题时自动注入所有记忆作为上下文

### 5. 语料库（Corpus Feed）

上传 IP 的历史脚本、访谈、账号资料，AI 分析后确认入库：

**上传**
- 支持格式：.txt、.md、.docx、.pdf、.json、.csv
- 单文件最大 10MB
- 自动解析文件内容（.docx 用 mammoth，.pdf 用 pdf-parse）
- 内容截断至 30000 字符

**AI 分析**
- 一键分析全部待处理语料
- AI 输出：价值评估摘要 + 标签 + 反馈建议
- 每条语料独立状态：待分析 → 已分析 → 确认入库/拒绝

**管理**
- 状态筛选：全部/待分析/已分析/已入库/已拒绝
- 确认入库后的语料在 AI 生成选题时作为参考上下文
- 单条删除

### 6. IP 档案库

| 功能 | 说明 |
|------|------|
| 卡片列表 | 展示所有已创建的 IP 档案 |
| 快速进入 | 点击进入对应 IP 工作台 |
| 删除 | 级联删除关联的记忆库和语料库数据 |

---

## API 路由

### 认证
| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/auth/register` | POST | 用户注册 |
| `/api/auth/login` | POST | 用户登录 |
| `/api/auth/me` | GET | 获取当前用户信息和积分 |
| `/api/auth/logout` | POST | 退出登录 |

### IP 档案
| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/profiles` | GET | 获取当前用户的 IP 档案列表 |
| `/api/profiles` | POST | 创建新 IP 档案 |
| `/api/profiles/[id]` | DELETE | 删除 IP 档案 |

### 选题生成
| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/generate` | POST | 调用 DashScope AI 生成选题 |

### 积分
| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/credits/balance` | GET | 获取当前积分余额和今日用量 |
| `/api/credits/reset` | POST | 重置每日额度 |

### 语料库
| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/corpus` | GET | 查询语料列表（支持 profileId + status 筛选） |
| `/api/corpus/upload` | POST | 上传文件（FormData） |
| `/api/corpus/analyze` | POST | AI 分析待处理语料 |
| `/api/corpus/confirm` | POST | 批量确认/拒绝语料 |
| `/api/corpus/[id]` | DELETE | 删除语料 |

### 记忆库
| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/memory` | GET | 查询记忆列表（支持 profileId + category 筛选） |
| `/api/memory` | POST | 新增记忆（profileId + category + content） |
| `/api/memory/[id]` | DELETE | 删除记忆 |

### 管理
| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/admin/users` | GET | 获取用户列表（含余额和档案数） |
| `/api/admin/users` | PATCH | 调整用户积分或角色 |
| `/api/admin/users` | DELETE | 删除用户 |

---

## 数据库

PostgreSQL，Prisma ORM。核心表：

| 表 | 说明 |
|----|------|
| User | 用户（含角色、积分流水关联） |
| Session | 登录会话 |
| IPProfile | IP 档案（人设、行业、产品、客户、目标、禁区、配比） |
| Topic | 选题（类型、标题、脚本、发布文案、拍摄建议） |
| CorpusEntry | 语料条目（文件名、类型、内容、AI 摘要、标签、状态） |
| AccountMemory | 账号记忆（类别、内容，关联 IP 档案） |
| UsageLog | 使用记录（每次 AI 调用） |
| CreditLedger | 积分流水 |

---

## 部署

### 开发
```bash
npx next dev --port 5173
```

### 构建 + 部署
```bash
# 本地构建
npx next build

# 上传到服务器
scp -r .next/standalone .next/static deploy@111.228.53.162:~/ip-workspace/

# 服务器启动（手动）
cd ~/ip-workspace && node server.js
```

Standalone 模式，构建后需手动复制 `.next/static/` 到 `.next/standalone/.next/`。

### 进程守护（PM2）

避免 SSH 断开后服务停止，推荐使用 PM2：

```bash
# 安装 PM2
npm install -g pm2

# 进入项目目录
cd /opt/copilot

# 启动服务
pm2 start server.js --name ip-workspace

# 保存进程列表（服务器重启后自动恢复）
pm2 save

# 配置开机自启（执行后会输出需要运行的命令，复制粘贴即可）
pm2 startup
```

PM2 常用命令：

| 命令 | 说明 |
|------|------|
| `pm2 status` | 查看所有进程运行状态 |
| `pm2 logs ip-workspace` | 查看实时日志 |
| `pm2 restart ip-workspace` | 重启服务 |
| `pm2 stop ip-workspace` | 停止服务 |
| `pm2 monit` | 查看 CPU / 内存占用 |

### 环境变量
- `DATABASE_URL` — PostgreSQL 连接字符串
- `DASHSCOPE_API_KEY` — 阿里云通义千问 API Key
- `NEXTAUTH_SECRET` — Cookie 签名密钥
