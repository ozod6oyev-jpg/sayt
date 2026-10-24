import { changeOwnPassword, regenerateOwnTotp } from "@/app/actions/auth";
import { requireAdmin } from "@/lib/auth";
import { getAdminCopy } from "@/lib/admin-i18n";
import { accountCopy } from "@/lib/admin-copy/account";
import { formatSecret, otpauthUrl } from "@/lib/totp";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProfilePage({ searchParams }: PageProps) {
  const user = await requireAdmin();
  const c = await getAdminCopy(accountCopy);
  const query = await searchParams;

  const saved = first(query.saved);
  const error = first(query.error);
  const isSetup = first(query.setup) === "1";

  const savedMessages: Record<string, string> = {
    password: c.savedPassword,
    totp: c.savedTotp,
  };

  const errorMessages: Record<string, string> = {
    current: c.errCurrent,
    weak: c.errWeak,
    match: c.errMatch,
  };

  const secret = formatSecret(user.totpSecret);
  const uri = otpauthUrl(user.totpSecret, user.email);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{c.profileTitle}</h1>
        <p className="mt-1 text-sm text-slate-500">{c.profileSubtitle}</p>
      </div>

      {isSetup && (
        <div className="rounded-lg border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800">
          <p className="font-semibold">{c.setupTitle}</p>
          <p className="mt-1 leading-6">{c.setupText}</p>
        </div>
      )}

      {saved && savedMessages[saved] && (
        <p className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">
          {savedMessages[saved]}
        </p>
      )}
      {error && errorMessages[error] && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessages[error]}</p>
      )}

      <section className="card p-6">
        <h2 className="text-sm font-semibold text-slate-900">{c.accountSection}</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-slate-500">{c.nameLabel}</dt>
            <dd className="mt-0.5 font-medium text-slate-900">{user.name}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">{c.emailLabel}</dt>
            <dd className="mt-0.5 font-medium text-slate-900">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">{c.roleLabel}</dt>
            <dd className="mt-0.5 font-medium text-slate-900">
              {user.role === "owner" ? c.roleOwner : c.roleAdmin}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">{c.lastLoginLabel}</dt>
            <dd className="mt-0.5 font-medium text-slate-900">
              {user.lastLoginAt
                ? new Intl.DateTimeFormat("ru-RU", {
                    dateStyle: "short",
                    timeStyle: "short",
                  }).format(user.lastLoginAt)
                : "—"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="card p-6">
        <h2 className="text-sm font-semibold text-slate-900">{c.authenticatorTitle}</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">{c.authenticatorHint}</p>

        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">
            {c.secretLabel}
          </p>
          <code className="mt-1 block font-mono text-base break-all text-slate-900 select-all">
            {secret}
          </code>
        </div>

        <div className="mt-3 rounded-lg border border-slate-200 p-4">
          <p className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">
            {c.otpauthLabel}
          </p>
          <a
            href={uri}
            className="mt-1 block font-mono text-xs break-all text-brand-700 hover:underline"
          >
            {uri}
          </a>
          <p className="mt-2 text-xs text-slate-500">{c.otpauthHint}</p>
        </div>

        <form action={regenerateOwnTotp} className="mt-4">
          <button type="submit" className="btn-secondary text-xs">
            {c.newKey}
          </button>
          <span className="ml-3 text-xs text-slate-500">{c.newKeyWarning}</span>
        </form>
      </section>

      <section className="card p-6">
        <h2 className="text-sm font-semibold text-slate-900">{c.changePassword}</h2>

        <form action={changeOwnPassword} className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="current">
              {c.currentPassword}
            </label>
            <input
              id="current"
              name="current"
              type="password"
              required
              autoComplete="current-password"
              className="field"
            />
          </div>
          <div>
            <label className="label" htmlFor="next">
              {c.newPassword}
            </label>
            <input
              id="next"
              name="next"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="field"
            />
          </div>
          <div>
            <label className="label" htmlFor="confirm">
              {c.repeatPassword}
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

          <div className="sm:col-span-3">
            <button type="submit" className="btn-primary">
              {c.save}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
