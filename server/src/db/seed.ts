import bcrypt from "bcryptjs";
import { pool } from "./connection";
import { migrate } from "./schema";

interface SeedNearby {
  type: "estacao" | "ponto_onibus" | "praca" | "mercado" | "escola" | "hospital" | "shopping";
  name: string;
  distanceMeters: number;
}

interface SeedProperty {
  title: string;
  description: string;
  price: number;
  purpose: "venda" | "aluguel";
  status: "disponivel" | "reservado" | "vendido" | "alugado";
  type: "apartamento" | "casa" | "cobertura" | "terreno" | "comercial";
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
  nearby: SeedNearby[];
}

const properties: SeedProperty[] = [
  {
    title: "Apartamento aconchegante com varanda gourmet",
    description:
      "Apartamento reformado com 3 quartos, sendo 1 suíte, varanda gourmet integrada à sala e vista livre. Prédio com portaria 24h, salão de festas e academia.",
    price: 620000,
    purpose: "venda",
    status: "disponivel",
    type: "apartamento",
    bedrooms: 3,
    bathrooms: 2,
    parkingSpots: 2,
    areaM2: 98,
    neighborhood: "Savassi",
    city: "Belo Horizonte",
    state: "MG",
    addressLine: "Rua Pium-í, próximo à Praça da Savassi",
    coverImage:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
    ],
    nearby: [
      { type: "praca", name: "Praça da Savassi", distanceMeters: 180 },
      { type: "ponto_onibus", name: "Ponto Av. Getúlio Vargas", distanceMeters: 120 },
      { type: "mercado", name: "Supermercado BH", distanceMeters: 300 },
      { type: "escola", name: "Escola Estadual Central", distanceMeters: 450 },
    ],
  },
  {
    title: "Casa térrea com quintal amplo em condomínio fechado",
    description:
      "Casa térrea com 4 quartos, quintal amplo, churrasqueira e 2 vagas cobertas. Condomínio fechado com segurança 24h e área de lazer completa para a família.",
    price: 3200,
    purpose: "aluguel",
    status: "disponivel",
    type: "casa",
    bedrooms: 4,
    bathrooms: 3,
    parkingSpots: 2,
    areaM2: 180,
    neighborhood: "Buritis",
    city: "Belo Horizonte",
    state: "MG",
    addressLine: "Condomínio Reserva do Buritis",
    coverImage:
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
    ],
    nearby: [
      { type: "escola", name: "Colégio Buritis", distanceMeters: 500 },
      { type: "shopping", name: "Shopping Del Rey", distanceMeters: 1800 },
      { type: "hospital", name: "Hospital Vera Cruz", distanceMeters: 2200 },
      { type: "ponto_onibus", name: "Ponto Av. Raja Gabáglia", distanceMeters: 350 },
    ],
  },
  {
    title: "Cobertura duplex com piscina privativa",
    description:
      "Cobertura duplex com piscina privativa, terraço gourmet e vista panorâmica da cidade. Acabamento de altíssimo padrão, 4 suítes e 3 vagas de garagem.",
    price: 1850000,
    purpose: "venda",
    status: "reservado",
    type: "cobertura",
    bedrooms: 4,
    bathrooms: 5,
    parkingSpots: 3,
    areaM2: 260,
    neighborhood: "Belvedere",
    city: "Belo Horizonte",
    state: "MG",
    addressLine: "Av. Prof. Mário Werneck",
    coverImage:
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
    ],
    nearby: [
      { type: "praca", name: "Parque das Mangabeiras", distanceMeters: 900 },
      { type: "shopping", name: "Shopping Sul", distanceMeters: 1500 },
      { type: "estacao", name: "Estação Move Villa Real", distanceMeters: 600 },
    ],
  },
  {
    title: "Studio moderno próximo ao metrô",
    description:
      "Studio compacto e funcional, ideal para quem busca praticidade no dia a dia. Prédio novo, com coworking e lavanderia compartilhada.",
    price: 1800,
    purpose: "aluguel",
    status: "disponivel",
    type: "apartamento",
    bedrooms: 1,
    bathrooms: 1,
    parkingSpots: 1,
    areaM2: 32,
    neighborhood: "Centro",
    city: "Belo Horizonte",
    state: "MG",
    addressLine: "Rua da Bahia, próximo à Estação Central",
    coverImage:
      "https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
    ],
    nearby: [
      { type: "estacao", name: "Estação Central (Metrô)", distanceMeters: 250 },
      { type: "ponto_onibus", name: "Ponto Rua da Bahia", distanceMeters: 80 },
      { type: "mercado", name: "Mercado Central", distanceMeters: 400 },
    ],
  },
  {
    title: "Terreno plano em bairro residencial tranquilo",
    description:
      "Terreno plano de 360m², em rua tranquila e arborizada, ideal para construção de casa térrea ou sobrado. Documentação regularizada.",
    price: 280000,
    purpose: "venda",
    status: "disponivel",
    type: "terreno",
    bedrooms: 0,
    bathrooms: 0,
    parkingSpots: 0,
    areaM2: 360,
    neighborhood: "Ouro Preto",
    city: "Belo Horizonte",
    state: "MG",
    addressLine: "Rua das Acácias",
    coverImage:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
    ],
    nearby: [
      { type: "praca", name: "Praça Jardim Ouro Preto", distanceMeters: 220 },
      { type: "escola", name: "Escola Municipal Ouro Preto", distanceMeters: 380 },
    ],
  },
  {
    title: "Sala comercial em andar alto com vista para o parque",
    description:
      "Sala comercial de 45m² em edifício corporativo, andar alto, vista para o parque. Ideal para escritórios e consultórios.",
    price: 2600,
    purpose: "aluguel",
    status: "alugado",
    type: "comercial",
    bedrooms: 0,
    bathrooms: 1,
    parkingSpots: 1,
    areaM2: 45,
    neighborhood: "Funcionários",
    city: "Belo Horizonte",
    state: "MG",
    addressLine: "Av. Bias Fortes",
    coverImage:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
    ],
    nearby: [
      { type: "praca", name: "Parque Municipal", distanceMeters: 350 },
      { type: "ponto_onibus", name: "Ponto Av. Bias Fortes", distanceMeters: 90 },
      { type: "hospital", name: "Hospital Madre Teresa", distanceMeters: 1200 },
    ],
  },
  {
    title: "Casa de vila charmosa e reformada",
    description:
      "Casa de vila com 2 quartos, quintal com horta e muito charme original preservado, aliado a uma reforma cuidadosa. Rua tranquila e arborizada.",
    price: 480000,
    purpose: "venda",
    status: "vendido",
    type: "casa",
    bedrooms: 2,
    bathrooms: 2,
    parkingSpots: 1,
    areaM2: 90,
    neighborhood: "Santa Teresa",
    city: "Belo Horizonte",
    state: "MG",
    addressLine: "Rua Conselheiro Rocha",
    coverImage:
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80",
    ],
    nearby: [
      { type: "praca", name: "Praça Duque de Caxias", distanceMeters: 260 },
      { type: "ponto_onibus", name: "Ponto Rua Conselheiro Rocha", distanceMeters: 100 },
    ],
  },
  {
    title: "Apartamento familiar com área de lazer completa",
    description:
      "Apartamento com 3 quartos, sendo 1 suíte, em condomínio com piscina, playground, salão de jogos e quadra poliesportiva. Ótimo para famílias com crianças.",
    price: 480000,
    purpose: "venda",
    status: "disponivel",
    type: "apartamento",
    bedrooms: 3,
    bathrooms: 2,
    parkingSpots: 2,
    areaM2: 85,
    neighborhood: "Castelo",
    city: "Belo Horizonte",
    state: "MG",
    addressLine: "Rua Colômbia",
    coverImage:
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80",
    ],
    nearby: [
      { type: "escola", name: "Escola Municipal Castelo", distanceMeters: 300 },
      { type: "mercado", name: "Supermercado Verdemar", distanceMeters: 420 },
      { type: "praca", name: "Praça do Castelo", distanceMeters: 150 },
      { type: "estacao", name: "Estação Move Castelo", distanceMeters: 700 },
    ],
  },
  {
    title: "Apartamento com vista para o mar",
    description:
      "Apartamento amplo a poucos metros da praia, com varanda integrada, 3 quartos (1 suíte) e vista livre para o mar. Prédio com portaria 24h e piscina na cobertura.",
    price: 2200000,
    purpose: "venda",
    status: "disponivel",
    type: "apartamento",
    bedrooms: 3,
    bathrooms: 3,
    parkingSpots: 2,
    areaM2: 140,
    neighborhood: "Ipanema",
    city: "Rio de Janeiro",
    state: "RJ",
    addressLine: "Rua Visconde de Pirajá, próximo à praia",
    coverImage:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80",
    ],
    nearby: [
      { type: "praca", name: "Praça General Osório", distanceMeters: 280 },
      { type: "estacao", name: "Estação General Osório (Metrô)", distanceMeters: 400 },
      { type: "ponto_onibus", name: "Ponto Rua Visconde de Pirajá", distanceMeters: 90 },
      { type: "mercado", name: "Mercado Zona Sul", distanceMeters: 220 },
    ],
  },
  {
    title: "Studio compacto na Vila Madalena",
    description:
      "Studio moderno e bem iluminado, ideal para quem busca praticidade perto da vida noturna e cultural da Vila Madalena. Prédio novo com bicicletário e coworking.",
    price: 2400,
    purpose: "aluguel",
    status: "disponivel",
    type: "apartamento",
    bedrooms: 1,
    bathrooms: 1,
    parkingSpots: 0,
    areaM2: 28,
    neighborhood: "Vila Madalena",
    city: "São Paulo",
    state: "SP",
    addressLine: "Rua Harmonia, próximo ao metrô Vila Madalena",
    coverImage:
      "https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
    ],
    nearby: [
      { type: "estacao", name: "Estação Vila Madalena (Metrô)", distanceMeters: 350 },
      { type: "ponto_onibus", name: "Ponto Rua Harmonia", distanceMeters: 60 },
      { type: "praca", name: "Praça Benedito Calixto", distanceMeters: 500 },
    ],
  },
  {
    title: "Casa de campo com amplo jardim",
    description:
      "Casa espaçosa em condomínio de chácaras, com jardim amplo, pomar e área externa para lazer. Ambiente tranquilo, ideal para quem busca contato com a natureza perto da cidade.",
    price: 950000,
    purpose: "venda",
    status: "disponivel",
    type: "casa",
    bedrooms: 4,
    bathrooms: 3,
    parkingSpots: 4,
    areaM2: 320,
    neighborhood: "Vale dos Cristais",
    city: "Nova Lima",
    state: "MG",
    addressLine: "Condomínio Vale dos Cristais",
    coverImage:
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
    ],
    nearby: [
      { type: "escola", name: "Escola Fundação Torino", distanceMeters: 1800 },
      { type: "mercado", name: "Mercado Vale dos Cristais", distanceMeters: 1200 },
      { type: "hospital", name: "Hospital Márcio Cunha", distanceMeters: 4500 },
    ],
  },
  {
    title: "Kitnet mobiliada próxima à praia",
    description:
      "Kitnet totalmente mobiliada a três quadras da praia de Copacabana, pronta para morar. Ótima opção para quem busca praticidade e localização.",
    price: 2100,
    purpose: "aluguel",
    status: "disponivel",
    type: "apartamento",
    bedrooms: 1,
    bathrooms: 1,
    parkingSpots: 0,
    areaM2: 25,
    neighborhood: "Copacabana",
    city: "Rio de Janeiro",
    state: "RJ",
    addressLine: "Rua Barata Ribeiro",
    coverImage:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&w=1200&q=80",
    ],
    nearby: [
      { type: "praca", name: "Praça do Lido", distanceMeters: 300 },
      { type: "ponto_onibus", name: "Ponto Rua Barata Ribeiro", distanceMeters: 70 },
      { type: "estacao", name: "Estação Cardeal Arcoverde (Metrô)", distanceMeters: 550 },
      { type: "mercado", name: "Mercado Prezunic", distanceMeters: 180 },
    ],
  },
  {
    title: "Sala comercial na Av. Paulista",
    description:
      "Sala comercial de 60m² em edifício corporativo tradicional na Av. Paulista, com recepção, ar-condicionado central e fácil acesso ao metrô.",
    price: 4200,
    purpose: "aluguel",
    status: "disponivel",
    type: "comercial",
    bedrooms: 0,
    bathrooms: 1,
    parkingSpots: 1,
    areaM2: 60,
    neighborhood: "Bela Vista",
    city: "São Paulo",
    state: "SP",
    addressLine: "Av. Paulista, próximo ao metrô Trianon-MASP",
    coverImage:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
    ],
    nearby: [
      { type: "estacao", name: "Estação Trianon-MASP (Metrô)", distanceMeters: 200 },
      { type: "praca", name: "Parque Trianon", distanceMeters: 250 },
      { type: "ponto_onibus", name: "Ponto Av. Paulista", distanceMeters: 50 },
    ],
  },
  {
    title: "Sobrado em condomínio fechado",
    description:
      "Sobrado com 3 quartos, sendo 1 suíte, em condomínio fechado com segurança 24h, salão de festas e piscina. Ótima opção para famílias.",
    price: 620000,
    purpose: "venda",
    status: "reservado",
    type: "casa",
    bedrooms: 3,
    bathrooms: 3,
    parkingSpots: 2,
    areaM2: 150,
    neighborhood: "Riacho das Pedras",
    city: "Contagem",
    state: "MG",
    addressLine: "Condomínio Villaggio",
    coverImage:
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
    ],
    nearby: [
      { type: "escola", name: "Escola Municipal Riacho das Pedras", distanceMeters: 400 },
      { type: "mercado", name: "Supermercado BH", distanceMeters: 600 },
      { type: "ponto_onibus", name: "Ponto Av. João César de Oliveira", distanceMeters: 250 },
    ],
  },
  {
    title: "Cobertura com terraço gourmet na Barra",
    description:
      "Cobertura duplex com terraço gourmet, piscina privativa e vista para a lagoa. Condomínio clube com infraestrutura completa de lazer.",
    price: 2600000,
    purpose: "venda",
    status: "vendido",
    type: "cobertura",
    bedrooms: 4,
    bathrooms: 4,
    parkingSpots: 3,
    areaM2: 210,
    neighborhood: "Barra da Tijuca",
    city: "Rio de Janeiro",
    state: "RJ",
    addressLine: "Av. Lúcio Costa",
    coverImage:
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
    ],
    nearby: [
      { type: "praca", name: "Parque Olímpico", distanceMeters: 1200 },
      { type: "shopping", name: "Shopping Barra", distanceMeters: 900 },
      { type: "ponto_onibus", name: "Ponto Av. Lúcio Costa", distanceMeters: 150 },
    ],
  },
];

async function ensureDemoCorretor() {
  const existing = await pool.query(`SELECT id FROM admin_users WHERE username = $1`, ["joao"]);
  if (existing.rows[0]) return;

  const insertResult = await pool.query(
    `INSERT INTO admin_users (username, "passwordHash", name, role, whatsapp)
     VALUES ($1, $2, $3, 'corretor', $4)
     RETURNING id`,
    ["joao", bcrypt.hashSync("joao123", 10), "João Corretor", "5531977776666"]
  );
  const joaoId = insertResult.rows[0].id as number;

  // Reassina alguns imóveis já existentes para o novo corretor, só para a demonstração
  // mostrar de cara que cada corretor vê apenas os próprios imóveis/visitas.
  const idsResult = await pool.query(
    `SELECT id FROM properties ORDER BY id ASC LIMIT 6 OFFSET 6`
  );
  const idsToReassign = idsResult.rows.map((r) => r.id as number);

  if (idsToReassign.length > 0) {
    await pool.query(`UPDATE properties SET "corretorId" = $1 WHERE id = ANY($2::int[])`, [
      joaoId,
      idsToReassign,
    ]);
  }

  console.log(
    `Corretor de demonstração criado -> usuário: joao | senha: joao123 (responsável por ${idsToReassign.length} imóveis)`
  );
}

/** Preenche o whatsapp de demonstração para contas antigas criadas antes dessa coluna existir. */
async function backfillDemoWhatsapp() {
  await pool.query(
    `UPDATE admin_users SET whatsapp = $1 WHERE username = 'corretor' AND (whatsapp IS NULL OR whatsapp = '')`,
    ["5531988887777"]
  );
  await pool.query(
    `UPDATE admin_users SET whatsapp = $1 WHERE username = 'joao' AND (whatsapp IS NULL OR whatsapp = '')`,
    ["5531977776666"]
  );
}

async function seed() {
  await migrate();
  await backfillDemoWhatsapp();

  const countResult = await pool.query(`SELECT COUNT(*) as c FROM properties`);
  const propertyCount = Number(countResult.rows[0].c);
  if (propertyCount > 0) {
    console.log("Banco já populado, seed de imóveis ignorado.");
    await ensureDemoCorretor();
    return;
  }

  const adminInsertResult = await pool.query(
    `INSERT INTO admin_users (username, "passwordHash", name, role, whatsapp)
     VALUES ($1, $2, $3, 'admin', $4)
     RETURNING id`,
    ["corretor", bcrypt.hashSync("imoveis123", 10), "Ana Corretora", "5531988887777"]
  );
  const adminId = adminInsertResult.rows[0].id as number;

  for (const [index, p] of properties.entries()) {
    const propertyInsertResult = await pool.query(
      `INSERT INTO properties
        (title, description, price, purpose, status, type, bedrooms, bathrooms, "parkingSpots", "areaM2", neighborhood, city, state, "addressLine", "coverImage", images, "corretorId")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING id`,
      [
        p.title,
        p.description,
        p.price,
        p.purpose,
        p.status,
        p.type,
        p.bedrooms,
        p.bathrooms,
        p.parkingSpots,
        p.areaM2,
        p.neighborhood,
        p.city,
        p.state,
        p.addressLine,
        p.coverImage,
        JSON.stringify(p.images),
        adminId,
      ]
    );
    const propertyId = propertyInsertResult.rows[0].id as number;

    for (const n of p.nearby) {
      await pool.query(
        `INSERT INTO nearby_places ("propertyId", type, name, "distanceMeters") VALUES ($1, $2, $3, $4)`,
        [propertyId, n.type, n.name, n.distanceMeters]
      );
    }

    if (index === 0) {
      await pool.query(
        `INSERT INTO visit_requests ("propertyId", name, phone, email, message, "preferredDate", status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          propertyId,
          "Marcos Silva",
          "(31) 99999-1234",
          "marcos.silva@email.com",
          "Tenho interesse em visitar no fim de semana, de preferência à tarde.",
          "2026-07-27 15:00",
          "pendente",
        ]
      );
    }
    if (index === 1) {
      await pool.query(
        `INSERT INTO visit_requests ("propertyId", name, phone, email, message, "preferredDate", status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          propertyId,
          "Juliana Costa",
          "(31) 98888-5678",
          "juliana.costa@email.com",
          "Gostaria de saber se aceita animais de estimação.",
          "2026-07-26 10:00",
          "confirmada",
        ]
      );
    }
    if (index === 3) {
      await pool.query(
        `INSERT INTO visit_requests ("propertyId", name, phone, email, message, "preferredDate", status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          propertyId,
          "Rafael Nogueira",
          "(31) 97777-4321",
          "rafael.n@email.com",
          "Já vi o apartamento no aplicativo, quero confirmar disponibilidade.",
          null,
          "realizada",
        ]
      );
    }
  }

  console.log(`Seed concluído: ${properties.length} imóveis cadastrados.`);
  console.log("Login admin -> usuário: corretor | senha: imoveis123");

  await ensureDemoCorretor();
}

seed()
  .then(() => pool.end())
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
