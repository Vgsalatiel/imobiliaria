import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { migrate } from "./db/schema";
import { authRouter } from "./routes/auth";
import { propertiesRouter } from "./routes/properties";
import { visitsRouter } from "./routes/visits";
import { assertStrongJwtSecret } from "./middleware/auth";

assertStrongJwtSecret();

const app = express();

app.use(helmet());

// CLIENT_ORIGIN aceita uma lista separada por vírgula (ex: para liberar tanto
// localhost quanto 127.0.0.1 em desenvolvimento, que o navegador trata como origens diferentes).
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173,http://127.0.0.1:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Requisições sem "Origin" (curl, apps mobile, health checks) sempre passam.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`Origem não permitida pelo CORS: ${origin}`));
    },
  })
);

app.use(express.json({ limit: "200kb" }));

// Corpo JSON malformado ou maior que o limite cai aqui em vez do handler de erro padrão do Express.
app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err?.type === "entity.parse.failed" || err?.type === "entity.too.large") {
    return res.status(400).json({ error: "Corpo da requisição inválido ou grande demais." });
  }
  next(err);
});

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRouter);
app.use("/api/properties", propertiesRouter);
app.use("/api/visits", visitsRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Rota não encontrada." });
});

const PORT = Number(process.env.PORT) || 3333;

async function start() {
  await migrate();
  app.listen(PORT, () => {
    console.log(`API da imobiliária rodando em http://localhost:${PORT}`);
    console.log(`CORS liberado para: ${allowedOrigins.join(", ")}`);
  });
}

start().catch((err) => {
  console.error("Falha ao iniciar o servidor:", err);
  process.exit(1);
});
