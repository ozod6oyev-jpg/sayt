"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDict, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type SliderSlide = {
  id: string;
  href: string;
  title: string;
  price: string;
  location: string;
  saleLabel: string;
  propertyTypeLabel: string;
  image: { url: string; width: number; height: number; alt: string | null } | null;
};

const AUTOPLAY_MS = 6000;

export function ListingsSlider({
  items,
  locale,
}: {
  items: SliderSlide[];
  locale: Locale;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const t = getDict(locale);

  useEffect(() => {
    if (items.length < 2 || paused) return;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % items.length);
    }, AUTOPLAY_MS);

    return () => window.clearInterval(timer);
  }, [items.length, paused, index]);

  if (items.length === 0) return null;

  const active = items[index];
  const current = String(index + 1).padStart(2, "0");
  const total = String(items.length).padStart(2, "0");

  function goTo(next: number) {
    setIndex((next + items.length) % items.length);
  }

  return (
    <section className="container-page pt-4 sm:pt-5">
      <div
        className="relative overflow-hidden rounded-2xl bg-neutral-950 shadow-float sm:rounded-3xl"
        aria-roledescription="carousel"
        aria-label={locale === "ru" ? "Слайдер объявлений" : "E'lonlar slayderi"}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <div className="relative h-[540px] sm:h-[520px] lg:h-[560px]">
          {/* Rasmlar */}
          {items.map((item, slideIndex) => {
            const isActive = slideIndex === index;

            return (
              <div
                key={item.id}
                aria-hidden={!isActive}
                className={cn(
                  "absolute inset-0 transition-opacity duration-[1200ms] ease-out motion-reduce:transition-none",
                  isActive ? "opacity-100" : "pointer-events-none opacity-0",
                )}
              >
                {item.image ? (
                  <Image
                    src={item.image.url}
                    alt={item.image.alt || item.title}
                    fill
                    priority={slideIndex === 0}
                    sizes="(max-width: 1152px) 100vw, 1152px"
                    className={cn(
                      "object-cover transition-transform duration-[7000ms] ease-out motion-reduce:transition-none",
                      isActive ? "scale-105" : "scale-100",
                    )}
                  />
                ) : (
                  <div className="h-full w-full bg-neutral-900" />
                )}
              </div>
            );
          })}

          {/* Chetlarni yumshatuvchi blur */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/35 via-black/10 to-transparent backdrop-blur-md [mask-image:linear-gradient(to_bottom,black,transparent)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/45 via-black/10 to-transparent backdrop-blur-lg [mask-image:linear-gradient(to_top,black,transparent)]"
          />

          {/* Yuqori boshqaruv */}
          <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 p-4 sm:p-5 lg:p-6">
            <span className="rounded-full bg-black/25 px-3 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-white ring-1 ring-white/20 backdrop-blur-md">
              {current} <span className="text-white/50">/ {total}</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goTo(index - 1)}
                aria-label={t.slider.prev}
                className="flex size-9 items-center justify-center rounded-full bg-black/25 text-white ring-1 ring-white/20 backdrop-blur-md transition-colors hover:bg-black/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 sm:size-10"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => goTo(index + 1)}
                aria-label={t.slider.next}
                className="flex size-9 items-center justify-center rounded-full bg-black/25 text-white ring-1 ring-white/20 backdrop-blur-md transition-colors hover:bg-black/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 sm:size-10"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
          </div>

          {/* Suzuvchi ma'lumot kartasi */}
          <div className="absolute inset-x-4 bottom-4 z-20 sm:inset-x-6 sm:bottom-6 lg:left-8 lg:bottom-8 lg:max-w-[430px]">
            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-2xl sm:p-6">
              <p className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                {t.slider.featured}
              </p>

              <div key={active.id} className="mt-3 animate-in fade-in duration-500">
                <div className="flex flex-wrap gap-1.5">
                  <Badge>{active.saleLabel}</Badge>
                  <Badge variant="secondary">{active.propertyTypeLabel}</Badge>
                </div>

                <h2 className="mt-3 line-clamp-2 text-xl leading-snug font-extrabold tracking-tight text-foreground sm:text-2xl">
                  {active.title}
                </h2>

                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
                  <MapPin className="size-4 shrink-0 text-brand-500" />
                  {active.location}
                </p>

                <p className="font-display mt-3 text-2xl font-extrabold tracking-tight text-foreground">
                  {active.price}
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between gap-4 border-t border-border pt-4">
                <Button asChild size="sm" className="h-10 px-4">
                  <Link href={active.href}>
                    {t.slider.view}
                    <ArrowUpRight className="size-4" />
                  </Link>
                </Button>

                <div className="flex items-center gap-1">
                  {items.map((item, dotIndex) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => goTo(dotIndex)}
                      aria-label={`${dotIndex + 1} / ${items.length}`}
                      aria-current={dotIndex === index}
                      className={cn(
                        "h-1 rounded-full transition-all duration-300",
                        dotIndex === index
                          ? "w-5 bg-foreground"
                          : "w-1.5 bg-foreground/20 hover:bg-foreground/40",
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
