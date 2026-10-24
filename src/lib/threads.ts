import { decryptSecret } from "./crypto";
import { prisma } from "./prisma";

const THREADS_BASE = "https://graph.threads.net/v1.0";

export type ThreadsResult<T> =
  | { ok: true; result: T }
  | { ok: false; description: string; code?: number };

type ThreadsProfile = { id: string; username?: string };

async function threadsCall<T>(
  path: string,
  options: {
    token: string;
    method?: "GET" | "POST";
    params?: Record<string, string>;
    body?: Record<string, unknown>;
  },
): Promise<ThreadsResult<T>> {
  const url = new URL(`${THREADS_BASE}/${path.replace(/^\//, "")}`);
  for (const [key, value] of Object.entries(options.params ?? {})) {
    url.searchParams.set(key, value);
  }

  try {
    const response = await fetch(url, {
      method: options.method ?? "GET",
      headers: {
        authorization: `Bearer ${options.token}`,
        ...(options.method === "POST" ? { "content-type": "application/json" } : {}),
      },
      body: options.method === "POST" ? JSON.stringify(options.body ?? {}) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });

    const payload = (await response.json().catch(() => null)) as
      | (T & { error?: { message?: string; code?: number } })
      | null;

    if (!response.ok || !payload || payload.error) {
      return {
        ok: false,
        description: payload?.error?.message ?? `Threads API xatosi (${response.status})`,
        code: payload?.error?.code,
      };
    }

    return { ok: true, result: payload as T };
  } catch {
    return { ok: false, description: "Threads bilan aloqa yo'q" };
  }
}

/** Threads akkauntini tekshiradi va username'ni saqlaydi */
export async function checkThreadsConnection(): Promise<ThreadsResult<{ username: string | null }>> {
  const row = await prisma.metaIntegration.findUnique({ where: { id: "default" } });
  const token = row?.threadsToken ? decryptSecret(row.threadsToken) : null;

  if (!row?.threadsUserId || !token) {
    return { ok: false, description: "Threads user ID va token kerak" };
  }

  const result = await threadsCall<ThreadsProfile>("me", {
    token,
    params: { fields: "id,username" },
  });

  if (!result.ok) {
    return { ok: false, description: result.description, code: result.code };
  }

  const username = result.result.username ? `@${result.result.username}` : null;

  await prisma.metaIntegration.update({
    where: { id: "default" },
    data: { threadsUsername: username },
  });

  return { ok: true, result: { username } };
}

/** Threads'ga matnli post joylash (container → publish) */
export async function publishThreadsPost(text: string): Promise<ThreadsResult<{ id: string }>> {
  const row = await prisma.metaIntegration.findUnique({ where: { id: "default" } });
  const token = row?.threadsToken ? decryptSecret(row.threadsToken) : null;

  if (!row?.threadsUserId || !token) {
    return { ok: false, description: "Threads user ID yoki token o'rnatilmagan" };
  }

  const container = await threadsCall<{ id: string }>(`${row.threadsUserId}/threads`, {
    method: "POST",
    token,
    body: { media_type: "TEXT", text },
  });

  if (!container.ok) {
    return { ok: false, description: container.description, code: container.code };
  }

  const published = await threadsCall<{ id: string }>(`${row.threadsUserId}/threads_publish`, {
    method: "POST",
    token,
    body: { creation_id: container.result.id },
  });

  if (!published.ok) {
    return { ok: false, description: published.description, code: published.code };
  }

  return { ok: true, result: published.result };
}
