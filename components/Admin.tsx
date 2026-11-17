"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { QTD_PEDIDOS, type CartinhaSalva } from "@/lib/validar";
import { ORGANIZACAO } from "@/lib/projeto";
import s from "./admin.module.css";

const CHAVE_SESSAO = "cartinhas-senha";

const formatarData = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

async function buscarCartinhas(senha: string): Promise<CartinhaSalva[]> {
  const r = await fetch("/api/cartinhas", { headers: { "x-admin-password": senha }, cache: "no-store" });
  const j = (await r.json().catch(() => ({}))) as { erro?: string; cartinhas?: CartinhaSalva[] };
  if (!r.ok) throw new Error(j.erro || "Erro ao carregar.");
  return j.cartinhas ?? [];
}

// Garante 3 pedidos mesmo em registros antigos/incompletos
const pedidosDe = (c: CartinhaSalva) => Array.from({ length: QTD_PEDIDOS }, (_, i) => c.pedidos?.[i] ?? "");

function baixarCsv(cartinhas: CartinhaSalva[]) {
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const titulosPedidos = Array.from({ length: QTD_PEDIDOS }, (_, i) => `Pedido ${i + 1}`);
  const linhas = [["Nome", "Idade", "Roupa", "Calçado", ...titulosPedidos, "Enviada em"].map(esc).join(";")];
  for (const c of cartinhas) {
    linhas.push([c.nome, c.idade, c.roupa, c.calcado, ...pedidosDe(c), formatarData(c.criadoEm)].map(esc).join(";"));
  }
  // BOM + ";" para o Excel em português abrir certinho
  const blob = new Blob(["﻿" + linhas.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `cartinhas-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export default function Admin() {
  const [senha, setSenha] = useState("");
  const [cartinhas, setCartinhas] = useState<CartinhaSalva[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [busca, setBusca] = useState("");

  async function entrar(senhaUsada: string) {
    setCarregando(true);
    setErro(null);
    try {
      setCartinhas(await buscarCartinhas(senhaUsada));
      try { sessionStorage.setItem(CHAVE_SESSAO, senhaUsada); } catch {}
    } catch (e) {
      try { sessionStorage.removeItem(CHAVE_SESSAO); } catch {}
      setErro((e as Error).message);
    } finally {
      setCarregando(false);
    }
  }

  // Lembra a senha enquanto a aba estiver aberta
  useEffect(() => {
    let salva: string | null = null;
    try { salva = sessionStorage.getItem(CHAVE_SESSAO); } catch {}
    if (salva) {
      setSenha(salva);
      entrar(salva);
    }
  }, []);

  const filtradas = useMemo(() => {
    if (!cartinhas) return [];
    const termo = busca.trim().toLowerCase();
    if (!termo) return cartinhas;
    return cartinhas.filter(
      (c) => c.nome.toLowerCase().includes(termo) || pedidosDe(c).some((p) => p.toLowerCase().includes(termo))
    );
  }, [cartinhas, busca]);

  return (
    <div className={s.fundo}>
      <main className={s.main}>
        <h1 className={s.h1}>📬 Cartinhas recebidas</h1>
        <p className={s.sub}>Área do {ORGANIZACAO}. Digite a senha para ver as cartinhas.</p>

        {cartinhas === null ? (
          <section className={s.card}>
            <form
              className={s.login}
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                entrar(senha);
              }}
            >
              <input
                className={s.input}
                type="password"
                placeholder="Senha"
                autoComplete="current-password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
              <button className={s.btn} type="submit" disabled={carregando}>
                {carregando ? "Entrando…" : "Entrar"}
              </button>
            </form>
            {erro && <p className={s.erro}>{erro}</p>}
          </section>
        ) : (
          <section className={s.card}>
            <div className={s.bar}>
              <div className={s.total}>
                <b>{cartinhas.length}</b> cartinhas
              </div>
              <div className={s.acoes}>
                <button className={`${s.btn} ${s.ghost}`} type="button" disabled={carregando} onClick={() => entrar(senha)}>
                  {carregando ? "Atualizando…" : "Atualizar"}
                </button>
                <button className={s.btn} type="button" onClick={() => baixarCsv(cartinhas)} disabled={!cartinhas.length}>
                  Baixar planilha (CSV)
                </button>
              </div>
              <input
                className={`${s.input} ${s.busca}`}
                type="search"
                placeholder="Procurar por nome ou pedido"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            {erro && <p className={s.erro}>{erro}</p>}
            <div className={s.tabela}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Idade</th>
                    <th>Roupa</th>
                    <th>Calçado</th>
                    <th>Pedidos</th>
                    <th>Enviada em</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={s.vazio}>
                        {cartinhas.length ? "Nada encontrado." : "Nenhuma cartinha ainda. 💌"}
                      </td>
                    </tr>
                  ) : (
                    filtradas.map((c, i) => (
                      <tr key={`${c.criadoEm}-${i}`}>
                        <td className={s.nome}>{c.nome}</td>
                        <td>{c.idade} anos</td>
                        <td>{c.roupa ?? "—"}</td>
                        <td>{c.calcado ?? "—"}</td>
                        <td className={s.pedidosCel}>
                          <ol>
                            {pedidosDe(c).map((p, j) => (
                              <li key={j}>{p || "—"}</li>
                            ))}
                          </ol>
                        </td>
                        <td>{formatarData(c.criadoEm)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
