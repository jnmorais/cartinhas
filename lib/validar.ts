// Regras usadas tanto no navegador quanto na API.

export const IDADE_MIN = 1;
export const IDADE_MAX = 18;

export const CALCADO_MIN = 15;
export const CALCADO_MAX = 44;

export const TAMANHOS_ROUPA = ["1", "2", "3", "4", "6", "8", "10", "12", "14", "16", "PP", "P", "M", "G", "GG"] as const;
export type TamanhoRoupa = (typeof TAMANHOS_ROUPA)[number];

export const QTD_PEDIDOS = 3;
export const PEDIDO_MAX = 60;

export type Cartinha = {
  nome: string;
  idade: number;
  roupa: TamanhoRoupa;
  calcado: number;
  pedidos: string[];
};

export type CartinhaSalva = Cartinha & { criadoEm: string };

export function somenteDigitos(valor: unknown): string {
  return String(valor ?? "").replace(/\D/g, "");
}

const limparTexto = (v: unknown) => String(v ?? "").replace(/\s+/g, " ").trim();

const ehTamanhoRoupa = (v: string): v is TamanhoRoupa => (TAMANHOS_ROUPA as readonly string[]).includes(v);

export function validarCartinha(body: unknown) {
  const b = (body ?? {}) as Record<string, unknown>;
  const erros: string[] = [];

  const nome = limparTexto(b.nome);
  if (nome.length < 2) erros.push("Escreva seu nome.");
  if (nome.length > 80) erros.push("O nome está muito comprido.");

  const idade = Number(b.idade);
  if (!Number.isInteger(idade) || idade < IDADE_MIN || idade > IDADE_MAX) {
    erros.push(`A idade precisa ser entre ${IDADE_MIN} e ${IDADE_MAX} anos.`);
  }

  const roupa = String(b.roupa ?? "").toUpperCase();
  if (!ehTamanhoRoupa(roupa)) erros.push("Escolha o tamanho da roupa.");

  const calcado = Number(b.calcado);
  if (!Number.isInteger(calcado) || calcado < CALCADO_MIN || calcado > CALCADO_MAX) {
    erros.push(`O calçado precisa ser entre ${CALCADO_MIN} e ${CALCADO_MAX}.`);
  }

  const brutos = Array.isArray(b.pedidos) ? b.pedidos : [];
  const pedidos = Array.from({ length: QTD_PEDIDOS }, (_, i) => limparTexto(brutos[i]));
  if (pedidos.some((p) => p.length < 2)) erros.push(`Escreva os ${QTD_PEDIDOS} pedidos.`);
  if (pedidos.some((p) => p.length > PEDIDO_MAX)) erros.push("Um dos pedidos está muito comprido.");

  const dados: Cartinha = { nome, idade, roupa: roupa as TamanhoRoupa, calcado, pedidos };
  return { ok: erros.length === 0, erros, dados };
}
