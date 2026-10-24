"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";

/** "sotamiz" o'zgarmaydi, oldidagi birikma tepadan pastga almashib turadi */
const WORDS: Record<Locale, string[]> = {
  uz: ["Real", "Tez", "Arzon", "Halol", "Oson"],
  ru: ["Реально", "Быстро", "Дёшево", "Честно", "Легко"],
};

const VERB: Record<Locale, string> = { uz: "sotamiz", ru: "продаём" };

const INTERVAL_MS = 2600;

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function BrandRotator({ locale }: { locale: Locale }) {
  const words = WORDS[locale];
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(false);
  const [width, setWidth] = useState<number | null>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    setAnimate(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (!animate) return;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % words.length);
    }, INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [animate, words.length]);

  // Oyna kengligi joriy so'z bo'yicha o'zgaradi — "sotamiz" bilan oraliq doim bir xil
  useIsomorphicLayoutEffect(() => {
    const measure = () => {
      const el = wordRefs.current[index];
      if (el) setWidth(el.getBoundingClientRect().width);
    };

    measure();
    document.fonts?.ready.then(measure).catch(() => undefined);
  }, [index, locale]);

  const previous = (index - 1 + words.length) % words.length;

  return (
    <span aria-hidden="true" className="inline-flex items-baseline gap-[0.32em]">
      <span
        className={`inline-grid h-[1.35em] overflow-hidden ${
          animate ? "transition-[width] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)]" : ""
        }`}
        style={width ? { width: `${width}px` } : undefined}
      >
        {words.map((word, wordIndex) => {
          const offset = wordIndex === index ? 0 : wordIndex === previous ? 100 : -100;

          return (
            <span
              key={word}
              ref={(element) => {
                wordRefs.current[wordIndex] = element;
              }}
              className={`col-start-1 row-start-1 justify-self-start leading-[1.35] whitespace-nowrap transition-transform duration-[520ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                animate ? "" : "transition-none"
              }`}
              style={{ transform: `translateY(${offset}%)` }}
            >
              {word}
            </span>
          );
        })}
      </span>
      <span>{VERB[locale]}</span>
    </span>
  );
}
