import "server-only";

// Cliente mínimo para o Upstash Redis via REST (sem dependências).
// A integração "Upstash for Redis" da Vercel cria estas variáveis automaticamente.

export const CHAVE_CARTINHAS = "cartinhas";

function config() {
  return {
    url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
  };
}

export function redisConfigurado(): boolean {
  const { url, token } = config();
  return Boolean(url && token);
}

export async function redis<T = unknown>(...comando: (string | number)[]): Promise<T> {
  const { url, token } = config();
  const resp = await fetch(url!, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(comando.map(String)),
    cache: "no-store",
  });
  const json = (await resp.json().catch(() => ({}))) as { result?: T; error?: string };
  if (!resp.ok || json.error) {
    throw new Error(`Redis: ${json.error || `HTTP ${resp.status}`}`);
  }
  return json.result as T;
}
