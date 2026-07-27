import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db/connection";
import { AdminUser } from "../types";
import { JWT_SECRET, requireAdmin, requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { loginRateLimiter } from "../middleware/rateLimit";
import { createCorretorSchema, loginSchema } from "../validation/schemas";

export const authRouter = Router();

authRouter.post("/login", loginRateLimiter, validateBody(loginSchema), async (req, res) => {
  const { username, password } = req.body as { username: string; password: string };

  const result = await pool.query(`SELECT * FROM admin_users WHERE username = $1`, [username]);
  const user = result.rows[0] as AdminUser | undefined;

  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: "Usuário ou senha inválidos." });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: "12h" }
  );

  res.json({ token, name: user.name, username: user.username, role: user.role });
});

// --- gestão de corretores (só para administradores) ---

authRouter.get("/corretores", requireAuth, requireAdmin, async (_req, res) => {
  const result = await pool.query(
    `SELECT u.id, u.username, u.name, u.role, u.whatsapp,
            (SELECT COUNT(*) FROM properties p WHERE p."corretorId" = u.id)::int as "propertyCount"
     FROM admin_users u
     ORDER BY u.role DESC, u.name ASC`
  );
  res.json(result.rows);
});

authRouter.post(
  "/corretores",
  requireAuth,
  requireAdmin,
  validateBody(createCorretorSchema),
  async (req, res) => {
    const { username, password, name, whatsapp } = req.body as {
      username: string;
      password: string;
      name: string;
      whatsapp: string;
    };

    const existingResult = await pool.query(`SELECT id FROM admin_users WHERE username = $1`, [
      username,
    ]);
    if (existingResult.rows[0]) {
      return res.status(409).json({ error: "Já existe um usuário com esse login." });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const insertResult = await pool.query(
      `INSERT INTO admin_users (username, "passwordHash", name, role, whatsapp)
       VALUES ($1, $2, $3, 'corretor', $4)
       RETURNING id, username, name, role, whatsapp`,
      [username, passwordHash, name, whatsapp]
    );

    res.status(201).json(insertResult.rows[0]);
  }
);
