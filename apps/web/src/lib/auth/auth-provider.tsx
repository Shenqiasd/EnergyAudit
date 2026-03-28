"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type UserRole = "enterprise_user" | "manager" | "reviewer";

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
}

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "energy_audit_user";

const DEFAULT_USERS: Record<UserRole, AuthUser> = {
  enterprise_user: {
    id: "dev-enterprise-001",
    name: "测试企业用户",
    role: "enterprise_user",
  },
  manager: {
    id: "dev-manager-001",
    name: "测试管理员",
    role: "manager",
  },
  reviewer: {
    id: "dev-reviewer-001",
    name: "测试审核员",
    role: "reviewer",
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const login = useCallback((u: AuthUser) => {
    setUser(u);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const switchRole = useCallback(
    (role: UserRole) => {
      const newUser = DEFAULT_USERS[role];
      login(newUser);
    },
    [login],
  );

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, login, logout, switchRole }}
    >
      {children}
    </AuthContext.Provider>
  );
}
