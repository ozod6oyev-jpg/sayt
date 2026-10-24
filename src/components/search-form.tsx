import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
      className="rounded-2xl border border-border bg-card p-4 shadow-float sm:p-5"
    >
      <div
        className="inline-flex flex-wrap gap-1 rounded-xl bg-muted p-1"
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
            <span className="block rounded-lg px-3.5 py-2 text-sm font-semibold text-muted-foreground transition-all peer-checked:bg-white peer-checked:text-primary peer-checked:shadow-xs">
              {option.label}
            </span>
          </label>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label htmlFor="propertyType" className="mb-1.5">
            {t.search.propertyType}
          </Label>
          <select
            id="propertyType"
            name="propertyType"
            defaultValue={values.propertyType ?? ""}
            className="field h-11"
          >
            <option value="">{t.search.all}</option>
            <option value="apartment">{t.propertyType.apartment}</option>
            <option value="house">{t.propertyType.house}</option>
            <option value="land">{t.propertyType.land}</option>
            <option value="commercial">{t.propertyType.commercial}</option>
          </select>
        </div>

        <div>
          <Label htmlFor="district" className="mb-1.5">
            {t.search.district}
          </Label>
          <select
            id="district"
            name="district"
            defaultValue={values.district ?? ""}
            className="field h-11"
          >
            <option value="">{t.search.all}</option>
            {districts.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="rooms" className="mb-1.5">
            {t.search.rooms}
          </Label>
          <select id="rooms" name="rooms" defaultValue={values.rooms ?? ""} className="field h-11">
            <option value="">{t.search.all}</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5+">5+</option>
          </select>
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-semibold tracking-wide text-foreground/80 uppercase">
            {t.search.price}
          </span>
          <div className="flex items-center gap-2 rounded-xl border border-input bg-background px-3 transition-colors focus-within:border-primary/60 focus-within:ring-[3px] focus-within:ring-ring/25">
            <input
              name="minPrice"
              type="number"
              inputMode="numeric"
              min={0}
              defaultValue={values.minPrice ?? ""}
              placeholder={locale === "ru" ? "от" : "dan"}
              aria-label={t.search.priceFrom}
              className="h-11 w-full min-w-0 border-0 bg-transparent px-0.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <span className="text-border">—</span>
            <input
              name="maxPrice"
              type="number"
              inputMode="numeric"
              min={0}
              defaultValue={values.maxPrice ?? ""}
              placeholder={locale === "ru" ? "до" : "gacha"}
              aria-label={t.search.priceTo}
              className="h-11 w-full min-w-0 border-0 bg-transparent px-0.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-end">
        <Button asChild variant="ghost" className="w-full sm:w-auto">
          <Link href={`/${locale}/elonlar`}>{t.search.reset}</Link>
        </Button>
        <Button type="submit" className="w-full sm:w-auto">
          <SearchIcon className="h-4 w-4" />
          {t.search.apply}
        </Button>
      </div>
    </form>
  );
}
