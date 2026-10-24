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

/** Threads video/rasm konteyneri tayyor bo'lishini kutadi */
async function waitForContainer(
  containerId: string,
  token: string,
): Promise<ThreadsResult<{ id: string }>> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const status = await threadsCall<{ id: string; status?: string; error_message?: string }>(
      containerId,
      { token, params: { fields: "status,error_message" } },
    );

    if (!status.ok) return { ok: false, description: status.description, code: status.code };

    const value = status.result.status;
    if (value === "FINISHED" || value === "PUBLISHED") return { ok: true, result: { id: containerId } };
    if (value === "ERROR" || value === "EXPIRED") {
      return { ok: false, description: status.result.error_message ?? "Threads mediani qabul qilmadi" };
    }

    await new Promise((resolve) => setTimeout(resolve, 3_000));
  }

  return { ok: false, description: "Threads media tayyor bo'lmadi (vaqt tugadi)" };
}

/** Threads'ga video yoki rasmli post joylash (container → publish) */
export async function publishThreadsMedia(options: {
  text: string;
  videoUrl?: string;
  imageUrl?: string;
  replyControl?: string;
  topicTag?: string;
}): Promise<ThreadsResult<{ id: string }>> {
  const row = await prisma.metaIntegration.findUnique({ where: { id: "default" } });
  const token = row?.threadsToken ? decryptSecret(row.threadsToken) : null;

  if (!row?.threadsUserId || !token) {
    return { ok: false, description: "Threads user ID yoki token o'rnatilmagan" };
  }

  // Threads matni 500 belgidan oshmaydi
  const text = options.text.slice(0, 500);
  const isVideo = Boolean(options.videoUrl);

  if (!isVideo && !options.imageUrl) {
    return { ok: false, description: "Threads uchun media kerak" };
  }

  const container = await threadsCall<{ id: string }>(`${row.threadsUserId}/threads`, {
    method: "POST",
    token,
    body: {
      media_type: isVideo ? "VIDEO" : "IMAGE",
      ...(isVideo ? { video_url: options.videoUrl } : { image_url: options.imageUrl }),
      text,
      ...(options.replyControl ? { reply_control: options.replyControl } : {}),
      ...(options.topicTag ? { topic_tag: options.topicTag } : {}),
    },
  });

  if (!container.ok) {
    return { ok: false, description: container.description, code: container.code };
  }

  if (isVideo) {
    const ready = await waitForContainer(container.result.id, token);
    if (!ready.ok) return ready;
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
