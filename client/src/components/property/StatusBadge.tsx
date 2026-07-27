import { PropertyStatus } from "../../types";
import { STATUS_LABELS } from "../../utils/format";

const STATUS_CLASS: Record<PropertyStatus, string> = {
  disponivel: "badge--success",
  reservado: "badge--warning",
  vendido: "badge--info",
  alugado: "badge--info",
};

export function StatusBadge({ status }: { status: PropertyStatus }) {
  return <span className={`badge ${STATUS_CLASS[status]}`}>{STATUS_LABELS[status]}</span>;
}
