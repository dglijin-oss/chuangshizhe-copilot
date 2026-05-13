"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  PERSONA_OPTIONS, INDUSTRY_OPTIONS, PRODUCT_OPTIONS,
  CUSTOMER_OPTIONS, GOAL_OPTIONS, FORBIDDEN_OPTIONS,
} from "@/lib/store";

interface Topic {
  id: string;
  type: "traffic" | "persona" | "product";
  title: string;
  description: string;
  script?: string;
  publishCopy?: string;
  shootingTips?: string;
  status: "pending" | "generating" | "done";
  weekKey?: string;
}

interface UserProfile {
  id: string;
  username: string;
  name: string;
  role: "USER" | "ADMIN";
}

interface CreditInfo {
  balance: number;
  usedToday: number;
  dailyQuota: number;
}

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [credits, setCredits] = useState<CreditInfo>({ balance: 0, usedToday: 0, dailyQuota: 10 });
  const [view, setView] = useState<"landing" | "form" | "workspace" | "archive" | "admin">("landing");

  // Form state
  const [formData, setFormData] = useState({
    name: "", founder: "", personas: [] as string[], personaExtra: "",
    industry: "", products: [] as string[], customers: [] as string[], customerExtra: "",
    goals: [] as string[], goalExtra: "", forbidden: [] as string[], forbiddenExtra: "",
    mixTraffic: 4, mixPersona: 2, mixProduct: 1,
  });

  // Workspace state
  const [profiles, setProfiles] = useState<any[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [generating, setGenerating] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Load auth on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          setAuthReady(true);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setUser(data.user);
        setCredits(data.credits);

        // Load profiles
        const profilesRes = await fetch("/api/profiles");
        if (profilesRes.ok) {
          const profilesData = await profilesRes.json();
          setProfiles(profilesData);
          if (profilesData.length > 0) {
            setActiveProfileId(profilesData[0].id);
          }
        }

        // Check localStorage for migration
        const localProfiles = localStorage.getItem("ip_profiles");
        if (localProfiles && !localStorage.getItem("migrated_to_server")) {
          try {
            const parsed = JSON.parse(localProfiles);
            for (const profile of parsed) {
              await fetch("/api/profiles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(profile),
              });
            }
            localStorage.setItem("migrated_to_server", "true");
            // Reload profiles after migration
            const refreshed = await fetch("/api/profiles");
            if (refreshed.ok) {
              const newData = await refreshed.json();
              setProfiles(newData);
              if (newData.length > 0 && !activeProfileId) {
                setActiveProfileId(newData[0].id);
              }
            }
          } catch {
            // Migration failed silently
          }
        }
      } catch {
        // Network error
      } finally {
        setAuthReady(true);
        setLoading(false);
      }
    })();
  }, []);

  const toggleTag = (field: keyof typeof formData, value: string) => {
    setFormData(prev => {
      const arr = [...(prev[field] as string[])];
      const idx = arr.indexOf(value);
      if (idx >= 0) arr.splice(idx, 1);
      else arr.push(value);
      return { ...prev, [field]: arr };
    });
  };

  const isSelected = (field: keyof typeof formData, value: string) => {
    return ((formData[field] as unknown) as string[])?.includes(value);
  };

  const handleCreate = async () => {
    const profileData = {
      name: formData.name,
      founder: formData.founder,
      personas: formData.personas,
      personaExtra: formData.personaExtra,
      industry: formData.industry,
      products: formData.products,
      customers: formData.customers,
      customerExtra: formData.customerExtra,
      goals: formData.goals,
      goalExtra: formData.goalExtra,
      forbidden: formData.forbidden,
      forbiddenExtra: formData.forbiddenExtra,
      mix: { traffic: formData.mixTraffic, persona: formData.mixPersona, product: formData.mixProduct },
    };

    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.error || "创建失败");
        return;
      }

      const newProfile = await res.json();
      setProfiles(prev => [newProfile, ...prev]);
      setActiveProfileId(newProfile.id);
      setTopics([]);
      setSelectedTopic(null);
      setView("workspace");

      // Update credits
      const creditsRes = await fetch("/api/credits/balance");
      if (creditsRes.ok) {
        const cd = await creditsRes.json();
        setCredits(prev => ({ ...prev, balance: cd.balance }));
      }
    } catch {
      setErrorMsg("网络错误");
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!activeProfileId) return;
    const profile = profiles.find(p => p.id === activeProfileId);
    if (!profile) return;

    setGenerating(true);
    setSelectedTopic(null);
    setErrorMsg("");

    const prompt = `你是短视频内容策划专家。根据以下IP档案，生成本周选题池。

【IP 档案】
- IP 名称：${profile.name}
- 创始人：${profile.founder}
- 行业：${profile.industry}
- 人设特点：${(profile.personas || []).join("、")} ${profile.personaExtra || ""}
- 产品服务：${(profile.products || []).join("、")}
- 目标客户：${(profile.customers || []).join("、")} ${profile.customerExtra || ""}
- 账号目标：${(profile.goals || []).join("、")} ${profile.goalExtra || ""}
- 内容禁区：${(profile.forbidden || []).join("、")} ${profile.forbiddenExtra || ""}
- 本周配比：流量型 ${profile.mix?.traffic || 4} 条、人设型 ${profile.mix?.persona || 2} 条、产品型 ${profile.mix?.product || 1} 条

【要求】
1. 严格按照配比数量生成对应类型的选题
2. 每个选题必须包含：title（标题，要有吸引力）、description（一句话描述）、script（完整口播脚本，含开头钩子+正文+结尾引导）、publishCopy（发布文案，含话题标签）、shootingTips（拍摄建议）
3. 流量型选题要能引发共鸣或争议，人设型要体现创始人真实故事，产品型要展示产品价值
4. 所有脚本必须口语化，符合创始人的人设特点，遵守内容禁区
5. 每条脚本长度 200-300 字，适合 30-45 秒视频

【输出格式】
严格按以下 JSON 数组格式输出，不要输出任何其他内容：
[
  {
    "type": "traffic",
    "title": "...",
    "description": "...",
    "script": "...",
    "publishCopy": "...",
    "shootingTips": "..."
  }
]`;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "你是专业的短视频内容策划师，擅长为本地商家老板策划短视频内容。输出必须是纯 JSON 数组，不要任何解释文字。" },
            { role: "user", content: prompt },
          ],
          temperature: 0.8,
          max_tokens: 4000,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "生成失败");
        setGenerating(false);
        return;
      }

      const aiContent = data.choices?.[0]?.message?.content || "";
      const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        setErrorMsg("AI 返回格式异常，请重试");
        setGenerating(false);
        return;
      }

      const parsed = JSON.parse(jsonMatch[0]) as Topic[];
      const allTopics: Topic[] = parsed.map((t, i) => ({
        ...t,
        id: `${t.type}-${Date.now()}-${i}`,
        status: "done" as const,
      }));

      setTopics(allTopics);

      // Update credits after successful generation
      const creditsRes = await fetch("/api/credits/balance");
      if (creditsRes.ok) {
        const cd = await creditsRes.json();
        setCredits(prev => ({ ...prev, balance: cd.balance, usedToday: cd.usedToday }));
      }
    } catch (err: any) {
      setErrorMsg(err.message || "请求失败");
    }
    setGenerating(false);
  }, [activeProfileId, profiles]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const activeProfile = activeProfileId ? profiles.find(p => p.id === activeProfileId) : null;
  const totalTopics = topics.length;
  const doneTopics = topics.filter(t => t.status === "done").length;

  const handleDeleteProfile = async (id: string) => {
    await fetch(`/api/profiles/${id}`, { method: "DELETE" });
    const updated = profiles.filter(p => p.id !== id);
    setProfiles(updated);
    if (activeProfileId === id) {
      setActiveProfileId(updated.length > 0 ? updated[0].id : null);
      setTopics([]);
      setSelectedTopic(null);
    }
  };

  const handleSelectProfile = (id: string) => {
    setActiveProfileId(id);
    setTopics([]);
    setSelectedTopic(null);
    setView("workspace");
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-text-muted">加载中...</p>
      </div>
    );
  }

  // Not logged in — show landing with login/register CTAs
  if (!user) {
    return (
      <div className="min-h-screen bg-cream text-text">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 lg:px-8">
          <span className="text-sm text-text-muted tracking-wider">创世者 Copilot</span>
          <div className="flex items-center gap-4">
            <a href="/login" className="text-sm text-text-muted hover:text-text transition">登录</a>
            <a href="/register" className="rounded-full border border-brown bg-white px-4 py-2 text-sm font-medium text-brown shadow-sm transition hover:border-brown-dark hover:bg-cream-light">
              注册
            </a>
          </div>
        </nav>

        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.80),_transparent_40%),radial-gradient(circle_at_top_right,_rgba(139,94,52,0.18),_transparent_35%)]" />
          <main className="relative mx-auto max-w-6xl px-6 pb-16 pt-10 lg:px-8 lg:pb-24">
            <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-end">
              <div className="space-y-6">
                <p className="text-xs uppercase tracking-[0.36em] text-text-muted">创世者 Copilot</p>
                <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight text-text sm:text-5xl">
                  先建一个 IP，再谋划整周发布方案。
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-text-muted">
                  把单条爆款生成器，升级成整个账号的周策划工作台。先把人设、行业和目标设定好，再让 AI 帮你生成可落地的选题池。
                </p>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <a href="/register" className="inline-flex items-center justify-center rounded-full bg-brown px-8 py-4 text-base font-medium text-white shadow-lg shadow-brown/10 transition hover:bg-brown-dark">
                    免费注册
                  </a>
                  <a href="/login" className="inline-flex items-center justify-center rounded-full border border-border bg-white px-8 py-4 text-base font-medium text-text transition hover:border-brown hover:text-brown">
                    登录
                  </a>
                </div>
              </div>

              <div className="grid gap-5">
                <div className="rounded-3xl bg-white p-8 shadow-[0_18px_50px_rgba(44,24,16,0.06)]">
                  <p className="text-sm uppercase tracking-[0.3em] text-text-muted">每日免费</p>
                  <p className="mt-4 text-5xl font-serif font-bold text-text">{credits.dailyQuota || 10}</p>
                  <p className="mt-2 text-sm text-text-muted">每日 AI 调用次数</p>
                </div>
                <div className="rounded-3xl bg-brown p-8 text-white shadow-[0_18px_50px_rgba(44,24,16,0.08)]">
                  <p className="text-sm uppercase tracking-[0.3em] text-white/70">零门槛</p>
                  <p className="mt-4 text-3xl font-serif font-bold">注册即用</p>
                  <p className="mt-2 text-sm text-white/75">无需付费，注册即送每日额度</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ===== LOGGED IN =====
  return (
    <div className="min-h-screen bg-cream text-text">
      {/* NAV */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 lg:px-8">
        <span className="cursor-pointer text-sm text-text-muted tracking-wider" onClick={() => setView("landing")}>创世者 Copilot</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-text-muted">
            {user.name} · {credits.balance} 次
          </span>
          {user.role === "ADMIN" && (
            <button onClick={() => setView("admin")} className="text-sm text-brown hover:text-brown-dark transition">
              管理
            </button>
          )}
          <button onClick={() => setView("archive")} className="text-sm text-text-muted hover:text-text transition">
            档案库
          </button>
          <button onClick={() => setView("form")} className="rounded-full border border-brown bg-white px-4 py-2 text-sm font-medium text-brown shadow-sm transition hover:border-brown-dark hover:bg-cream-light">
            新建 IP
          </button>
          <button onClick={handleLogout} className="text-sm text-text-muted hover:text-red-500 transition">
            退出
          </button>
        </div>
      </nav>

      {/* LANDING VIEW */}
      {view === "landing" && (
        <>
          <div className="relative overflow-hidden">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.80),_transparent_40%),radial-gradient(circle_at_top_right,_rgba(139,94,52,0.18),_transparent_35%)]" />
            <main className="relative mx-auto max-w-6xl px-6 pb-16 pt-10 lg:px-8 lg:pb-24">
              <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-end">
                <div className="space-y-6">
                  <p className="text-xs uppercase tracking-[0.36em] text-text-muted">欢迎回来，{user.name}</p>
                  <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight text-text sm:text-5xl">
                    继续你的 IP 内容策划。
                  </h1>
                  <p className="max-w-2xl text-lg leading-8 text-text-muted">
                    今日剩余 {credits.balance} 次 AI 调用，已用 {credits.usedToday} 次。
                  </p>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <button onClick={() => setView("form")} className="inline-flex items-center justify-center rounded-full bg-brown px-8 py-4 text-base font-medium text-white shadow-lg shadow-brown/10 transition hover:bg-brown-dark">
                      新建 IP 档案
                    </button>
                    {profiles.length > 0 && (
                      <button onClick={() => { setActiveProfileId(profiles[0].id); setView("workspace"); }} className="inline-flex items-center justify-center rounded-full border border-border bg-white px-8 py-4 text-base font-medium text-text transition hover:border-brown hover:text-brown">
                        进入工作台
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid gap-5">
                  <div className="rounded-3xl bg-white p-8 shadow-[0_18px_50px_rgba(44,24,16,0.06)]">
                    <p className="text-sm uppercase tracking-[0.3em] text-text-muted">今日余额</p>
                    <p className="mt-4 text-5xl font-serif font-bold text-text">{credits.balance}</p>
                    <p className="mt-2 text-sm text-text-muted">剩余 AI 调用次数</p>
                  </div>
                  <div className="rounded-3xl bg-brown p-8 text-white shadow-[0_18px_50px_rgba(44,24,16,0.08)] cursor-pointer transition hover:bg-brown-dark" onClick={() => setView("archive")}>
                    <p className="text-sm uppercase tracking-[0.3em] text-white/70">IP 档案</p>
                    <p className="mt-4 text-5xl font-serif font-bold">{profiles.length}</p>
                    <p className="mt-2 text-sm text-white/75">已创建 IP 数量</p>
                  </div>
                </div>
              </div>
            </main>
          </div>

          <section className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[1.4fr_0.95fr]">
              <div className="grid gap-6">
                <div className="rounded-[28px] bg-white p-8 shadow-[0_18px_50px_rgba(44,24,16,0.06)]">
                  <h2 className="font-serif text-3xl font-bold text-text leading-tight mb-4">从账号视角，而不是从单条文案视角开始。</h2>
                  <p className="text-sm leading-7 text-text-muted">
                    先把人设、行业、产品、目标和禁区整理成一个 IP 档案，再让 AI 一次生成整周选题池，避免单条文案碎片化输出。
                  </p>
                </div>
                <div className="rounded-[28px] bg-white p-8 shadow-[0_18px_50px_rgba(44,24,16,0.06)]">
                  <p className="text-sm font-medium text-text-muted mb-3">使用统计</p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-text">{credits.usedToday}</p>
                      <p className="text-xs text-text-muted">今日已用</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-text">{credits.dailyQuota}</p>
                      <p className="text-xs text-text-muted">每日额度</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-text">{profiles.length}</p>
                      <p className="text-xs text-text-muted">IP 档案</p>
                    </div>
                  </div>
                </div>
              </div>

              <aside className="rounded-[28px] bg-brown p-8 text-white shadow-[0_18px_50px_rgba(44,24,16,0.08)]">
                <h2 className="font-serif text-3xl font-bold leading-tight mb-6">每个策划方案，都是一个长期运营的 IP 档案。</h2>
                <ul className="space-y-4 text-sm leading-7">
                  <li className="flex gap-3"><span className="mt-1 text-brown-light font-bold">•</span><span>先录一次创始人、行业、产品、客户和内容禁区。</span></li>
                  <li className="flex gap-3"><span className="mt-1 text-brown-light font-bold">•</span><span>再按账号目标生成一周选题池，而不是临时抽一条。</span></li>
                  <li className="flex gap-3"><span className="mt-1 text-brown-light font-bold">•</span><span>最后从选题池点进单条执行，直接拿到完整发布包。</span></li>
                </ul>
              </aside>
            </div>
          </section>
        </>
      )}

      {/* FORM VIEW */}
      {view === "form" && (
        <section className="max-w-5xl mx-auto px-8 py-16">
          <div className="mb-8">
            <button onClick={() => setView("landing")} className="text-sm text-text-muted hover:text-brown transition">← 返回首页</button>
          </div>
          <div className="grid gap-10 lg:grid-cols-[1.9fr_1fr]">
            <div className="space-y-10">
              <div className="space-y-4">
                <p className="text-xs text-text-muted uppercase tracking-wider">Knowledge Base</p>
                <h2 className="font-serif text-4xl font-bold text-text leading-tight">这个 IP 的底层资料。</h2>
                <p className="max-w-2xl text-sm text-text-muted">在左侧填写核心 IP 信息，右侧实时预览当前档案状态。</p>
              </div>

              <div className="grid gap-6 rounded-[28px] bg-white p-8 shadow-[0_18px_50px_rgba(44,24,16,0.06)]">
                <div>
                  <label className="text-sm font-medium text-text-muted mb-2 block">IP 名称</label>
                  <input type="text" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    placeholder="比如：老韦的广西餐饮号"
                    className="w-full bg-cream-light border border-border rounded-2xl px-5 py-3 text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-brown/20 focus:border-brown" />
                </div>
                <div>
                  <label className="text-sm font-medium text-text-muted mb-2 block">创始人姓名</label>
                  <input type="text" value={formData.founder} onChange={e => setFormData(p => ({ ...p, founder: e.target.value }))}
                    placeholder="比如：韦总"
                    className="w-full bg-cream-light border border-border rounded-2xl px-5 py-3 text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-brown/20 focus:border-brown" />
                </div>
                <div>
                  <label className="text-sm font-medium text-text-muted mb-3 block">创始人人设特点</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {PERSONA_OPTIONS.map(tag => (
                      <button key={tag} onClick={() => toggleTag("personas", tag)}
                        className={`px-4 py-2 rounded-full text-sm transition-colors ${isSelected("personas", tag) ? "bg-brown text-white" : "bg-white border border-border text-text-muted hover:border-brown"}`}>
                        {tag}
                      </button>
                    ))}
                  </div>
                  <textarea value={formData.personaExtra} onChange={e => setFormData(p => ({ ...p, personaExtra: e.target.value }))}
                    placeholder="可以补充一句更具体的人设" rows={3}
                    className="w-full bg-cream-light border border-border rounded-2xl px-5 py-3 text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-brown/20 focus:border-brown resize-none" />
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-[28px] bg-white p-8 shadow-[0_18px_50px_rgba(44,24,16,0.06)]">
                  <p className="text-sm text-text-muted uppercase tracking-wider mb-3">行业</p>
                  <div className="flex flex-wrap gap-2">
                    {INDUSTRY_OPTIONS.map(tag => (
                      <button key={tag} onClick={() => setFormData(p => ({ ...p, industry: tag }))}
                        className={`px-4 py-2 rounded-full text-sm transition-colors ${formData.industry === tag ? "bg-brown text-white" : "bg-white border border-border text-text-muted hover:border-brown"}`}>
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-[28px] bg-white p-8 shadow-[0_18px_50px_rgba(44,24,16,0.06)]">
                  <p className="text-sm text-text-muted uppercase tracking-wider mb-3">产品 / 服务</p>
                  <div className="flex flex-wrap gap-2">
                    {PRODUCT_OPTIONS.map(tag => (
                      <button key={tag} onClick={() => toggleTag("products", tag)}
                        className={`px-4 py-2 rounded-full text-sm transition-colors ${isSelected("products", tag) ? "bg-brown text-white" : "bg-white border border-border text-text-muted hover:border-brown"}`}>
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-[28px] bg-white p-8 shadow-[0_18px_50px_rgba(44,24,16,0.06)]">
                  <p className="text-sm text-text-muted uppercase tracking-wider mb-3">目标客户</p>
                  <div className="flex flex-wrap gap-2">
                    {CUSTOMER_OPTIONS.map(tag => (
                      <button key={tag} onClick={() => toggleTag("customers", tag)}
                        className={`px-4 py-2 rounded-full text-sm transition-colors ${isSelected("customers", tag) ? "bg-brown text-white" : "bg-white border border-border text-text-muted hover:border-brown"}`}>
                        {tag}
                      </button>
                    ))}
                  </div>
                  <textarea value={formData.customerExtra} onChange={e => setFormData(p => ({ ...p, customerExtra: e.target.value }))}
                    placeholder="可以补充年龄、城市、消费能力或真实痛点。" rows={3}
                    className="w-full bg-cream-light border border-border rounded-2xl px-5 py-3 mt-4 text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-brown/20 focus:border-brown resize-none" />
                </div>
                <div className="rounded-[28px] bg-white p-8 shadow-[0_18px_50px_rgba(44,24,16,0.06)]">
                  <p className="text-sm text-text-muted uppercase tracking-wider mb-3">账号目标</p>
                  <div className="flex flex-wrap gap-2">
                    {GOAL_OPTIONS.map(tag => (
                      <button key={tag} onClick={() => toggleTag("goals", tag)}
                        className={`px-4 py-2 rounded-full text-sm transition-colors ${isSelected("goals", tag) ? "bg-brown text-white" : "bg-white border border-border text-text-muted hover:border-brown"}`}>
                        {tag}
                      </button>
                    ))}
                  </div>
                  <textarea value={formData.goalExtra} onChange={e => setFormData(p => ({ ...p, goalExtra: e.target.value }))}
                    placeholder="可以补充阶段目标" rows={3}
                    className="w-full bg-cream-light border border-border rounded-2xl px-5 py-3 mt-4 text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-brown/20 focus:border-brown resize-none" />
                </div>
              </div>

              <div className="rounded-[28px] bg-white p-8 shadow-[0_18px_50px_rgba(44,24,16,0.06)]">
                <p className="text-sm text-text-muted uppercase tracking-wider mb-3">内容禁区</p>
                <div className="flex flex-wrap gap-2">
                  {FORBIDDEN_OPTIONS.map(tag => (
                    <button key={tag} onClick={() => toggleTag("forbidden", tag)}
                      className={`px-4 py-2 rounded-full text-sm transition-colors ${isSelected("forbidden", tag) ? "bg-brown text-white" : "bg-white border border-border text-text-muted hover:border-brown"}`}>
                      {tag}
                    </button>
                  ))}
                </div>
                <textarea value={formData.forbiddenExtra} onChange={e => setFormData(p => ({ ...p, forbiddenExtra: e.target.value }))}
                  placeholder="可以补充不能碰的话题、品牌语气、合规边界。" rows={3}
                  className="w-full bg-cream-light border border-border rounded-2xl px-5 py-3 mt-4 text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-brown/20 focus:border-brown resize-none" />
              </div>

              <div className="rounded-[28px] bg-white p-8 shadow-[0_18px_50px_rgba(44,24,16,0.06)]">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between mb-5">
                  <div>
                    <p className="text-sm text-text-muted uppercase tracking-wider">Content Mix</p>
                    <p className="text-lg font-semibold text-text">{formData.mixTraffic}:{formData.mixPersona}:{formData.mixProduct}</p>
                  </div>
                  <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                    <span className="rounded-full bg-cream px-3 py-1 text-xs text-text-muted">默认 4:2:1 可编辑</span>
                    <button onClick={handleCreate} className="rounded-full bg-brown px-5 py-3 text-sm font-medium text-white transition hover:bg-brown-dark">
                      创建 IP 档案
                    </button>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { label: "流量型", value: formData.mixTraffic, onInc: () => setFormData(p => ({ ...p, mixTraffic: Math.min(10, p.mixTraffic + 1) })), onDec: () => setFormData(p => ({ ...p, mixTraffic: Math.max(0, p.mixTraffic - 1) })) },
                    { label: "人设型", value: formData.mixPersona, onInc: () => setFormData(p => ({ ...p, mixPersona: Math.min(10, p.mixPersona + 1) })), onDec: () => setFormData(p => ({ ...p, mixPersona: Math.max(0, p.mixPersona - 1) })) },
                    { label: "产品型", value: formData.mixProduct, onInc: () => setFormData(p => ({ ...p, mixProduct: Math.min(10, p.mixProduct + 1) })), onDec: () => setFormData(p => ({ ...p, mixProduct: Math.max(0, p.mixProduct - 1) })) },
                  ].map(item => (
                    <div key={item.label} className="rounded-3xl bg-cream-light p-5 text-center">
                      <p className="text-sm text-text-muted mb-3">{item.label}</p>
                      <p className="text-3xl font-bold text-text">{item.value}</p>
                      <div className="mt-4 flex items-center justify-center gap-2">
                        <button onClick={item.onInc} className="h-10 w-10 rounded-xl bg-white border border-border text-text transition hover:border-brown">+</button>
                        <button onClick={item.onDec} className="h-10 w-10 rounded-xl bg-white border border-border text-text transition hover:border-brown">−</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside className="rounded-[28px] bg-white p-8 shadow-[0_18px_50px_rgba(44,24,16,0.06)] self-start">
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.35em] text-text-muted">档案预览</p>
                <h2 className="font-serif text-3xl font-bold text-text">右侧实时预览</h2>
              </div>
              <div className="mt-6 rounded-3xl bg-cream-light p-6 space-y-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-text-muted">IP 名称</p>
                  <p className="mt-2 text-lg font-semibold text-text">{formData.name || "尚未填写"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-text-muted">创始人</p>
                  <p className="mt-2 text-sm text-text">{formData.founder || "尚未填写"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-text-muted">行业 / 产品</p>
                  <p className="mt-2 text-sm text-text">{formData.industry || "未选择"} {formData.products.length > 0 ? ` / ${formData.products.join("、")}` : ""}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-text-muted">目标客户</p>
                  <p className="mt-2 text-sm text-text">{formData.customers.length > 0 ? formData.customers.join("、") : "未选择"}</p>
                </div>
              </div>
              <button onClick={handleCreate} className="mt-6 w-full rounded-3xl bg-brown px-6 py-4 text-lg font-medium text-white transition hover:bg-brown-dark">
                创建 IP 档案
              </button>
            </aside>
          </div>
        </section>
      )}

      {/* WORKSPACE VIEW */}
      {view === "workspace" && activeProfile && (
        <section className="max-w-5xl mx-auto px-8 py-16 space-y-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-serif text-3xl font-bold text-text mb-2">{activeProfile.name}</h1>
              <p className="text-text-muted">{activeProfile.industry} · 创始人：{activeProfile.founder}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {(activeProfile.personas || []).map((p: string) => (
                  <span key={p} className="px-3 py-1 bg-white rounded-full text-xs text-text-muted border border-border">{p}</span>
                ))}
              </div>
            </div>
            <button onClick={() => setView("archive")} className="text-sm text-text-muted hover:text-brown transition shrink-0">
              查看所有档案 →
            </button>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(44,24,16,0.08)]">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-3">本周内容配比</p>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-brown"></span><span className="text-sm text-text">流量型 x {activeProfile.mix?.traffic}</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-brown-light"></span><span className="text-sm text-text">人设型 x {activeProfile.mix?.persona}</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-border"></span><span className="text-sm text-text">产品型 x {activeProfile.mix?.product}</span></div>
            </div>
          </div>

          {!generating && totalTopics === 0 && (
            <button onClick={handleGenerate}
              className="w-full bg-brown text-white py-5 rounded-2xl text-lg font-medium hover:bg-brown-dark transition-colors">
              生成本周选题池
            </button>
          )}

          {generating && (
            <div className="bg-white rounded-2xl p-12 text-center shadow-[0_1px_3px_rgba(44,24,16,0.08)]">
              <div className="text-4xl mb-4 text-brown">[ ]</div>
              <p className="text-lg text-text font-medium">AI 正在熬本周选题...</p>
              <p className="text-sm text-text-muted mt-2">结合 IP 档案和账号目标，生成定制选题池</p>
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
              <p className="text-red-600 font-medium mb-2">生成失败</p>
              <p className="text-sm text-red-500 mb-4">{errorMsg}</p>
              <button onClick={handleGenerate} className="bg-brown text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-brown-dark transition-colors">
                重试
              </button>
            </div>
          )}

          {totalTopics > 0 && !selectedTopic && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-xl font-bold text-text">本周选题池</h2>
                <span className="text-sm text-text-muted">已完成 {doneTopics}/{totalTopics}</span>
              </div>
              <div className="space-y-3">
                {topics.map((topic, i) => (
                  <div key={topic.id} onClick={() => setSelectedTopic(topic)}
                    className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(44,24,16,0.08)] cursor-pointer transition-all hover:shadow-md">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xs text-text-muted font-mono">#{i + 1}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            topic.type === "traffic" ? "bg-brown/10 text-brown" :
                            topic.type === "persona" ? "bg-brown-light/10 text-brown-light" :
                            "bg-border text-text-muted"
                          }`}>
                            {topic.type === "traffic" ? "流量型" : topic.type === "persona" ? "人设型" : "产品型"}
                          </span>
                        </div>
                        <h3 className="font-medium text-text mb-1">{topic.title}</h3>
                        <p className="text-sm text-text-muted">{topic.description}</p>
                      </div>
                      <span className={`ml-4 px-2 py-1 rounded-full text-xs ${
                        topic.status === "done" ? "bg-green-50 text-green-600" : "bg-cream text-text-muted"
                      }`}>
                        {topic.status === "done" ? "已生成" : "待生成"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedTopic && (
            <div className="bg-white rounded-2xl p-8 shadow-[0_1px_3px_rgba(44,24,16,0.08)] space-y-6">
              <h2 className="font-serif text-2xl font-bold text-text">{selectedTopic.title}</h2>
              <div>
                <h3 className="text-sm font-medium text-text-muted mb-3 uppercase tracking-wider">完整脚本</h3>
                <div className="bg-cream-light rounded-xl p-5 text-sm text-text leading-relaxed whitespace-pre-line">{selectedTopic.script}</div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-text-muted mb-3 uppercase tracking-wider">发布文案</h3>
                <div className="bg-cream-light rounded-xl p-5 text-sm text-text">{selectedTopic.publishCopy}</div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-text-muted mb-3 uppercase tracking-wider">拍摄建议</h3>
                <div className="bg-cream-light rounded-xl p-5 text-sm text-text whitespace-pre-line">{selectedTopic.shootingTips}</div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { if (selectedTopic.script) { navigator.clipboard.writeText(selectedTopic.script); } }}
                  className="bg-brown text-white px-6 py-3 rounded-xl font-medium hover:bg-brown-dark transition-colors">
                  复制脚本
                </button>
                <button onClick={() => setSelectedTopic(null)}
                  className="bg-white border border-border text-text px-6 py-3 rounded-xl font-medium hover:border-brown transition-colors">
                  返回选题池
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ARCHIVE VIEW */}
      {view === "archive" && (
        <section className="max-w-4xl mx-auto px-8 py-16">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="font-serif text-4xl font-bold text-text mb-2">已创建的 IP 档案</h1>
              <p className="text-text-muted">每个 IP 档案都是一个长期运营的账号知识库</p>
            </div>
            <button onClick={() => setView("landing")} className="text-sm text-text-muted hover:text-brown transition shrink-0">← 返回首页</button>
          </div>

          {profiles.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-[0_1px_3px_rgba(44,24,16,0.08)]">
              <p className="text-text-muted mb-6">还没有创建过 IP 档案</p>
              <button onClick={() => setView("form")} className="rounded-full bg-brown px-6 py-3 text-sm font-medium text-white transition hover:bg-brown-dark">
                创建第一个 IP
              </button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {profiles.map(profile => (
                <div key={profile.id} className="group rounded-[28px] border border-transparent bg-white p-6 shadow-[0_12px_30px_rgba(44,24,16,0.06)] transition hover:border-brown/20 hover:shadow-lg">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 cursor-pointer" onClick={() => handleSelectProfile(profile.id)}>
                      <h2 className="font-serif text-xl font-bold text-text mb-1 truncate">{profile.name}</h2>
                      <p className="text-sm text-text-muted mb-3 truncate">{profile.industry} · 创始人：{profile.founder}</p>
                    </div>
                    <button type="button" onClick={() => handleDeleteProfile(profile.id)}
                      className="rounded-full border border-border bg-cream px-3 py-2 text-xs font-medium text-text-muted transition hover:border-red-300 hover:text-red-600">
                      删除
                    </button>
                  </div>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {(profile.personas || []).slice(0, 4).map((p: string) => (
                      <span key={p} className="rounded-full bg-cream px-3 py-1 text-xs text-text-muted">{p}</span>
                    ))}
                    {(profile.personas || []).length > 4 && (
                      <span className="rounded-full bg-cream px-3 py-1 text-xs text-text-muted">+{(profile.personas || []).length - 4}</span>
                    )}
                  </div>
                  <div className="grid gap-3 text-sm text-text-muted">
                    <div className="rounded-2xl bg-cream-light p-4">
                      <p className="font-medium text-text">{profile.mix?.traffic}:{profile.mix?.persona}:{profile.mix?.product}</p>
                      <p className="mt-1">流量/人设/产品</p>
                    </div>
                    <div className="rounded-2xl bg-cream-light p-4">
                      <p className="font-medium text-text">{new Date(profile.createdAt).toLocaleDateString("zh-CN")}</p>
                      <p className="mt-1">创建时间</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ADMIN VIEW */}
      {view === "admin" && user?.role === "ADMIN" && (
        <AdminPanel onBack={() => setView("landing")} />
      )}
    </div>
  );
}

// Admin Panel Component
function AdminPanel({ onBack }: { onBack: () => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [creditAmount, setCreditAmount] = useState("10");

  useEffect(() => {
    fetch("/api/admin/users")
      .then(r => r.json())
      .then(data => { setUsers(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleAdjustCredits = async (userId: string) => {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, credits: parseInt(creditAmount) }),
    });
    // Refresh
    const data = await (await fetch("/api/admin/users")).json();
    setUsers(data);
    setSelectedUser(null);
  };

  const handleToggleRole = async (userId: string, newRole: string) => {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: newRole }),
    });
    const data = await (await fetch("/api/admin/users")).json();
    setUsers(data);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("确定删除此用户及其所有数据？")) return;
    await fetch(`/api/admin/users?id=${userId}`, { method: "DELETE" });
    const data = await (await fetch("/api/admin/users")).json();
    setUsers(data);
    setSelectedUser(null);
  };

  if (loading) return <div className="text-center py-12 text-text-muted">加载中...</div>;

  return (
    <section className="max-w-4xl mx-auto px-8 py-16">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-serif text-4xl font-bold text-text mb-2">管理面板</h1>
          <p className="text-text-muted">用户管理 · 次数配置</p>
        </div>
        <button onClick={onBack} className="text-sm text-text-muted hover:text-brown transition shrink-0">← 返回首页</button>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(44,24,16,0.08)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cream-light">
            <tr>
              <th className="text-left px-6 py-4 text-text-muted font-medium">用户</th>
              <th className="text-left px-6 py-4 text-text-muted font-medium">角色</th>
              <th className="text-left px-6 py-4 text-text-muted font-medium">余额</th>
              <th className="text-left px-6 py-4 text-text-muted font-medium">档案数</th>
              <th className="text-left px-6 py-4 text-text-muted font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t border-border">
                <td className="px-6 py-4">
                  <p className="font-medium text-text">{u.name || u.username}</p>
                  <p className="text-xs text-text-muted">@{u.username}</p>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleToggleRole(u.id, u.role === "ADMIN" ? "USER" : "ADMIN")}
                    className={`px-3 py-1 rounded-full text-xs ${u.role === "ADMIN" ? "bg-brown text-white" : "bg-cream text-text-muted"}`}
                  >
                    {u.role === "ADMIN" ? "管理员" : "普通用户"}
                  </button>
                </td>
                <td className="px-6 py-4 text-text">{u.balance}</td>
                <td className="px-6 py-4 text-text">{u.profileCount}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedUser(u)} className="text-xs text-brown hover:underline">调整次数</button>
                    <button onClick={() => handleDelete(u.id)} className="text-xs text-red-500 hover:underline">删除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <div className="mt-6 bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(44,24,16,0.08)]">
          <h2 className="font-serif text-xl font-bold text-text mb-4">调整次数 — {selectedUser.name || selectedUser.username}</h2>
          <div className="flex gap-3">
            <input
              type="number"
              value={creditAmount}
              onChange={e => setCreditAmount(e.target.value)}
              className="bg-cream-light border border-border rounded-2xl px-5 py-3 text-text w-32"
              placeholder="次数"
            />
            <button
              onClick={() => handleAdjustCredits(selectedUser.id)}
              className="bg-brown text-white px-6 py-3 rounded-xl font-medium hover:bg-brown-dark transition-colors"
            >
              增加次数
            </button>
            <button
              onClick={() => setSelectedUser(null)}
              className="bg-white border border-border text-text px-6 py-3 rounded-xl font-medium hover:border-brown transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
