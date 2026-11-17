// Cenário de fundo: céu, sol, nuvens, balões e morrinhos.
export default function Ceu() {
  return (
    <div className="sky" aria-hidden="true">
      <div className="sun" />
      <span className="cloud c1" />
      <span className="cloud c2" />
      <span className="cloud c3" />
      <span className="cloud c4" />
      <span className="balloon b1" />
      <span className="balloon b2" />
      <span className="balloon b3" />
      <span className="balloon b4" />
      <div className="hill h1" />
      <div className="hill h2" />
    </div>
  );
}
