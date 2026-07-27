import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="container empty-state" style={{ padding: "80px 20px" }}>
      <h1 className="page-title">Página não encontrada</h1>
      <p className="section-subtitle" style={{ marginTop: 8 }}>
        O endereço que você tentou acessar não existe ou foi movido.
      </p>
      <Link to="/" className="btn btn-primary" style={{ marginTop: 24 }}>
        Voltar para a página inicial
      </Link>
    </div>
  );
}
