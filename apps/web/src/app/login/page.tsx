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
import { motion } from "framer-motion";

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
      {/* Left: Brand Panel */}
      <div className="hidden lg:flex lg:w-[44%] flex-col justify-between bg-[hsl(222_47%_11%)] relative overflow-hidden text-white p-14">
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }} />
        <div className="absolute top-0 right-0 w-3/4 h-1/2 bg-[hsl(var(--primary))/0.12] blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-20">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--primary))] shadow-lg">
              <Zap size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">能源审计平台</h1>
              <span className="text-[10px] text-blue-200/60 font-medium tracking-widest uppercase">ENERGY AUDIT PLATFORM</span>
            </div>
          </div>

          <div className="space-y-8">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                className="flex items-start gap-4"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/6 border border-white/10">
                  <feature.icon size={18} className="text-blue-300" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-blue-200/60 leading-relaxed max-w-xs">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative z-10 pt-10 border-t border-white/8 mt-10">
          <p className="text-xs text-blue-200/40 leading-relaxed max-w-sm">
            国家重点用能单位监管支撑系统。通过数字化审计流程，确保工业能耗数据真实、准确、可追溯，助力区域双碳目标达成。
          </p>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="flex w-full items-center justify-center px-5 lg:w-[56%]">
        <motion.div
          className="w-full max-w-[400px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Mobile-only logo */}
          <div className="mb-10 flex flex-col items-center gap-3 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--primary))] text-white shadow-lg">
              <Zap size={24} />
            </div>
            <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">
              能源审计平台
            </h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-[hsl(var(--foreground))] tracking-tight mb-1.5">
              欢迎登录
            </h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              请输入您的政务/企业账号或使用快捷入口
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-[hsl(var(--danger))/8] border border-[hsl(var(--danger))/20] p-3.5 text-sm text-[hsl(var(--danger))] flex items-center gap-2">
                <Shield size={15} />
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
              startIcon={<Mail size={16} />}
              className="h-11"
            />

            <Input
              id="password"
              type="password"
              label="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              startIcon={<Lock size={16} />}
              className="h-11"
            />

            <Button
              type="submit"
              loading={isLoading}
              className="w-full h-11 font-medium mt-1"
            >
              登录系统
            </Button>
          </form>

          {/* Dev mode shortcuts */}
          <div className="mt-10 pt-7 border-t border-[hsl(var(--border))]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">开发环境快捷入口</span>
              <Badge variant="outline" className="text-[10px] text-[hsl(var(--muted-foreground))]">Dev only</Badge>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {devRoles.map((role) => (
                <button
                  key={role.label}
                  type="button"
                  onClick={() => router.push(role.href)}
                  className="group flex flex-col items-center gap-2 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 transition-all hover:-translate-y-0.5 hover:border-[hsl(var(--primary))/40] hover:shadow-[var(--shadow-md)] cursor-pointer"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(var(--muted))] group-hover:bg-[hsl(var(--primary))/10] text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))] transition-colors">
                    <role.icon size={18} />
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-medium text-[hsl(var(--foreground))]">
                      {role.label}
                    </div>
                    <div className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">
                      {role.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
