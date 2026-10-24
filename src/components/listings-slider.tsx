"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight, Eye, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { contact } from "@/lib/contact";
import { formatNumber } from "@/lib/format";
import { getDict, type Locale } from "@/lib/i18n";
import { TelegramIcon } from "./icons";

export type SliderSlide = {
  id: string;
  href: string;
  title: string;
  price: string;
  metric: string | null;
  location: string;
  views: number;
  phoneHref: string;
  saleLabel: string;
  propertyTypeLabel: string;
  image: { url: string; width: number; height: number; alt: string | null } | null;
};

const SLIDE_MS = 6000;

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

    const timer = window.setTimeout(() => {
      setIndex((current) => (current + 1) % items.length);
    }, SLIDE_MS);

    return () => window.clearTimeout(timer);
  }, [items.length, index, paused]);

  if (items.length === 0) return null;

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
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <div className="relative h-[300px] sm:h-[330px] lg:h-[360px]">
          {/* Yumshoq siljiydigan lenta */}
          <div
            className="flex h-full transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            style={{ transform: `translate3d(-${index * 100}%, 0, 0)` }}
          >
            {items.map((item, slideIndex) => (
              <div
                key={item.id}
                aria-hidden={slideIndex !== index}
                className="relative h-full w-full shrink-0 overflow-hidden"
              >
                {item.image ? (
                  <Image
                    src={item.image.url}
                    alt={item.image.alt || item.title}
                    fill
                    priority={slideIndex === 0}
                    sizes="(max-width: 1152px) 100vw, 1152px"
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-neutral-900" />
                )}

                {/* O'qish uchun gradientlar */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/45 to-transparent" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[72%] bg-gradient-to-t from-black/85 via-black/45 to-transparent" />

                {/* Tepa/past blur */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-black/10 backdrop-blur-md [mask-image:linear-gradient(to_bottom,black,transparent)]"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-black/10 backdrop-blur-sm [mask-image:linear-gradient(to_top,black,transparent)]"
                />

                <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3 sm:p-4">
                  <div className="max-w-2xl">
                    <div className="pointer-events-auto flex flex-wrap items-center gap-1">
                      <span className="rounded-full border border-white/20 bg-black/35 px-1.5 py-0.5 text-[9.5px] font-semibold text-white backdrop-blur-md sm:px-2 sm:text-[10px]">
                        {item.saleLabel}
                      </span>
                      <span className="rounded-full border border-white/20 bg-black/35 px-1.5 py-0.5 text-[9.5px] font-semibold text-white/90 backdrop-blur-md sm:px-2 sm:text-[10px]">
                        {item.propertyTypeLabel}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/25 px-1.5 py-0.5 text-[9.5px] font-medium text-white/75 backdrop-blur-md sm:px-2 sm:text-[10px]">
                        <Eye className="size-2.5" />
                        {formatNumber(item.views, locale)}
                      </span>
                    </div>

                    <Link
                      href={item.href}
                      tabIndex={slideIndex === index ? 0 : -1}
                      className="pointer-events-auto mt-1 line-clamp-1 block max-w-xl text-[12.5px] leading-[1.3] font-bold tracking-tight text-white transition-colors hover:text-white/85 sm:line-clamp-2 sm:text-[14px]"
                    >
                      {item.title}
                    </Link>

                    <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <p className="font-display text-[15px] font-extrabold tracking-tight text-white sm:text-base">
                        {item.price}
                      </p>
                      <p className="flex items-center gap-1 text-[10px] text-white/65 sm:text-[10.5px]">
                        <MapPin className="size-2.5 shrink-0 text-white/50" />
                        <span className="max-w-[46vw] truncate sm:max-w-none">{item.location}</span>
                      </p>
                      {item.metric && (
                        <p className="hidden text-[10px] font-medium text-white/50 md:block">
                          {item.metric}
                        </p>
                      )}
                    </div>

                    <div className="pointer-events-auto mt-2 flex flex-wrap items-center gap-1.5">
                      <Button
                        asChild
                        className="h-7 rounded-lg bg-white px-2.5 text-[10.5px] font-semibold text-[#0b0b0d] shadow-sm hover:bg-neutral-200 sm:text-[11px]"
                      >
                        <a href={item.phoneHref} tabIndex={slideIndex === index ? 0 : -1}>
                          <Phone className="size-3" />
                          {t.slider.contact}
                        </a>
                      </Button>

                      <Button
                        asChild
                        variant="subtle"
                        className="h-7 rounded-lg border border-white/20 bg-white/10 px-2.5 text-[10.5px] text-white hover:bg-white/20 sm:text-[11px]"
                      >
                        <a
                          href={contact.telegramUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          tabIndex={slideIndex === index ? 0 : -1}
                        >
                          <TelegramIcon className="size-3" />
                          Telegram
                        </a>
                      </Button>

                      <Button
                        asChild
                        variant="ghost"
                        className="hidden h-7 rounded-lg px-2 text-[10.5px] text-white/65 hover:bg-white/10 hover:text-white sm:inline-flex"
                      >
                        <Link href={item.href} tabIndex={slideIndex === index ? 0 : -1}>
                          {t.slider.detail}
                          <ArrowUpRight className="size-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Qo'lda aylantirish: yon zonalar */}
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            aria-label={t.slider.prev}
            className="absolute inset-y-0 left-0 z-10 w-[18%] cursor-w-resize focus-visible:outline-none"
          />
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            aria-label={t.slider.next}
            className="absolute inset-y-0 right-0 z-10 w-[18%] cursor-e-resize focus-visible:outline-none"
          />

          {/* Strelkalar */}
          <div className="absolute top-3 right-3 z-30 flex gap-1.5">
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label={t.slider.prev}
              className="flex size-8 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-md transition-colors hover:bg-white/25 focus-visible:outline-none"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label={t.slider.next}
              className="flex size-8 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-md transition-colors hover:bg-white/25 focus-visible:outline-none"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
