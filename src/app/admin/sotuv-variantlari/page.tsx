import { createSaleOption, deleteSaleOption, updateSaleOption } from "@/app/actions/admin";
import { getDict } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

const ERROR_MESSAGES: Record<string, string> = {
  required: "Ikkala tildagi nomni kiriting.",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SaleOptionsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const saved = Array.isArray(params.saved) ? params.saved[0] : params.saved;
  const t = getDict("uz");

  const options = await prisma.saleOption.findMany({
    orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { listings: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{t.admin.saleOptions}</h1>
        <p className="mt-1 text-sm text-slate-500">{t.admin.saleOptionsHint}</p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {ERROR_MESSAGES[error] ?? "Xatolik yuz berdi. Qayta urinib ko'ring."}
        </p>
      )}
      {saved && (
        <p className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-700">Saqlandi.</p>
      )}

      <section className="card p-5">
        <h2 className="text-sm font-semibold text-slate-900">{t.admin.newSaleOption}</h2>
        <form action={createSaleOption} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="new-nameUz">
              {t.admin.fields.saleOptionUz}
            </label>
            <input
              id="new-nameUz"
              name="nameUz"
              required
              className="field"
              placeholder="Naqd"
            />
          </div>
          <div>
            <label className="label" htmlFor="new-nameRu">
              {t.admin.fields.saleOptionRu}
            </label>
            <input
              id="new-nameRu"
              name="nameRu"
              required
              className="field"
              placeholder="Наличные"
            />
          </div>
          <div>
            <label className="label" htmlFor="new-sort">
              {t.admin.fields.sort}
            </label>
            <input
              id="new-sort"
              name="sort"
              type="number"
              defaultValue={0}
              className="field"
            />
          </div>
          <div className="flex items-end gap-4">
            <label className="inline-flex items-center gap-2 pb-2.5 text-sm text-slate-700">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked
                className="size-4 rounded border-slate-300 accent-brand-700"
              />
              {t.admin.active}
            </label>
            <button type="submit" className="btn-primary text-xs">
              + {t.admin.newSaleOption}
            </button>
          </div>
        </form>
      </section>

      <div className="space-y-3">
        {options.length === 0 ? (
          <p className="card px-4 py-10 text-center text-sm text-slate-500">
            Hozircha variant qo&apos;shilmagan.
          </p>
        ) : (
          options.map((option) => (
            <div key={option.id} className="card overflow-hidden">
              <form
                action={updateSaleOption.bind(null, option.id)}
                className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_100px_auto]"
              >
                <div>
                  <label className="label" htmlFor={`nameUz-${option.id}`}>
                    {t.admin.fields.saleOptionUz}
                  </label>
                  <input
                    id={`nameUz-${option.id}`}
                    name="nameUz"
                    required
                    defaultValue={option.nameUz}
                    className="field"
                  />
                </div>
                <div>
                  <label className="label" htmlFor={`nameRu-${option.id}`}>
                    {t.admin.fields.saleOptionRu}
                  </label>
                  <input
                    id={`nameRu-${option.id}`}
                    name="nameRu"
                    required
                    defaultValue={option.nameRu}
                    className="field"
                  />
                </div>
                <div>
                  <label className="label" htmlFor={`sort-${option.id}`}>
                    {t.admin.fields.sort}
                  </label>
                  <input
                    id={`sort-${option.id}`}
                    name="sort"
                    type="number"
                    defaultValue={option.sort}
                    className="field"
                  />
                </div>
                <div className="flex items-end gap-3">
                  <label className="inline-flex items-center gap-2 pb-2.5 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      name="isActive"
                      defaultChecked={option.isActive}
                      className="size-4 rounded border-slate-300 accent-brand-700"
                    />
                    {t.admin.active}
                  </label>
                  <button type="submit" className="btn-secondary text-xs">
                    {t.admin.save}
                  </button>
                </div>
              </form>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50 px-4 py-2 text-xs text-slate-500">
                <span>
                  {option.slug} · {option._count.listings} ta e&apos;lon
                </span>
                <form action={deleteSaleOption.bind(null, option.id)}>
                  <button type="submit" className="font-medium text-red-600 hover:underline">
                    {t.admin.delete}
                  </button>
                </form>
              </div>
            </div>
          ))
        )}
      </div>

      <p className="text-xs text-slate-500">
        Variant o&apos;chirilsa, unga bog&apos;langan e&apos;lonlarda variant belgisi bo&apos;sh
        qoladi — e&apos;lonlar o&apos;chmaydi.
      </p>
    </div>
  );
}
