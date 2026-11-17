"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from "react";
import {
  CALCADO_MAX,
  CALCADO_MIN,
  IDADE_MAX,
  IDADE_MIN,
  PEDIDO_MAX,
  QTD_PEDIDOS,
  TAMANHOS_ROUPA,
  somenteDigitos,
} from "@/lib/validar";
import { PARTICULAS, esperar, estrelinhas, menosMovimento, pontoDoCursor } from "./efeitos";

type Campo = "nome" | "idade" | "roupa" | "calcado" | "pedidos";
type Fase = "fechada" | "abrindo" | "aberta" | "enviando";

type Props = {
  chegando: boolean; // true quando é um envelope novo depois de enviar outro
  fxRef: RefObject<HTMLDivElement | null>;
  onEnviada: (primeiroNome: string) => void;
};

const CORES_VELAS = ["#ff4d6d", "#4aa8ff", "#36c98a", "#a77bff", "#ff9f43", "#f4b400"];
const CORES_PEDIDOS = ["#ff4d6d", "#4aa8ff", "#f4b400"];
const NOMES_PEDIDOS = ["Primeiro pedido", "Segundo pedido", "Terceiro pedido"];

const limitar = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/* ---------- Contador com botões − e + (idade e calçado) ---------- */

type ContadorProps = {
  id: string;
  valor: string;
  min: number;
  max: number;
  inicio: () => number; // valor quando aperta + com o campo vazio
  sufixo?: string;
  rotulo: string; // ex.: "idade"
  inputRef: RefObject<HTMLInputElement | null>;
  onValor: (v: string) => void;
  onDigitar: (e: ChangeEvent<HTMLInputElement>, valor: string) => void;
  onBotao: (botao: HTMLElement) => void;
  onEnter: () => void;
};

function Contador({ id, valor, min, max, inicio, sufixo, rotulo, inputRef, onValor, onDigitar, onBotao, onEnter }: ContadorProps) {
  function passo(n: number) {
    const atual = parseInt(valor, 10);
    onValor(String(limitar(Number.isNaN(atual) ? (n > 0 ? inicio() : min) : atual + n, min, max)));
  }

  function aoTeclar(e: ReactKeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") { e.preventDefault(); onEnter(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); passo(1); }
    else if (e.key === "ArrowDown") { e.preventDefault(); passo(-1); }
  }

  return (
    <div className="age">
      <button type="button" className="step" aria-label={`Diminuir ${rotulo}`} onClick={(e) => { passo(-1); onBotao(e.currentTarget); }}>
        −
      </button>
      <input
        ref={inputRef}
        id={id}
        name={id}
        type="text"
        inputMode="numeric"
        maxLength={2}
        placeholder="?"
        enterKeyHint="next"
        value={valor}
        onChange={(e) => {
          const d = somenteDigitos(e.target.value).slice(0, 2);
          const v = d === "" ? "" : String(Math.min(parseInt(d, 10), max));
          onValor(v);
          onDigitar(e, v);
        }}
        onBlur={() => valor && onValor(String(limitar(parseInt(valor, 10), min, max)))}
        onKeyDown={aoTeclar}
      />
      <button type="button" className="step" aria-label={`Aumentar ${rotulo}`} onClick={(e) => { passo(1); onBotao(e.currentTarget); }}>
        +
      </button>
      {sufixo && <span className="age-suffix">{sufixo}</span>}
    </div>
  );
}

/* ---------- Envelope ---------- */

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
  const [roupa, setRoupa] = useState("");
  const [calcado, setCalcado] = useState("");
  const [pedidos, setPedidos] = useState<string[]>(() => Array(QTD_PEDIDOS).fill(""));
  const [isca, setIsca] = useState("");
  const [erros, setErros] = useState<Partial<Record<Campo, string>>>({});
  const [aviso, setAviso] = useState<string | null>(null);

  const fase = useRef<Fase>("fechada");
  const stageRef = useRef<HTMLFormElement>(null);
  const envRef = useRef<HTMLDivElement>(null);
  const letterRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const nomeRef = useRef<HTMLInputElement>(null);
  const idadeRef = useRef<HTMLInputElement>(null);
  const roupaRef = useRef<HTMLDivElement>(null);
  const calcadoRef = useRef<HTMLInputElement>(null);
  const pedidoRefs = useRef<(HTMLInputElement | null)[]>([]);

  /* ---------------- Altura da carta = altura do conteúdo ---------------- */

  useLayoutEffect(() => {
    const inner = innerRef.current;
    const stage = stageRef.current;
    if (!inner || !stage) return;
    const medir = () => {
      const pe = parseFloat(getComputedStyle(stage).getPropertyValue("--foot")) || 110;
      stage.style.setProperty("--letter-h", `${Math.ceil(inner.offsetHeight + pe + 4)}px`);
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(inner);
    return () => ro.disconnect();
  }, []);

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
    stageRef.current?.scrollIntoView({ behavior: menosMovimento() ? "auto" : "smooth", block: "start" });
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

  function efeitoDigitar(e: ChangeEvent<HTMLInputElement>, particulas: string[], valor: string) {
    const tipo = (e.nativeEvent as InputEvent).inputType;
    if (tipo && !tipo.startsWith("insert")) return;
    const input = e.currentTarget;
    input.classList.remove("pop");
    void input.offsetWidth; // reinicia a animação
    input.classList.add("pop");
    const { x, y } = pontoDoCursor(input, valor);
    estrelinhas(fxRef.current, x, y, particulas);
  }

  function efeitoBotao(botao: HTMLElement, particulas: string[]) {
    const r = botao.getBoundingClientRect();
    estrelinhas(fxRef.current, r.left + r.width / 2, r.top, particulas, 2);
  }

  function aoMudarNome(e: ChangeEvent<HTMLInputElement>) {
    const valor = e.target.value.replace(/\s{2,}/g, " ").replace(/^\s+/, "");
    setNome(valor);
    limparErro("nome");
    efeitoDigitar(e, PARTICULAS.nome, valor);
  }

  function aoMudarPedido(i: number, e: ChangeEvent<HTMLInputElement>) {
    const valor = e.target.value.replace(/\s{2,}/g, " ").replace(/^\s+/, "");
    setPedidos((p) => p.map((v, j) => (j === i ? valor : v)));
    limparErro("pedidos");
    efeitoDigitar(e, PARTICULAS.pedidos, valor);
  }

  function focarRoupa() {
    const marcado = roupaRef.current?.querySelector<HTMLInputElement>("input:checked");
    (marcado ?? roupaRef.current?.querySelector<HTMLInputElement>("input"))?.focus();
  }

  const qtdVelas = parseInt(idade, 10) || 0;
  const remetente = nome.trim() || "você";

  /* ---------------- Validação e envio ---------------- */

  function validar(): boolean {
    const novos: Partial<Record<Campo, string>> = {};
    if (nome.trim().length < 2) novos.nome = "Escreva seu nome 😊";
    const i = parseInt(idade, 10);
    if (!(i >= IDADE_MIN && i <= IDADE_MAX)) novos.idade = "Quantos anos você tem? 🎂";
    if (!roupa) novos.roupa = "Escolha um tamanho 👕";
    const c = parseInt(calcado, 10);
    if (!(c >= CALCADO_MIN && c <= CALCADO_MAX)) novos.calcado = "Qual número você calça? 👟";
    const pedidoVazio = pedidos.findIndex((p) => p.trim().length < 2);
    if (pedidoVazio >= 0) novos.pedidos = `Faltam pedidos! Escreva os ${QTD_PEDIDOS} 🎁`;

    // limpa e reaplica para o campo tremer de novo
    setErros({});
    requestAnimationFrame(() => setErros(novos));

    const ordem: Campo[] = ["nome", "idade", "roupa", "calcado", "pedidos"];
    const primeiro = ordem.find((campo) => novos[campo]);
    if (!primeiro) return true;
    if (primeiro === "nome") nomeRef.current?.focus();
    else if (primeiro === "idade") idadeRef.current?.focus();
    else if (primeiro === "roupa") focarRoupa();
    else if (primeiro === "calcado") calcadoRef.current?.focus();
    else pedidoRefs.current[pedidoVazio]?.focus();
    return false;
  }

  async function enviarDados() {
    try {
      const resp = await fetch("/api/cartinha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome.trim(),
          idade: parseInt(idade, 10),
          roupa,
          calcado: parseInt(calcado, 10),
          pedidos: pedidos.map((p) => p.trim()),
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
            <div className="letter-inner" ref={innerRef}>
              <p className="greeting">Oi! Esta é a minha cartinha 💛</p>

              {/* Nome */}
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

              {/* Idade */}
              <div className={classeCampo("idade")}>
                <label htmlFor="idade">
                  <span className="ico">🎂</span> Eu tenho
                </label>
                <Contador
                  id="idade"
                  rotulo="idade"
                  sufixo="anos"
                  valor={idade}
                  min={IDADE_MIN}
                  max={IDADE_MAX}
                  inicio={() => 5}
                  inputRef={idadeRef}
                  onValor={(v) => { setIdade(v); limparErro("idade"); }}
                  onDigitar={(e, v) => efeitoDigitar(e, PARTICULAS.idade, v)}
                  onBotao={(b) => efeitoBotao(b, PARTICULAS.idade)}
                  onEnter={focarRoupa}
                />
                <div className="candles" aria-hidden="true">
                  {Array.from({ length: qtdVelas }, (_, i) => (
                    <span key={i} className="candle" style={{ "--cc": CORES_VELAS[i % CORES_VELAS.length] } as CSSProperties} />
                  ))}
                </div>
                <p className="hint" role="alert">{erros.idade}</p>
              </div>

              {/* Roupa */}
              <div className={classeCampo("roupa")} role="radiogroup" aria-labelledby="roupa-titulo" ref={roupaRef}>
                <p className="label" id="roupa-titulo">
                  <span className="ico">👕</span> Minha roupa é tamanho
                </p>
                <div className="chips">
                  {TAMANHOS_ROUPA.map((t) => (
                    <label key={t} className="chip">
                      <input
                        type="radio"
                        name="roupa"
                        value={t}
                        checked={roupa === t}
                        onChange={(e) => {
                          setRoupa(t);
                          limparErro("roupa");
                          efeitoBotao(e.currentTarget.parentElement!, PARTICULAS.roupa);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            calcadoRef.current?.focus();
                          }
                        }}
                      />
                      <span>{t}</span>
                    </label>
                  ))}
                </div>
                <p className="hint" role="alert">{erros.roupa}</p>
              </div>

              {/* Calçado */}
              <div className={classeCampo("calcado")}>
                <label htmlFor="calcado">
                  <span className="ico">👟</span> Eu calço número
                </label>
                <Contador
                  id="calcado"
                  rotulo="número do calçado"
                  valor={calcado}
                  min={CALCADO_MIN}
                  max={CALCADO_MAX}
                  inicio={() => {
                    const i = parseInt(idade, 10);
                    return i ? Math.min(38, Math.round(18 + i * 1.6)) : 28;
                  }}
                  inputRef={calcadoRef}
                  onValor={(v) => { setCalcado(v); limparErro("calcado"); }}
                  onDigitar={(e, v) => efeitoDigitar(e, PARTICULAS.calcado, v)}
                  onBotao={(b) => efeitoBotao(b, PARTICULAS.calcado)}
                  onEnter={() => pedidoRefs.current[0]?.focus()}
                />
                <p className="hint" role="alert">{erros.calcado}</p>
              </div>

              {/* Pedidos */}
              <div className={classeCampo("pedidos")}>
                <p className="label">
                  <span className="ico">🎁</span> Meus {QTD_PEDIDOS} pedidos são
                </p>
                <ol className="pedidos">
                  {pedidos.map((p, i) => (
                    <li key={i} className="pedido">
                      <span className="num" style={{ "--nc": CORES_PEDIDOS[i % CORES_PEDIDOS.length] } as CSSProperties} aria-hidden="true">
                        {i + 1}
                      </span>
                      <input
                        ref={(el) => { pedidoRefs.current[i] = el; }}
                        type="text"
                        name={`pedido${i + 1}`}
                        aria-label={NOMES_PEDIDOS[i] ?? `Pedido ${i + 1}`}
                        placeholder={NOMES_PEDIDOS[i] ?? `Pedido ${i + 1}`}
                        maxLength={PEDIDO_MAX}
                        autoComplete="off"
                        spellCheck={false}
                        enterKeyHint={i === QTD_PEDIDOS - 1 ? "send" : "next"}
                        value={p}
                        onChange={(e) => aoMudarPedido(i, e)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && i < QTD_PEDIDOS - 1) {
                            e.preventDefault();
                            pedidoRefs.current[i + 1]?.focus();
                          }
                        }}
                      />
                    </li>
                  ))}
                </ol>
                <p className="hint" role="alert">{erros.pedidos}</p>
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
