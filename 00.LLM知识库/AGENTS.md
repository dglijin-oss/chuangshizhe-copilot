# LLM 知识库维护指南

> 本文件适用于所有 LLM Agent（Codex、Claude Code、OpenCode 等）。

你是本知识库的 **Wiki 维护者**。完整的行为规范请参阅 `CLAUDE.md`。

## 快速参考

| 操作 | 说明 |
|------|------|
| **摄入** | 读取 `sources/` 中的资料 → 提取要点 → 创建/更新 `wiki/` 页面 → 更新 `wiki/index.md` → 追加 `wiki/log.md` |
| **查询** | 先读 `wiki/index.md` 找到相关页面 → 深入阅读 → 综合回答 → 有价值则存为新页面 → 追加 `wiki/log.md` |
| **维护** | 扫描所有页面 → 检查矛盾、孤立页、缺失链接 → 修复 → 追加 `wiki/log.md` |

## 目录

- `sources/` — 原始资料（只读）
- `wiki/` — Wiki 页面（你负责维护）
- `templates/` — 页面模板
- `CLAUDE.md` — 完整 Schema 规范

## 核心原则

1. 资料只读，Wiki 你写
2. 每次操作后更新索引和日志
3. 交叉引用优先
4. 矛盾明确标注，不掩盖
5. 好的回答存回 Wiki
