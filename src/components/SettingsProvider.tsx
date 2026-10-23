"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { dictionaries, isLang, type Dictionary, type Lang, type Theme } from "@/lib/i18n";

const THEME_KEY = "nexus-theme";
const LANG_KEY = "nexus-lang";
const DEFAULT_LANG: Lang = "fr";

type SettingsValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  theme: Theme;
  toggleTheme: () => void;
  t: Dictionary;
  isRtl: boolean;
};

const SettingsContext = createContext<SettingsValue | null>(null);
const listeners = new Set<() => void>();

function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage can be blocked (private mode); the preference then lasts for this visit only.
  }
}

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  window.addEventListener("storage", listener);
  media.addEventListener("change", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
    media.removeEventListener("change", listener);
  };
}

function getLangSnapshot(): Lang {
  const stored = readStored(LANG_KEY);
  if (isLang(stored)) return stored;
  const browser = navigator.language.slice(0, 2);
  return isLang(browser) ? browser : DEFAULT_LANG;
}

function getThemeSnapshot(): Theme {
  const stored = readStored(THEME_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(subscribe, getLangSnapshot, () => DEFAULT_LANG);
  const theme = useSyncExternalStore(subscribe, getThemeSnapshot, () => "light" as Theme);

  const setLang = useCallback((next: Lang) => {
    writeStored(LANG_KEY, next);
    notify();
  }, []);

  const toggleTheme = useCallback(() => {
    const root = document.documentElement;
    root.classList.add("theme-transition");
    window.setTimeout(() => root.classList.remove("theme-transition"), 400);
    writeStored(THEME_KEY, getThemeSnapshot() === "dark" ? "light" : "dark");
    notify();
  }, []);

  const t = dictionaries[lang];
  const isRtl = lang === "ar";

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = isRtl ? "rtl" : "ltr";
    document.title = t.meta.title;
  }, [lang, isRtl, t]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
  }, [theme]);

  const value = useMemo(() => ({ lang, setLang, theme, toggleTheme, t, isRtl }), [lang, setLang, theme, toggleTheme, t, isRtl]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsValue {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used inside SettingsProvider");
  return context;
}
