import Ceu from "@/components/Ceu";
import Cartinha from "@/components/Cartinha";
import { ORGANIZACAO } from "@/lib/projeto";

const TITULO = "Minha Cartinha";

export default function Home() {
  return (
    <>
      <Ceu />
      <main className="page">
        <header className="hero">
          <p className="org-badge">
            <span aria-hidden="true">🌱</span> Um projeto do <strong>{ORGANIZACAO}</strong>
          </p>
          <h1 className="title" aria-label={TITULO}>
            {TITULO.split("").map((letra, i) =>
              letra === " " ? (
                <span key={i} className="gap"> </span>
              ) : (
                <span key={i} aria-hidden="true">{letra}</span>
              )
            )}
          </h1>
          <p className="subtitle">Conte quem você é, seus tamanhos e os seus 3 pedidos. Depois é só mandar!{" "}✨</p>
        </header>

        <Cartinha />

        <footer className="org-footer">
          Feito com carinho pelo <strong>{ORGANIZACAO}</strong>{" "}💛
        </footer>
      </main>
    </>
  );
}
