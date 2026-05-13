"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "登录失败");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-text">登录</h1>
          <p className="text-sm text-text-muted mt-2">回到你的创世者 Copilot</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-[28px] p-8 shadow-[0_18px_50px_rgba(44,24,16,0.06)] space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">{error}</div>
          )}

          <div>
            <label className="text-sm font-medium text-text-muted mb-2 block">用户名</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              className="w-full bg-cream-light border border-border rounded-2xl px-5 py-3 text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-brown/20 focus:border-brown"
              placeholder="中文、英文或数字"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-text-muted mb-2 block">密码</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-cream-light border border-border rounded-2xl px-5 py-3 text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-brown/20 focus:border-brown"
              placeholder="至少 6 位"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-brown px-6 py-4 text-base font-medium text-white transition hover:bg-brown-dark disabled:opacity-50"
          >
            {loading ? "登录中..." : "登录"}
          </button>

          <p className="text-center text-sm text-text-muted">
            还没有账号？{" "}
            <a href="/register" className="text-brown hover:underline">立即注册</a>
          </p>
        </form>
      </div>
    </div>
  );
}
