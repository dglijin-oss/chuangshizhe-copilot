import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "创世者Copilot - 启明盒子",
  description: "教育 AI 协同平台，教案生成、作业管理、学情分析一体化",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif' }}>{children}</body>
    </html>
  );
}
