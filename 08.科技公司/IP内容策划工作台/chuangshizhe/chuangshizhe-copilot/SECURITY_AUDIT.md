# 安全审计报告

> 生成时间: 2026-05-20
> 最后更新: 2026-05-20（修复 P0 项）
> 下次复查: 2026-06-20

---

##  Critical / High

### 1. .env 文件含生产密码 [已记录]
- **文件**: `.env`
- **风险**: 数据库密码和 API Key 明文存储在本地文件中
- **状态**: 生产环境通过 Docker 环境变量注入，不依赖 .env 文件，实际风险低
- **建议**: 本地 .env 使用占位符

### 2. 中间件 Admin 权限 Cookie 伪造 [✅ 已修复]
- **文件**: `src/middleware.ts`
- **修复**: 移除了基于 `user-role` Cookie 的 admin 判断，admin 权限完全由 handler 内 `getSessionUser()` 服务端校验

### 3. 登录端点无限重试 [✅ 已修复]
- **文件**: `src/app/api/auth/login/route.ts`、`src/lib/rate-limiter.ts`
- **修复**: 基于内存的限流器，同一手机号 15 分钟最多 5 次尝试，超限返回 429 并告知剩余等待秒数

### 4. 注册无验证 [✅ 已修复]
- **文件**: `src/app/api/auth/register/route.ts`、`src/app/api/auth/captcha/route.ts`、`src/lib/captcha.ts`
- **修复**: 数学运算验证码（加减乘），注册时需先获取验证码题目，提交时验证答案正确才允许注册

---

## 🟡 Medium（待修复）

### 5. Cookie 未标记 Secure [️ 部分修复]
- **文件**: `src/app/api/auth/login/route.ts`, `register/route.ts`
- **状态**: 已改为 `secure: process.env.NODE_ENV === "production"`，生产环境自动启用
- **建议**: 确认生产环境走 HTTPS

### 6. 缺少安全响应头 [待修复]
- **文件**: `next.config.ts`
- **风险**: 缺少 X-Content-Type-Options, X-Frame-Options, HSTS 等

### 7. AI 端点 Prompt 注入 [待修复]
- **文件**: `src/app/api/ai/article/route.ts` 等
- **风险**: 用户输入直接拼接到系统 prompt

### 8. 错误信息泄露内部细节 [待修复]
- **修复**: 登录/注册错误信息已改为通用描述

### 9. Hermes/OpenClaw 代理端点无消息量限制 [待修复]
- **文件**: `src/app/api/hermes/chat/route.ts`
- **风险**: 可发送超长消息或极多轮对话
