import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "创世者Copilot - IP 内容工作台",
  description: "把灵感、知识库和发布包放在一个工作台里",
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
