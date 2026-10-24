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
  const total = String(items.length).padStart(2, "0");
  const current = String(index + 1).padStart(2, "0");

  function goTo(next: number) {
    setIndex((next + items.length) % items.length);
  }

  return (
    <section className="container-page pt-4 sm:pt-5">
      <div
        className="relative overflow-hidden rounded-2xl bg-brand-900 shadow-float sm:rounded-3xl"
        aria-roledescription="carousel"
        aria-label={locale === "ru" ? "Слайдер объявлений" : "E'lonlar slayderi"}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <div className="grid lg:h-[480px] lg:grid-cols-[0.92fr_1.08fr]">
          {/* Rasm */}
          <div className="relative order-1 h-[230px] overflow-hidden bg-brand-800 sm:h-[320px] lg:order-2 lg:h-full">
            {items.map((item, slideIndex) => {
              const isActive = slideIndex === index;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  aria-hidden={!isActive}
                  tabIndex={isActive ? 0 : -1}
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
                      sizes="(max-width: 1024px) 100vw, 58vw"
                      className={cn(
                        "object-cover transition-transform duration-[7000ms] ease-out motion-reduce:transition-none",
                        isActive ? "scale-105" : "scale-100",
                      )}
                    />
                  ) : (
                    <div className="h-full w-full bg-brand-800" />
                  )}
                </Link>
              );
            })}

            {/* Chetlarni yumshatish */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-brand-900/50 to-transparent backdrop-blur-xl [mask-image:linear-gradient(to_bottom,black,transparent)]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-brand-900/60 to-transparent backdrop-blur-xl [mask-image:linear-gradient(to_top,black,transparent)] lg:h-20"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 hidden w-24 bg-gradient-to-r from-brand-900 to-transparent lg:block"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-brand-900 to-transparent lg:hidden"
            />
          </div>

          {/* Ma'lumot paneli */}
          <div className="relative z-10 order-2 flex flex-col justify-between gap-7 bg-brand-900 p-6 sm:p-8 lg:order-1 lg:p-10">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[11px] font-semibold tracking-[0.22em] text-brand-300 uppercase">
                {t.slider.featured}
              </span>
              <span className="font-display text-xs font-bold tracking-widest text-brand-300">
                <span className="text-white">{current}</span> / {total}
              </span>
            </div>

            <div
              key={active.id}
              className="animate-in fade-in slide-in-from-bottom-1 duration-500 motion-reduce:animate-none"
            >
              <div className="flex flex-wrap gap-1.5">
                <Badge className="bg-white/10 text-white backdrop-blur">{active.saleLabel}</Badge>
                <Badge variant="glass">{active.propertyTypeLabel}</Badge>
              </div>

              <h2 className="mt-4 line-clamp-3 text-2xl leading-[1.18] font-extrabold tracking-tight text-white sm:text-3xl lg:text-[2rem]">
                {active.title}
              </h2>

              <p className="mt-4 flex items-center gap-2 text-sm text-brand-200">
                <MapPin className="size-4 shrink-0 text-brand-300" />
                {active.location}
              </p>

              <p className="font-display mt-5 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                {active.price}
              </p>
            </div>

            <div>
              <div className="flex gap-1.5" role="tablist" aria-label="Slaydlar">
                {items.map((item, dotIndex) => (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    onClick={() => goTo(dotIndex)}
                    aria-selected={dotIndex === index}
                    aria-label={`${dotIndex + 1} / ${items.length}`}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors duration-300",
                      dotIndex === index
                        ? "bg-white"
                        : "bg-white/20 hover:bg-white/40",
                    )}
                  />
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between gap-4">
                <Button
                  asChild
                  size="lg"
                  className="rounded-xl bg-white text-brand-900 shadow-sm hover:bg-brand-50"
                >
                  <Link href={active.href}>
                    {t.slider.view}
                    <ArrowUpRight className="size-4" />
                  </Link>
                </Button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => goTo(index - 1)}
                    aria-label={t.slider.prev}
                    className="flex size-10 items-center justify-center rounded-full border border-white/20 text-white/80 transition-colors hover:border-white/40 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => goTo(index + 1)}
                    aria-label={t.slider.next}
                    className="flex size-10 items-center justify-center rounded-full border border-white/20 text-white/80 transition-colors hover:border-white/40 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                  >
                    <ChevronRight className="size-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
