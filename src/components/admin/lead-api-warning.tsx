"use client";

import { TriangleAlert } from "lucide-react";
import { useState } from "react";

/**
 * «So'rovlar» kartasining o'ng tomonidagi yonib turuvchi uchburchak belgi.
 * Bosilganda ogohlantirish matni ochiladi (karta `relative` bo'lishi kerak).
 */
export function LeadApiWarning({ message }: { message: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label={message}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="absolute top-2.5 right-2.5 grid size-5 animate-pulse place-items-center rounded-full text-amber-500 transition hover:bg-amber-50 hover:text-amber-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        <TriangleAlert className="size-5" strokeWidth={2.25} aria-hidden />
      </button>

      {open && (
        <p
          role="status"
          className="absolute top-full right-0 z-30 mt-1.5 w-64 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-left text-[11px] leading-4 font-semibold text-amber-900 shadow-float"
        >
          {message}
        </p>
      )}
    </>
  );
}
