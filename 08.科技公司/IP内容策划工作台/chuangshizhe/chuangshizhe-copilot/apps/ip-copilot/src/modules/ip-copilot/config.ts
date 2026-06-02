export default {
  id: 'ip-copilot',
  name: 'IP 内容工作台',
  icon: 'FileText',
  description: 'AI 驱动的 IP 内容策划与生产平台，覆盖文案生成、周策划、GEO 增长等全链路',
  version: '1.0.0',
  enabled: true,
  requiredProducts: ['ip-copilot'],
  dbSchema: 'ip',
  pricing: {
    'ai-article': { points: 10 },
    'weekly-plan': { points: 20 },
    'geo-growth': { points: 15 },
  },
}
