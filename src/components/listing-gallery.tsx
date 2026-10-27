"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";

export type GalleryPhoto = {
  id: string;
  url: string;
  alt: string | null;
  width: number;
  height: number;
};

export type GalleryLabels = {
  enlarge: string;
  close: string;
  prev: string;
  next: string;
};

/**
 * E'lon rasmlari: muqova va kichik rasmlar. Bosilganda rasm butun ekranga
 * ochiladi — strelkalar, klaviatura va telefonda surish (swipe) bilan almashadi.
 */
export function ListingGallery({
  photos,
  title,
  labels,
  emptyLabel,
}: {
  photos: GalleryPhoto[];
  title: string;
  labels: GalleryLabels;
  emptyLabel: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const touchStart = useRef<number | null>(null);
  const total = photos.length;

  const close = useCallback(() => setOpenIndex(null), []);

  const step = useCallback(
    (delta: number) => {
      setOpenIndex((current) => {
        if (current === null || total === 0) return current;
        return (current + delta + total) % total;
      });
    },
    [total],
  );

  // Kattalashtirilgan ko'rinish: Escape yopadi, strelkalar rasmni almashtiradi
  useEffect(() => {
    if (openIndex === null) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [openIndex, close, step]);

  if (total === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-400">
        {emptyLabel}
      </div>
    );
  }

  const cover = photos[0];
  const active = openIndex === null ? null : photos[openIndex];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpenIndex(0)}
        aria-label={labels.enlarge}
        title={labels.enlarge}
        className="group relative block w-full overflow-hidden rounded-2xl bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        <Image
          src={cover.url}
          alt={cover.alt || title}
          width={cover.width}
          height={cover.height}
          priority
          sizes="(max-width: 1024px) 100vw, 66vw"
          className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.01] motion-reduce:transition-none"
        />
        <span className="pointer-events-none absolute right-3 bottom-3 flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1.5 text-[11px] font-semibold text-white ring-1 ring-white/25 backdrop-blur-md">
          <Maximize2 className="size-3.5" />
          {labels.enlarge}
        </span>
      </button>

      {total > 1 && (
        <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {photos.slice(1).map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setOpenIndex(index + 1)}
              aria-label={labels.enlarge}
              title={labels.enlarge}
              className="overflow-hidden rounded-xl bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <Image
                src={photo.url}
                alt={photo.alt || title}
                width={photo.width}
                height={photo.height}
                sizes="(max-width: 640px) 33vw, 20vw"
                className="aspect-[4/3] w-full object-cover transition-transform duration-300 hover:scale-[1.03] motion-reduce:transition-none"
              />
            </button>
          ))}
        </div>
      )}

      {active &&
        openIndex !== null &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={active.alt || title}
            onClick={close}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 p-2 backdrop-blur-sm sm:p-6"
          >
            <div
              onClick={(event) => event.stopPropagation()}
              onTouchStart={(event) => {
                touchStart.current = event.touches[0]?.clientX ?? null;
              }}
              onTouchEnd={(event) => {
                const start = touchStart.current;
                touchStart.current = null;
                const end = event.changedTouches[0]?.clientX;
                if (start === null || end === undefined) return;
                if (Math.abs(end - start) < 40) return;
                step(end < start ? 1 : -1);
              }}
              className="relative flex h-full w-full max-w-6xl items-center justify-center"
            >
              <div className="relative h-[82vh] w-full">
                <Image
                  src={active.url}
                  alt={active.alt || title}
                  fill
                  sizes="100vw"
                  className="object-contain"
                />
              </div>

              <button
                type="button"
                onClick={close}
                aria-label={labels.close}
                title={labels.close}
                autoFocus
                className="absolute top-2 right-2 flex size-10 items-center justify-center rounded-full bg-black/60 text-white ring-1 ring-white/25 backdrop-blur-md transition-colors hover:bg-black/80 focus-visible:outline-none sm:top-0 sm:right-0"
              >
                <X className="size-5" />
              </button>

              {total > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    aria-label={labels.prev}
                    title={labels.prev}
                    className="absolute left-1 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white ring-1 ring-white/25 backdrop-blur-md transition-colors hover:bg-black/75 focus-visible:outline-none sm:-left-2 sm:size-11"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    aria-label={labels.next}
                    title={labels.next}
                    className="absolute right-1 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white ring-1 ring-white/25 backdrop-blur-md transition-colors hover:bg-black/75 focus-visible:outline-none sm:-right-2 sm:size-11"
                  >
                    <ChevronRight className="size-5" />
                  </button>
                  <p className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/20 backdrop-blur-md">
                    {openIndex + 1} / {total}
                  </p>
                </>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
