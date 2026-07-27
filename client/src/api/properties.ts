import { http } from "./http";
import { Property, PropertyFilters, PropertyWithNearby } from "../types";

export async function fetchProperties(filters: PropertyFilters = {}): Promise<Property[]> {
  const { data } = await http.get<Property[]>("/properties", { params: filters });
  return data;
}

export async function fetchAllPropertiesAdmin(status?: string): Promise<Property[]> {
  const { data } = await http.get<Property[]>("/properties/admin/todos", {
    params: status ? { status } : {},
  });
  return data;
}

export async function fetchPropertyById(id: number): Promise<PropertyWithNearby> {
  const { data } = await http.get<PropertyWithNearby>(`/properties/${id}`);
  return data;
}

export interface ContactBrokerPayload {
  name: string;
  phone: string;
  email?: string;
  message?: string;
}

export async function sendContactRequest(propertyId: number, payload: ContactBrokerPayload) {
  const { data } = await http.post(`/properties/${propertyId}/contato`, payload);
  return data;
}

export interface PropertyFormPayload {
  title: string;
  description: string;
  price: number;
  purpose: string;
  status?: string;
  type: string;
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
  nearbyPlaces: { type: string; name: string; distanceMeters: number }[];
  corretorId?: number;
}

export async function createPropertyAdmin(payload: PropertyFormPayload) {
  const { data } = await http.post<PropertyWithNearby>("/properties", payload);
  return data;
}

export async function updatePropertyAdmin(id: number, payload: Partial<PropertyFormPayload>) {
  const { data } = await http.patch<PropertyWithNearby>(`/properties/${id}`, payload);
  return data;
}

export async function deletePropertyAdmin(id: number) {
  await http.delete(`/properties/${id}`);
}
