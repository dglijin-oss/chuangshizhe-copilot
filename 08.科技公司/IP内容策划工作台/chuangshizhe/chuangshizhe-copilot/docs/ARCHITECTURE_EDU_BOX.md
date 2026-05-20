# 创世者 Copilot 平台架构方案

> 定位：创世者 Copilot 是**总项目/平台级入口**，启明盒子与 IP 策划是平台下的**子项目（独立产品）**。

## 1. 产品层级

```
创世者 Copilot（平台总入口）
├── 启明盒子（子产品：教育 AI 协同平台）
└── IP 策划工作台（子产品：新媒体内容 AI）
```

- 用户在平台入口登录后，看到已授权的产品卡片，点击进入对应工作台
- 子项目共享用户体系、积分系统、全局配置
- 子项目之间业务逻辑、数据模型、智能体完全隔离

---

## 2. 仓库结构 (Monorepo)

```text
chuangshizhe-monorepo/
── apps/
│   ├── platform/             # 创世者 Copilot 平台入口（登录、产品导航、全局设置）
│   ├── ip-copilot/           # IP 策划工作台（现有代码迁移）
│   └── edu-box/              # 启明盒子（新建）
├── packages/
│   ├── database/             # 统一 Prisma Schema & Client
│   ├── ui/                   # 共享 UI 组件库
│   ├── config/               # 共享 Tailwind/ESLint/TSConfig
│   ├── auth/                 # 统一鉴权（Session, Cookie, RBAC）
│   ├── billing/              # 积分扣费 SDK
│   └── llm/                  # 统一 LLM 调用封装（模型路由、流式输出）
├── turbo.json
└── package.json
```

---

## 3. PostgreSQL Schema 隔离方案

PostgreSQL 原生支持 **多 Schema**，是"同库多业务"的最佳方案。

### 3.1 架构示意

```
Database: chuangshizhe
├── Schema: public        ← 共享层（用户、积分、配置、审计）
├── Schema: ip            ← IP 策划子项目（IpProfile, WeeklyPlan, Corpus...）
└── Schema: edu           ← 启明盒子子项目（EduStudent, EduClass, EduLesson...）
```

### 3.2 Prisma 配置

每个子项目使用独立的 Prisma Client，通过 `schema` 参数指定命名空间：

```prisma
// packages/database/schema-core.prisma (public 共享表)
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider        = "prisma-client-js"
  output          = "../packages/database/client-core"
}

model User { id String @id ... points Int @default(100) ... }
model PointsLog { id String @id ... userId String ... product String ... }
```

```prisma
// packages/database/schema-ip.prisma (ip Schema)
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["public", "ip"]
}

generator client {
  provider        = "prisma-client-js"
  output          = "../packages/database/client-ip"
  previewFeatures = ["multiSchema"]
}

model IpProfile {
  @@schema("ip")
  id String @id ...
  name String ...
}
```

```prisma
// packages/database/schema-edu.prisma (edu Schema)
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["public", "edu"]
}

generator client {
  provider        = "prisma-client-js"
  output          = "../packages/database/client-edu"
  previewFeatures = ["multiSchema"]
}

model EduStudent {
  @@schema("edu")
  id String @id ...
  name String ...
  classId String ...
}
```

### 3.3 使用方式

```typescript
// 平台入口 / IP 策划中调用
import { prismaCore } from "@chuangshizhe/database/client-core"
import { prismaIp } from "@chuangshizhe/database/client-ip"

const user = await prismaCore.user.findUnique({ where: { id } })
const ip = await prismaIp.ipProfile.findFirst({ where: { userId: id } })

// 启明盒子中调用
import { prismaCore } from "@chuangshizhe/database/client-core"
import { prismaEdu } from "@chuangshizhe/database/client-edu"

const student = await prismaEdu.eduStudent.findMany({ where: { classId } })
```

### 3.4 权限隔离

PostgreSQL 支持 Schema 级别权限控制：

```sql
-- 创建角色
CREATE ROLE ip_app_user;
CREATE ROLE edu_app_user;

-- IP 应用只能访问 public + ip Schema
GRANT USAGE ON SCHEMA public, ip TO ip_app_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ip TO ip_app_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO ip_app_user;

-- 教育应用只能访问 public + edu Schema
GRANT USAGE ON SCHEMA public, edu TO edu_app_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA edu TO edu_app_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO edu_app_user;
```

---

## 4. 共享内核

### 4.1 统一鉴权 (Auth)
- `packages/auth` 提供 `getSessionUser()` 和 `requireAuth()` 中间件
- 平台入口负责登录态发放，子项目共享 Cookie/Session（SSO）
- RBAC 角色中包含产品授权标记（如 `products: ['ip-copilot', 'edu-box']`）

### 4.2 积分扣费 (Billing)
- `packages/billing` 提供 `consumePoints(userId, amount, description, product)` 
- 所有扣费流水记入 `public.points_log`，通过 `product` 字段区分来源
- 子项目只需调用 SDK，不直接操作积分表

### 4.3 统一 LLM 调用 (LLM)
- `packages/llm` 封装所有 AI 调用（通义千问、智谱等）
- 子项目传入不同 prompt 和上下文，共享模型路由和流式输出逻辑
- 教育板块和 IP 板块的 API Key、用量限制统一管控

---

## 5. 平台入口设计 (apps/platform)

创世者 Copilot 平台入口负责：

1. **全局登录**：用户在此完成认证，获取 Session
2. **产品导航**：登录后展示产品矩阵卡片
3. **权限路由**：根据用户授权自动跳转
   - 创作者 → `/ip-copilot/dashboard`
   - 教师/学校 → `/edu-box/dashboard`
   - 超级管理员 → `/admin`
4. **全局设置**：积分充值、账号安全、消息通知

---

## 6. 实施步骤

| 阶段 | 任务 | 产出 |
| :--- | :--- | :--- |
| **阶段一** | 初始化 Monorepo + PostgreSQL Schema | 空仓库结构 + `npx prisma migrate` 成功 |
| **阶段二** | 现有代码迁移至 `apps/ip-copilot` | IP 策划可在 Monorepo 中独立运行 |
| **阶段三** | 提取共享包（auth, billing, llm, ui） | 共享 SDK 可供多应用调用 |
| **阶段四** | 新建 `apps/edu-box`，开发启明盒子核心功能 | 教育板块独立运行，共享用户/积分 |
| **阶段五** | 开发 `apps/platform` 平台入口 | 统一登录 + 产品导航上线 |
| **阶段六** | PostgreSQL 权限隔离 + CI/CD | 安全隔离 + 按需部署 |

---

## 7. 关键优势

| 维度 | 方案 |
| :--- | :--- |
| **开发效率** | 共享包一次开发多处使用，节省 30%+ 工作量 |
| **数据安全** | PostgreSQL Schema 隔离 + 角色权限，教育数据独立保护 |
| **部署灵活** | 子项目可独立部署，改动启明盒子不影响 IP 策划 |
| **扩展性** | 未来加第三个子产品（如电商助手），只需加 `apps/xxx` + `schema-xxx.prisma` |
| **成本控制** | 一台 PostgreSQL 实例服务所有产品，无需多服务器 |

---

## 8. 注意事项

- **Prisma 多 Schema**：需开启 `multiSchema` preview feature，Prisma 5.14+ 已支持
- **连接池**：三个应用共用同一 Postgres 实例，注意 `pool` 参数配置（建议 `pool = { max: 10, min: 2 }`）
- **跨 Schema 查询**：避免直接 JOIN 跨 Schema 表，通过 API 层聚合数据
- **迁移策略**：现有 `ip-copilot` 的表需迁移到 `ip` Schema，建议先在新 Schema 重建表，再逐步切流
