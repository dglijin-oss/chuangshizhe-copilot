export const PERSONA_OPTIONS = [
  "说话直", "懂门店经营", "会算账", "有江湖气",
  "重视老客户", "对品质较真", "返乡创业", "不爱讲空话",
];

export const INDUSTRY_OPTIONS = [
  "餐饮", "家装建材", "本地生活服务", "美业",
  "教育培训", "农产品", "实体零售", "企业服务",
];

export const PRODUCT_OPTIONS = [
  "到店消费", "套餐团购", "会员卡", "加盟咨询",
  "私域服务", "定制方案", "本地配送", "课程培训",
];

export const CUSTOMER_OPTIONS = [
  "本地老板", "同城消费者", "想开店的人", "家庭决策者",
  "年轻上班族", "宝妈群体", "企业客户", "老客户复购",
];

export const GOAL_OPTIONS = [
  "涨同城精准粉", "建立创始人人设", "引导私域咨询",
  "提升门店到店", "解释产品价值", "招加盟/代理", "提高信任感",
];

export const FORBIDDEN_OPTIONS = [
  "不要专家腔", "不要硬广", "不要过度承诺", "不要全国通用模板",
  "不要太油腻", "不要攻击同行", "不要虚假案例",
];

export interface IPProfile {
  id: string;
  name: string;
  founder: string;
  personas: string[];
  personaExtra: string;
  industry: string;
  products: string[];
  customers: string[];
  customerExtra: string;
  goals: string[];
  goalExtra: string;
  forbidden: string[];
  forbiddenExtra: string;
  mix: { traffic: number; persona: number; product: number };
  createdAt: string;
}

// Store in localStorage
export function saveIPProfile(profile: IPProfile): void {
  const existing = getIPProfiles();
  existing.push(profile);
  localStorage.setItem("ip_profiles", JSON.stringify(existing));
}

export function deleteIPProfile(id: string): void {
  const remaining = getIPProfiles().filter(profile => profile.id !== id);
  localStorage.setItem("ip_profiles", JSON.stringify(remaining));
}

export function getIPProfiles(): IPProfile[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem("ip_profiles");
  return data ? JSON.parse(data) : [];
}

export function getIPProfile(id: string): IPProfile | undefined {
  return getIPProfiles().find(p => p.id === id);
}

export function updateAICredits(count: number): void {
  localStorage.setItem("ai_credits", String(count));
}

export function getAICredits(): number {
  if (typeof window === "undefined") return 96;
  const data = localStorage.getItem("ai_credits");
  return data ? parseInt(data) : 96;
}
