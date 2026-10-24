"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ListingCard } from "@/components/listing-card";
import type { Locale } from "@/lib/i18n";
import type { ListingCardData } from "@/lib/listing-view";

const AUTOPLAY_MS = 5000;

type Props = {
  items: ListingCardData[];
  locale: Locale;
  title: string;
  prevLabel: string;
  nextLabel: string;
  subtitle?: string;
  allHref?: string;
  allLabel?: string;
};

export function SimilarListings({
  items,
  locale,
  title,
  prevLabel,
  nextLabel,
  subtitle,
  allHref,
  allLabel,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [canScroll, setCanScroll] = useState(false);

  const go = useCallback((direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;

    const card = track.firstElementChild as HTMLElement | null;
    const stepWidth = card ? card.offsetWidth + 16 : track.clientWidth;
    const maxScroll = track.scrollWidth - track.clientWidth;

    // Chetga yetganda boshidan davom etadi
    if (direction === 1 && track.scrollLeft >= maxScroll - 8) {
      track.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }
    if (direction === -1 && track.scrollLeft <= 8) {
      track.scrollTo({ left: maxScroll, behavior: "smooth" });
      return;
    }

    track.scrollBy({ left: stepWidth * direction, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const update = () => {
      setCanScroll(track.scrollWidth - track.clientWidth > 8);
    };

    update();
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      track.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [items.length]);

  useEffect(() => {
    if (!canScroll || paused || items.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => go(1), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [canScroll, paused, items.length, go]);

  if (items.length === 0) return null;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={title}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-3">
          {allHref && allLabel && (
            <Link
              href={allHref}
              className="text-xs font-semibold whitespace-nowrap text-brand-700 hover:underline"
            >
              {allLabel} →
            </Link>
          )}

          <button
            type="button"
            onClick={() => go(-1)}
            aria-label={prevLabel}
            disabled={!canScroll}
            className="flex size-8 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label={nextLabel}
            disabled={!canScroll}
            className="flex size-8 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="w-[84%] max-w-[330px] shrink-0 snap-start sm:w-[46%] lg:w-[calc((100%-2rem)/3)]"
          >
            <ListingCard listing={item} locale={locale} />
          </div>
        ))}
      </div>
    </div>
  );
}
