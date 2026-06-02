# 玄学工作室模块

## 目录结构

```
xuanxue/
├── config.ts              # 模块配置（10 个技能元数据 + 定价）
├── routes.ts              # 侧边栏导航定义
├── index.ts               # 模块导出入口
├── lib/
│   ├── types.ts           # 类型定义（SkillId, SkillInput, SkillOutput 等）
│   ├── executor.ts        # 技能执行引擎（Python + Node 统一调用）
│   └── billing.ts         # 积分扣费逻辑
├── api/
│   ├── [skill]/route.ts   # 技能执行 API（动态路由）
│   └── history/route.ts   # 历史记录查询 API
├── pages/
│   └── page.tsx           # 玄学首页（10 宫格导航）
├── components/            # 模块内组件（待开发）
├── database/
│   └── schema-xuanxue.prisma  # 数据库 Schema 文档
── skills/                # 10 个技能仓库代码
│   ├── bazi-pan-skill/    # Python - 八字排盘
│   ├── qimen-dunjia/      # Python - 奇门遁甲
│   ├── liuyao-najia-skill/# Python - 六爻纳甲
│   ├── meihua-yishu-skill/# Python - 梅花易数
│   ├── qizheng-siyu-skill/# Python - 七政四余
│   ├── ziwei-skill/       # Node.js - 紫微斗数
│   ├── liuren-skill/      # Node.js - 大六壬
│   ├── taiyi-skill/       # Node.js - 太乙神数
│   ├── fengshui-skill/    # Node.js - 风水堪舆
│   └── ze-ri-skill/       # Node.js - 择日学
└── README.md
```

## API 接口

### 执行技能
```
POST /api/xuanxue/[skill]
Body: { date, hour, gender, question, ... }
Response: { success, cost, balance, result }
```

### 查询历史
```
GET /api/xuanxue/history?skillId=bazi&limit=20&offset=0
Response: { success, records, total }
```

## 技能定价

统一 **10 积分/次**，配置在 `config.ts` 中。

## 技能执行方式

| 语言 | 技能 | 执行方式 |
|------|------|----------|
| Python | 八字、奇门、六爻、梅花、七政 | `child_process` 调用 `python3` |
| Node.js | 紫微、六壬、太乙、风水、择日 | 直接 `require()` 导入 |

## 数据库

使用 `xuanxue` schema，表 `DivinationRecord` 存储所有占卜记录。

## 下一步

1. [ ] 运行 `prisma migrate` 应用 xuanxue schema
2. [ ] 创建各技能的操作页面（`/xuanxue/[skill]/page.tsx`）
3. [ ] 实现结果展示组件
4. [ ] 完善历史记录功能
5. [ ] 前端积分余额实时显示
