# IP 内容工作台模块

## 目录结构

```
ip-copilot/
├── config.ts      # 模块元数据配置
── routes.ts      # 路由/侧边栏定义
├── pages/         # 页面组件（对应 src/app/(app)/ 下的路由）
│   ├── dashboard/ # 工作总览
│   ├── ip/        # IP 管理
│   ├── geo/       # GEO 增长
│   ── ...
├── components/    # 模块内专用组件
└── api/           # 模块 API handlers
```

## 如何添加新页面

1. 在 `pages/` 下创建新目录，如 `pages/fortune/`
2. 创建 `page.tsx` 文件
3. 在 `routes.ts` 中添加导航配置
4. 在 `src/app/(app)/` 下创建对应的路由文件（引用模块页面）

## 与主应用的关系

- 主应用路由：`src/app/(app)/`
- 模块页面：`src/modules/ip-copilot/pages/`
- 页面组件从模块导入，路由定义在主应用中

## 数据库

使用 `ip` schema，与 `public` schema 的用户/会话表关联。
