import { Link } from "react-router-dom";
import { KeyRound, UserRound } from "lucide-react";
import "./PublicHeader.css";

export function PublicHeader() {
  return (
    <header className="public-header">
      <div className="container public-header__inner">
        <Link to="/" className="public-header__brand">
          <span className="public-header__brand-icon">
            <KeyRound size={18} strokeWidth={2.2} />
          </span>
          <span>
            <span className="public-header__brand-mark">Lar</span>&amp;Chave
          </span>
        </Link>
        <nav className="public-header__nav">
          <Link to="/">Imóveis</Link>
          <Link to="/admin/login" className="public-header__admin-link">
            <UserRound size={16} strokeWidth={2.2} />
            Sou corretor
          </Link>
        </nav>
      </div>
    </header>
  );
}
