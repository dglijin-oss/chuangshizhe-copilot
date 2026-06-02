export interface SkillPricing {
  points: number
  name: string
}

export interface SkillInput {
  date?: string      // YYYY-MM-DD
  hour?: number      // 0-23
  gender?: '男' | '女'
  question?: string  // 问题类型：财运/事业/婚姻/健康等
  method?: string    // 起卦方式：coin/number/time等
  numbers?: string   // 数字串
  year?: number
  direction?: string
  event?: string     // 择日事件类型
}

export interface SkillOutput {
  success: boolean
  result: Record<string, any>
  formatted?: string  // 格式化后的文本
}

export interface DivinationRecord {
  id: string
  userId: string
  skillId: string
  input: SkillInput
  output: SkillOutput
  pointsCost: number
  createdAt: string
}

export type SkillId =
  | 'bazi' | 'liuyao' | 'qimen' | 'meihua' | 'qizheng'
  | 'ziwei' | 'liuren' | 'taiyi' | 'fengshui' | 'ze-ri'

export const SKILL_NAMES: Record<SkillId, string> = {
  bazi: '八字排盘',
  liuyao: '六爻纳甲',
  qimen: '奇门遁甲',
  meihua: '梅花易数',
  qizheng: '七政四余',
  ziwei: '紫微斗数',
  liuren: '大六壬',
  taiyi: '太乙神数',
  fengshui: '风水堪舆',
  'ze-ri': '择日学',
}

export const SKILL_DESCRIPTIONS: Record<SkillId, string> = {
  bazi: '根据出生年月日时排八字，分析四柱十神、五行旺衰、大运流年',
  liuyao: '六爻纳甲占卜，铜钱起卦或数字起卦，断吉凶、应期、趋避建议',
  qimen: '奇门遁甲排盘，时空定位，九宫飞星，断事吉凶',
  meihua: '梅花易数，以数起卦或时间起卦，简洁断卦',
  qizheng: '七政四余排盘，星曜落宫，宫位分析',
  ziwei: '紫微斗数排盘，十二宫位，四化飞星，命盘详解',
  liuren: '大六壬排盘，四课三传，天地盘分析',
  taiyi: '太乙神数排盘，国运天灾，格局分析',
  fengshui: '八宅风水，游年九星，方位吉凶，布局建议',
  'ze-ri': '择日查询，婚嫁/开业/出行等吉日历法',
}
