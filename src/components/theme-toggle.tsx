"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "uyjoy-theme";

type PageTransition = { finished: Promise<void> };
type DocumentWithTransitions = Document & {
  startViewTransition?: (callback: () => void) => PageTransition;
};

export function ThemeToggle({ label }: { label: string }) {
  const [dark, setDark] = useState(false);
  const runId = useRef(0);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const root = document.documentElement;
    const next = !root.classList.contains("dark");
    const doc = document as DocumentWithTransitions;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function apply() {
      root.classList.toggle("dark", next);

      try {
        localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
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
      size="icon-sm"
      onClick={toggleTheme}
      aria-label={label}
      aria-pressed={dark}
      title={label}
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
