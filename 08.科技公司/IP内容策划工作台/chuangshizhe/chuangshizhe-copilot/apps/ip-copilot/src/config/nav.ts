/**
 * Navigation groups loaded from the module system.
 * Icons are string names that get resolved to Lucide components at runtime.
 * This mirrors src/modules/ip-copilot/routes.ts but lives inside the app
 * since the app currently uses its own copy of routes.
 */
import type { ModuleNavGroup } from '@/lib/nav-loader'

export const navGroups: ModuleNavGroup[] = [
  {
    label: '工作台',
    items: [
      { path: '/', label: '工作总览', icon: 'LayoutDashboard' },
    ],
  },
  {
    label: '内容生产',
    items: [
      { path: '/ip/create', label: '创建 IP', icon: 'Plus' },
      { path: '/ip/manage', label: 'IP 档案管理', icon: 'Shield' },
      { path: '/ip/archive', label: '发布归档', icon: 'Archive' },
    ],
  },
  {
    label: 'GEO 增长',
    items: [
      { path: '/geo', label: 'GEO 总览', icon: 'BarChart3' },
      { path: '/geo/article', label: 'GEO 文章', icon: 'FilePlus' },
      { path: '/geo/hotwords', label: '热词关联', icon: 'Hash' },
      { path: '/geo/publish', label: '发布库', icon: 'Send' },
      { path: '/geo/rules', label: '规则模板', icon: 'FileCheck' },
      { path: '/geo/stats', label: 'GEO 统计', icon: 'BarChart3' },
    ],
  },
  {
    label: '账号资产',
    items: [
      { path: '/scrape', label: 'AI 智能采集', icon: 'Scan' },
      { path: '/assets/knowledge', label: '账号知识库', icon: 'BookOpen' },
      { path: '/assets/keywords', label: '关键词库', icon: 'List' },
      { path: '/assets/integrations', label: '接入配置', icon: 'Link2' },
    ],
  },
  {
    label: 'AI 助手',
    items: [
      { path: '/ai-arsenal/project', label: '项目助手', icon: 'FolderKanban' },
      { path: '/ai-arsenal/squad', label: 'AI 智囊团', icon: 'Users' },
      { path: '/ai-arsenal/image', label: '图片生成', icon: 'ImageIcon' },
      { path: '/ai-arsenal/video', label: '视频生成', icon: 'Video' },
      { path: '/ai-arsenal/image-agent', label: '图片 Agent', icon: 'ImageIcon' },
      { path: '/ai-arsenal/video-agent', label: '视频 Agent', icon: 'Video' },
    ],
  },
  {
    label: '账号运营',
    items: [
      { path: '/account/logs', label: '生成记录', icon: 'ScrollText' },
      { path: '/account/recharge', label: '积分充值', icon: 'CreditCard' },
      { path: '/account/profile', label: '个人中心', icon: 'User' },
    ],
  },
  {
    label: '玄学工作室',
    items: [
      { path: '/xuanxue', label: '玄学首页', icon: 'Sparkles' },
      { path: '/xuanxue/bazi', label: '八字排盘', icon: 'CalendarDays' },
      { path: '/xuanxue/liuyao', label: '六爻纳甲', icon: 'CircleDot' },
      { path: '/xuanxue/meihua', label: '梅花易数', icon: 'Flower2' },
      { path: '/xuanxue/qimen', label: '奇门遁甲', icon: 'Compass' },
      { path: '/xuanxue/ziwei', label: '紫微斗数', icon: 'Star' },
      { path: '/xuanxue/qizheng', label: '七政四余', icon: 'Orbit' },
      { path: '/xuanxue/liuren', label: '大六壬', icon: 'Waves' },
      { path: '/xuanxue/taiyi', label: '太乙神数', icon: 'Zap' },
      { path: '/xuanxue/fengshui', label: '风水堪舆', icon: 'Mountain' },
      { path: '/xuanxue/ze-ri', label: '择日学', icon: 'CalendarCheck' },
      { path: '/xuanxue/history', label: '占卜历史', icon: 'History' },
    ],
  },
]

/**
 * Admin-only navigation groups (separate section in sidebar).
 */
export const adminNavGroups: ModuleNavGroup[] = [
  {
    label: '管理后台',
    items: [
      { path: '/admin/dashboard', label: '数据看板', icon: 'BarChart3' },
      { path: '/admin/users', label: '用户管理', icon: 'User' },
      { path: '/admin/points', label: '积分管理', icon: 'Shield' },
      { path: '/admin/config', label: '系统配置', icon: 'Sliders' },
      { path: '/admin/ips', label: 'IP 档案', icon: 'FolderKanban' },
      { path: '/admin/sessions', label: '登录记录', icon: 'KeyRound' },
      { path: '/admin/recharges', label: '充值记录', icon: 'Coins' },
      { path: '/admin/logs', label: '操作日志', icon: 'FileText' },
    ],
  },
]
