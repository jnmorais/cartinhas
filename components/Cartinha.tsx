"use client";

import { useEffect, useRef, useState } from "react";
import Envelope from "./Envelope";
import { confete, menosMovimento } from "./efeitos";
import { ORGANIZACAO } from "@/lib/projeto";

// Alterna entre o envelope (escrevendo) e a tela de "Cartinha enviada!".
export default function Cartinha() {
  const [enviadaPor, setEnviadaPor] = useState<string | null>(null);
  const [rodada, setRodada] = useState(0);
  const fxRef = useRef<HTMLDivElement>(null);
  const outraRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (enviadaPor === null) return;
    window.scrollTo({ top: 0, behavior: menosMovimento() ? "auto" : "smooth" });
    confete(fxRef.current);
    outraRef.current?.focus({ preventScroll: true });
  }, [enviadaPor]);

  return (
    <>
      {enviadaPor === null ? (
        <Envelope key={rodada} chegando={rodada > 0} fxRef={fxRef} onEnviada={setEnviadaPor} />
      ) : (
        <section className="done">
          <div className="done-icon" aria-hidden="true">📬</div>
          <h2>Cartinha enviada!</h2>
          <p>
            Obrigado, <b>{enviadaPor}</b>! Sua cartinha chegou direitinho. 💌
          </p>
          <p className="done-org">Com carinho, {ORGANIZACAO} 🌱</p>
          <button
            ref={outraRef}
            type="button"
            className="send-btn again"
            onClick={() => {
              setEnviadaPor(null);
              setRodada((r) => r + 1);
            }}
          >
            Escrever outra cartinha ✏️
          </button>
        </section>
      )}
      <div className="fx" ref={fxRef} aria-hidden="true" />
    </>
  );
}
