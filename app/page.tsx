import Ceu from "@/components/Ceu";
import Cartinha from "@/components/Cartinha";

const TITULO = "Minha Cartinha";

export default function Home() {
  return (
    <>
      <Ceu />
      <main className="page">
        <header className="hero">
          <h1 className="title" aria-label={TITULO}>
            {TITULO.split("").map((letra, i) =>
              letra === " " ? (
                <span key={i} className="gap"> </span>
              ) : (
                <span key={i} aria-hidden="true">{letra}</span>
              )
            )}
          </h1>
          <p className="subtitle">Escreva seu nome, sua idade e um telefone. Depois é só mandar! ✨</p>
        </header>

        <Cartinha />
      </main>
    </>
  );
}
