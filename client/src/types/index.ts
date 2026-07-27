export type UserRole = "admin" | "corretor";

export type Purpose = "venda" | "aluguel";

export type PropertyStatus = "disponivel" | "reservado" | "vendido" | "alugado";

export type PropertyType =
  | "apartamento"
  | "casa"
  | "cobertura"
  | "terreno"
  | "comercial";

export type NearbyPlaceType =
  | "estacao"
  | "ponto_onibus"
  | "praca"
  | "mercado"
  | "escola"
  | "hospital"
  | "shopping";

export interface NearbyPlace {
  id?: number;
  propertyId?: number;
  type: NearbyPlaceType;
  name: string;
  distanceMeters: number;
}

export interface Property {
  id: number;
  title: string;
  description: string;
  price: number;
  purpose: Purpose;
  status: PropertyStatus;
  type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  parkingSpots: number;
  areaM2: number;
  neighborhood: string;
  city: string;
  state: string;
  addressLine: string;
  coverImage: string;
  images: string[];
  corretorId: number | null;
  corretorName: string | null;
  corretorWhatsapp: string | null;
  createdAt: string;
}

export interface PropertyWithNearby extends Property {
  nearbyPlaces: NearbyPlace[];
}

export type VisitStatus = "pendente" | "confirmada" | "realizada" | "cancelada";

export interface VisitRequest {
  id: number;
  propertyId: number;
  name: string;
  phone: string;
  email: string;
  message: string;
  preferredDate: string | null;
  status: VisitStatus;
  createdAt: string;
}

export interface VisitRequestWithProperty extends VisitRequest {
  propertyTitle: string;
  propertyCoverImage: string;
  corretorName: string | null;
}

export interface Corretor {
  id: number;
  username: string;
  name: string;
  role: UserRole;
  whatsapp: string;
  propertyCount: number;
}

export interface PropertyFilters {
  purpose?: Purpose;
  type?: PropertyType;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
}
