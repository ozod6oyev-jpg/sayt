import Link from "next/link";
import { getDict, type Locale } from "@/lib/i18n";

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

  return (
    <form
      action={`/${locale}/elonlar`}
      method="get"
      className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6"
    >
      <div>
        <label className="label" htmlFor="type">
          {t.search.type}
        </label>
        <select id="type" name="type" defaultValue={values.type ?? ""} className="field">
          <option value="">{t.search.all}</option>
          <option value="sale">{t.listingType.sale}</option>
          <option value="rent">{t.listingType.rent}</option>
        </select>
      </div>

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
        <label className="label" htmlFor="minPrice">
          {t.search.priceFrom}
        </label>
        <input
          id="minPrice"
          name="minPrice"
          type="number"
          inputMode="numeric"
          min={0}
          defaultValue={values.minPrice ?? ""}
          className="field"
          placeholder="0"
        />
      </div>

      <div>
        <label className="label" htmlFor="maxPrice">
          {t.search.priceTo}
        </label>
        <input
          id="maxPrice"
          name="maxPrice"
          type="number"
          inputMode="numeric"
          min={0}
          defaultValue={values.maxPrice ?? ""}
          className="field"
          placeholder="100000"
        />
      </div>

      <div className="flex gap-2 sm:col-span-2 lg:col-span-6">
        <button type="submit" className="btn-primary flex-1 sm:flex-none">
          {t.search.apply}
        </button>
        <Link href={`/${locale}/elonlar`} className="btn-secondary">
          {t.search.reset}
        </Link>
      </div>
    </form>
  );
}
