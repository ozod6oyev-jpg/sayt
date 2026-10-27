"use client";

/** Kichik «?» belgisi — bosilganda yoki hover'da tushuntirish chiqadi */
export function InfoHint({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex align-middle">
      <button
        type="button"
        aria-label={text}
        className="grid size-4 shrink-0 place-items-center rounded-full border border-slate-300 text-[9px] font-bold leading-none text-slate-500 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        ?
      </button>

      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-44 -translate-x-1/2 rounded-lg bg-slate-900 px-2.5 py-2 text-left text-[10px] leading-4 font-normal tracking-normal text-white normal-case opacity-0 shadow-xl transition group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}
