"use client";

import { useAuth } from "@/lib/auth/use-auth";
import { FileBarChart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
    <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--background))] px-4">
      <div className="w-full max-w-md rounded-xl border border-[hsl(var(--border))] bg-white p-8 shadow-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <FileBarChart size={32} className="text-[hsl(var(--primary))]" />
            <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">
              能源审计平台
            </h1>
          </div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            请使用您的账号登录
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-[hsl(var(--foreground))]"
            >
              邮箱
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入邮箱地址"
              required
              className="w-full rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-sm outline-none focus:border-[hsl(var(--primary))] focus:ring-1 focus:ring-[hsl(var(--primary))]"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-[hsl(var(--foreground))]"
            >
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
              className="w-full rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-sm outline-none focus:border-[hsl(var(--primary))] focus:ring-1 focus:ring-[hsl(var(--primary))]"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? "登录中..." : "登录"}
          </button>
        </form>

        {/* Dev mode link */}
        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]"
          >
            开发模式入口 →
          </a>
        </div>
      </div>
    </div>
  );
}
