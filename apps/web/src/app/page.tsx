"use client";

import { Badge } from "@/components/ui/badge";
import type { UserRole } from "@/lib/auth/auth-provider";
import { useAuth } from "@/lib/auth/use-auth";
import {
  Building2,
  FileBarChart,
  Shield,
  ListChecks,
  ArrowRight,
  Database,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { ElementType } from "react";

interface RoleCard {
  role: UserRole;
  label: string;
  description: string;
  features: string[];
  icon: ElementType;
  iconBg: string;
  iconColor: string;
  dashboard: string;
}

const roleCards: RoleCard[] = [
  {
    role: "enterprise_user",
    label: "企业端",
    description: "重点用能单位专属入口，完成能源数据合规报送与整改。",
    features: ["能源消费填报", "审计报告管理", "异常数据申诉", "整改任务追踪"],
    icon: Building2,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    dashboard: "/enterprise/dashboard",
  },
  {
    role: "manager",
    label: "管理端",
    description: "政府及监管部门入口，统筹全区域能源审计项目与数据分析。",
    features: ["企业台账管理", "项目进度监控", "区域能效对标", "预警策略配置"],
    icon: Shield,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    dashboard: "/manager/dashboard",
  },
  {
    role: "reviewer",
    label: "审核端",
    description: "专家库成员专属工作台，执行专业严谨的审计复核。",
    features: ["数据质量复核", "审计报告打分", "整改验收确认", "评审历史追溯"],
    icon: ListChecks,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
    dashboard: "/reviewer/tasks",
  },
];

const stagger = {
  animate: {
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

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
    <div className="flex min-h-screen flex-col bg-[hsl(var(--background))]">
      {/* Subtle top gradient */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-[hsl(var(--primary))/0.04] to-transparent pointer-events-none" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center pt-20 px-4 relative z-10">
        {/* Header */}
        <motion.div
          className="mb-14 text-center max-w-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[hsl(var(--primary))] text-white shadow-[var(--shadow-md)] shadow-[hsl(var(--primary))/0.25]">
              <Zap size={28} />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[hsl(var(--foreground))] mb-3">
            能源审计平台
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] leading-relaxed text-sm mb-5 max-w-sm mx-auto">
            "十五五"重点用能单位能源审计业务管理系统，支撑全生命周期管理
          </p>
          <Badge variant="outline" className="px-3 py-1.5 font-medium bg-[hsl(var(--card))] border-[hsl(var(--border))] text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse inline-block" />
            开发环境 / 演示模式
          </Badge>
        </motion.div>

        {/* Role selection cards */}
        <motion.div
          className="grid w-full max-w-5xl gap-5 md:grid-cols-3 px-2 pb-16"
          variants={stagger}
          initial="initial"
          animate="animate"
        >
          {roleCards.map((card) => {
            const Icon = card.icon;
            return (
              <motion.button
                key={card.role}
                variants={fadeUp}
                onClick={() => handleRoleSelect(card)}
                className="group flex flex-col text-left rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-7 transition-all duration-250 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-lg)] hover:-translate-y-1 hover:border-[hsl(var(--primary))/30] cursor-pointer"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className={`flex items-center justify-center w-11 h-11 rounded-2xl ${card.iconBg} ${card.iconColor}`}>
                    <Icon size={22} />
                  </div>
                  <div className="w-7 h-7 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center text-[hsl(var(--muted-foreground))] group-hover:bg-[hsl(var(--primary))] group-hover:text-white transition-colors duration-200">
                    <ArrowRight size={14} />
                  </div>
                </div>
                <h2 className="mb-1.5 text-xl font-semibold text-[hsl(var(--foreground))] tracking-tight">
                  {card.label}
                </h2>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6 leading-relaxed flex-1">
                  {card.description}
                </p>
                <div className="space-y-2.5 pt-5 border-t border-[hsl(var(--border))] w-full">
                  {card.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center text-xs text-[hsl(var(--muted-foreground))]">
                      <div className="w-1 h-1 rounded-full bg-[hsl(var(--primary))/50] mr-2.5 shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center relative z-10 border-t border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center px-6 gap-3">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">国家能源审计管理平台 v1.0.0</p>
          <div className="flex gap-5 text-xs text-[hsl(var(--muted-foreground))]">
            <span className="flex items-center gap-1.5"><Database size={12} /> 数据脱敏保护</span>
            <span className="flex items-center gap-1.5"><Shield size={12} /> 统一身份认证就绪</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
