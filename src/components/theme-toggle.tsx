"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { THEME_EVENT, THEME_KEY } from "./theme-sync";

const STORAGE_KEY = THEME_KEY;

type PageTransition = { finished: Promise<void> };
type DocumentWithTransitions = Document & {
  startViewTransition?: (callback: () => void) => PageTransition;
};

export function ThemeToggle({ label, compact = false }: { label: string; compact?: boolean }) {
  const [dark, setDark] = useState(false);
  const runId = useRef(0);

  useEffect(() => {
    const sync = () => setDark(document.documentElement.classList.contains("dark"));

    sync();
    window.addEventListener(THEME_EVENT, sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener(THEME_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  function toggleTheme() {
    const root = document.documentElement;
    const next = !root.classList.contains("dark");
    const doc = document as DocumentWithTransitions;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function apply() {
      root.classList.toggle("dark", next);

      try {
        const value = next ? "dark" : "light";
        localStorage.setItem(STORAGE_KEY, value);
        // Cookie serverga ham yetib boradi: sahifa almashganda rejim saqlanadi
        document.cookie = `${STORAGE_KEY}=${value};path=/;max-age=31536000;samesite=lax`;
      } catch {
        // localStorage mavjud bo'lmasa ham rejim shu sessiyada ishlaydi
      }

      setDark(next);
    }

    if (typeof doc.startViewTransition !== "function" || reduceMotion) {
      apply();
      return;
    }

    // Tepa markazdan tarqaluvchi to'lqin (globals.css dagi keyframe'lar)
    const currentRun = ++runId.current;
    root.dataset.themeTransition = next ? "dark" : "light";
    const transition = doc.startViewTransition(() => {
      flushSync(apply);
    });

    transition.finished.finally(() => {
      if (runId.current === currentRun) {
        delete root.dataset.themeTransition;
      }
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={compact ? "icon-xs" : "icon-sm"}
      onClick={toggleTheme}
      aria-label={label}
      aria-pressed={dark}
      title={label}
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
