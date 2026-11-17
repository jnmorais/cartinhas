// Regras usadas tanto no navegador quanto na API.

export const IDADE_MIN = 1;
export const IDADE_MAX = 18;

export type Cartinha = {
  nome: string;
  idade: number;
  telefone: string; // só dígitos, com DDD
};

export type CartinhaSalva = Cartinha & { criadoEm: string };

export function somenteDigitos(valor: unknown): string {
  return String(valor ?? "").replace(/\D/g, "");
}

export function formatarTelefone(valor: string): string {
  const d = somenteDigitos(valor).slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function validarCartinha(body: unknown) {
  const b = (body ?? {}) as Record<string, unknown>;
  const erros: string[] = [];

  const nome = String(b.nome ?? "").replace(/\s+/g, " ").trim();
  if (nome.length < 2) erros.push("Escreva seu nome.");
  if (nome.length > 80) erros.push("O nome está muito comprido.");

  const idade = Number(b.idade);
  if (!Number.isInteger(idade) || idade < IDADE_MIN || idade > IDADE_MAX) {
    erros.push(`A idade precisa ser entre ${IDADE_MIN} e ${IDADE_MAX} anos.`);
  }

  const telefone = somenteDigitos(b.telefone);
  if (telefone.length < 10 || telefone.length > 11) erros.push("O telefone precisa ter DDD + número.");

  const dados: Cartinha = { nome, idade, telefone };
  return { ok: erros.length === 0, erros, dados };
}
