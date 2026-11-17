"use client";

import { useEffect, useRef, useState, type CSSProperties, type ChangeEvent, type FormEvent, type RefObject } from "react";
import { IDADE_MAX, IDADE_MIN, formatarTelefone, somenteDigitos } from "@/lib/validar";
import { PARTICULAS, esperar, estrelinhas, menosMovimento, pontoDoCursor } from "./efeitos";

type Campo = "nome" | "idade" | "telefone";
type Fase = "fechada" | "abrindo" | "aberta" | "enviando";

type Props = {
  chegando: boolean; // true quando é um envelope novo depois de enviar outro
  fxRef: RefObject<HTMLDivElement | null>;
  onEnviada: (primeiroNome: string) => void;
};

const CORES_VELAS = ["#ff4d6d", "#4aa8ff", "#36c98a", "#a77bff", "#ff9f43", "#f4b400"];

const limitarIdade = (v: number) => Math.max(IDADE_MIN, Math.min(IDADE_MAX, v));

export default function Envelope({ chegando, fxRef, onEnviada }: Props) {
  // Estados visuais do envelope (cada um vira uma classe CSS)
  const [visual, setVisual] = useState({
    idle: !chegando,
    arrive: chegando,
    unsealed: false,
    "flap-open": false,
    "flap-behind": false,
    "letter-out": false,
    fly: false,
  });
  const mudar = (p: Partial<typeof visual>) => setVisual((v) => ({ ...v, ...p }));

  const [aberto, setAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [nome, setNome] = useState("");
  const [idade, setIdade] = useState("");
  const [telefone, setTelefone] = useState("");
  const [isca, setIsca] = useState("");
  const [erros, setErros] = useState<Partial<Record<Campo, string>>>({});
  const [aviso, setAviso] = useState<string | null>(null);

  const fase = useRef<Fase>("fechada");
  const stageRef = useRef<HTMLFormElement>(null);
  const envRef = useRef<HTMLDivElement>(null);
  const letterRef = useRef<HTMLDivElement>(null);
  const nomeRef = useRef<HTMLInputElement>(null);
  const idadeRef = useRef<HTMLInputElement>(null);
  const telRef = useRef<HTMLInputElement>(null);

  /* ---------------- Abrir e fechar ---------------- */

  function abrir() {
    if (fase.current !== "fechada") return;
    fase.current = "abrindo";
    // O foco precisa acontecer dentro do toque/tecla para o teclado do celular abrir.
    letterRef.current!.inert = false;
    nomeRef.current?.focus({ preventScroll: true });
    animarAbertura();
  }

  async function animarAbertura() {
    mudar({ idle: false, arrive: false, unsealed: true });
    await esperar(220);
    mudar({ "flap-open": true });
    setAberto(true);
    await esperar(280);
    mudar({ "flap-behind": true });
    await esperar(80);
    mudar({ "letter-out": true });
    await esperar(700);
    if (letterRef.current) letterRef.current.scrollTop = 0;
    if (fase.current === "abrindo") fase.current = "aberta";
    if (window.innerWidth <= 520) {
      stageRef.current?.scrollIntoView({ behavior: menosMovimento() ? "auto" : "smooth", block: "start" });
    }
  }

  async function fechar() {
    letterRef.current!.inert = true;
    mudar({ "letter-out": false });
    await esperar(650);
    mudar({ "flap-behind": false, "flap-open": false });
    await esperar(480);
    mudar({ unsealed: false });
    await esperar(450);
  }

  // A carta começa fechada (sem dar para tabular para dentro dela)
  useEffect(() => {
    if (letterRef.current) letterRef.current.inert = true;
  }, []);

  // Começou a digitar com o envelope fechado? Ele abre sozinho e a letra vai pro nome.
  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (fase.current !== "fechada" || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        abrir();
      } else if (e.key.length === 1) {
        abrir();
      }
    }
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Aviso some sozinho
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 4500);
    return () => clearTimeout(t);
  }, [aviso]);

  /* ---------------- Campos ---------------- */

  function limparErro(campo: Campo) {
    if (erros[campo]) setErros((e) => ({ ...e, [campo]: undefined }));
  }

  function efeitoDigitar(e: ChangeEvent<HTMLInputElement>, campo: Campo, valor: string) {
    const tipo = (e.nativeEvent as InputEvent).inputType;
    if (tipo && !tipo.startsWith("insert")) return;
    const input = e.currentTarget;
    input.classList.remove("pop");
    void input.offsetWidth; // reinicia a animação
    input.classList.add("pop");
    const { x, y } = pontoDoCursor(input, valor);
    estrelinhas(fxRef.current, x, y, PARTICULAS[campo]);
  }

  function aoMudarNome(e: ChangeEvent<HTMLInputElement>) {
    const valor = e.target.value.replace(/\s{2,}/g, " ").replace(/^\s+/, "");
    setNome(valor);
    limparErro("nome");
    efeitoDigitar(e, "nome", valor);
  }

  function aoMudarIdade(e: ChangeEvent<HTMLInputElement>) {
    const digitos = somenteDigitos(e.target.value).slice(0, 2);
    const valor = digitos === "" ? "" : String(Math.min(parseInt(digitos, 10), IDADE_MAX));
    setIdade(valor);
    limparErro("idade");
    efeitoDigitar(e, "idade", valor);
  }

  function passoIdade(passo: number, botao?: HTMLElement) {
    const atual = parseInt(idade, 10);
    const nova = Number.isNaN(atual) ? (passo > 0 ? 5 : IDADE_MIN) : atual + passo;
    setIdade(String(limitarIdade(nova)));
    limparErro("idade");
    if (botao) {
      const r = botao.getBoundingClientRect();
      estrelinhas(fxRef.current, r.left + r.width / 2, r.top, PARTICULAS.idade, 2);
    }
  }

  function aoMudarTelefone(e: ChangeEvent<HTMLInputElement>) {
    const valor = formatarTelefone(e.target.value);
    setTelefone(valor);
    limparErro("telefone");
    efeitoDigitar(e, "telefone", valor);
  }

  const qtdVelas = parseInt(idade, 10) || 0;
  const remetente = nome.trim() || "você";

  /* ---------------- Validação e envio ---------------- */

  function validar(): boolean {
    const novos: Partial<Record<Campo, string>> = {};
    if (nome.trim().length < 2) novos.nome = "Escreva seu nome 😊";
    const i = parseInt(idade, 10);
    if (!(i >= IDADE_MIN && i <= IDADE_MAX)) novos.idade = "Quantos anos você tem? 🎂";
    const t = somenteDigitos(telefone);
    if (t.length < 10) novos.telefone = t.length ? "Falta número aqui 📞" : "Coloque um telefone 📞";

    // limpa e reaplica para o campo tremer de novo
    setErros({});
    requestAnimationFrame(() => setErros(novos));

    const primeiro = (["nome", "idade", "telefone"] as Campo[]).find((c) => novos[c]);
    if (primeiro) {
      ({ nome: nomeRef, idade: idadeRef, telefone: telRef })[primeiro].current?.focus();
      return false;
    }
    return true;
  }

  async function enviarDados() {
    try {
      const resp = await fetch("/api/cartinha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome.trim(),
          idade: parseInt(idade, 10),
          telefone: somenteDigitos(telefone),
          website: isca,
        }),
      });
      const json = (await resp.json().catch(() => ({}))) as { erro?: string };
      if (!resp.ok) return json.erro || "Não deu para enviar agora. Tente de novo!";
      return null;
    } catch {
      return "Sem internet? Tente de novo! 📶";
    }
  }

  async function aoEnviar(e: FormEvent) {
    e.preventDefault();
    if (fase.current !== "aberta" && fase.current !== "abrindo") return;
    if (!validar()) return;

    fase.current = "enviando";
    setEnviando(true);
    (document.activeElement as HTMLElement | null)?.blur();

    // Envia enquanto a cartinha se fecha
    const pedido = enviarDados();
    await fechar();
    const erro = await pedido;

    if (erro) {
      setAviso(erro);
      setEnviando(false);
      fase.current = "fechada";
      abrir();
      return;
    }

    // Tchau, cartinha!
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        const r = envRef.current?.getBoundingClientRect();
        if (r) estrelinhas(fxRef.current, r.left + r.width / 2, r.top + r.height / 2, PARTICULAS.voo, 2);
      }, i * 110);
    }
    mudar({ fly: true });
    await esperar(1100);
    onEnviada(nome.trim().split(" ")[0]);
  }

  /* ---------------- Tela ---------------- */

  const classesEnvelope = [
    "envelope",
    ...Object.entries(visual)
      .filter(([, ativo]) => ativo)
      .map(([nomeClasse]) => nomeClasse),
  ].join(" ");

  const classeCampo = (campo: Campo) => `field f-${campo}${erros[campo] ? " invalid" : ""}`;

  return (
    <>
      <form
        ref={stageRef}
        className={`stage${aberto ? " is-open" : ""}${enviando ? " sending" : ""}`}
        onSubmit={aoEnviar}
        noValidate
        autoComplete="off"
      >
        <p className="open-hint" aria-hidden="true">
          Toque no envelope para abrir! 👇
        </p>

        <div
          ref={envRef}
          className={classesEnvelope}
          onAnimationEnd={(e) => {
            if (e.target === e.currentTarget && visual.arrive) mudar({ arrive: false, idle: true });
          }}
        >
          <div className="env-back" />

          <div className="letter" ref={letterRef}>
            <div className="letter-inner">
              <p className="greeting">Oi! Esta é a minha cartinha 💛</p>

              <div className={classeCampo("nome")}>
                <label htmlFor="nome">
                  <span className="ico">🧒</span> Meu nome é
                </label>
                <input
                  ref={nomeRef}
                  id="nome"
                  name="nome"
                  type="text"
                  maxLength={80}
                  placeholder="Escreva seu nome"
                  autoComplete="off"
                  autoCapitalize="words"
                  spellCheck={false}
                  enterKeyHint="next"
                  value={nome}
                  onChange={aoMudarNome}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      idadeRef.current?.focus();
                    }
                  }}
                />
                <p className="hint" role="alert">{erros.nome}</p>
              </div>

              <div className={classeCampo("idade")}>
                <label htmlFor="idade">
                  <span className="ico">🎂</span> Eu tenho
                </label>
                <div className="age">
                  <button type="button" className="step" aria-label="Diminuir idade" onClick={(e) => passoIdade(-1, e.currentTarget)}>
                    −
                  </button>
                  <input
                    ref={idadeRef}
                    id="idade"
                    name="idade"
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    placeholder="?"
                    enterKeyHint="next"
                    value={idade}
                    onChange={aoMudarIdade}
                    onBlur={() => idade && setIdade(String(limitarIdade(parseInt(idade, 10))))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        telRef.current?.focus();
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        passoIdade(1);
                      } else if (e.key === "ArrowDown") {
                        e.preventDefault();
                        passoIdade(-1);
                      }
                    }}
                  />
                  <button type="button" className="step" aria-label="Aumentar idade" onClick={(e) => passoIdade(1, e.currentTarget)}>
                    +
                  </button>
                  <span className="age-suffix">anos</span>
                </div>
                <div className="candles" aria-hidden="true">
                  {Array.from({ length: qtdVelas }, (_, i) => (
                    <span key={i} className="candle" style={{ "--cc": CORES_VELAS[i % CORES_VELAS.length] } as CSSProperties} />
                  ))}
                </div>
                <p className="hint" role="alert">{erros.idade}</p>
              </div>

              <div className={classeCampo("telefone")}>
                <label htmlFor="telefone">
                  <span className="ico">📞</span> Meu telefone é
                </label>
                <input
                  ref={telRef}
                  id="telefone"
                  name="telefone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={15}
                  placeholder="(00) 00000-0000"
                  enterKeyHint="send"
                  value={telefone}
                  onChange={aoMudarTelefone}
                />
                <p className="tip">Peça ajuda a um adulto 👨‍👩‍👧</p>
                <p className="hint" role="alert">{erros.telefone}</p>
              </div>

              {/* campo isca para robôs: crianças não veem */}
              <input
                className="hp"
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={isca}
                onChange={(e) => setIsca(e.target.value)}
              />
            </div>
            <div className="letter-foot" aria-hidden="true">
              <span>✏️</span>
              <span>🖍️</span>
              <span>⭐</span>
              <span>🌈</span>
            </div>
          </div>

          <div className="env-pocket">
            <p className="env-label">
              <span className="env-from">
                De: <b>{remetente}</b>
              </span>
              <span className="env-stamp">🏫</span>
            </p>
          </div>
          <div className="env-flap" />
          <div className="seal" aria-hidden="true">♥</div>
          <button type="button" className="open-btn" aria-label="Abrir a cartinha" onClick={abrir} />
        </div>

        <button type="submit" className="send-btn" disabled={enviando}>
          Enviar minha cartinha 🚀
        </button>
      </form>

      {aviso && (
        <div className="toast" role="status" aria-live="polite">
          {aviso}
        </div>
      )}
    </>
  );
}
