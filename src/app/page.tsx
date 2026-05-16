"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  PERSONA_OPTIONS, INDUSTRY_OPTIONS, PRODUCT_OPTIONS,
  CUSTOMER_OPTIONS, GOAL_OPTIONS, FORBIDDEN_OPTIONS,
} from "@/lib/store";
import { LoadingScreen } from "@/components/loading";

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

interface Script {
  id: string;
  profileId: string;
  topicId?: string;
  content: string;
  version: number;
  isSavedToKnowledge: boolean;
  createdAt: string;
  updatedAt: string;
}

interface KnowledgeData {
  profileId: string;
  name: string;
  knowledgeContent: string | null;
  feedScripts: Array<{ content: string; updatedAt: string; source: string }>;
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
  const [view, setView] = useState<"landing" | "form" | "workspace" | "archive" | "admin" | "corpus">("landing");

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

  // Corpus state
  const [corpusProfileId, setCorpusProfileId] = useState<string | null>(null);
  const [corpusEntries, setCorpusEntries] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [corpusFilter, setCorpusFilter] = useState<string>("all");

  // Script state (PRD v2: 三版本脚本)
  const [scripts, setScripts] = useState<Script[]>([]);
  const [activeScriptId, setActiveScriptId] = useState<string | null>(null);
  const [generatingScripts, setGeneratingScripts] = useState(false);
  const [rewriteInstruction, setRewriteInstruction] = useState("");
  const [rewriting, setRewriting] = useState(false);
  const [savingToKnowledge, setSavingToKnowledge] = useState(false);

  // Knowledge state (PRD v2: 知识库可视化)
  const [knowledge, setKnowledge] = useState<KnowledgeData | null>(null);
  const [editingKnowledge, setEditingKnowledge] = useState(false);
  const [knowledgeDraft, setKnowledgeDraft] = useState("");

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

    // Fetch memories and confirmed corpus for context
    let memoryContext = "";
    let corpusContext = "";

    try {
      const memRes = await fetch(`/api/memory?profileId=${activeProfileId}`);
      if (memRes.ok) {
        const mems: any[] = await memRes.json();
        if (mems.length > 0) {
          const byCategory: Record<string, string[]> = {};
          mems.forEach(m => {
            if (!byCategory[m.categoryLabel]) byCategory[m.categoryLabel] = [];
            byCategory[m.categoryLabel].push(m.content);
          });
          memoryContext = "\n【账号记忆】\n" + Object.entries(byCategory).map(([cat, items]) =>
            `- ${cat}：${items.join("；")}`
          ).join("\n");
        }
      }
    } catch { /* ignore memory fetch errors */ }

    try {
      const corpusRes = await fetch(`/api/corpus?profileId=${activeProfileId}&status=confirmed`);
      if (corpusRes.ok) {
        const corpusData: any[] = await corpusRes.json();
        if (corpusData.length > 0) {
          corpusContext = "\n【语料库摘要】\n" + corpusData.map(c =>
            `- ${c.fileName}：${c.summary || ""}${c.tags && c.tags.length > 0 ? `（标签：${c.tags.join("、")}）` : ""}`
          ).join("\n");
        }
      }
    } catch { /* ignore corpus fetch errors */ }

    // 获取知识库内容
    let knowledgeContext = "";
    try {
      const kbRes = await fetch(`/api/knowledge?profileId=${activeProfileId}`);
      if (kbRes.ok) {
        const kbData: KnowledgeData = await kbRes.json();
        setKnowledge(kbData);
        if (kbData.knowledgeContent) {
          knowledgeContext = `\n【IP 知识库】\n${kbData.knowledgeContent}`;
        }
      }
    } catch { /* ignore */ }

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
${memoryContext}${corpusContext}${knowledgeContext}
【要求】
1. 严格按照配比数量生成对应类型的选题
2. 每个选题必须包含：title（标题，要有吸引力）、description（一句话描述）、script（完整口播脚本，含开头钩子+正文+结尾引导）、publishCopy（发布文案，含话题标签）、shootingTips（拍摄建议）
3. 流量型选题要能引发共鸣或争议，人设型要体现创始人真实故事，产品型要展示产品价值
4. 所有脚本必须口语化，符合创始人的人设特点，遵守内容禁区
5. 每条脚本长度 200-300 字，适合 30-45 秒视频
6. 参考账号记忆中的偏好和禁忌，参考语料库中的历史内容风格，参考知识库中的萃取信息

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

  // ===== 脚本管理功能（PRD v2） =====

  // 为单个选题生成 3 个差异化版本脚本
  const handleGenerateScripts = async (topic: Topic) => {
    if (!activeProfileId) return;
    setGeneratingScripts(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/scripts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: activeProfileId,
          topicId: topic.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "脚本生成失败");
        setGeneratingScripts(false);
        return;
      }

      setScripts(data.scripts);
      setActiveScriptId(data.scripts[0]?.id || null);
    } catch (err: any) {
      setErrorMsg(err.message || "请求失败");
    }
    setGeneratingScripts(false);
  };

  // 批量生成本周所有选题的脚本（一键生成完整发布包）
  const handleGenerateFullPackage = async () => {
    if (!activeProfileId || topics.length === 0) return;
    setGeneratingScripts(true);
    setErrorMsg("");

    try {
      // 先加载知识库
      try {
        const kbRes = await fetch(`/api/knowledge?profileId=${activeProfileId}`);
        if (kbRes.ok) setKnowledge(await kbRes.json());
      } catch { /* ignore */ }

      // 为每个选题生成脚本
      const allScripts: Script[] = [];
      for (const topic of topics) {
        const res = await fetch("/api/scripts/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileId: activeProfileId, topicId: topic.id }),
        });
        if (res.ok) {
          const data = await res.json();
          allScripts.push(...data.scripts);
        }
      }
      setScripts(allScripts);
      setActiveScriptId(allScripts[0]?.id || null);

      const creditsRes = await fetch("/api/credits/balance");
      if (creditsRes.ok) {
        const cd = await creditsRes.json();
        setCredits(prev => ({ ...prev, balance: cd.balance, usedToday: cd.usedToday }));
      }
    } catch (err: any) {
      setErrorMsg(err.message || "请求失败");
    }
    setGeneratingScripts(false);
  };

  // 自定义指令改写脚本
  const handleRewriteScript = async () => {
    if (!rewriteInstruction.trim() || !activeProfileId) return;
    setRewriting(true);

    try {
      const res = await fetch("/api/scripts/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scriptId: activeScriptId,
          instruction: rewriteInstruction,
          profileId: activeProfileId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "改写失败");
        setRewriting(false);
        return;
      }

      setScripts(prev => [...prev, data.script]);
      setActiveScriptId(data.script.id);
      setRewriteInstruction("");
    } catch (err: any) {
      setErrorMsg(err.message || "请求失败");
    }
    setRewriting(false);
  };

  // 保存脚本修改到知识库（记忆迭代核心功能）
  const handleSaveToKnowledge = async () => {
    if (!activeProfileId || !activeScriptId) return;
    const activeScript = scripts.find(s => s.id === activeScriptId);
    if (!activeScript) return;

    setSavingToKnowledge(true);
    try {
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: activeProfileId,
          scriptContent: activeScript.content,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "保存知识库失败");
        return;
      }

      // 更新脚本状态
      setScripts(prev => prev.map(s =>
        s.id === activeScriptId ? { ...s, isSavedToKnowledge: true } : s
      ));

      // 更新知识库状态
      if (knowledge) {
        setKnowledge(prev => prev ? { ...prev, knowledgeContent: data.knowledgeContent } : null);
      }

      // 更新 credits
      const creditsRes = await fetch("/api/credits/balance");
      if (creditsRes.ok) {
        const cd = await creditsRes.json();
        setCredits(prev => ({ ...prev, balance: cd.balance }));
      }
    } catch (err: any) {
      setErrorMsg(err.message || "请求失败");
    }
    setSavingToKnowledge(false);
  };

  // 加载脚本
  const loadScripts = async (topicId: string) => {
    if (!activeProfileId) return;
    try {
      const res = await fetch(`/api/scripts?profileId=${activeProfileId}&topicId=${topicId}`);
      if (res.ok) {
        const data: Script[] = await res.json();
        setScripts(data);
        setActiveScriptId(data[0]?.id || null);
      }
    } catch { /* ignore */ }
  };

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
    return <LoadingScreen />;
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

        {/* ===== 理念介绍 ===== */}
        <section className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl font-bold text-text mb-4">从账号视角，而不是从单条文案视角开始。</h2>
            <p className="max-w-2xl mx-auto text-lg text-text-muted">
              先把人设、行业、产品、客户和禁区整理成一个 IP 档案，再让 AI 一次生成整周选题池，避免单条文案碎片化输出。
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-[28px] bg-white p-8 shadow-[0_12px_30px_rgba(44,24,16,0.06)] transition hover:shadow-lg">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brown/10 text-brown text-xl font-bold">1</div>
              <h3 className="font-serif text-xl font-bold text-text mb-3">IP 档案创建</h3>
              <p className="text-sm leading-7 text-text-muted">
                填写创始人、行业、产品、客户、账号目标和内容禁区，建立完整的 IP 档案。支持 4:2:1 内容配比自定义。
              </p>
            </div>

            <div className="rounded-[28px] bg-white p-8 shadow-[0_12px_30px_rgba(44,24,16,0.06)] transition hover:shadow-lg">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brown/10 text-brown text-xl font-bold">2</div>
              <h3 className="font-serif text-xl font-bold text-text mb-3">4:2:1 内容配比</h3>
              <p className="text-sm leading-7 text-text-muted">
                流量型、人设型、产品型三种内容类型，默认 4:2:1 黄金比例。每周按配比生成选题池，保证内容结构健康。
              </p>
            </div>

            <div className="rounded-[28px] bg-white p-8 shadow-[0_12px_30px_rgba(44,24,16,0.06)] transition hover:shadow-lg">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brown/10 text-brown text-xl font-bold">3</div>
              <h3 className="font-serif text-xl font-bold text-text mb-3">AI 知识库</h3>
              <p className="text-sm leading-7 text-text-muted">
                上传脚本、访谈、账号资料等语料，AI 自动分析萃取人设特征、话术技巧、风格偏好和禁区，沉淀为结构化知识库。
              </p>
            </div>

            <div className="rounded-[28px] bg-white p-8 shadow-[0_12px_30px_rgba(44,24,16,0.06)] transition hover:shadow-lg">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brown/10 text-brown text-xl font-bold">4</div>
              <h3 className="font-serif text-xl font-bold text-text mb-3">一键选题生成</h3>
              <p className="text-sm leading-7 text-text-muted">
                点击「生成本周选题池」，AI 结合 IP 档案、账号记忆和知识库，一次生成完整的周选题方案。
              </p>
            </div>

            <div className="rounded-[28px] bg-white p-8 shadow-[0_12px_30px_rgba(44,24,16,0.06)] transition hover:shadow-lg">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brown/10 text-brown text-xl font-bold">5</div>
              <h3 className="font-serif text-xl font-bold text-text mb-3">三版本脚本生成</h3>
              <p className="text-sm leading-7 text-text-muted">
                为每个选题生成 3 个差异化脚本版本，支持自定义指令改写，修改满意后保存至知识库。
              </p>
            </div>

            <div className="rounded-[28px] bg-white p-8 shadow-[0_12px_30px_rgba(44,24,16,0.06)] transition hover:shadow-lg">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brown/10 text-brown text-xl font-bold">6</div>
              <h3 className="font-serif text-xl font-bold text-text mb-3">记忆迭代循环</h3>
              <p className="text-sm leading-7 text-text-muted">
                每次发现 AI 写偏或有新偏好，都可以记录为账号记忆。后续策划和生成都会参考记忆，越用越懂你的账号风格。
              </p>
            </div>
          </div>
        </section>

        {/* ===== 四步工作流 ===== */}
        <section className="mx-auto max-w-6xl px-6 pb-16 lg:px-8">
          <div className="rounded-[28px] bg-brown p-10 text-white shadow-[0_18px_50px_rgba(44,24,16,0.08)]">
            <h2 className="font-serif text-3xl font-bold leading-tight mb-8 text-center">从创建到发布，只需四步。</h2>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div className="text-center">
                <div className="mb-3 text-4xl font-serif font-bold text-white/30">01</div>
                <h3 className="text-lg font-bold mb-2">创建 IP 档案</h3>
                <p className="text-sm text-white/70">填写创始人、行业、产品、客户、目标和禁区</p>
              </div>
              <div className="text-center">
                <div className="mb-3 text-4xl font-serif font-bold text-white/30">02</div>
                <h3 className="text-lg font-bold mb-2">生成周选题池</h3>
                <p className="text-sm text-white/70">AI 按内容配比一次生成整周选题方案</p>
              </div>
              <div className="text-center">
                <div className="mb-3 text-4xl font-serif font-bold text-white/30">03</div>
                <h3 className="text-lg font-bold mb-2">选择并打磨脚本</h3>
                <p className="text-sm text-white/70">从三个版本中选择最合适的，用自定义指令改写</p>
              </div>
              <div className="text-center">
                <div className="mb-3 text-4xl font-serif font-bold text-white/30">04</div>
                <h3 className="text-lg font-bold mb-2">发布并沉淀记忆</h3>
                <p className="text-sm text-white/70">拿到完整发布包，将偏好沉淀为长期记忆</p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 底部 CTA + 核心能力 ===== */}
        <section className="mx-auto max-w-6xl px-6 pb-24 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_0.95fr]">
            <div className="rounded-[28px] bg-white p-8 shadow-[0_18px_50px_rgba(44,24,16,0.06)]">
              <h2 className="font-serif text-3xl font-bold text-text leading-tight mb-4">每个策划方案，都是一个长期运营的 IP 档案。</h2>
              <p className="text-sm leading-7 text-text-muted mb-8">
                不是单条爆款生成器，而是整个账号的周策划工作台。从账号视角出发，让每一次发布都有策略、有记忆、有积累。
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

            <aside className="rounded-[28px] bg-cream-light p-8 shadow-[0_12px_30px_rgba(44,24,16,0.04)]">
              <h2 className="font-serif text-2xl font-bold text-text leading-tight mb-6">核心能力一览</h2>
              <ul className="space-y-4 text-sm leading-7">
                <li className="flex gap-3"><span className="mt-1 text-brown font-bold">✓</span><span>完整 IP 档案：创始人、行业、产品、客户、目标、禁区</span></li>
                <li className="flex gap-3"><span className="mt-1 text-brown font-bold">✓</span><span>4:2:1 内容配比，流量/人设/产品三种类型</span></li>
                <li className="flex gap-3"><span className="mt-1 text-brown font-bold">✓</span><span>AI 语料库：上传脚本和资料，自动分析萃取</span></li>
                <li className="flex gap-3"><span className="mt-1 text-brown font-bold">✓</span><span>一键生成周选题池，含完整发布包</span></li>
                <li className="flex gap-3"><span className="mt-1 text-brown font-bold">✓</span><span>三版本脚本 + 自定义指令改写</span></li>
                <li className="flex gap-3"><span className="mt-1 text-brown font-bold">✓</span><span>账号记忆库，越用越懂你的风格</span></li>
                <li className="flex gap-3"><span className="mt-1 text-brown font-bold">✓</span><span>知识库可视化，手动编辑补充</span></li>
                <li className="flex gap-3"><span className="mt-1 text-brown font-bold">✓</span><span>每日免费 10 次 AI 调用，注册即用</span></li>
              </ul>
            </aside>
          </div>
        </section>
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
            <button onClick={() => setView("admin")} className="rounded-full bg-brown px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brown-dark">
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
                  {user.role === "ADMIN" && (
                    <div className="rounded-3xl bg-white p-8 shadow-[0_18px_50px_rgba(44,24,16,0.06)] cursor-pointer transition hover:shadow-lg border-2 border-brown/20" onClick={() => setView("admin")}>
                      <p className="text-sm uppercase tracking-[0.3em] text-text-muted">管理</p>
                      <p className="mt-4 text-3xl font-serif font-bold text-text">用户管理</p>
                      <p className="mt-2 text-sm text-text-muted">查看客户、调整积分</p>
                    </div>
                  )}
                </div>
              </div>
            </main>
          </div>

          <section className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="font-serif text-3xl font-bold text-text mb-4">从账号视角，而不是从单条文案视角开始。</h2>
              <p className="max-w-2xl mx-auto text-lg text-text-muted">
                先把人设、行业、产品、客户和禁区整理成一个 IP 档案，再让 AI 一次生成整周选题池，避免单条文案碎片化输出。
              </p>
            </div>

            {/* Feature Grid */}
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1: IP 档案创建 */}
              <div className="rounded-[28px] bg-white p-8 shadow-[0_12px_30px_rgba(44,24,16,0.06)] transition hover:shadow-lg">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brown/10 text-brown text-xl font-bold">1</div>
                <h3 className="font-serif text-xl font-bold text-text mb-3">IP 档案创建</h3>
                <p className="text-sm leading-7 text-text-muted">
                  填写创始人、行业、产品、客户、账号目标和内容禁区，建立一个完整的 IP 档案。支持 4:2:1 内容配比自定义。
                </p>
              </div>

              {/* Feature 2: 4:2:1 内容配比 */}
              <div className="rounded-[28px] bg-white p-8 shadow-[0_12px_30px_rgba(44,24,16,0.06)] transition hover:shadow-lg">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brown/10 text-brown text-xl font-bold">2</div>
                <h3 className="font-serif text-xl font-bold text-text mb-3">4:2:1 内容配比</h3>
                <p className="text-sm leading-7 text-text-muted">
                  流量型、人设型、产品型三种内容类型，默认 4:2:1 黄金比例，可自定义数量。每周按配比生成选题池，保证内容结构健康。
                </p>
              </div>

              {/* Feature 3: AI 知识库 */}
              <div className="rounded-[28px] bg-white p-8 shadow-[0_12px_30px_rgba(44,24,16,0.06)] transition hover:shadow-lg">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brown/10 text-brown text-xl font-bold">3</div>
                <h3 className="font-serif text-xl font-bold text-text mb-3">AI 知识库</h3>
                <p className="text-sm leading-7 text-text-muted">
                  上传脚本、访谈、账号资料等语料，AI 自动分析萃取人设特征、话术技巧、风格偏好和禁区，沉淀为结构化知识库。
                </p>
              </div>

              {/* Feature 4: 一键选题生成 */}
              <div className="rounded-[28px] bg-white p-8 shadow-[0_12px_30px_rgba(44,24,16,0.06)] transition hover:shadow-lg">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brown/10 text-brown text-xl font-bold">4</div>
                <h3 className="font-serif text-xl font-bold text-text mb-3">一键选题生成</h3>
                <p className="text-sm leading-7 text-text-muted">
                  点击「生成本周选题池」，AI 结合 IP 档案、账号记忆和知识库，一次生成完整的周选题方案，包含标题、描述、脚本、发布文案和拍摄建议。
                </p>
              </div>

              {/* Feature 5: 三版本脚本生成 */}
              <div className="rounded-[28px] bg-white p-8 shadow-[0_12px_30px_rgba(44,24,16,0.06)] transition hover:shadow-lg">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brown/10 text-brown text-xl font-bold">5</div>
                <h3 className="font-serif text-xl font-bold text-text mb-3">三版本脚本生成</h3>
                <p className="text-sm leading-7 text-text-muted">
                  为每个选题生成 3 个差异化脚本版本，支持自定义指令改写（变短、更通顺、加情绪、改风格），修改满意后保存至知识库。
                </p>
              </div>

              {/* Feature 6: 记忆迭代循环 */}
              <div className="rounded-[28px] bg-white p-8 shadow-[0_12px_30px_rgba(44,24,16,0.06)] transition hover:shadow-lg">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brown/10 text-brown text-xl font-bold">6</div>
                <h3 className="font-serif text-xl font-bold text-text mb-3">记忆迭代循环</h3>
                <p className="text-sm leading-7 text-text-muted">
                  每次发现 AI 写偏或有新偏好，都可以记录为账号记忆。后续策划和生成都会参考记忆，越用越懂你的账号风格。
                </p>
              </div>
            </div>
          </section>

          {/* Workflow Section */}
          <section className="mx-auto max-w-6xl px-6 pb-16 lg:px-8">
            <div className="rounded-[28px] bg-brown p-10 text-white shadow-[0_18px_50px_rgba(44,24,16,0.08)]">
              <h2 className="font-serif text-3xl font-bold leading-tight mb-8 text-center">从创建到发布，只需四步。</h2>
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                <div className="text-center">
                  <div className="mb-3 text-4xl font-serif font-bold text-white/30">01</div>
                  <h3 className="text-lg font-bold mb-2">创建 IP 档案</h3>
                  <p className="text-sm text-white/70">填写创始人、行业、产品、客户、目标和禁区</p>
                </div>
                <div className="text-center">
                  <div className="mb-3 text-4xl font-serif font-bold text-white/30">02</div>
                  <h3 className="text-lg font-bold mb-2">生成周选题池</h3>
                  <p className="text-sm text-white/70">AI 按内容配比一次生成整周选题方案</p>
                </div>
                <div className="text-center">
                  <div className="mb-3 text-4xl font-serif font-bold text-white/30">03</div>
                  <h3 className="text-lg font-bold mb-2">选择并打磨脚本</h3>
                  <p className="text-sm text-white/70">从三个版本中选择最合适的，用自定义指令改写</p>
                </div>
                <div className="text-center">
                  <div className="mb-3 text-4xl font-serif font-bold text-white/30">04</div>
                  <h3 className="text-lg font-bold mb-2">发布并沉淀记忆</h3>
                  <p className="text-sm text-white/70">拿到完整发布包，将偏好沉淀为长期记忆</p>
                </div>
              </div>
            </div>
          </section>

          {/* Trust / Summary Section */}
          <section className="mx-auto max-w-6xl px-6 pb-24 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[1.4fr_0.95fr]">
              <div className="grid gap-6">
                <div className="rounded-[28px] bg-white p-8 shadow-[0_18px_50px_rgba(44,24,16,0.06)]">
                  <h2 className="font-serif text-3xl font-bold text-text leading-tight mb-4">每个策划方案，都是一个长期运营的 IP 档案。</h2>
                  <p className="text-sm leading-7 text-text-muted">
                    不是单条爆款生成器，而是整个账号的周策划工作台。从账号视角出发，让每一次发布都有策略、有记忆、有积累。
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

              <aside className="rounded-[28px] bg-cream-light p-8 shadow-[0_12px_30px_rgba(44,24,16,0.04)]">
                <h2 className="font-serif text-2xl font-bold text-text leading-tight mb-6">核心能力一览</h2>
                <ul className="space-y-4 text-sm leading-7">
                  <li className="flex gap-3"><span className="mt-1 text-brown font-bold">✓</span><span>完整 IP 档案：创始人、行业、产品、客户、目标、禁区</span></li>
                  <li className="flex gap-3"><span className="mt-1 text-brown font-bold">✓</span><span>4:2:1 内容配比，流量/人设/产品三种类型</span></li>
                  <li className="flex gap-3"><span className="mt-1 text-brown font-bold">✓</span><span>AI 语料库：上传脚本和资料，自动分析萃取</span></li>
                  <li className="flex gap-3"><span className="mt-1 text-brown font-bold">✓</span><span>一键生成周选题池，含完整发布包</span></li>
                  <li className="flex gap-3"><span className="mt-1 text-brown font-bold">✓</span><span>三版本脚本 + 自定义指令改写</span></li>
                  <li className="flex gap-3"><span className="mt-1 text-brown font-bold">✓</span><span>账号记忆库，越用越懂你的风格</span></li>
                  <li className="flex gap-3"><span className="mt-1 text-brown font-bold">✓</span><span>知识库可视化，手动编辑补充</span></li>
                  <li className="flex gap-3"><span className="mt-1 text-brown font-bold">✓</span><span>每日免费 10 次 AI 调用，注册即用</span></li>
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
            <button onClick={() => { setCorpusProfileId(activeProfileId); setCorpusFilter("all"); setView("corpus"); }} className="text-sm text-brown hover:text-brown-dark transition shrink-0">
              语料库
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
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-8 shadow-[0_1px_3px_rgba(44,24,16,0.08)] space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-2xl font-bold text-text">{selectedTopic.title}</h2>
                  <button onClick={() => setSelectedTopic(null)}
                    className="text-sm text-text-muted hover:text-brown transition">← 返回选题池</button>
                </div>

                {/* 生成 3 版本脚本 */}
                {scripts.length === 0 && !generatingScripts && (
                  <button onClick={() => handleGenerateScripts(selectedTopic)}
                    className="w-full bg-brown text-white py-4 rounded-2xl text-base font-medium hover:bg-brown-dark transition-colors">
                    生成 3 个差异化脚本版本
                  </button>
                )}

                {generatingScripts && (
                  <div className="bg-cream-light rounded-xl p-8 text-center">
                    <p className="text-lg text-text font-medium">AI 正在生成脚本版本...</p>
                  </div>
                )}

                {/* 版本切换 */}
                {scripts.length > 0 && (
                  <>
                    <div className="flex gap-2">
                      {[1, 2, 3].map(v => {
                        const script = scripts.find(s => s.version === v);
                        return (
                          <button key={v} onClick={() => script && setActiveScriptId(script.id)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                              scripts.find(s => s.id === activeScriptId)?.version === v
                                ? "bg-brown text-white" : "bg-white border border-border text-text-muted hover:border-brown"
                            }`}>
                            版本 {v} {script?.isSavedToKnowledge ? "✓" : ""}
                          </button>
                        );
                      })}
                    </div>

                    {/* 当前脚本展示 */}
                    {activeScriptId && (() => {
                      const activeScript = scripts.find(s => s.id === activeScriptId);
                      if (!activeScript) return null;
                      return (
                        <div className="space-y-4">
                          <div className="bg-cream-light rounded-xl p-5 text-sm text-text leading-relaxed whitespace-pre-line">
                            {activeScript.content}
                          </div>

                          {/* 自定义指令改写 */}
                          <div className="flex gap-3">
                            <input
                              type="text"
                              value={rewriteInstruction}
                              onChange={e => setRewriteInstruction(e.target.value)}
                              placeholder="输入改写指令：变短、更通顺、加情绪、改风格..."
                              className="flex-1 bg-white border border-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-brown/20 focus:border-brown"
                              onKeyDown={e => e.key === "Enter" && handleRewriteScript()}
                            />
                            <button onClick={handleRewriteScript} disabled={!rewriteInstruction.trim() || rewriting}
                              className={`rounded-xl px-5 py-3 text-sm font-medium transition ${
                                !rewriteInstruction.trim() || rewriting
                                  ? "bg-border cursor-not-allowed text-text-muted"
                                  : "bg-brown text-white hover:bg-brown-dark"
                              }`}>
                              {rewriting ? "改写中..." : "改写"}
                            </button>
                          </div>

                          <div className="flex gap-3 flex-wrap">
                            <button onClick={() => { navigator.clipboard.writeText(activeScript.content); }}
                              className="bg-brown text-white px-6 py-3 rounded-xl font-medium hover:bg-brown-dark transition-colors">
                              复制脚本
                            </button>
                            <button onClick={handleSaveToKnowledge} disabled={savingToKnowledge}
                              className={`rounded-xl px-6 py-3 font-medium transition ${
                                savingToKnowledge
                                  ? "bg-border cursor-not-allowed text-text-muted"
                                  : activeScript.isSavedToKnowledge
                                    ? "bg-green-50 text-green-600 border border-green-200"
                                    : "bg-white border border-border text-text hover:border-brown"
                              }`}>
                              {savingToKnowledge ? "保存中..." : activeScript.isSavedToKnowledge ? "✓ 已入库" : "保存修改到知识库"}
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>

              {/* 发布包其余部分 */}
              <div className="bg-white rounded-2xl p-8 shadow-[0_1px_3px_rgba(44,24,16,0.08)] space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-text-muted mb-3 uppercase tracking-wider">发布文案</h3>
                  <div className="bg-cream-light rounded-xl p-5 text-sm text-text">{selectedTopic.publishCopy}</div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-text-muted mb-3 uppercase tracking-wider">拍摄建议</h3>
                  <div className="bg-cream-light rounded-xl p-5 text-sm text-text whitespace-pre-line">{selectedTopic.shootingTips}</div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* CORPUS VIEW */}
      {view === "corpus" && corpusProfileId && (
        <CorpusView
          profileId={corpusProfileId}
          profile={profiles.find(p => p.id === corpusProfileId)}
          entries={corpusEntries}
          setEntries={setCorpusEntries}
          uploading={uploading}
          setUploading={setUploading}
          analyzing={analyzing}
          setAnalyzing={setAnalyzing}
          filter={corpusFilter}
          setFilter={setCorpusFilter}
          onBack={() => setView("workspace")}
          onCreditsUpdate={(bal: number) => setCredits(prev => ({ ...prev, balance: bal }))}
        />
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

// Corpus View Component
function CorpusView({
  profileId, profile, entries, setEntries, uploading, setUploading,
  analyzing, setAnalyzing, filter, setFilter, onBack, onCreditsUpdate,
}: {
  profileId: string; profile: any; entries: any[]; setEntries: (fn: any) => void;
  uploading: boolean; setUploading: (v: boolean) => void;
  analyzing: boolean; setAnalyzing: (v: boolean) => void;
  filter: string; setFilter: (v: string) => void;
  onBack: () => void; onCreditsUpdate: (bal: number) => void;
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState("script");
  const [uploadMsg, setUploadMsg] = useState("");

  // Memory state
  const [memories, setMemories] = useState<any[]>([]);
  const [memoryCategory, setMemoryCategory] = useState("fact_correction");
  const [memoryContent, setMemoryContent] = useState("");
  const [memoryFilter, setMemoryFilter] = useState("all");

  const MEMORY_CATEGORIES = [
    { key: "fact_correction", label: "事实纠错" },
    { key: "writing_preference", label: "写作偏好" },
    { key: "expression_forbidden", label: "表达禁区" },
    { key: "customer_insight", label: "客户洞察" },
  ];

  // Knowledge state (PRD v2: 知识库可视化)
  const [knowledge, setKnowledge] = useState<KnowledgeData | null>(null);
  const [loadingKnowledge, setLoadingKnowledge] = useState(false);

  useEffect(() => {
    if (profileId) { loadEntries(); loadMemories(); loadKnowledge(); }
  }, [profileId, filter, memoryFilter]);

  const loadKnowledge = async () => {
    setLoadingKnowledge(true);
    const res = await fetch(`/api/knowledge?profileId=${profileId}`);
    if (res.ok) setKnowledge(await res.json());
    setLoadingKnowledge(false);
  };

  const handleSaveKnowledge = async () => {
    if (!knowledge) return;
    const res = await fetch("/api/knowledge", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId, knowledgeContent: knowledge.knowledgeContent }),
    });
    if (res.ok) {
      const data = await res.json();
      setKnowledge(prev => prev ? { ...prev, knowledgeContent: data.knowledgeContent } : null);
    }
  };

  const loadEntries = async () => {
    const url = filter === "all" ? `/api/corpus?profileId=${profileId}` : `/api/corpus?profileId=${profileId}&status=${filter}`;
    const res = await fetch(url);
    if (res.ok) setEntries(await res.json());
  };

  const loadMemories = async () => {
    const url = memoryFilter === "all" ? `/api/memory?profileId=${profileId}` : `/api/memory?profileId=${profileId}&category=${memoryFilter}`;
    const res = await fetch(url);
    if (res.ok) setMemories(await res.json());
  };

  const handleAddMemory = async () => {
    if (!memoryContent.trim()) return;
    const res = await fetch("/api/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId, category: memoryCategory, content: memoryContent.trim() }),
    });
    if (res.ok) {
      setMemoryContent("");
      loadMemories();
    }
  };

  const handleDeleteMemory = async (id: string) => {
    await fetch(`/api/memory/${id}`, { method: "DELETE" });
    loadMemories();
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadMsg("");
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("profileId", profileId);
    formData.append("fileType", fileType);

    const res = await fetch("/api/corpus/upload", { method: "POST", body: formData });
    const data = await res.json();

    if (res.ok) {
      setEntries((prev: any[]) => [data, ...prev]);
      setSelectedFile(null);
      setUploadMsg("上传成功");
    } else {
      setUploadMsg(data.error || "上传失败");
    }
    setUploading(false);
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    const res = await fetch("/api/corpus/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId }),
    });
    const data = await res.json();
    if (res.ok) {
      loadEntries();
      const cr = await fetch("/api/credits/balance");
      if (cr.ok) { const cd = await cr.json(); onCreditsUpdate(cd.balance); }
    }
    setAnalyzing(false);
  };

  const handleConfirm = async (corpusId: string, action: "confirm" | "reject") => {
    const res = await fetch("/api/corpus/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actions: [{ corpusId, action }] }),
    });
    if (res.ok) loadEntries();
  };

  const handleDeleteCorpus = async (id: string) => {
    await fetch(`/api/corpus/${id}`, { method: "DELETE" });
    loadEntries();
  };

  const FILE_TYPE_LABELS: Record<string, string> = {
    script: "脚本", interview: "访谈", account: "账号资料", other: "其他",
  };

  const STATUS_LABELS: Record<string, string> = {
    pending: "待分析", analyzing: "分析中", ready: "已分析", confirmed: "已入库", rejected: "已拒绝",
  };

  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-cream text-text-muted",
    analyzing: "bg-yellow-50 text-yellow-700",
    ready: "bg-blue-50 text-blue-600",
    confirmed: "bg-green-50 text-green-600",
    rejected: "bg-red-50 text-red-600",
  };

  const CORPUS_FILTER_OPTIONS = [
    { key: "all", label: "全部" },
    { key: "pending", label: "待分析" },
    { key: "ready", label: "已分析" },
    { key: "confirmed", label: "已入库" },
    { key: "rejected", label: "已拒绝" },
  ];

  return (
    <section className="max-w-4xl mx-auto px-8 py-16 space-y-12">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-4xl font-bold text-text mb-2">{profile?.name}</h1>
          <p className="text-text-muted">账号记忆库 · 语料库</p>
        </div>
        <button onClick={onBack} className="text-sm text-text-muted hover:text-brown transition shrink-0">← 返回工作台</button>
      </div>

      {/* ===== ACCOUNT MEMORY ===== */}
      <div>
        <div className="flex items-baseline gap-3 mb-2">
          <h2 className="font-serif text-2xl font-bold text-text">账号记忆库</h2>
          <span className="text-sm text-text-muted">{memories.length} 条</span>
        </div>
        <p className="text-sm text-text-muted mb-4">每次你发现 AI 写偏、或者有新的偏好，都可以沉淀成一条记忆。后续周策划和单条发布包都会参考它。</p>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {MEMORY_CATEGORIES.map(c => (
            <button key={c.key} onClick={() => setMemoryCategory(c.key)}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${memoryCategory === c.key ? "bg-brown text-white" : "bg-white border border-border text-text-muted hover:border-brown"}`}>
              {c.label}
            </button>
          ))}
        </div>

        {/* Input */}
        <textarea value={memoryContent} onChange={e => setMemoryContent(e.target.value)}
          placeholder="比如：不要把创始人写成加盟商；发布文案要更像老板本人说话；不要虚构门店数量。"
          rows={3}
          className="w-full bg-white border border-border rounded-2xl px-5 py-3 text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-brown/20 focus:border-brown resize-none mb-3" />
        <button onClick={handleAddMemory} disabled={!memoryContent.trim()}
          className={`rounded-full px-6 py-3 text-sm font-medium transition ${!memoryContent.trim() ? "bg-border cursor-not-allowed text-text-muted" : "bg-brown text-white hover:bg-brown-dark"}`}>
          加入账号记忆库
        </button>

        {/* Memory Filter + List */}
        <div className="mt-6">
          <div className="flex flex-wrap gap-2 mb-4">
            <button onClick={() => setMemoryFilter("all")}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${memoryFilter === "all" ? "bg-brown text-white" : "bg-white border border-border text-text-muted hover:border-brown"}`}>
              全部
            </button>
            {MEMORY_CATEGORIES.map(c => (
              <button key={c.key} onClick={() => setMemoryFilter(c.key)}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${memoryFilter === c.key ? "bg-brown text-white" : "bg-white border border-border text-text-muted hover:border-brown"}`}>
                {c.label}
              </button>
            ))}
          </div>

          {memories.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-[0_1px_3px_rgba(44,24,16,0.08)]">
              <p className="text-sm text-text-muted">还没有记忆，添加第一条吧</p>
            </div>
          ) : (
            <div className="space-y-3">
              {memories.map(m => (
                <div key={m.id} className="bg-white rounded-2xl p-5 shadow-[0_1px_3px_rgba(44,24,16,0.08)]">
                  <div className="flex items-start justify-between mb-2">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-brown/10 text-brown">{m.categoryLabel || m.category}</span>
                    <button onClick={() => handleDeleteMemory(m.id)} className="text-xs text-text-muted hover:text-red-500 transition">删除</button>
                  </div>
                  <p className="text-sm text-text whitespace-pre-line">{m.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===== IP 知识库（PRD v2 新增） ===== */}
      <div>
        <div className="flex items-baseline gap-3 mb-2">
          <h2 className="font-serif text-2xl font-bold text-text">IP 知识库</h2>
          <span className="text-xs text-text-muted">
            {loadingKnowledge ? "加载中..." : knowledge?.knowledgeContent ? "已更新" : "待生成"}
          </span>
        </div>
        <p className="text-sm text-text-muted mb-4">系统自动生成的 IP 结构化知识库，包含人设特征、话术技巧、风格偏好等萃取信息。可手动编辑补充。</p>

        {/* 知识库编辑区 */}
        <div className="rounded-[28px] bg-white p-8 shadow-[0_18px_50px_rgba(44,24,16,0.06)]">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-text">知识库内容（可编辑）</p>
            <button onClick={handleSaveKnowledge} disabled={!knowledge?.knowledgeContent}
              className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                !knowledge?.knowledgeContent
                  ? "bg-border cursor-not-allowed text-text-muted"
                  : "bg-brown text-white hover:bg-brown-dark"
              }`}>
              保存知识库
            </button>
          </div>
          <textarea
            value={knowledge?.knowledgeContent || ""}
            onChange={e => setKnowledge(prev => prev ? { ...prev, knowledgeContent: e.target.value } : null)}
            placeholder="知识库内容会自动从语料萃取和用户脚本修改中积累。也可以手动补充..."
            rows={12}
            className="w-full bg-cream-light border border-border rounded-2xl px-5 py-3 text-sm text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-brown/20 focus:border-brown resize-none font-mono"
          />
        </div>

        {/* 投喂脚本列表 */}
        {knowledge?.feedScripts && knowledge.feedScripts.length > 0 && (
          <div className="mt-6">
            <p className="text-sm font-medium text-text mb-3">投喂历史脚本（{knowledge.feedScripts.length} 条）</p>
            <div className="space-y-2">
              {knowledge.feedScripts?.slice(-10).reverse().map((s: any, i: number) => (
                <details key={i} className="rounded-xl bg-white border border-border p-4">
                  <summary className="text-sm text-text-muted cursor-pointer">
                    {s.source === "user_edit" ? "用户修改" : "上传"} · {new Date(s.updatedAt).toLocaleString("zh-CN")}
                  </summary>
                  <pre className="mt-2 text-xs text-text bg-cream-light rounded-lg p-3 whitespace-pre-wrap max-h-40 overflow-auto">
                    {s.content}
                  </pre>
                </details>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ===== CORPUS FEED ===== */}
      <div>
        <h2 className="font-serif text-2xl font-bold text-text mb-2">投喂历史语料</h2>
        <p className="text-sm text-text-muted mb-6">上传这个 IP 以前拍过的脚本、访谈、账号资料，AI 会先分析哪些信息值得进入知识库。你确认后才会保存。</p>

        {/* Upload Area */}
        <div className="rounded-[28px] bg-white p-8 shadow-[0_18px_50px_rgba(44,24,16,0.06)] mb-8">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-48">
              <label className="text-xs text-text-muted mb-1 block">选择文件</label>
              <input type="file" accept=".txt,.md,.docx,.pdf,.json,.csv" onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-text-muted" />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">文件类型</label>
              <select value={fileType} onChange={e => setFileType(e.target.value)}
                className="bg-cream-light border border-border rounded-2xl px-4 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-brown/20 focus:border-brown">
                <option value="script">脚本</option>
                <option value="interview">访谈</option>
                <option value="account">账号资料</option>
                <option value="other">其他</option>
              </select>
            </div>
            <button onClick={handleUpload} disabled={!selectedFile || uploading}
              className={`rounded-full px-6 py-3 text-sm font-medium text-white transition ${uploading || !selectedFile ? "bg-border cursor-not-allowed" : "bg-brown hover:bg-brown-dark"}`}>
              {uploading ? "上传中..." : "上传"}
            </button>
          </div>
          {uploadMsg && <p className="mt-3 text-sm text-text-muted">{uploadMsg}</p>}
          <p className="mt-3 text-xs text-text-muted">支持 .txt .md .docx .pdf .json .csv，单文件最大 10MB</p>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {CORPUS_FILTER_OPTIONS.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${filter === f.key ? "bg-brown text-white" : "bg-white border border-border text-text-muted hover:border-brown"}`}>
                {f.label}
              </button>
            ))}
          </div>
          <button onClick={handleAnalyze} disabled={analyzing}
            className={`rounded-full px-6 py-3 text-sm font-medium transition ${analyzing ? "bg-border cursor-not-allowed text-text-muted" : "bg-brown text-white hover:bg-brown-dark"}`}>
            {analyzing ? "AI 分析中..." : "分析全部待处理语料"}
          </button>
        </div>

        {/* Corpus List */}
        {entries.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-[0_1px_3px_rgba(44,24,16,0.08)]">
            <p className="text-text-muted mb-2">还没有语料</p>
            <p className="text-sm text-text-muted">上传历史脚本开始积累语料吧</p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map(entry => (
              <div key={entry.id} className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(44,24,16,0.08)]">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-text">{entry.fileName}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-cream text-text-muted">{FILE_TYPE_LABELS[entry.fileType] || entry.fileType}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[entry.status] || "bg-cream text-text-muted"}`}>
                      {STATUS_LABELS[entry.status] || entry.status}
                    </span>
                  </div>
                  <button onClick={() => handleDeleteCorpus(entry.id)}
                    className="text-xs text-text-muted hover:text-red-500 transition">删除</button>
                </div>
                {entry.summary && (
                  <div className="mb-3">
                    <p className="text-xs text-text-muted mb-1">AI 摘要</p>
                    <p className="text-sm text-text bg-cream-light rounded-xl p-4">{entry.summary}</p>
                  </div>
                )}
                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {entry.tags.map((tag: string, i: number) => (
                      <span key={i} className="px-3 py-1 rounded-full text-xs bg-cream text-text-muted">{tag}</span>
                    ))}
                  </div>
                )}
                {entry.aiFeedback && (
                  <p className="text-xs text-text-muted mb-3">{entry.aiFeedback}</p>
                )}
                {entry.status === "ready" && (
                  <div className="flex gap-2">
                    <button onClick={() => handleConfirm(entry.id, "confirm")}
                      className="rounded-full bg-brown text-white px-5 py-2 text-sm font-medium hover:bg-brown-dark transition">
                      确认入库
                    </button>
                    <button onClick={() => handleConfirm(entry.id, "reject")}
                      className="rounded-full border border-border text-text-muted px-5 py-2 text-sm hover:border-red-300 hover:text-red-600 transition">
                      拒绝
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// Admin Panel Component
function AdminPanel({ onBack }: { onBack: () => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [creditAmount, setCreditAmount] = useState("10");
  const [viewingUser, setViewingUser] = useState<any>(null);
  const [viewingProfile, setViewingProfile] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    fetch("/api/admin/users")
      .then(r => r.json())
      .then(data => { setUsers(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const handleViewUser = async (userId: string) => {
    setDetailLoading(true);
    const res = await fetch(`/api/admin/users?userId=${userId}&detail=1`);
    if (res.ok) {
      const data = await res.json();
      setViewingUser(data);
      setViewingProfile(null);
    }
    setDetailLoading(false);
  };

  const handleAdjustCredits = async (userId: string) => {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, credits: parseInt(creditAmount) }),
    });
    loadUsers();
    setSelectedUser(null);
  };

  const handleToggleRole = async (userId: string, newRole: string) => {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: newRole }),
    });
    loadUsers();
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("确定删除此用户及其所有数据？")) return;
    await fetch(`/api/admin/users?id=${userId}`, { method: "DELETE" });
    loadUsers();
    setSelectedUser(null);
    if (viewingUser?.user.id === userId) setViewingUser(null);
  };

  // ===== 用户详情视图 =====
  if (viewingUser) {
    return (
      <section className="max-w-6xl mx-auto px-8 py-16">
        {/* 返回按钮 */}
        <button onClick={() => { setViewingUser(null); setViewingProfile(null); }}
          className="text-sm text-text-muted hover:text-brown transition mb-8">
          ← 返回客户列表
        </button>

        {/* 用户信息卡片 */}
        <div className="bg-white rounded-2xl p-8 shadow-[0_1px_3px_rgba(44,24,16,0.08)] mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-3xl font-bold text-text mb-1">
                {viewingUser.user.name || viewingUser.user.username}
              </h1>
              <p className="text-sm text-text-muted">
                @{viewingUser.user.username} · {viewingUser.user.role === "ADMIN" ? "管理员" : "普通用户"}
                · 余额 {viewingUser.user.balance} 次
                · {new Date(viewingUser.user.createdAt).toLocaleDateString("zh-CN")} 注册
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setSelectedUser(viewingUser.user)}
                className="text-sm text-brown hover:text-brown-dark transition">调整次数</button>
              <button onClick={() => handleToggleRole(viewingUser.user.id, viewingUser.user.role === "ADMIN" ? "USER" : "ADMIN")}
                className="text-sm text-text-muted hover:text-text transition">
                切换角色
              </button>
            </div>
          </div>
        </div>

        {/* 统计概览 */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(44,24,16,0.08)] text-center">
            <p className="text-3xl font-bold text-text">{viewingUser.profiles.length}</p>
            <p className="text-xs text-text-muted mt-1">IP 档案</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(44,24,16,0.08)] text-center">
            <p className="text-3xl font-bold text-text">
              {viewingUser.profiles.reduce((sum: number, p: any) => sum + p.topicCount, 0)}
            </p>
            <p className="text-xs text-text-muted mt-1">选题总数</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(44,24,16,0.08)] text-center">
            <p className="text-3xl font-bold text-text">
              {viewingUser.profiles.reduce((sum: number, p: any) => sum + p.corpusCount, 0)}
            </p>
            <p className="text-xs text-text-muted mt-1">语料总数</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(44,24,16,0.08)] text-center">
            <p className="text-3xl font-bold text-text">
              {viewingUser.profiles.reduce((sum: number, p: any) => sum + p.memoryCount, 0)}
            </p>
            <p className="text-xs text-text-muted mt-1">记忆总数</p>
          </div>
        </div>

        {/* IP 档案列表 */}
        <h2 className="font-serif text-2xl font-bold text-text mb-4">IP 档案（{viewingUser.profiles.length}）</h2>

        {viewingUser.profiles.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-[0_1px_3px_rgba(44,24,16,0.08)]">
            <p className="text-text-muted">该客户还没有创建任何 IP 档案</p>
          </div>
        ) : (
          <div className="space-y-4">
            {viewingUser.profiles.map((profile: any) => (
              <div key={profile.id} className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(44,24,16,0.08)]">
                {/* 档案头部 */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 cursor-pointer" onClick={() => setViewingProfile(viewingProfile?.id === profile.id ? null : profile)}>
                    <h3 className="font-serif text-xl font-bold text-text">{profile.name}</h3>
                    <p className="text-sm text-text-muted mt-1">
                      {profile.industry} · 创始人：{profile.founder}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(profile.personas || []).slice(0, 5).map((p: string) => (
                        <span key={p} className="px-2 py-0.5 rounded-full text-xs bg-cream text-text-muted">{p}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-4 text-center shrink-0 ml-4">
                    <div>
                      <p className="text-lg font-bold text-text">{profile.topicCount}</p>
                      <p className="text-xs text-text-muted">选题</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-text">{profile.corpusCount}</p>
                      <p className="text-xs text-text-muted">语料</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-text">{profile.memoryCount}</p>
                      <p className="text-xs text-text-muted">记忆</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-text">{profile.scriptCount}</p>
                      <p className="text-xs text-text-muted">脚本</p>
                    </div>
                  </div>
                </div>

                {/* 展开详情 */}
                {viewingProfile?.id === profile.id && (
                  <div className="mt-6 space-y-6 border-t border-border pt-6">
                    {/* 基础信息 */}
                    <div>
                      <h4 className="text-sm font-medium text-text-muted mb-3 uppercase tracking-wider">基础信息</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-cream-light rounded-xl p-4">
                          <p className="text-xs text-text-muted">产品/服务</p>
                          <p className="mt-1 text-text">{(profile.products || []).join("、") || "未设置"}</p>
                        </div>
                        <div className="bg-cream-light rounded-xl p-4">
                          <p className="text-xs text-text-muted">目标客户</p>
                          <p className="mt-1 text-text">{(profile.customers || []).join("、") || "未设置"} {profile.customerExtra}</p>
                        </div>
                        <div className="bg-cream-light rounded-xl p-4">
                          <p className="text-xs text-text-muted">账号目标</p>
                          <p className="mt-1 text-text">{(profile.goals || []).join("、") || "未设置"} {profile.goalExtra}</p>
                        </div>
                        <div className="bg-cream-light rounded-xl p-4">
                          <p className="text-xs text-text-muted">内容禁区</p>
                          <p className="mt-1 text-text">{(profile.forbidden || []).join("、") || "未设置"} {profile.forbiddenExtra}</p>
                        </div>
                        <div className="bg-cream-light rounded-xl p-4">
                          <p className="text-xs text-text-muted">内容配比</p>
                          <p className="mt-1 text-text">流量 {profile.mix?.traffic} : 人设 {profile.mix?.persona} : 产品 {profile.mix?.product}</p>
                        </div>
                        <div className="bg-cream-light rounded-xl p-4">
                          <p className="text-xs text-text-muted">创建时间</p>
                          <p className="mt-1 text-text">{new Date(profile.createdAt).toLocaleString("zh-CN")}</p>
                        </div>
                      </div>
                    </div>

                    {/* 选题列表 */}
                    {profile.topics.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-text-muted mb-3 uppercase tracking-wider">选题（{profile.topics.length}）</h4>
                        <div className="space-y-2">
                          {profile.topics.map((t: any) => (
                            <div key={t.id} className="bg-cream-light rounded-xl p-4">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-0.5 rounded-full text-xs ${
                                  t.type === "traffic" ? "bg-brown/10 text-brown" :
                                  t.type === "persona" ? "bg-brown-light/10 text-brown-light" :
                                  "bg-border text-text-muted"
                                }`}>
                                  {t.type === "traffic" ? "流量" : t.type === "persona" ? "人设" : "产品"}
                                </span>
                                <span className="font-medium text-text text-sm">{t.title}</span>
                              </div>
                              <p className="text-xs text-text-muted">{t.description}</p>
                              {t.script && (
                                <details className="mt-2">
                                  <summary className="text-xs text-brown cursor-pointer">查看脚本</summary>
                                  <pre className="mt-2 text-xs text-text bg-white rounded-lg p-3 whitespace-pre-wrap">{t.script}</pre>
                                </details>
                              )}
                              {t.publishCopy && (
                                <details className="mt-1">
                                  <summary className="text-xs text-brown cursor-pointer">查看发布文案</summary>
                                  <p className="mt-1 text-xs text-text bg-white rounded-lg p-3">{t.publishCopy}</p>
                                </details>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 账号记忆 */}
                    {profile.accountMemories.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-text-muted mb-3 uppercase tracking-wider">账号记忆（{profile.accountMemories.length}）</h4>
                        <div className="space-y-2">
                          {profile.accountMemories.map((m: any) => (
                            <div key={m.id} className="bg-cream-light rounded-xl p-4">
                              <span className="px-2 py-0.5 rounded-full text-xs bg-brown/10 text-brown">{m.category}</span>
                              <p className="text-sm text-text mt-2">{m.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 语料库 */}
                    {profile.corpusEntries.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-text-muted mb-3 uppercase tracking-wider">语料库（{profile.corpusEntries.length}）</h4>
                        <div className="space-y-2">
                          {profile.corpusEntries.map((c: any) => (
                            <div key={c.id} className="bg-cream-light rounded-xl p-4">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-text text-sm">{c.fileName}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs ${
                                  c.status === "confirmed" ? "bg-green-50 text-green-600" :
                                  c.status === "ready" ? "bg-blue-50 text-blue-600" :
                                  c.status === "rejected" ? "bg-red-50 text-red-600" :
                                  "bg-cream text-text-muted"
                                }`}>{c.status}</span>
                              </div>
                              {c.summary && <p className="text-xs text-text-muted mt-1">{c.summary}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 脚本 */}
                    {profile.scripts.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-text-muted mb-3 uppercase tracking-wider">脚本（{profile.scripts.length}）</h4>
                        <div className="space-y-2">
                          {profile.scripts.slice(0, 10).map((s: any) => (
                            <div key={s.id} className="bg-cream-light rounded-xl p-4">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded-full text-xs bg-cream text-text-muted">v{s.version}</span>
                                {s.isSavedToKnowledge && <span className="px-2 py-0.5 rounded-full text-xs bg-green-50 text-green-600">已入库</span>}
                              </div>
                              <details>
                                <summary className="text-xs text-brown cursor-pointer">查看脚本内容</summary>
                                <pre className="mt-2 text-xs text-text bg-white rounded-lg p-3 whitespace-pre-wrap">{s.content}</pre>
                              </details>
                            </div>
                          ))}
                          {profile.scripts.length > 10 && (
                            <p className="text-xs text-text-muted">... 还有 {profile.scripts.length - 10} 条脚本</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 知识库 */}
                    {profile.knowledgeContent && (
                      <div>
                        <h4 className="text-sm font-medium text-text-muted mb-3 uppercase tracking-wider">IP 知识库</h4>
                        <pre className="bg-cream-light rounded-xl p-4 text-xs text-text whitespace-pre-wrap max-h-60 overflow-auto">{profile.knowledgeContent}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 调整次数弹窗 */}
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

  // ===== 用户列表视图 =====
  if (loading) return <div className="text-center py-12 text-text-muted">加载中...</div>;

  return (
    <section className="max-w-4xl mx-auto px-8 py-16">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-serif text-4xl font-bold text-text mb-2">客户管理</h1>
          <p className="text-text-muted">客户管理 · 次数配置</p>
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
                    <button onClick={() => handleViewUser(u.id)} className="text-xs text-brown hover:underline">查看档案</button>
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
