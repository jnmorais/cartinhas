// Efeitos visuais soltos (estrelinhas e confete). Ficam fora do React de propósito:
// são elementos descartáveis que nascem e somem em menos de um segundo.

export const menosMovimento = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const esperar = (ms: number) =>
  new Promise<void>((r) => setTimeout(r, menosMovimento() ? 0 : ms));

export const PARTICULAS = {
  nome: ["⭐", "✨", "💖", "🌟", "🌈", "💫"],
  idade: ["🎈", "🎉", "🍰", "🎂", "✨"],
  roupa: ["👕", "👗", "🩳", "✨"],
  calcado: ["👟", "🥿", "⭐", "✨"],
  pedidos: ["🎁", "🧸", "🎀", "⭐", "🪁", "✨"],
  voo: ["✨", "⭐", "💖", "💫"],
};

export function estrelinhas(fx: HTMLElement | null, x: number, y: number, emojis: string[], quantidade = 1) {
  if (!fx || menosMovimento()) return;
  for (let i = 0; i < quantidade; i++) {
    const p = document.createElement("span");
    p.className = "particle";
    p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    p.style.left = `${x + (Math.random() - 0.5) * 16}px`;
    p.style.top = `${y}px`;
    p.style.setProperty("--dx", `${(Math.random() - 0.5) * 60}px`);
    p.style.setProperty("--rot", `${(Math.random() - 0.5) * 80}deg`);
    p.style.fontSize = `${18 + Math.random() * 10}px`;
    fx.appendChild(p);
    setTimeout(() => p.remove(), 950);
  }
}

export function confete(fx: HTMLElement | null) {
  if (!fx || menosMovimento()) return;
  const cores = ["#ff4d6d", "#ffd23f", "#4aa8ff", "#36c98a", "#a77bff", "#ff9f43"];
  for (let i = 0; i < 90; i++) {
    const c = document.createElement("span");
    c.className = "confetti";
    c.style.left = `${Math.random() * 100}vw`;
    c.style.background = cores[i % cores.length];
    c.style.setProperty("--dx", `${(Math.random() - 0.5) * 200}px`);
    c.style.setProperty("--rot", `${(Math.random() - 0.5) * 1080}deg`);
    c.style.setProperty("--dur", `${2.4 + Math.random() * 2}s`);
    c.style.setProperty("--delay", `${Math.random() * 0.6}s`);
    if (Math.random() > 0.5) c.style.borderRadius = "50%";
    fx.appendChild(c);
    setTimeout(() => c.remove(), 5200);
  }
}

let ctxMedida: CanvasRenderingContext2D | null = null;

/** Posição aproximada do fim do texto digitado, para as estrelinhas saírem dali. */
export function pontoDoCursor(input: HTMLInputElement, valor: string) {
  ctxMedida ??= document.createElement("canvas").getContext("2d");
  const r = input.getBoundingClientRect();
  const cs = getComputedStyle(input);
  let larguraTexto = 0;
  if (ctxMedida) {
    ctxMedida.font = `${cs.fontSize} ${cs.fontFamily}`;
    larguraTexto = ctxMedida.measureText(valor).width;
  }
  let x = r.left + (parseFloat(cs.paddingLeft) || 0) + larguraTexto;
  if (cs.textAlign === "center") x = r.left + r.width / 2 + larguraTexto / 2;
  return { x: Math.min(x, r.right - 10), y: r.top + r.height / 2 };
}
