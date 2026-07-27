import { pool } from "./connection";
import { NearbyPlace, Property, PropertyWithNearby } from "../types";

interface PropertyFilters {
  purpose?: string;
  type?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
  includeAllStatuses?: boolean;
  corretorId?: number;
}

function rowToProperty(row: any): Property {
  return {
    ...row,
    images: JSON.parse(row.images || "[]"),
    corretorName: row.corretorName ?? null,
    corretorWhatsapp: row.corretorWhatsapp ?? null,
  };
}

function buildFilterClauses(filters: PropertyFilters) {
  const clauses: string[] = [];
  const values: unknown[] = [];

  function addClause(sqlWithPlaceholder: string, value: unknown) {
    values.push(value);
    clauses.push(sqlWithPlaceholder.replace("?", `$${values.length}`));
  }

  if (!filters.includeAllStatuses) {
    addClause("status = ?", filters.status || "disponivel");
  } else if (filters.status) {
    addClause("status = ?", filters.status);
  }

  if (filters.purpose) addClause("purpose = ?", filters.purpose);
  if (filters.type) addClause("type = ?", filters.type);
  if (filters.city) addClause("city ILIKE ?", `%${filters.city}%`);
  if (filters.minPrice !== undefined) addClause("price >= ?", filters.minPrice);
  if (filters.maxPrice !== undefined) addClause("price <= ?", filters.maxPrice);
  if (filters.corretorId !== undefined) addClause(`"corretorId" = ?`, filters.corretorId);

  return { clauses, values };
}

const PROPERTY_SELECT_WITH_OWNER = `
  SELECT p.*, u.name as "corretorName", u.whatsapp as "corretorWhatsapp"
  FROM properties p
  LEFT JOIN admin_users u ON u.id = p."corretorId"
`;

export async function listProperties(filters: PropertyFilters): Promise<Property[]> {
  const { clauses, values } = buildFilterClauses(filters);
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const result = await pool.query(
    `${PROPERTY_SELECT_WITH_OWNER} ${where} ORDER BY p."createdAt" DESC`,
    values
  );
  return result.rows.map(rowToProperty);
}

export async function getPropertyById(id: number): Promise<PropertyWithNearby | undefined> {
  const result = await pool.query(`${PROPERTY_SELECT_WITH_OWNER} WHERE p.id = $1`, [id]);
  const row = result.rows[0];
  if (!row) return undefined;

  const nearbyResult = await pool.query(
    `SELECT * FROM nearby_places WHERE "propertyId" = $1 ORDER BY "distanceMeters" ASC`,
    [id]
  );

  return { ...rowToProperty(row), nearbyPlaces: nearbyResult.rows as NearbyPlace[] };
}

export interface CreatePropertyInput {
  title: string;
  description: string;
  price: number;
  purpose: string;
  status?: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  parkingSpots: number;
  areaM2: number;
  neighborhood: string;
  city: string;
  state: string;
  addressLine: string;
  coverImage: string;
  images: string[];
  corretorId: number;
  nearbyPlaces: { type: string; name: string; distanceMeters: number }[];
}

export async function createProperty(input: CreatePropertyInput): Promise<PropertyWithNearby> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const propertyResult = await client.query(
      `INSERT INTO properties
        (title, description, price, purpose, status, type, bedrooms, bathrooms, "parkingSpots", "areaM2", neighborhood, city, state, "addressLine", "coverImage", images, "corretorId")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING id`,
      [
        input.title,
        input.description,
        input.price,
        input.purpose,
        input.status || "disponivel",
        input.type,
        input.bedrooms,
        input.bathrooms,
        input.parkingSpots,
        input.areaM2,
        input.neighborhood,
        input.city,
        input.state,
        input.addressLine,
        input.coverImage,
        JSON.stringify(input.images || []),
        input.corretorId,
      ]
    );

    const propertyId = propertyResult.rows[0].id as number;

    for (const n of input.nearbyPlaces || []) {
      await client.query(
        `INSERT INTO nearby_places ("propertyId", type, name, "distanceMeters") VALUES ($1,$2,$3,$4)`,
        [propertyId, n.type, n.name, n.distanceMeters]
      );
    }

    await client.query("COMMIT");
    return (await getPropertyById(propertyId))!;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export interface UpdatePropertyInput {
  title?: string;
  description?: string;
  price?: number;
  purpose?: string;
  status?: string;
  type?: string;
  bedrooms?: number;
  bathrooms?: number;
  parkingSpots?: number;
  areaM2?: number;
  neighborhood?: string;
  city?: string;
  state?: string;
  addressLine?: string;
  coverImage?: string;
  images?: string[];
  corretorId?: number;
}

const UPDATABLE_PROPERTY_FIELDS = [
  "title",
  "description",
  "price",
  "purpose",
  "status",
  "type",
  "bedrooms",
  "bathrooms",
  "parkingSpots",
  "areaM2",
  "neighborhood",
  "city",
  "state",
  "addressLine",
  "coverImage",
  "images",
  "corretorId",
] as const satisfies readonly (keyof UpdatePropertyInput)[];

// Nomes de coluna sempre entre aspas quando têm letra maiúscula, pra preservar a grafia no Postgres.
const COLUMN_SQL: Record<(typeof UPDATABLE_PROPERTY_FIELDS)[number], string> = {
  title: "title",
  description: "description",
  price: "price",
  purpose: "purpose",
  status: "status",
  type: "type",
  bedrooms: "bedrooms",
  bathrooms: "bathrooms",
  parkingSpots: `"parkingSpots"`,
  areaM2: `"areaM2"`,
  neighborhood: "neighborhood",
  city: "city",
  state: "state",
  addressLine: `"addressLine"`,
  coverImage: `"coverImage"`,
  images: "images",
  corretorId: `"corretorId"`,
};

export async function updateProperty(
  id: number,
  input: UpdatePropertyInput
): Promise<PropertyWithNearby | undefined> {
  const existing = await getPropertyById(id);
  if (!existing) return undefined;

  const setClauses: string[] = [];
  const values: unknown[] = [];

  // Only ever touch columns from this fixed whitelist, and only ones that were
  // actually declared as parameterized placeholders below — arbitrary keys from
  // the input object (e.g. request bodies) can never reach the SQL string.
  for (const key of UPDATABLE_PROPERTY_FIELDS) {
    const value = input[key];
    if (value === undefined) continue;
    values.push(key === "images" ? JSON.stringify(value) : value);
    setClauses.push(`${COLUMN_SQL[key]} = $${values.length}`);
  }

  if (setClauses.length === 0) return existing;

  values.push(id);
  await pool.query(
    `UPDATE properties SET ${setClauses.join(", ")} WHERE id = $${values.length}`,
    values
  );
  return getPropertyById(id);
}

export async function deleteProperty(id: number): Promise<boolean> {
  const result = await pool.query(`DELETE FROM properties WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}
