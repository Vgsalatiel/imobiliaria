import "./PublicFooter.css";

export function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="container public-footer__inner">
        <p>© {new Date().getFullYear()} Lar&amp;Chave Imóveis. Encontre o lugar certo para viver.</p>
        <p className="public-footer__contact">(31) 3333-4455 · contato@larechave.com.br</p>
      </div>
    </footer>
  );
}
