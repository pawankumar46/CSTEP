"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "theme";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === "dark") return "dark";
  if (theme === "light") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  const resolved = resolveTheme(theme);
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initial: Theme =
      stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    setThemeState(initial);
    applyTheme(initial);
    setResolvedTheme(resolveTheme(initial));
    setMounted(true);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      setThemeState((current) => {
        if (current === "system") {
          applyTheme("system");
          setResolvedTheme(resolveTheme("system"));
        }
        return current;
      });
    };

    media.addEventListener("change", onSystemChange);
    return () => media.removeEventListener("change", onSystemChange);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    localStorage.setItem(STORAGE_KEY, next);
    setThemeState(next);
    applyTheme(next);
    setResolvedTheme(resolveTheme(next));
  }, []);

  const value = useMemo(
    () => ({ theme: mounted ? theme : "system", resolvedTheme, setTheme }),
    [mounted, theme, resolvedTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
