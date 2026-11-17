import { redis, redisConfigurado, CHAVE_CARTINHAS } from "@/lib/redis";
import { validarCartinha, type CartinhaSalva } from "@/lib/validar";

// Uma escola inteira pode sair pelo mesmo IP, então o limite é generoso.
const LIMITE_POR_MINUTO = 60;

export async function POST(req: Request) {
  if (!redisConfigurado()) {
    return Response.json({ erro: "O site ainda não está pronto para receber cartinhas." }, { status: 503 });
  }

  const corpo = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  // Campo isca preenchido = robô. Finge que deu certo e não guarda nada.
  if (corpo.website) return Response.json({ ok: true }, { status: 201 });

  const { ok, erros, dados } = validarCartinha(corpo);
  if (!ok) return Response.json({ erro: erros[0], erros }, { status: 400 });

  try {
    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "anon";
    const chaveLimite = `limite:${ip}`;
    const tentativas = await redis<number>("INCR", chaveLimite);
    if (tentativas === 1) await redis("EXPIRE", chaveLimite, 60);
    if (tentativas > LIMITE_POR_MINUTO) {
      return Response.json({ erro: "Muitas cartinhas de uma vez! Espere um minutinho. ⏳" }, { status: 429 });
    }

    const registro: CartinhaSalva = { ...dados, criadoEm: new Date().toISOString() };
    await redis("RPUSH", CHAVE_CARTINHAS, JSON.stringify(registro));
    return Response.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json({ erro: "Não conseguimos guardar a cartinha agora. Tente de novo!" }, { status: 500 });
  }
}
