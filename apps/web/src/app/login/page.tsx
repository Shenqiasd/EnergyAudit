"use client";

import { useAuth } from "@/lib/auth/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileBarChart,
  Mail,
  Lock,
  BarChart3,
  Brain,
  ClipboardCheck,
  Building2,
  Shield,
  UserCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const features = [
  {
    icon: BarChart3,
    title: "数据采集",
    description: "24个模块标准化采集，5层校验保障数据质量",
  },
  {
    icon: Brain,
    title: "智能分析",
    description: "能耗计算、碳排放分析、能效对标一站完成",
  },
  {
    icon: ClipboardCheck,
    title: "全流程管理",
    description: "审计立项→数据填报→报告生成→专家审核→整改闭环",
  },
];

const devRoles = [
  {
    icon: Building2,
    label: "企业端",
    description: "数据填报与整改",
    href: "/enterprise/dashboard",
    color: "blue",
  },
  {
    icon: Shield,
    label: "管理端",
    description: "审计管理与统计",
    href: "/manager/dashboard",
    color: "emerald",
  },
  {
    icon: UserCheck,
    label: "审核端",
    description: "审核评分与验收",
    href: "/reviewer/dashboard",
    color: "purple",
  },
] as const;

const roleColorMap: Record<string, { bg: string; text: string }> = {
  blue: { bg: "bg-blue-500/10", text: "text-blue-500" },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-500" },
  purple: { bg: "bg-purple-500/10", text: "text-purple-500" },
};

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
      router.push("/");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "登录失败，请检查邮箱和密码",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left: Brand Panel - hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-between bg-gradient-to-br from-blue-600 to-blue-900 p-12 text-white">
        <div>
          {/* Brand Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
              <FileBarChart size={24} className="text-white" />
            </div>
            <span className="text-xl font-bold">能源审计平台</span>
          </div>

          {/* Feature highlights */}
          <div className="space-y-8">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <feature.icon size={24} className="text-blue-200" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-1 text-sm text-blue-200/80">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom description */}
        <div className="mt-auto pt-12">
          <p className="text-sm text-blue-200/60">
            &ldquo;十五五&rdquo;重点用能单位能源审计业务管理系统，支撑企业能源数据采集、审计报告生成、专家审核、整改跟踪的全生命周期管理。
          </p>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="flex w-full items-center justify-center bg-[hsl(var(--background))] px-4 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Form Card */}
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 shadow-sm">
            {/* Header */}
            <div className="mb-8 text-center">
              {/* Mobile-only logo */}
              <div className="mb-4 flex items-center justify-center gap-2 lg:hidden">
                <FileBarChart
                  size={28}
                  className="text-[hsl(var(--primary))]"
                />
                <span className="text-lg font-bold text-[hsl(var(--foreground))]">
                  能源审计平台
                </span>
              </div>
              <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">
                欢迎回来
              </h2>
              <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                登录您的账户以继续
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-[hsl(var(--danger)/0.1)] p-3 text-sm text-[hsl(var(--danger))]">
                  {error}
                </div>
              )}

              <Input
                id="email"
                type="email"
                label="邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入邮箱地址"
                required
                startIcon={<Mail size={16} />}
              />

              <Input
                id="password"
                type="password"
                label="密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                required
                startIcon={<Lock size={16} />}
              />

              <Button
                type="submit"
                loading={isLoading}
                className="w-full"
                size="lg"
              >
                登录
              </Button>
            </form>

            {/* Dev mode divider */}
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[hsl(var(--border))]" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[hsl(var(--card))] px-2 text-[hsl(var(--muted-foreground))]">
                    开发模式快捷入口
                  </span>
                </div>
              </div>

              {/* Dev role cards */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                {devRoles.map((role) => {
                  const colors = roleColorMap[role.color];
                  return (
                    <button
                      key={role.label}
                      type="button"
                      onClick={() => router.push(role.href)}
                      className="group flex flex-col items-center gap-2 rounded-lg border border-[hsl(var(--border))] p-3 transition-all hover:-translate-y-0.5 hover:border-[hsl(var(--primary))] hover:shadow-sm"
                    >
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${colors.bg}`}
                      >
                        <role.icon size={18} className={colors.text} />
                      </div>
                      <span className="text-xs font-medium text-[hsl(var(--foreground))]">
                        {role.label}
                      </span>
                      <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                        {role.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
