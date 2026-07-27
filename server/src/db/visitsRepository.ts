import { pool } from "./connection";
import { VisitRequest, VisitRequestWithProperty, VisitStatus } from "../types";

export interface CreateVisitInput {
  propertyId: number;
  name: string;
  phone: string;
  email?: string;
  message?: string;
  preferredDate?: string | null;
  status?: VisitStatus;
}

export async function createVisitRequest(input: CreateVisitInput): Promise<VisitRequest> {
  const result = await pool.query(
    `INSERT INTO visit_requests ("propertyId", name, phone, email, message, "preferredDate", status)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [
      input.propertyId,
      input.name,
      input.phone,
      input.email || "",
      input.message || "",
      input.preferredDate || null,
      input.status || "pendente",
    ]
  );
  return result.rows[0] as VisitRequest;
}

export interface VisitFilters {
  status?: string;
  corretorId?: number;
}

export async function listVisitRequests(filters: VisitFilters): Promise<VisitRequestWithProperty[]> {
  const clauses: string[] = [];
  const values: unknown[] = [];

  if (filters.status) {
    values.push(filters.status);
    clauses.push(`v.status = $${values.length}`);
  }
  if (filters.corretorId !== undefined) {
    values.push(filters.corretorId);
    clauses.push(`p."corretorId" = $${values.length}`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const result = await pool.query(
    `SELECT v.*, p.title as "propertyTitle", p."coverImage" as "propertyCoverImage", u.name as "corretorName"
     FROM visit_requests v
     JOIN properties p ON p.id = v."propertyId"
     LEFT JOIN admin_users u ON u.id = p."corretorId"
     ${where}
     ORDER BY v."createdAt" DESC`,
    values
  );

  return result.rows.map((row) => ({ ...row, corretorName: row.corretorName ?? null }));
}

/** Dono (corretorId) do imóvel ao qual esta solicitação de visita pertence, usado para checar permissão. */
export async function getVisitOwnerCorretorId(visitId: number): Promise<number | null> {
  const result = await pool.query(
    `SELECT p."corretorId" as "corretorId"
     FROM visit_requests v
     JOIN properties p ON p.id = v."propertyId"
     WHERE v.id = $1`,
    [visitId]
  );
  const row = result.rows[0] as { corretorId: number | null } | undefined;
  return row ? row.corretorId : null;
}

export async function updateVisitStatus(
  id: number,
  status: VisitStatus
): Promise<VisitRequest | undefined> {
  const result = await pool.query(
    `UPDATE visit_requests SET status = $1 WHERE id = $2 RETURNING *`,
    [status, id]
  );
  return result.rows[0] as VisitRequest | undefined;
}
