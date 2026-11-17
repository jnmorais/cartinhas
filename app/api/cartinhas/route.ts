import { createHash, timingSafeEqual } from "node:crypto";
import { redis, redisConfigurado, CHAVE_CARTINHAS } from "@/lib/redis";
import type { CartinhaSalva } from "@/lib/validar";

export const dynamic = "force-dynamic";

const hash = (texto: string) => createHash("sha256").update(texto).digest();
const semCache = { "Cache-Control": "no-store" };

export async function GET(req: Request) {
  const senhaCerta = process.env.ADMIN_PASSWORD;
  if (!senhaCerta) {
    return Response.json({ erro: "Defina a variável ADMIN_PASSWORD na Vercel." }, { status: 503, headers: semCache });
  }
  if (!redisConfigurado()) {
    return Response.json({ erro: "Conecte o Upstash Redis ao projeto na Vercel." }, { status: 503, headers: semCache });
  }

  const senhaEnviada = req.headers.get("x-admin-password") || "";
  if (!timingSafeEqual(hash(senhaEnviada), hash(senhaCerta))) {
    return Response.json({ erro: "Senha incorreta." }, { status: 401, headers: semCache });
  }

  try {
    const itens = (await redis<string[]>("LRANGE", CHAVE_CARTINHAS, 0, -1)) || [];
    const cartinhas = itens
      .map((s) => {
        try { return JSON.parse(s) as CartinhaSalva; } catch { return null; }
      })
      .filter((c): c is CartinhaSalva => c !== null)
      .reverse(); // mais recentes primeiro
    return Response.json({ total: cartinhas.length, cartinhas }, { headers: semCache });
  } catch (err) {
    console.error(err);
    return Response.json({ erro: "Não foi possível ler as cartinhas." }, { status: 500, headers: semCache });
  }
}
