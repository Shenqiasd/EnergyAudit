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
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: BarChart3,
    title: "标准化数据采集",
    description: "覆盖24个行业模块，5层智能校验保障数据严谨合规",
  },
  {
    icon: Brain,
    title: "智能核算引擎",
    description: "内置国标能耗计算模型、碳排放分析及区域能效对标",
  },
  {
    icon: ClipboardCheck,
    title: "全量生命周期管理",
    description: "审计立项 → 数据填报 → 报告生成 → 专家审核 → 整改闭环",
  },
];

const devRoles = [
  {
    icon: Building2,
    label: "企业端",
    description: "重点用能单位",
    href: "/enterprise/dashboard",
  },
  {
    icon: Shield,
    label: "管理端",
    description: "监管机构",
    href: "/manager/dashboard",
  },
  {
    icon: UserCheck,
    label: "审核端",
    description: "评审专家",
    href: "/reviewer/tasks",
  },
] as const;

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
    <div className="flex min-h-screen bg-[hsl(var(--background))]">
      {/* Left: Brand Panel (Dark Slate Indigo) - hidden on mobile */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between bg-[#1e293b] relative overflow-hidden text-white p-16">
        {/* Background Texture */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay"></div>
        <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative z-10">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 mb-24">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#1e293b] shadow-lg">
              <Zap size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">能源审计平台</h1>
              <span className="text-xs text-blue-200/80 font-medium tracking-widest uppercase">ENERGY AUDIT PLATFORM</span>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="space-y-10">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-start gap-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <feature.icon size={22} className="text-blue-300" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight mb-1.5">{feature.title}</h3>
                  <p className="text-sm text-blue-200/70 leading-relaxed max-w-sm">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom description */}
        <div className="relative z-10 pt-12 border-t border-white/10 mt-12">
          <p className="text-sm text-blue-200/50 leading-relaxed max-w-md">
            国家重点用能单位监管支撑系统。通过数字化审计流程，确保工业能耗数据真实、准确、可追溯，助力区域双碳目标达成。
          </p>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="flex w-full items-center justify-center px-4 lg:w-[55%] relative">
        <div className="w-full max-w-md">
          {/* Mobile-only logo */}
          <div className="mb-10 flex flex-col items-center justify-center gap-3 lg:hidden">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(var(--primary))] text-white shadow-lg">
              <Zap size={28} />
            </div>
            <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">
              能源审计平台
            </h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[hsl(var(--foreground))] tracking-tight mb-2">
              系统登录
            </h2>
            <p className="text-[hsl(var(--muted-foreground))]">
              请输入您的政务/企业账号或测试账号
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-[hsl(var(--danger))/10] border border-[hsl(var(--danger))/20] p-4 text-sm text-[hsl(var(--danger))] flex items-center gap-2">
                <Shield size={16} />
                {error}
              </div>
            )}

            <Input
              id="email"
              type="email"
              label="账号 / 邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入账号"
              required
              startIcon={<Mail size={18} />}
              className="h-12 text-base"
            />

            <Input
              id="password"
              type="password"
              label="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              startIcon={<Lock size={18} />}
              className="h-12 text-base"
            />

            <Button
              type="submit"
              loading={isLoading}
              className="w-full h-12 text-base font-medium mt-2 shadow-md hover:shadow-lg transition-all"
            >
              登录系统
            </Button>
          </form>

          {/* Dev mode shortcuts */}
          <div className="mt-12 pt-8 border-t border-[hsl(var(--border))]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-[hsl(var(--foreground))]">开发环境快捷入口</span>
              <Badge variant="outline" className="text-xs text-[hsl(var(--muted-foreground))]">Auto-login</Badge>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {devRoles.map((role) => (
                <button
                  key={role.label}
                  type="button"
                  onClick={() => router.push(role.href)}
                  className="group flex flex-col items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 transition-all hover:-translate-y-1 hover:border-[hsl(var(--primary))] hover:shadow-md cursor-pointer"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--muted))] group-hover:bg-[hsl(var(--primary))/10] group-hover:text-[hsl(var(--primary))] text-[hsl(var(--muted-foreground))] transition-colors">
                    <role.icon size={20} />
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-[hsl(var(--foreground))]">
                      {role.label}
                    </div>
                    <div className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5 scale-90 origin-top">
                      {role.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
