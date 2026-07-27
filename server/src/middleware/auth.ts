import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { UserRole } from "../types";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

const KNOWN_PLACEHOLDER_SECRETS = ["dev-secret", "troque-este-segredo-em-producao"];

export function assertStrongJwtSecret() {
  const isWeak = JWT_SECRET.length < 32 || KNOWN_PLACEHOLDER_SECRETS.includes(JWT_SECRET);

  if (!isWeak) return;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "JWT_SECRET fraco ou de exemplo detectado em produção. Gere um segredo forte (ex: `openssl rand -hex 32`) e defina a variável de ambiente JWT_SECRET antes de subir o servidor."
    );
  }

  console.warn(
    "[aviso] JWT_SECRET fraco ou de exemplo. Ok para desenvolvimento, mas troque antes de ir para produção."
  );
}

export interface AuthenticatedRequest extends Request {
  admin?: { id: number; username: string; name: string; role: UserRole };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token de autenticação ausente." });
  }

  const token = header.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      id: number;
      username: string;
      name: string;
      role: UserRole;
    };
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido ou expirado." });
  }
}

/** Use depois de requireAuth. Bloqueia corretores comuns, deixa passar só quem é admin. */
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.admin?.role !== "admin") {
    return res.status(403).json({ error: "Apenas administradores podem fazer isso." });
  }
  next();
}

export { JWT_SECRET };
