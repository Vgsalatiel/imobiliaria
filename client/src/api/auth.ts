import { http } from "./http";
import { Corretor, UserRole } from "../types";

export interface LoginResponse {
  token: string;
  name: string;
  username: string;
  role: UserRole;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const { data } = await http.post<LoginResponse>("/auth/login", { username, password });
  return data;
}

export async function fetchCorretores(): Promise<Corretor[]> {
  const { data } = await http.get<Corretor[]>("/auth/corretores");
  return data;
}

export interface CreateCorretorPayload {
  username: string;
  password: string;
  name: string;
  whatsapp: string;
}

export async function createCorretor(payload: CreateCorretorPayload) {
  const { data } = await http.post("/auth/corretores", payload);
  return data;
}
