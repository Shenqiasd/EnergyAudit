"use client";

import { Badge } from "@/components/ui/badge";
import type { UserRole } from "@/lib/auth/auth-provider";
import { useAuth } from "@/lib/auth/use-auth";
import {
  Building2,
  FileBarChart,
  ListChecks,
  Shield,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { ElementType } from "react";

interface RoleCard {
  role: UserRole;
  label: string;
  description: string;
  icon: ElementType;
  color: string;
  bgColor: string;
  dashboard: string;
}

const roleCards: RoleCard[] = [
  {
    role: "enterprise_user",
    label: "企业端",
    description: "企业用户登录，填报审计数据、管理报告和整改任务",
    icon: Building2,
    color: "text-blue-600",
    bgColor: "bg-blue-50 hover:bg-blue-100 border-blue-200",
    dashboard: "/enterprise/dashboard",
  },
  {
    role: "manager",
    label: "管理端",
    description: "政府管理人员登录，管理企业、项目、审核流程和统计分析",
    icon: Shield,
    color: "text-green-600",
    bgColor: "bg-green-50 hover:bg-green-100 border-green-200",
    dashboard: "/manager/dashboard",
  },
  {
    role: "reviewer",
    label: "审核端",
    description: "审核专家登录，查看审核任务、评分和提交审核意见",
    icon: ListChecks,
    color: "text-orange-600",
    bgColor: "bg-orange-50 hover:bg-orange-100 border-orange-200",
    dashboard: "/reviewer/tasks",
  },
];

export default function HomePage() {
  const { loginDev } = useAuth();
  const router = useRouter();

  const handleRoleSelect = (card: RoleCard) => {
    console.log("Role selected:", card.role);
    const defaultUsers: Record<UserRole, { id: string; name: string }> = {
      enterprise_user: { id: "dev-enterprise-001", name: "测试企业用户" },
      manager: { id: "dev-manager-001", name: "测试管理员" },
      reviewer: { id: "dev-reviewer-001", name: "测试审核员" },
    };
    const u = defaultUsers[card.role];
    console.log("Logging in as:", u);
    loginDev({ ...u, role: card.role });
    console.log("Navigating to:", card.dashboard);
    router.push(card.dashboard);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg)] px-4">
      {/* Header */}
      <div className="mb-12 text-center">
        <div className="mb-4 flex items-center justify-center gap-3">
          <FileBarChart size={40} className="text-[var(--color-primary)]" />
          <h1 className="text-3xl font-bold text-[var(--color-text)]">
            能源审计平台
          </h1>
        </div>
        <p className="text-[var(--color-text-secondary)]">
          请选择登录角色进入对应的工作台
        </p>
        <Badge variant="primary" className="mt-2">
          开发模式
        </Badge>
      </div>

      {/* Role selection cards */}
      <div className="grid w-full max-w-4xl gap-6 md:grid-cols-3">
        {roleCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.role}
              onClick={() => handleRoleSelect(card)}
              className={`flex flex-col items-center rounded-xl border-2 p-8 text-center transition-all duration-200 ${card.bgColor} cursor-pointer shadow-sm hover:shadow-md`}
            >
              <div
                className={`mb-4 rounded-full bg-white p-4 shadow-sm ${card.color}`}
              >
                <Icon size={32} />
              </div>
              <h2 className="mb-2 text-xl font-bold text-[var(--color-text)]">
                {card.label}
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {card.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-sm text-[var(--color-text-secondary)]">
        <p>能源审计管理平台 v0.1.0</p>
        <p className="mt-1">实际部署时将对接统一身份认证 (OIDC)</p>
      </div>
    </div>
  );
}
