"use client";

import { Badge } from "@/components/ui/badge";
import type { UserRole } from "@/lib/auth/auth-provider";
import { useAuth } from "@/lib/auth/use-auth";
import {
  Building2,
  FileBarChart,
  ListChecks,
  Shield,
  ArrowRight,
  Database,
  Briefcase,
  LineChart,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { ElementType } from "react";

interface RoleCard {
  role: UserRole;
  label: string;
  description: string;
  features: string[];
  icon: ElementType;
  color: string;
  bgStyle: string;
  dashboard: string;
}

const roleCards: RoleCard[] = [
  {
    role: "enterprise_user",
    label: "企业端",
    description: "重点用能单位专属入口，完成能源数据合规报送与整改。",
    features: ["能源消费填报", "审计报告管理", "异常数据申诉", "整改任务追踪"],
    icon: Building2,
    color: "text-blue-600 dark:text-blue-400",
    bgStyle: "hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20",
    dashboard: "/enterprise/dashboard",
  },
  {
    role: "manager",
    label: "管理端",
    description: "政府及监管部门入口，统筹全区域能源审计项目与数据分析。",
    features: ["企业台账管理", "项目进度监控", "区域能效对标", "预警策略配置"],
    icon: Shield,
    color: "text-emerald-600 dark:text-emerald-400",
    bgStyle: "hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20",
    dashboard: "/manager/dashboard",
  },
  {
    role: "reviewer",
    label: "审核端",
    description: "专家库成员专属工作台，执行专业严谨的审计复核。",
    features: ["数据质量复核", "审计报告打分", "整改验收确认", "评审历史追溯"],
    icon: ListChecks,
    color: "text-indigo-600 dark:text-indigo-400",
    bgStyle: "hover:border-indigo-500/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20",
    dashboard: "/reviewer/tasks",
  },
];

export default function HomePage() {
  const { loginDev } = useAuth();
  const router = useRouter();

  const handleRoleSelect = async (card: RoleCard) => {
    const defaultUsers: Record<UserRole, { id: string; name: string }> = {
      enterprise_user: { id: "dev-enterprise-001", name: "测试企业用户" },
      manager: { id: "dev-manager-001", name: "测试管理员" },
      reviewer: { id: "dev-reviewer-001", name: "测试审核员" },
    };
    const u = defaultUsers[card.role];
    await loginDev({ ...u, role: card.role });
    router.push(card.dashboard);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[hsl(var(--background))] relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 right-0 h-[50vh] bg-gradient-to-b from-[hsl(var(--primary))/0.05] to-transparent pointer-events-none" />
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-[hsl(var(--primary))/0.03] blur-3xl rounded-full pointer-events-none" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center pt-24 px-4 relative z-10">
        {/* Header */}
        <div className="mb-16 text-center max-w-2xl">
          <div className="mb-6 flex items-center justify-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[hsl(var(--primary))] text-white shadow-lg shadow-[hsl(var(--primary))/0.2] mb-4">
              <FileBarChart size={32} />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[hsl(var(--foreground))] mb-4">
            能源审计平台
          </h1>
          <p className="text-lg text-[hsl(var(--muted-foreground))] leading-relaxed mb-6">
            “十五五”重点用能单位能源审计业务管理系统
            <br className="hidden md:block" />
            支撑企业能源数据采集、审计报告生成、专家审核、整改跟踪的全生命周期管理
          </p>
          <Badge variant="outline" className="px-3 py-1 font-medium bg-[hsl(var(--card))] border-[hsl(var(--border))]">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
            开发环境 / 演示模式
          </Badge>
        </div>

        {/* Role selection cards */}
        <div className="grid w-full max-w-6xl gap-6 md:grid-cols-3 px-4">
          {roleCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.role}
                onClick={() => handleRoleSelect(card)}
                className={`group flex flex-col text-left rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 ${card.bgStyle} cursor-pointer`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] shadow-sm ${card.color}`}>
                    <Icon size={24} />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center text-[hsl(var(--muted-foreground))] group-hover:bg-[hsl(var(--primary))] group-hover:text-white transition-colors">
                    <ArrowRight size={16} />
                  </div>
                </div>
                <h2 className="mb-2 text-2xl font-bold text-[hsl(var(--foreground))] tracking-tight">
                  {card.label}
                </h2>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6 leading-relaxed flex-1">
                  {card.description}
                </p>
                <div className="space-y-3 pt-6 border-t border-[hsl(var(--border))] w-full">
                  {card.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center text-xs text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))] transition-colors">
                      <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--primary))/40] mr-2" />
                      {feature}
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-[hsl(var(--muted-foreground))] relative z-10 border-t border-[hsl(var(--border))] bg-[hsl(var(--card))/50] backdrop-blur-sm mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center px-6">
          <p>国家能源审计管理平台 v1.0.0 (开发环境)</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <span className="flex items-center gap-1"><Database size={14} /> 数据脱敏保护</span>
            <span className="flex items-center gap-1"><Shield size={14} /> 统一身份认证(OIDC)就绪</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
