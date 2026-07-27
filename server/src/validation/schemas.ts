import { z } from "zod";

const purposeEnum = z.enum(["venda", "aluguel"]);
const statusEnum = z.enum(["disponivel", "reservado", "vendido", "alugado"]);
const typeEnum = z.enum(["apartamento", "casa", "cobertura", "terreno", "comercial"]);
const nearbyTypeEnum = z.enum([
  "estacao",
  "ponto_onibus",
  "praca",
  "mercado",
  "escola",
  "hospital",
  "shopping",
]);
const visitStatusEnum = z.enum(["pendente", "confirmada", "realizada", "cancelada"]);

const nearbyPlaceSchema = z.object({
  type: nearbyTypeEnum,
  name: z.string().trim().min(1).max(120),
  distanceMeters: z.coerce.number().int().min(0).max(100_000),
});

const urlOrEmpty = z.string().trim().max(2048).refine(
  (value) => value === "" || /^https?:\/\//i.test(value),
  { message: "URL deve começar com http:// ou https://" }
);

export const createPropertySchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(4000).default(""),
  price: z.coerce.number().min(0),
  purpose: purposeEnum,
  status: statusEnum.optional(),
  type: typeEnum,
  bedrooms: z.coerce.number().int().min(0).max(50).default(0),
  bathrooms: z.coerce.number().int().min(0).max(50).default(0),
  parkingSpots: z.coerce.number().int().min(0).max(50).default(0),
  areaM2: z.coerce.number().min(0).max(1_000_000).default(0),
  neighborhood: z.string().trim().max(200).default(""),
  city: z.string().trim().max(200).default(""),
  state: z.string().trim().max(2).default(""),
  addressLine: z.string().trim().max(300).default(""),
  coverImage: urlOrEmpty.default(""),
  images: z.array(urlOrEmpty).max(30).default([]),
  nearbyPlaces: z.array(nearbyPlaceSchema).max(30).default([]),
  corretorId: z.coerce.number().int().positive().optional(),
});

export const updatePropertySchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(4000),
    price: z.coerce.number().min(0),
    purpose: purposeEnum,
    status: statusEnum,
    type: typeEnum,
    bedrooms: z.coerce.number().int().min(0).max(50),
    bathrooms: z.coerce.number().int().min(0).max(50),
    parkingSpots: z.coerce.number().int().min(0).max(50),
    areaM2: z.coerce.number().min(0).max(1_000_000),
    neighborhood: z.string().trim().max(200),
    city: z.string().trim().max(200),
    state: z.string().trim().max(2),
    addressLine: z.string().trim().max(300),
    coverImage: urlOrEmpty,
    images: z.array(urlOrEmpty).max(30),
    corretorId: z.coerce.number().int().positive(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Envie ao menos um campo para atualizar.",
  });

export const contactRequestSchema = z.object({
  name: z.string().trim().min(1).max(150),
  phone: z.string().trim().min(1).max(40),
  email: z.union([z.literal(""), z.string().trim().email()]).optional(),
  message: z.string().trim().max(1000).optional(),
});

export const visitStatusSchema = z.object({
  status: visitStatusEnum,
});

export const createVisitAdminSchema = z.object({
  propertyId: z.coerce.number().int().positive(),
  name: z.string().trim().min(1).max(150),
  phone: z.string().trim().min(1).max(40),
  email: z.union([z.literal(""), z.string().trim().email()]).optional(),
  message: z.string().trim().max(1000).optional(),
  preferredDate: z.string().trim().max(40).optional(),
  status: visitStatusEnum.optional(),
});

export const loginSchema = z.object({
  username: z.string().trim().min(1).max(100),
  password: z.string().min(1).max(200),
});

export const createCorretorSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Usuário deve ter pelo menos 3 caracteres")
    .max(60)
    .regex(/^[a-z0-9._-]+$/i, "Use apenas letras, números, ponto, hífen ou underscore"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").max(200),
  name: z.string().trim().min(1).max(150),
  whatsapp: z
    .string()
    .trim()
    .regex(/^\d{10,15}$/, "Use só números, com DDI e DDD (ex: 5531999998888)"),
});
