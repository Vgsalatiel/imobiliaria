import { Purpose, NearbyPlaceType } from "../types";

export function formatPrice(price: number, purpose: Purpose): string {
  const formatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(price);
  return purpose === "aluguel" ? `${formatted}/mês` : formatted;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(1).replace(".0", "")} km`;
}

export const NEARBY_LABELS: Record<NearbyPlaceType, string> = {
  estacao: "Estação",
  ponto_onibus: "Ponto de ônibus",
  praca: "Praça",
  mercado: "Mercado",
  escola: "Escola",
  hospital: "Hospital",
  shopping: "Shopping",
};

export const NEARBY_ICONS: Record<NearbyPlaceType, string> = {
  estacao: "🚇",
  ponto_onibus: "🚌",
  praca: "🌳",
  mercado: "🛒",
  escola: "🏫",
  hospital: "🏥",
  shopping: "🛍️",
};

export const PURPOSE_LABELS: Record<Purpose, string> = {
  venda: "Venda",
  aluguel: "Aluguel",
};

export const STATUS_LABELS: Record<string, string> = {
  disponivel: "Disponível",
  reservado: "Reservado",
  vendido: "Vendido",
  alugado: "Alugado",
};

export const TYPE_LABELS: Record<string, string> = {
  apartamento: "Apartamento",
  casa: "Casa",
  cobertura: "Cobertura",
  terreno: "Terreno",
  comercial: "Comercial",
};

export const VISIT_STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  confirmada: "Confirmada",
  realizada: "Realizada",
  cancelada: "Cancelada",
};

export function formatDateTime(value: string | null): string {
  if (!value) return "A combinar";
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
