import Link from "next/link";
import { getDict, type Locale } from "@/lib/i18n";
import { SearchIcon } from "./icons";

export type SearchParams = {
  type?: string;
  propertyType?: string;
  district?: string;
  rooms?: string;
  minPrice?: string;
  maxPrice?: string;
};

export function SearchForm({
  locale,
  districts,
  values = {},
}: {
  locale: Locale;
  districts: string[];
  values?: SearchParams;
}) {
  const t = getDict(locale);

  const typeOptions = [
    { value: "", label: t.search.all },
    { value: "sale", label: t.listingType.sale },
    { value: "rent", label: t.listingType.rent },
  ];

  return (
    <form
      action={`/${locale}/elonlar`}
      method="get"
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-float sm:p-5"
    >
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="inline-flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1"
          role="radiogroup"
          aria-label={t.search.type}
        >
          {typeOptions.map((option) => (
            <label key={option.value || "all"} className="cursor-pointer">
              <input
                type="radio"
                name="type"
                value={option.value}
                defaultChecked={(values.type ?? "") === option.value}
                className="peer sr-only"
              />
              <span className="block rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-600 transition-colors peer-checked:bg-white peer-checked:text-brand-800 peer-checked:shadow-sm">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="label" htmlFor="propertyType">
            {t.search.propertyType}
          </label>
          <select
            id="propertyType"
            name="propertyType"
            defaultValue={values.propertyType ?? ""}
            className="field"
          >
            <option value="">{t.search.all}</option>
            <option value="apartment">{t.propertyType.apartment}</option>
            <option value="house">{t.propertyType.house}</option>
            <option value="land">{t.propertyType.land}</option>
            <option value="commercial">{t.propertyType.commercial}</option>
          </select>
        </div>

        <div>
          <label className="label" htmlFor="district">
            {t.search.district}
          </label>
          <select id="district" name="district" defaultValue={values.district ?? ""} className="field">
            <option value="">{t.search.all}</option>
            {districts.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="rooms">
            {t.search.rooms}
          </label>
          <select id="rooms" name="rooms" defaultValue={values.rooms ?? ""} className="field">
            <option value="">{t.search.all}</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5+">5+</option>
          </select>
        </div>

        <div>
          <span className="label">{t.search.price}</span>
          <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-1 transition-colors focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100">
            <input
              name="minPrice"
              type="number"
              inputMode="numeric"
              min={0}
              defaultValue={values.minPrice ?? ""}
              placeholder="dan"
              aria-label={t.search.priceFrom}
              className="w-full border-0 bg-transparent px-0.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            <span className="text-slate-300">—</span>
            <input
              name="maxPrice"
              type="number"
              inputMode="numeric"
              min={0}
              defaultValue={values.maxPrice ?? ""}
              placeholder="gacha"
              aria-label={t.search.priceTo}
              className="w-full border-0 bg-transparent px-0.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          {locale === "ru"
            ? "Площадь, цена и район — всё в одном поиске."
            : "Maydon, narx va tuman — bitta qidiruvda."}
        </p>
        <div className="flex w-full gap-2 sm:w-auto">
          <Link href={`/${locale}/elonlar`} className="btn-secondary flex-1 sm:flex-none">
            {t.search.reset}
          </Link>
          <button type="submit" className="btn-primary flex-1 sm:flex-none">
            <SearchIcon className="h-4 w-4" />
            {t.search.apply}
          </button>
        </div>
      </div>
    </form>
  );
}
