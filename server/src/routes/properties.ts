import { Router } from "express";
import { AuthenticatedRequest, requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { contactRateLimiter } from "../middleware/rateLimit";
import { pool } from "../db/connection";
import {
  createProperty,
  deleteProperty,
  getPropertyById,
  listProperties,
  updateProperty,
} from "../db/propertiesRepository";
import { createVisitRequest } from "../db/visitsRepository";
import { contactRequestSchema, createPropertySchema, updatePropertySchema } from "../validation/schemas";

export const propertiesRouter = Router();

async function corretorExists(id: number): Promise<boolean> {
  const result = await pool.query(`SELECT 1 FROM admin_users WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

propertiesRouter.get("/", async (req, res) => {
  const { purpose, type, city, minPrice, maxPrice, status } = req.query;

  const properties = await listProperties({
    purpose: purpose as string,
    type: type as string,
    city: city as string,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    status: status as string,
    includeAllStatuses: false,
  });

  res.json(properties);
});

propertiesRouter.get("/:id", async (req, res) => {
  const property = await getPropertyById(Number(req.params.id));
  if (!property) return res.status(404).json({ error: "Imóvel não encontrado." });
  res.json(property);
});

propertiesRouter.post(
  "/:id/contato",
  contactRateLimiter,
  validateBody(contactRequestSchema),
  async (req, res) => {
    const propertyId = Number(req.params.id);
    const property = await getPropertyById(propertyId);
    if (!property) return res.status(404).json({ error: "Imóvel não encontrado." });

    const { name, phone, email, message } = req.body as {
      name: string;
      phone: string;
      email?: string;
      message?: string;
    };

    const visit = await createVisitRequest({
      propertyId,
      name,
      phone,
      email,
      message,
    });

    res.status(201).json(visit);
  }
);

// --- rotas administrativas (autenticadas) ---
// Um corretor comum só vê e mexe nos próprios imóveis; o admin vê e mexe em tudo.

propertiesRouter.get("/admin/todos", requireAuth, async (req: AuthenticatedRequest, res) => {
  const { status } = req.query;
  const isAdmin = req.admin!.role === "admin";

  const properties = await listProperties({
    status: status as string,
    includeAllStatuses: true,
    corretorId: isAdmin ? undefined : req.admin!.id,
  });
  res.json(properties);
});

propertiesRouter.post(
  "/",
  requireAuth,
  validateBody(createPropertySchema),
  async (req: AuthenticatedRequest, res) => {
    const isAdmin = req.admin!.role === "admin";

    // Só o admin escolhe para qual corretor o imóvel vai; qualquer outro usuário
    // sempre cadastra para si mesmo, mesmo que tente mandar outro corretorId.
    let corretorId = req.admin!.id;
    if (isAdmin && req.body.corretorId !== undefined) {
      if (!(await corretorExists(req.body.corretorId))) {
        return res.status(400).json({ error: "Corretor selecionado não existe." });
      }
      corretorId = req.body.corretorId;
    }

    const property = await createProperty({ ...req.body, corretorId });
    res.status(201).json(property);
  }
);

propertiesRouter.patch(
  "/:id",
  requireAuth,
  validateBody(updatePropertySchema),
  async (req: AuthenticatedRequest, res) => {
    const id = Number(req.params.id);
    const existing = await getPropertyById(id);
    if (!existing) return res.status(404).json({ error: "Imóvel não encontrado." });

    const isAdmin = req.admin!.role === "admin";
    if (!isAdmin && existing.corretorId !== req.admin!.id) {
      return res.status(403).json({ error: "Você não tem permissão para editar este imóvel." });
    }

    // Só o admin pode trocar de quem é o imóvel — um corretor nunca reatribui,
    // nem para si mesmo, então essa chave é sempre descartada nesse caso.
    if (!isAdmin) {
      delete req.body.corretorId;
    } else if (req.body.corretorId !== undefined && !(await corretorExists(req.body.corretorId))) {
      return res.status(400).json({ error: "Corretor selecionado não existe." });
    }

    const property = await updateProperty(id, req.body);
    res.json(property);
  }
);

propertiesRouter.delete("/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const existing = await getPropertyById(id);
  if (!existing) return res.status(404).json({ error: "Imóvel não encontrado." });

  const isAdmin = req.admin!.role === "admin";
  if (!isAdmin && existing.corretorId !== req.admin!.id) {
    return res.status(403).json({ error: "Você não tem permissão para remover este imóvel." });
  }

  await deleteProperty(id);
  res.status(204).send();
});
