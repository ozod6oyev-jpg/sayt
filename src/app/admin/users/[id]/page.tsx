import Link from "next/link";
import { notFound } from "next/navigation";
import { regenerateAdminTotp, resetAdminPassword, toggleAdminActive } from "@/app/actions/users";
import { getAdminCopy } from "@/lib/admin-i18n";
import { peopleCopy } from "@/lib/admin-copy/people";
import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatSecret, otpauthUrl } from "@/lib/totp";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminUserPage({ params, searchParams }: PageProps) {
  await requireOwner();

  const c = await getAdminCopy(peopleCopy);
  const ERRORS: Record<string, string> = {
    weak: c.errWeak,
    match: c.errMatch,
    self: c.errSelf,
    lastowner: c.errLastOwner,
    notfound: c.errNotFound,
  };

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
            {c.backAdmins}
          </Link>
          <h1 className="mt-2 text-xl font-bold text-slate-900">{user.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {user.email} · {user.role === "owner" ? c.roleOwner : c.roleAdmin}
          </p>
        </div>
        <span
          className={
            user.isActive
              ? "rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700"
              : "rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700"
          }
        >
          {user.isActive ? c.statusActive : c.statusBlocked}
        </span>
      </div>

      {isCreated && (
        <div className="rounded-lg border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800">
          <p className="font-semibold">{c.detailCreatedTitle}</p>
          <p className="mt-1 leading-6">{c.detailCreatedText}</p>
        </div>
      )}

      {saved === "password" && (
        <p className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">
          {c.savedPassword}
        </p>
      )}
      {saved === "totp" && (
        <p className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">
          {c.savedTotp}
        </p>
      )}
      {saved === "status" && (
        <p className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">
          {c.savedStatus}
        </p>
      )}
      {error && ERRORS[error] && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{ERRORS[error]}</p>
      )}

      <section className="card p-6">
        <h2 className="text-sm font-semibold text-slate-900">{c.totpTitle}</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">{c.totpHint}</p>

        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">
            {c.totpSecret}
          </p>
          <code className="mt-1 block font-mono text-base break-all text-slate-900 select-all">
            {secret}
          </code>
        </div>

        <div className="mt-3 rounded-lg border border-slate-200 p-4">
          <p className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">
            {c.totpUri}
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
            {c.totpRegenerate}
          </button>
          <span className="ml-3 text-xs text-slate-500">{c.totpRegenerateHint}</span>
        </form>
      </section>

      <section className="card p-6">
        <h2 className="text-sm font-semibold text-slate-900">{c.passwordTitle}</h2>

        <form action={resetAdminPassword.bind(null, user.id)} className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="password">
              {c.labelNewPassword}
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
              {c.labelRepeat}
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
              {c.save}
            </button>
          </div>
        </form>
      </section>

      <section className="card p-6">
        <h2 className="text-sm font-semibold text-slate-900">{c.blockTitle}</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">{c.blockHint}</p>

        <form action={toggleAdminActive.bind(null, user.id)} className="mt-4">
          <button type="submit" className={user.isActive ? "btn-secondary" : "btn-primary"}>
            {user.isActive ? c.block : c.activate}
          </button>
        </form>
      </section>
    </div>
  );
}
