"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { apiClient } from "../api/client";

export type UserRole = "enterprise_user" | "manager" | "reviewer";

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
  enterpriseId?: string | null;
}

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginDev: (user: AuthUser) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  getAccessToken: () => string | null;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "energy_audit_token";
const REFRESH_TOKEN_KEY = "energy_audit_refresh_token";
const USER_KEY = "energy_audit_user";

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

function storeTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return null;

  try {
    const data = await apiClient.post<{
      accessToken: string;
      refreshToken: string;
    }>("/auth/refresh", { refreshToken });
    storeTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    clearTokens();
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      const token = localStorage.getItem(TOKEN_KEY);
      if (stored && token) {
        setUser(JSON.parse(stored));
      } else {
        // No valid token — clear stale session
        clearTokens();
      }
    } catch {
      clearTokens();
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiClient.post<{
      accessToken: string;
      refreshToken: string;
      user: AuthUser;
    }>("/auth/login", { email, password });

    storeTokens(data.accessToken, data.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
  }, []);

  const loginDev = useCallback(async (u: AuthUser) => {
    const devEmail = `${u.role}@dev.local`;
    const devPassword = "dev123456";

    try {
      // Try login first
      const data = await apiClient.post<{
        accessToken: string;
        refreshToken: string;
        user: AuthUser;
      }>("/auth/login", { email: devEmail, password: devPassword });

      storeTokens(data.accessToken, data.refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setUser(data.user);
    } catch {
      try {
        // If login fails, register then use returned tokens
        const data = await apiClient.post<{
          accessToken: string;
          refreshToken: string;
          user: AuthUser;
        }>("/auth/register", {
          email: devEmail,
          password: devPassword,
          name: u.name,
          role: u.role,
        });

        storeTokens(data.accessToken, data.refreshToken);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        setUser(data.user);
      } catch {
        // Fallback: store user without token (some APIs may fail)
        setUser(u);
        localStorage.setItem(USER_KEY, JSON.stringify(u));
      }
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    clearTokens();
  }, []);

  const switchRole = useCallback(
    async (role: UserRole) => {
      const newUser = DEFAULT_USERS[role];
      await loginDev(newUser);
    },
    [loginDev],
  );

  const getAccessToken = useCallback((): string | null => {
    return getStoredAccessToken();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginDev,
        logout,
        switchRole,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
