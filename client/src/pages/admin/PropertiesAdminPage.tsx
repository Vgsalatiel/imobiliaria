import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PlusCircle, Trash2 } from "lucide-react";
import {
  deletePropertyAdmin,
  fetchAllPropertiesAdmin,
  updatePropertyAdmin,
} from "../../api/properties";
import { fetchCorretores } from "../../api/auth";
import { useAuth } from "../../context/AuthContext";
import { Corretor, PropertyStatus, Property } from "../../types";
import { formatPrice, STATUS_LABELS, TYPE_LABELS } from "../../utils/format";
import "./PropertiesAdminPage.css";

const STATUS_OPTIONS: PropertyStatus[] = ["disponivel", "reservado", "vendido", "alugado"];

const STATUS_DOT_CLASS: Record<PropertyStatus, string> = {
  disponivel: "status-select--success",
  reservado: "status-select--warning",
  vendido: "status-select--info",
  alugado: "status-select--info",
};

export function PropertiesAdminPage() {
  const { isAdmin } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [corretores, setCorretores] = useState<Corretor[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  function load() {
    setLoading(true);
    fetchAllPropertiesAdmin(statusFilter || undefined)
      .then(setProperties)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    if (isAdmin) fetchCorretores().then(setCorretores);
  }, [isAdmin]);

  async function handleStatusChange(id: number, status: PropertyStatus) {
    await updatePropertyAdmin(id, { status });
    setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  }

  async function handleCorretorChange(id: number, corretorId: number) {
    await updatePropertyAdmin(id, { corretorId });
    const corretor = corretores.find((c) => c.id === corretorId);
    setProperties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, corretorId, corretorName: corretor?.name ?? null } : p))
    );
  }

  async function handleDelete(id: number) {
    if (!confirm("Remover este imóvel definitivamente?")) return;
    await deletePropertyAdmin(id);
    setProperties((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="properties-admin-page">
      <div className="properties-admin-page__header">
        <div>
          <h1 className="page-title">Imóveis</h1>
          <p className="section-subtitle">
            {isAdmin
              ? "Gerencie o status de todos os imóveis cadastrados pela equipe."
              : "Gerencie o status de cada imóvel do seu portfólio."}
          </p>
        </div>
        <Link to="/admin/imoveis/novo" className="btn btn-primary">
          <PlusCircle size={17} strokeWidth={2.2} />
          Novo imóvel
        </Link>
      </div>

      <div className="properties-admin-page__filter">
        <label>Filtrar por status</label>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todos</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : (
        <div className="card-surface properties-admin-table">
          <table>
            <thead>
              <tr>
                <th>Imóvel</th>
                <th>Tipo</th>
                <th>Preço</th>
                {isAdmin && <th>Responsável</th>}
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {properties.map((property) => (
                <tr key={property.id}>
                  <td>
                    <div className="properties-admin-table__title">
                      <img src={property.coverImage} alt="" />
                      <div>
                        <strong>{property.title}</strong>
                        <span>
                          {property.neighborhood}, {property.city}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>{TYPE_LABELS[property.type]}</td>
                  <td>{formatPrice(property.price, property.purpose)}</td>
                  {isAdmin && (
                    <td>
                      <select
                        className="corretor-select"
                        value={property.corretorId ?? ""}
                        onChange={(e) => handleCorretorChange(property.id, Number(e.target.value))}
                      >
                        {corretores.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </td>
                  )}
                  <td>
                    <select
                      className={`status-select ${STATUS_DOT_CLASS[property.status]}`}
                      value={property.status}
                      onChange={(e) =>
                        handleStatusChange(property.id, e.target.value as PropertyStatus)
                      }
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => handleDelete(property.id)}
                    >
                      <Trash2 size={15} strokeWidth={2.2} />
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {properties.length === 0 && (
            <div className="empty-state">Nenhum imóvel encontrado para este filtro.</div>
          )}
        </div>
      )}
    </div>
  );
}
