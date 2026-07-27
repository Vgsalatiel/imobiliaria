import { FormEvent, useEffect, useState } from "react";
import { scheduleVisitAdmin } from "../../api/visits";
import { Property, VisitStatus } from "../../types";

interface Props {
  properties: Property[];
  onSuccess: () => void;
}

export function ScheduleVisitForm({ properties, onSuccess }: Props) {
  const [propertyId, setPropertyId] = useState<number | "">(properties[0]?.id ?? "");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<VisitStatus>("confirmada");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A lista de imóveis chega de forma assíncrona (é buscada só quando o modal abre),
  // então o valor padrão pode não existir ainda no primeiro render — atualiza assim que chegar.
  useEffect(() => {
    if (propertyId === "" && properties.length > 0) {
      setPropertyId(properties[0].id);
    }
  }, [properties, propertyId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!propertyId) {
      setError("Selecione um imóvel.");
      return;
    }

    setSubmitting(true);
    try {
      await scheduleVisitAdmin({
        propertyId: Number(propertyId),
        name,
        phone,
        email: email || undefined,
        message: message || undefined,
        preferredDate: preferredDate || undefined,
        status,
      });
      onSuccess();
    } catch {
      setError("Não foi possível agendar a visita. Verifique os campos e tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="schedule-property">Imóvel</label>
        <select
          id="schedule-property"
          required
          value={propertyId}
          onChange={(e) => setPropertyId(Number(e.target.value))}
        >
          {properties.length === 0 && <option value="">Nenhum imóvel disponível</option>}
          {properties.map((property) => (
            <option key={property.id} value={property.id}>
              {property.title} — {property.neighborhood}, {property.city}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="schedule-name">Nome do cliente</label>
        <input
          id="schedule-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome completo"
        />
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="schedule-phone">Telefone</label>
          <input
            id="schedule-phone"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(31) 99999-0000"
          />
        </div>
        <div className="field">
          <label htmlFor="schedule-email">E-mail (opcional)</label>
          <input
            id="schedule-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="cliente@email.com"
          />
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="schedule-date">Data da visita</label>
          <input
            id="schedule-date"
            type="datetime-local"
            value={preferredDate}
            onChange={(e) => setPreferredDate(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="schedule-status">Status</label>
          <select
            id="schedule-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as VisitStatus)}
          >
            <option value="confirmada">Confirmada</option>
            <option value="pendente">Pendente</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="schedule-message">Observações (opcional)</label>
        <textarea
          id="schedule-message"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Detalhes combinados com o cliente..."
        />
      </div>

      {error && <p style={{ color: "var(--color-danger)", marginBottom: 12 }}>{error}</p>}

      <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
        {submitting ? "Agendando..." : "Agendar visita"}
      </button>
    </form>
  );
}
