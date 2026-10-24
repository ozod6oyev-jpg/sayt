import type { Article } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { getDict } from "@/lib/i18n";

const t = getDict("uz");

const ERROR_MESSAGES: Record<string, string> = {
  required: "Sarlavha (ikki tilda) va muallif ismini to'ldiring.",
  cover: "Muqova rasmni yuklang.",
};

export function ArticleForm({
  action,
  article,
  error,
  saved,
}: {
  action: (formData: FormData) => Promise<void>;
  article?: Article;
  error?: string;
  saved?: string;
}) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} className="card space-y-6 p-6">
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {ERROR_MESSAGES[error] ?? "Xatolik yuz berdi. Qayta urinib ko'ring."}
        </p>
      )}
      {saved && (
        <p className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-700">Saqlandi.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="titleUz">
            {t.admin.fields.titleUz} *
          </label>
          <input
            id="titleUz"
            name="titleUz"
            required
            defaultValue={article?.titleUz}
            className="field"
            placeholder="Toshkentda kvartira narxlari: 2026 tahlili"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="label" htmlFor="titleRu">
            {t.admin.fields.titleRu} *
          </label>
          <input
            id="titleRu"
            name="titleRu"
            required
            defaultValue={article?.titleRu}
            className="field"
          />
        </div>

        <div>
          <label className="label" htmlFor="category">
            {t.admin.fields.category}
          </label>
          <select
            id="category"
            name="category"
            defaultValue={article?.category ?? "qollanma"}
            className="field"
          >
            <option value="bozor">{t.category.bozor}</option>
            <option value="qollanma">{t.category.qollanma}</option>
            <option value="ipoteka">{t.category.ipoteka}</option>
            <option value="tahlil">{t.category.tahlil}</option>
          </select>
        </div>

        <div>
          <label className="label" htmlFor="slug">
            {t.admin.fields.slug}
          </label>
          <input
            id="slug"
            name="slug"
            defaultValue={article?.slug}
            className="field"
            placeholder="avtomatik"
          />
        </div>

        <div>
          <label className="label" htmlFor="authorName">
            {t.admin.fields.authorName} *
          </label>
          <input
            id="authorName"
            name="authorName"
            required
            defaultValue={article?.authorName}
            className="field"
            placeholder="Ism Familiya"
          />
        </div>

        <div>
          <label className="label" htmlFor="authorRole">
            {t.admin.fields.authorRole}
          </label>
          <input
            id="authorRole"
            name="authorRole"
            defaultValue={article?.authorRole}
            className="field"
            placeholder="Ko'chmas mulk bo'yicha mutaxassis"
          />
        </div>

        <div>
          <label className="label" htmlFor="publishedAt">
            {t.admin.fields.publishedAt}
          </label>
          <input
            id="publishedAt"
            name="publishedAt"
            type="date"
            defaultValue={article ? article.publishedAt.toISOString().slice(0, 10) : today}
            className="field"
          />
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              name="published"
              defaultChecked={article?.published ?? true}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            {t.admin.published}
          </label>
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-slate-500 uppercase">
          Qisqa tavsif
        </h2>
        <div className="grid gap-4">
          <div>
            <label className="label" htmlFor="excerptUz">
              {t.admin.fields.excerptUz}
            </label>
            <textarea
              id="excerptUz"
              name="excerptUz"
              rows={3}
              defaultValue={article?.excerptUz}
              className="field"
              placeholder="Google Discover uchun 1-2 jumlalik qisqa tavsif."
            />
          </div>
          <div>
            <label className="label" htmlFor="excerptRu">
              {t.admin.fields.excerptRu}
            </label>
            <textarea
              id="excerptRu"
              name="excerptRu"
              rows={3}
              defaultValue={article?.excerptRu}
              className="field"
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-slate-500 uppercase">
          Matn
        </h2>
        <div className="grid gap-4">
          <div>
            <label className="label" htmlFor="bodyUz">
              {t.admin.fields.bodyUz}
            </label>
            <textarea
              id="bodyUz"
              name="bodyUz"
              rows={14}
              defaultValue={article?.bodyUz}
              className="field min-h-[280px] font-mono text-[13px]"
            />
          </div>
          <div>
            <label className="label" htmlFor="bodyRu">
              {t.admin.fields.bodyRu}
            </label>
            <textarea
              id="bodyRu"
              name="bodyRu"
              rows={14}
              defaultValue={article?.bodyRu}
              className="field min-h-[280px] font-mono text-[13px]"
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Matn bo'sh qator bilan ajratilgan paragraflarga bo'linadi. Sarlavhalar uchun
          <code className="mx-1 rounded bg-slate-100 px-1">##</code> va
          <code className="mx-1 rounded bg-slate-100 px-1">###</code>, ro'yxat uchun
          <code className="mx-1 rounded bg-slate-100 px-1">-</code> ishlatiladi.
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-slate-500 uppercase">
          {t.admin.fields.cover}
        </h2>

        {article && (
          <div className="mb-4 flex items-start gap-4">
            <Image
              src={article.coverImage}
              alt={article.titleUz}
              width={article.coverWidth}
              height={article.coverHeight}
              className="h-32 w-48 rounded-lg object-cover"
            />
            <p className="text-xs text-slate-500">
              Joriy muqova. Yangi rasm yuklamasangiz, shu rasm qoladi.
            </p>
          </div>
        )}

        <input
          name="cover"
          type="file"
          accept="image/*"
          required={!article}
          className="field file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700"
        />
        <p className="mt-2 text-xs text-slate-500">
          Kamida 1200px kenglikdagi rasm tavsiya etiladi (Discover uchun).
        </p>
      </section>

      <div className="flex items-center gap-3 border-t border-slate-200 pt-5">
        <button type="submit" className="btn-primary">
          {t.admin.save}
        </button>
        <Link href="/admin/articles" className="btn-secondary">
          Bekor qilish
        </Link>
      </div>
    </form>
  );
}
