import { http } from "./http";
import { VisitRequest, VisitRequestWithProperty, VisitStatus } from "../types";

export async function fetchVisits(status?: VisitStatus): Promise<VisitRequestWithProperty[]> {
  const { data } = await http.get<VisitRequestWithProperty[]>("/visits", {
    params: status ? { status } : {},
  });
  return data;
}

export async function updateVisitStatus(id: number, status: VisitStatus) {
  const { data } = await http.patch(`/visits/${id}`, { status });
  return data;
}

export interface ScheduleVisitPayload {
  propertyId: number;
  name: string;
  phone: string;
  email?: string;
  message?: string;
  preferredDate?: string;
  status?: VisitStatus;
}

export async function scheduleVisitAdmin(payload: ScheduleVisitPayload): Promise<VisitRequest> {
  const { data } = await http.post<VisitRequest>("/visits", payload);
  return data;
}
