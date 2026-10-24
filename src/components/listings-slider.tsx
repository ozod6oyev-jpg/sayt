"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
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
  }, [items.length, paused]);

  if (items.length === 0) return null;

  const active = items[index];

  return (
    <section
      className="relative isolate overflow-hidden bg-brand-900"
      aria-roledescription="carousel"
      aria-label={locale === "ru" ? "Слайдер объявлений" : "E'lonlar slayderi"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="relative h-[320px] w-full sm:h-[400px] lg:h-[460px]">
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
                  width={item.image.width}
                  height={item.image.height}
                  priority={slideIndex === 0}
                  sizes="100vw"
                  className={cn(
                    "h-full w-full object-cover transition-transform duration-[7000ms] ease-out motion-reduce:transition-none",
                    isActive ? "scale-105" : "scale-100",
                  )}
                />
              ) : (
                <div className="h-full w-full bg-brand-800" />
              )}
            </Link>
          );
        })}

        {/* O'qish uchun qoraytirish */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-900/60 via-brand-900/10 to-brand-900/20" />

        {/* Tepa blur */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-brand-900/55 via-brand-900/20 to-transparent backdrop-blur-xl [mask-image:linear-gradient(to_bottom,black,transparent)] sm:h-28 sm:backdrop-blur-2xl"
        />

        {/* Past blur */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-brand-900/75 via-brand-900/40 to-transparent backdrop-blur-2xl [mask-image:linear-gradient(to_top,black_35%,transparent)] sm:h-64"
        />

        <div className="absolute inset-x-0 bottom-0 z-20">
          <div className="container-page pb-5 sm:pb-7">
            <div
              key={active.id}
              className="animate-in fade-in slide-in-from-bottom-1 max-w-2xl duration-500 motion-reduce:animate-none"
            >
              <div className="mb-2.5 flex flex-wrap gap-1.5">
                <Badge>{active.saleLabel}</Badge>
                <Badge variant="glass">{active.propertyTypeLabel}</Badge>
              </div>

              <h2 className="line-clamp-2 text-xl leading-tight font-extrabold tracking-tight text-white sm:text-2xl lg:text-3xl">
                {active.title}
              </h2>

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-brand-100">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4 text-brand-300" />
                  {active.location}
                </span>
                <span className="font-display text-lg font-extrabold text-white sm:text-xl">
                  {active.price}
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                {items.map((item, dotIndex) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setIndex(dotIndex)}
                    aria-label={`${dotIndex + 1} / ${items.length}`}
                    aria-current={dotIndex === index}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      dotIndex === index
                        ? "w-6 bg-white"
                        : "w-1.5 bg-white/40 hover:bg-white/70",
                    )}
                  />
                ))}
              </div>

              <Button asChild size="lg" className="rounded-full shadow-float">
                <Link href={active.href}>
                  {t.slider.view}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
