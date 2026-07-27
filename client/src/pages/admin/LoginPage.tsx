import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { KeyRound, LogIn } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "./LoginPage.css";

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username, password);
      navigate("/admin");
    } catch {
      setError("Usuário ou senha inválidos.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card card-surface" onSubmit={handleSubmit}>
        <span className="login-card__icon">
          <KeyRound size={22} strokeWidth={2.2} />
        </span>
        <h1 className="page-title">Painel do corretor</h1>
        <p className="section-subtitle">Entre para gerenciar imóveis e visitas agendadas.</p>

        <div className="field" style={{ marginTop: 24 }}>
          <label htmlFor="username">Usuário</label>
          <input
            id="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="corretor"
            autoFocus
          />
        </div>
        <div className="field">
          <label htmlFor="password">Senha</label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {error && <p style={{ color: "var(--color-danger)", marginBottom: 12 }}>{error}</p>}

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          <LogIn size={17} strokeWidth={2.2} />
          {submitting ? "Entrando..." : "Entrar"}
        </button>

        <p className="login-page__hint">Usuário de teste: corretor / imoveis123</p>
      </form>
    </div>
  );
}
