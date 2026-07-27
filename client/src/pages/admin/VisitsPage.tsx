import { useEffect, useState } from "react";
import { CalendarClock, CalendarPlus, Mail, MessageSquareText, Phone, UserRound } from "lucide-react";
import { fetchVisits, updateVisitStatus } from "../../api/visits";
import { fetchAllPropertiesAdmin } from "../../api/properties";
import { useAuth } from "../../context/AuthContext";
import { Property, VisitRequestWithProperty, VisitStatus } from "../../types";
import { formatDateTime, VISIT_STATUS_LABELS } from "../../utils/format";
import { Modal } from "../../components/common/Modal";
import { ScheduleVisitForm } from "../../components/property/ScheduleVisitForm";
import "./VisitsPage.css";

const STATUS_TABS: { value: VisitStatus | ""; label: string }[] = [
  { value: "", label: "Todas" },
  { value: "pendente", label: "Pendentes" },
  { value: "confirmada", label: "Confirmadas" },
  { value: "realizada", label: "Realizadas" },
  { value: "cancelada", label: "Canceladas" },
];

const STATUS_BADGE_CLASS: Record<VisitStatus, string> = {
  pendente: "badge--warning",
  confirmada: "badge--info",
  realizada: "badge--success",
  cancelada: "badge--danger",
};

const STATUS_SELECT_CLASS: Record<VisitStatus, string> = {
  pendente: "status-select--warning",
  confirmada: "status-select--info",
  realizada: "status-select--success",
  cancelada: "status-select--danger",
};

export function VisitsPage() {
  const { isAdmin } = useAuth();
  const [visits, setVisits] = useState<VisitRequestWithProperty[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<VisitStatus | "">("");
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  function load() {
    setLoading(true);
    fetchVisits(activeTab || undefined)
      .then(setVisits)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  async function handleStatusChange(id: number, status: VisitStatus) {
    const updated = await updateVisitStatus(id, status);
    setVisits((prev) => prev.map((v) => (v.id === id ? { ...v, status: updated.status } : v)));
  }

  function openScheduleModal() {
    fetchAllPropertiesAdmin().then(setProperties);
    setShowScheduleModal(true);
  }

  return (
    <div className="visits-page">
      <div className="visits-page__header">
        <div>
          <h1 className="page-title">Visitas agendadas</h1>
          <p className="section-subtitle">
            Acompanhe as solicitações de contato e agendamentos de visita enviados pelo site.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openScheduleModal}>
          <CalendarPlus size={17} strokeWidth={2.2} />
          Agendar visita
        </button>
      </div>

      <div className="visits-page__tabs">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={activeTab === tab.value ? "is-active" : ""}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="spinner" />
      ) : visits.length === 0 ? (
        <div className="empty-state">Nenhuma solicitação encontrada.</div>
      ) : (
        <div className="visits-page__list">
          {visits.map((visit) => (
            <div key={visit.id} className="card-surface visit-row">
              <img src={visit.propertyCoverImage} alt="" />
              <div className="visit-row__info">
                <strong>{visit.propertyTitle}</strong>
                {isAdmin && visit.corretorName && (
                  <span>
                    <UserRound size={13} strokeWidth={2.2} /> Responsável: {visit.corretorName}
                  </span>
                )}
                <span>
                  {visit.name} <Phone size={13} strokeWidth={2.2} /> {visit.phone}
                  {visit.email && (
                    <>
                      {" "}
                      <Mail size={13} strokeWidth={2.2} /> {visit.email}
                    </>
                  )}
                </span>
                <span>
                  <CalendarClock size={13} strokeWidth={2.2} /> {formatDateTime(visit.preferredDate)}
                </span>
                {visit.message && (
                  <p>
                    <MessageSquareText size={13} strokeWidth={2.2} /> {visit.message}
                  </p>
                )}
              </div>
              <div className="visit-row__actions">
                <span className={`badge ${STATUS_BADGE_CLASS[visit.status]}`}>
                  {VISIT_STATUS_LABELS[visit.status]}
                </span>
                <select
                  className={`status-select ${STATUS_SELECT_CLASS[visit.status]}`}
                  value={visit.status}
                  onChange={(e) => handleStatusChange(visit.id, e.target.value as VisitStatus)}
                >
                  <option value="pendente">Pendente</option>
                  <option value="confirmada">Confirmada</option>
                  <option value="realizada">Realizada</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {showScheduleModal && (
        <Modal title="Agendar visita" onClose={() => setShowScheduleModal(false)}>
          <ScheduleVisitForm
            properties={properties}
            onSuccess={() => {
              setShowScheduleModal(false);
              load();
            }}
          />
        </Modal>
      )}
    </div>
  );
}
