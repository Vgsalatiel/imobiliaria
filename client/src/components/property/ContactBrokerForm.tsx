import { FormEvent, useState } from "react";
import { sendContactRequest } from "../../api/properties";
import { buildWhatsappLink } from "../../utils/whatsapp";

interface Props {
  propertyId: number;
  propertyTitle: string;
  propertyLocation: string;
  corretorName: string | null;
  corretorWhatsapp: string | null;
  onSuccess: () => void;
}

export function ContactBrokerForm({
  propertyId,
  propertyTitle,
  propertyLocation,
  corretorName,
  corretorWhatsapp,
  onSuccess,
}: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("Tenho interesse neste imóvel. Podemos agendar uma visita?");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await sendContactRequest(propertyId, {
        name,
        phone,
        email: email || undefined,
        message,
      });

      if (corretorWhatsapp) {
        const whatsappMessage = `Olá${corretorName ? " " + corretorName : ""}! Me chamo ${name} e tenho interesse no imóvel "${propertyTitle}" (${propertyLocation}). ${message} A data e o horário da visita ficam a seu critério.`;
        window.open(buildWhatsappLink(corretorWhatsapp, whatsappMessage), "_blank", "noopener");
      }

      onSuccess();
    } catch {
      setError("Não foi possível enviar sua solicitação. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="section-subtitle" style={{ marginBottom: 16 }}>
        {corretorWhatsapp
          ? `Envie seus dados e você será direcionado ao WhatsApp de ${corretorName || "corretor"}. O dia e horário da visita ficam combinados diretamente com ele.`
          : "Envie seus dados e o corretor entrará em contato para combinar o dia e horário da visita."}
      </p>

      <div className="field">
        <label htmlFor="contact-name">Nome</label>
        <input
          id="contact-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Seu nome completo"
        />
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="contact-phone">Telefone</label>
          <input
            id="contact-phone"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(31) 99999-0000"
          />
        </div>
        <div className="field">
          <label htmlFor="contact-email">E-mail (opcional)</label>
          <input
            id="contact-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@email.com"
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="contact-message">Mensagem</label>
        <textarea
          id="contact-message"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      {error && <p style={{ color: "var(--color-danger)", marginBottom: 12 }}>{error}</p>}
      <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
        {submitting ? "Enviando..." : corretorWhatsapp ? "Continuar no WhatsApp" : "Enviar para o corretor"}
      </button>
    </form>
  );
}
