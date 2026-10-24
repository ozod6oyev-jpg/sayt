"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";

export const THEME_KEY = "uyjoy-theme";
export const THEME_EVENT = "uyjoy-theme-sync";

function storedTheme(): "dark" | "light" | null {
  try {
    const value = window.localStorage.getItem(THEME_KEY);
    if (value === "dark" || value === "light") return value;
  } catch {
    // localStorage yopiq bo'lsa cookie'dan foydalanamiz
  }

  const match = document.cookie.match(/(?:^|; )uyjoy-theme=([^;]+)/);
  if (match?.[1] === "dark") return "dark";
  if (match?.[1] === "light") return "light";
  return null;
}

/**
 * Sahifa almashganda (orqaga/oldinga ham) React <html> klassini tozalab yuborishi mumkin.
 * Shu komponent tanlangan rejimni har navigatsiyada qayta qo'llaydi.
 */
export function ThemeSync() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    const theme = storedTheme();
    const root = document.documentElement;
    const dark = theme === "dark";

    if (root.classList.contains("dark") !== dark) {
      root.classList.toggle("dark", dark);
    }

    window.dispatchEvent(new Event(THEME_EVENT));
  }, [pathname]);

  return null;
}
