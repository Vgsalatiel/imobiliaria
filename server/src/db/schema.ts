import { pool } from "./connection";

// Postgres deixa nomes de coluna em minúsculas a menos que venham entre aspas
// duplas — por isso toda coluna em camelCase (ex: "corretorId") é declarada e
// consultada sempre entre aspas, em todo o projeto, para preservar a grafia.

async function columnExists(table: string, column: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`,
    [table, column]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      "passwordHash" TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'corretor' CHECK (role IN ('admin','corretor')),
      whatsapp TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS properties (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      purpose TEXT NOT NULL CHECK (purpose IN ('venda','aluguel')),
      status TEXT NOT NULL DEFAULT 'disponivel' CHECK (status IN ('disponivel','reservado','vendido','alugado')),
      type TEXT NOT NULL CHECK (type IN ('apartamento','casa','cobertura','terreno','comercial')),
      bedrooms INTEGER NOT NULL DEFAULT 0,
      bathrooms INTEGER NOT NULL DEFAULT 0,
      "parkingSpots" INTEGER NOT NULL DEFAULT 0,
      "areaM2" REAL NOT NULL DEFAULT 0,
      neighborhood TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      "addressLine" TEXT NOT NULL DEFAULT '',
      "coverImage" TEXT NOT NULL DEFAULT '',
      images TEXT NOT NULL DEFAULT '[]',
      "corretorId" INTEGER REFERENCES admin_users(id),
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS nearby_places (
      id SERIAL PRIMARY KEY,
      "propertyId" INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('estacao','ponto_onibus','praca','mercado','escola','hospital','shopping')),
      name TEXT NOT NULL,
      "distanceMeters" INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS visit_requests (
      id SERIAL PRIMARY KEY,
      "propertyId" INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL DEFAULT '',
      message TEXT NOT NULL DEFAULT '',
      "preferredDate" TEXT,
      status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','confirmada','realizada','cancelada')),
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
    CREATE INDEX IF NOT EXISTS idx_nearby_property ON nearby_places("propertyId");
    CREATE INDEX IF NOT EXISTS idx_visits_property ON visit_requests("propertyId");
  `);

  // --- migrações incrementais para bancos criados antes destas colunas existirem ---

  if (!(await columnExists("admin_users", "role"))) {
    await pool.query(
      `ALTER TABLE admin_users ADD COLUMN role TEXT NOT NULL DEFAULT 'corretor' CHECK (role IN ('admin','corretor'))`
    );
  }

  if (!(await columnExists("properties", "corretorId"))) {
    await pool.query(`ALTER TABLE properties ADD COLUMN "corretorId" INTEGER REFERENCES admin_users(id)`);
  }

  if (!(await columnExists("admin_users", "whatsapp"))) {
    await pool.query(`ALTER TABLE admin_users ADD COLUMN whatsapp TEXT NOT NULL DEFAULT ''`);
  }

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_properties_corretor ON properties("corretorId")`);

  // O primeiro usuário cadastrado vira admin, e qualquer imóvel sem dono
  // (dados antigos de antes do sistema de corretores) passa a pertencer a ele.
  const firstUserResult = await pool.query(`SELECT id FROM admin_users ORDER BY id ASC LIMIT 1`);
  const firstUser = firstUserResult.rows[0] as { id: number } | undefined;

  if (firstUser) {
    await pool.query(`UPDATE admin_users SET role = 'admin' WHERE id = $1`, [firstUser.id]);
    await pool.query(`UPDATE properties SET "corretorId" = $1 WHERE "corretorId" IS NULL`, [
      firstUser.id,
    ]);
  }
}
