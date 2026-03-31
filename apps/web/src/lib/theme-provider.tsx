"use client";

import { useThemeStore } from "@/lib/stores/theme-store";
import { useEffect } from "react";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (resolvedTheme: string) => {
      root.classList.remove("light", "dark");
      root.classList.add(resolvedTheme);
    };

    if (theme === "system") {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? "dark" : "light");
      };
      applyTheme(mql.matches ? "dark" : "light");
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    } else {
      applyTheme(theme);
    }
  }, [theme]);

  return <>{children}</>;
}
