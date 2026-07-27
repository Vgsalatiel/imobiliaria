import { Pool } from "pg";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL não definida. Configure a variável de ambiente com a string de conexão do Postgres (ex: postgres://usuario:senha@host:5432/banco)."
  );
}

// Provedores gratuitos (Neon, Supabase, Render...) exigem SSL, mas geralmente usam
// certificado autoassinado/gerenciado — por isso rejectUnauthorized fica false.
// Para Postgres local (ex: ambiente de desenvolvimento) não usamos SSL.
const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);

export const pool = new Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});
