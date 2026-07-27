import axios from "axios";

export const AUTH_TOKEN_KEY = "imobiliaria.admin.token";
export const AUTH_NAME_KEY = "imobiliaria.admin.name";
export const AUTH_ROLE_KEY = "imobiliaria.admin.role";

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3333/api",
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
