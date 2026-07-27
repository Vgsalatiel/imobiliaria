import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  CircleCheck,
  CircleDot,
  Handshake,
} from "lucide-react";
import { fetchAllPropertiesAdmin } from "../../api/properties";
import { fetchVisits } from "../../api/visits";
import { useAuth } from "../../context/AuthContext";
import { Property, VisitRequestWithProperty } from "../../types";
import { formatDateTime, VISIT_STATUS_LABELS } from "../../utils/format";
import "./DashboardPage.css";

export function DashboardPage() {
  const { isAdmin } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [visits, setVisits] = useState<VisitRequestWithProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchAllPropertiesAdmin(), fetchVisits()])
      .then(([propertiesData, visitsData]) => {
        setProperties(propertiesData);
        setVisits(visitsData);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;

  const stats = {
    total: properties.length,
    disponivel: properties.filter((p) => p.status === "disponivel").length,
    reservado: properties.filter((p) => p.status === "reservado").length,
    vendidoAlugado: properties.filter((p) => p.status === "vendido" || p.status === "alugado")
      .length,
    visitasPendentes: visits.filter((v) => v.status === "pendente").length,
  };

  const upcomingVisits = visits
    .filter((v) => v.status === "pendente" || v.status === "confirmada")
    .slice(0, 5);

  return (
    <div className="dashboard-page">
      <h1 className="page-title">Visão geral</h1>
      <p className="section-subtitle">
        {isAdmin
          ? "Resumo de todos os imóveis e visitas agendadas da equipe."
          : "Resumo dos seus imóveis e visitas agendadas."}
      </p>

      <div className="dashboard-page__stats">
        <div className="dashboard-stat card-surface">
          <span className="dashboard-stat__icon dashboard-stat__icon--neutral">
            <Building2 size={19} strokeWidth={2.1} />
          </span>
          <div>
            <strong>{stats.total}</strong>
            <span>{isAdmin ? "Imóveis da equipe" : "Meus imóveis"}</span>
          </div>
        </div>
        <div className="dashboard-stat card-surface">
          <span className="dashboard-stat__icon dashboard-stat__icon--success">
            <CircleCheck size={19} strokeWidth={2.1} />
          </span>
          <div>
            <strong>{stats.disponivel}</strong>
            <span>Disponíveis</span>
          </div>
        </div>
        <div className="dashboard-stat card-surface">
          <span className="dashboard-stat__icon dashboard-stat__icon--warning">
            <CircleDot size={19} strokeWidth={2.1} />
          </span>
          <div>
            <strong>{stats.reservado}</strong>
            <span>Reservados</span>
          </div>
        </div>
        <div className="dashboard-stat card-surface">
          <span className="dashboard-stat__icon dashboard-stat__icon--info">
            <Handshake size={19} strokeWidth={2.1} />
          </span>
          <div>
            <strong>{stats.vendidoAlugado}</strong>
            <span>Vendidos / Alugados</span>
          </div>
        </div>
        <div className="dashboard-stat card-surface dashboard-stat--highlight">
          <span className="dashboard-stat__icon dashboard-stat__icon--primary">
            <CalendarClock size={19} strokeWidth={2.1} />
          </span>
          <div>
            <strong>{stats.visitasPendentes}</strong>
            <span>Visitas pendentes</span>
          </div>
        </div>
      </div>

      <section className="dashboard-page__section">
        <div className="dashboard-page__section-header">
          <h2>Próximas visitas</h2>
          <Link to="/admin/visitas">
            Ver todas <ArrowRight size={15} strokeWidth={2.2} />
          </Link>
        </div>

        {upcomingVisits.length === 0 ? (
          <p className="section-subtitle">Nenhuma visita pendente ou confirmada no momento.</p>
        ) : (
          <div className="card-surface dashboard-page__visits">
            {upcomingVisits.map((visit) => (
              <div key={visit.id} className="dashboard-visit-row">
                <img src={visit.propertyCoverImage} alt="" />
                <div className="dashboard-visit-row__info">
                  <strong>{visit.propertyTitle}</strong>
                  <span>
                    {visit.name} · {visit.phone}
                  </span>
                  <span>{formatDateTime(visit.preferredDate)}</span>
                </div>
                <span className={`badge badge--${visit.status === "confirmada" ? "success" : "warning"}`}>
                  {VISIT_STATUS_LABELS[visit.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
