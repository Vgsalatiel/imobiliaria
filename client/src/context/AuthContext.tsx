import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { AUTH_NAME_KEY, AUTH_ROLE_KEY, AUTH_TOKEN_KEY } from "../api/http";
import { login as loginRequest } from "../api/auth";
import { UserRole } from "../types";

interface AuthContextValue {
  isAuthenticated: boolean;
  isAdmin: boolean;
  brokerName: string | null;
  role: UserRole | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(AUTH_TOKEN_KEY));
  const [brokerName, setBrokerName] = useState<string | null>(() =>
    localStorage.getItem(AUTH_NAME_KEY)
  );
  const [role, setRole] = useState<UserRole | null>(
    () => (localStorage.getItem(AUTH_ROLE_KEY) as UserRole | null) || null
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(token),
      isAdmin: role === "admin",
      brokerName,
      role,
      login: async (username: string, password: string) => {
        const response = await loginRequest(username, password);
        localStorage.setItem(AUTH_TOKEN_KEY, response.token);
        localStorage.setItem(AUTH_NAME_KEY, response.name);
        localStorage.setItem(AUTH_ROLE_KEY, response.role);
        setToken(response.token);
        setBrokerName(response.name);
        setRole(response.role);
      },
      logout: () => {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_NAME_KEY);
        localStorage.removeItem(AUTH_ROLE_KEY);
        setToken(null);
        setBrokerName(null);
        setRole(null);
      },
    }),
    [token, brokerName, role]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de um AuthProvider.");
  return ctx;
}
