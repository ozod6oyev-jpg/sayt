import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getDict, type Locale } from "@/lib/i18n";
import { SearchIcon } from "./icons";

export type SearchParams = {
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

  return (
    <form
      action={`/${locale}/elonlar`}
      method="get"
      className="rounded-2xl border border-border bg-card p-3 shadow-float sm:p-4"
    >
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <div>
          <Label htmlFor="propertyType" className="mb-1 text-[11px]">
            {t.search.propertyType}
          </Label>
          <select
            id="propertyType"
            name="propertyType"
            defaultValue={values.propertyType ?? ""}
            className="field h-10"
          >
            <option value="">{t.search.all}</option>
            <option value="apartment">{t.propertyType.apartment}</option>
            <option value="house">{t.propertyType.house}</option>
            <option value="land">{t.propertyType.land}</option>
            <option value="commercial">{t.propertyType.commercial}</option>
          </select>
        </div>

        <div>
          <Label htmlFor="district" className="mb-1 text-[11px]">
            {t.search.district}
          </Label>
          <select
            id="district"
            name="district"
            defaultValue={values.district ?? ""}
            className="field h-10"
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
          <Label htmlFor="rooms" className="mb-1 text-[11px]">
            {t.search.rooms}
          </Label>
          <select id="rooms" name="rooms" defaultValue={values.rooms ?? ""} className="field h-10">
            <option value="">{t.search.all}</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5+">5+</option>
          </select>
        </div>

        <div>
          <span className="mb-1 block text-[11px] font-semibold tracking-wide text-foreground/80 uppercase">
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
              className="h-10 w-full min-w-0 border-0 bg-transparent px-0.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none"
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
              className="h-10 w-full min-w-0 border-0 bg-transparent px-0.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2 border-t border-border pt-3">
        <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
          <Link href={`/${locale}/elonlar`}>{t.search.reset}</Link>
        </Button>
        <Button type="submit" size="sm" className="flex-1 sm:flex-none">
          <SearchIcon className="h-4 w-4" />
          {t.search.apply}
        </Button>
      </div>
    </form>
  );
}
