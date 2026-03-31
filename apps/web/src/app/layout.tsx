import type { Metadata } from "next";
import { Providers } from "@/lib/providers";
import "./globals.css";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "能源审计平台",
  description: "能源审计管理平台 - 企业端 / 管理端 / 审核端",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
