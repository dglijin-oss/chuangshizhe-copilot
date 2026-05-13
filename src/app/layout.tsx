import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "创世者 Copilot — AI 时代一人创业孵化生态母体 Agent",
  description: "AI 时代一人创业孵化生态母体 Agent",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
