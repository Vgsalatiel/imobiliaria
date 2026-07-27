import { FormEvent, useEffect, useState } from "react";
import { MessageCircle, ShieldCheck, UserPlus, Users } from "lucide-react";
import { createCorretor, fetchCorretores } from "../../api/auth";
import { Corretor } from "../../types";
import "./CorretoresPage.css";

export function CorretoresPage() {
  const [corretores, setCorretores] = useState<Corretor[]>([]);
  const [loading, setLoading] = useState(true);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetchCorretores()
      .then(setCorretores)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createCorretor({ username, password, name, whatsapp });
      setUsername("");
      setPassword("");
      setName("");
      setWhatsapp("");
      load();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Não foi possível criar o corretor.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="corretores-page">
      <h1 className="page-title">Corretores</h1>
      <p className="section-subtitle">
        Gerencie quem tem acesso ao painel. Cada corretor só vê os próprios imóveis e clientes.
      </p>

      <div className="corretores-page__layout">
        <section className="card-surface corretores-page__list">
          <h2 className="corretores-page__list-title">
            <Users size={17} strokeWidth={2.2} /> Equipe
          </h2>

          {loading ? (
            <div className="spinner" />
          ) : (
            <div className="corretores-table">
              <table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Usuário</th>
                    <th>WhatsApp</th>
                    <th>Papel</th>
                    <th>Imóveis</th>
                  </tr>
                </thead>
                <tbody>
                  {corretores.map((c) => (
                    <tr key={c.id}>
                      <td>{c.name}</td>
                      <td>{c.username}</td>
                      <td>{c.whatsapp || "—"}</td>
                      <td>
                        <span className={`badge ${c.role === "admin" ? "badge--info" : "badge--neutral"}`}>
                          {c.role === "admin" ? "Administrador" : "Corretor"}
                        </span>
                      </td>
                      <td>{c.propertyCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <form className="card-surface corretores-page__form" onSubmit={handleSubmit}>
          <h2 className="corretores-page__list-title">
            <UserPlus size={17} strokeWidth={2.2} /> Novo corretor
          </h2>

          <div className="field">
            <label htmlFor="corretor-name">Nome</label>
            <input
              id="corretor-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome completo"
            />
          </div>

          <div className="field">
            <label htmlFor="corretor-username">Usuário</label>
            <input
              id="corretor-username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="login (sem espaços)"
            />
          </div>

          <div className="field">
            <label htmlFor="corretor-password">Senha</label>
            <input
              id="corretor-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="mínimo 6 caracteres"
            />
          </div>

          <div className="field">
            <label htmlFor="corretor-whatsapp">
              <MessageCircle size={14} strokeWidth={2.2} style={{ verticalAlign: "-2px" }} /> WhatsApp
            </label>
            <input
              id="corretor-whatsapp"
              required
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ""))}
              placeholder="Ex: 5531999998888 (DDI + DDD + número)"
            />
          </div>

          {error && <p style={{ color: "var(--color-danger)", marginBottom: 12 }}>{error}</p>}

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            <ShieldCheck size={17} strokeWidth={2.2} />
            {submitting ? "Criando..." : "Criar corretor"}
          </button>
        </form>
      </div>
    </div>
  );
}
