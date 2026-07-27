import { Router } from "express";
import { AuthenticatedRequest, requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import {
  createVisitRequest,
  getVisitOwnerCorretorId,
  listVisitRequests,
  updateVisitStatus,
} from "../db/visitsRepository";
import { getPropertyById } from "../db/propertiesRepository";
import { createVisitAdminSchema, visitStatusSchema } from "../validation/schemas";

export const visitsRouter = Router();

visitsRouter.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const { status } = req.query;
  const isAdmin = req.admin!.role === "admin";

  const visits = await listVisitRequests({
    status: status as string | undefined,
    corretorId: isAdmin ? undefined : req.admin!.id,
  });
  res.json(visits);
});

// Permite ao próprio corretor (ou ao admin) agendar uma visita direto pelo painel,
// sem depender do visitante preencher o formulário do site.
visitsRouter.post(
  "/",
  requireAuth,
  validateBody(createVisitAdminSchema),
  async (req: AuthenticatedRequest, res) => {
    const { propertyId, name, phone, email, message, preferredDate, status } = req.body as {
      propertyId: number;
      name: string;
      phone: string;
      email?: string;
      message?: string;
      preferredDate?: string;
      status?: "pendente" | "confirmada" | "realizada" | "cancelada";
    };

    const property = await getPropertyById(propertyId);
    if (!property) return res.status(404).json({ error: "Imóvel não encontrado." });

    const isAdmin = req.admin!.role === "admin";
    if (!isAdmin && property.corretorId !== req.admin!.id) {
      return res
        .status(403)
        .json({ error: "Você não tem permissão para agendar visitas para este imóvel." });
    }

    const visit = await createVisitRequest({
      propertyId,
      name,
      phone,
      email,
      message,
      preferredDate,
      status: status || "confirmada",
    });

    res.status(201).json(visit);
  }
);

visitsRouter.patch(
  "/:id",
  requireAuth,
  validateBody(visitStatusSchema),
  async (req: AuthenticatedRequest, res) => {
    const id = Number(req.params.id);
    const ownerCorretorId = await getVisitOwnerCorretorId(id);
    if (ownerCorretorId === null) {
      return res.status(404).json({ error: "Agendamento não encontrado." });
    }

    const isAdmin = req.admin!.role === "admin";
    if (!isAdmin && ownerCorretorId !== req.admin!.id) {
      return res.status(403).json({ error: "Você não tem permissão para alterar esta visita." });
    }

    const { status } = req.body as { status: "pendente" | "confirmada" | "realizada" | "cancelada" };
    const visit = await updateVisitStatus(id, status);
    res.json(visit);
  }
);
