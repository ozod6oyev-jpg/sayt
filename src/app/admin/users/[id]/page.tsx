import Link from "next/link";
import { notFound } from "next/navigation";
import { regenerateAdminTotp, resetAdminPassword, toggleAdminActive } from "@/app/actions/users";
import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatSecret, otpauthUrl } from "@/lib/totp";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const ERRORS: Record<string, string> = {
  weak: "Parol kamida 8 belgidan iborat bo'lsin.",
  match: "Parollar mos kelmadi.",
  self: "O'zingizni bloklay olmaysiz.",
  lastowner: "Tizimda kamida bitta faol owner qolishi kerak.",
  notfound: "Admin topilmadi.",
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminUserPage({ params, searchParams }: PageProps) {
  await requireOwner();

  const { id } = await params;
  const query = await searchParams;

  const user = await prisma.adminUser.findUnique({ where: { id } });
  if (!user) notFound();

  const error = first(query.error);
  const saved = first(query.saved);
  const isCreated = first(query.created) === "1";

  const secret = formatSecret(user.totpSecret);
  const uri = otpauthUrl(user.totpSecret, user.email);

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/users" className="text-xs font-medium text-brand-700">
            ← Adminlar
          </Link>
          <h1 className="mt-2 text-xl font-bold text-slate-900">{user.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {user.email} · {user.role === "owner" ? "Owner" : "Admin"}
          </p>
        </div>
        <span
          className={
            user.isActive
              ? "rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700"
              : "rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700"
          }
        >
          {user.isActive ? "Faol" : "Bloklangan"}
        </span>
      </div>

      {isCreated && (
        <div className="rounded-lg border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800">
          <p className="font-semibold">Admin yaratildi</p>
          <p className="mt-1 leading-6">
            Quyidagi kalitni, email va vaqtinchalik parolni adminga yuboring. Admin birinchi
            kirishda shu kalit orqali olingan 6 xonali kodni kiritadi.
          </p>
        </div>
      )}

      {saved === "password" && (
        <p className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">Parol yangilandi.</p>
      )}
      {saved === "totp" && (
        <p className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">
          Yangi authenticator kaliti yaratildi. Eskisi ishlamaydi.
        </p>
      )}
      {saved === "status" && (
        <p className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">Holat o'zgardi.</p>
      )}
      {error && ERRORS[error] && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{ERRORS[error]}</p>
      )}

      <section className="card p-6">
        <h2 className="text-sm font-semibold text-slate-900">Authenticator kaliti</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Admin Google Authenticator'da «Kirish kodi» → «Kalitni qo'lda kiritish» orqali shu
          kalitni qo'shadi.
        </p>

        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">
            Maxfiy kalit
          </p>
          <code className="mt-1 block font-mono text-base break-all text-slate-900 select-all">
            {secret}
          </code>
        </div>

        <div className="mt-3 rounded-lg border border-slate-200 p-4">
          <p className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">
            otpauth havolasi
          </p>
          <a
            href={uri}
            className="mt-1 block font-mono text-xs break-all text-brand-700 hover:underline"
          >
            {uri}
          </a>
        </div>

        <form action={regenerateAdminTotp.bind(null, user.id)} className="mt-4">
          <button type="submit" className="btn-secondary text-xs">
            Yangi kalit yaratish
          </button>
          <span className="ml-3 text-xs text-slate-500">
            Eski kalit ishlamay qoladi — adminga yangisini yuboring.
          </span>
        </form>
      </section>

      <section className="card p-6">
        <h2 className="text-sm font-semibold text-slate-900">Parolni yangilash</h2>

        <form action={resetAdminPassword.bind(null, user.id)} className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="password">
              Yangi parol
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="field"
            />
          </div>
          <div>
            <label className="label" htmlFor="confirm">
              Takrorlang
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="field"
            />
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn-primary">
              Saqlash
            </button>
          </div>
        </form>
      </section>

      <section className="card p-6">
        <h2 className="text-sm font-semibold text-slate-900">Kirishni bloklash</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Bloklangan admin tizimga kira olmaydi, lekin ma'lumotlari saqlanadi.
        </p>

        <form action={toggleAdminActive.bind(null, user.id)} className="mt-4">
          <button type="submit" className={user.isActive ? "btn-secondary" : "btn-primary"}>
            {user.isActive ? "Bloklash" : "Faollashtirish"}
          </button>
        </form>
      </section>
    </div>
  );
}
