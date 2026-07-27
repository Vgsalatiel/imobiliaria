# Lar&Chave — Site de Imobiliária

Site público para visualização de imóveis (com detalhes de localização, distância de
estações, praças, pontos de ônibus etc. e um botão para falar com o corretor) e um
painel administrativo para o corretor cadastrar imóveis e acompanhar visitas agendadas
e o status de venda/aluguel.

## Estrutura do projeto

```
projeto/
├── client/                     # Front-end (React + TypeScript + Vite)
│   └── src/
│       ├── api/                # Chamadas HTTP para a API (axios)
│       ├── components/
│       │   ├── layout/         # Header, footer, layout do site público e do admin
│       │   ├── property/       # Card de imóvel, filtros, lista de pontos próximos...
│       │   └── common/         # Componentes genéricos (Modal, etc.)
│       ├── context/            # AuthContext (sessão do corretor)
│       ├── pages/
│       │   ├── public/         # HomePage (listagem) e PropertyDetailPage
│       │   └── admin/          # Login, Dashboard, Imóveis, Novo imóvel, Visitas
│       ├── routes/             # Proteção de rotas privadas (RequireAuth)
│       ├── types/               # Tipos TypeScript compartilhados com a API
│       └── utils/               # Formatação de preço, distância, datas...
│
└── server/                     # API (Node + Express + TypeScript)
    └── src/
        ├── db/                 # Conexão SQLite, schema, seed e repositórios
        ├── middleware/         # Autenticação (JWT)
        ├── routes/             # Rotas de auth, imóveis e visitas
        └── types/              # Tipos compartilhados
```

- **Banco de dados**: SQLite (arquivo local em `server/data/imobiliaria.db`), acessado
  via `better-sqlite3`. Não é necessário instalar nenhum banco externo.
- **Autenticação do admin**: login simples (usuário/senha) validado no backend,
  retornando um token JWT usado para proteger as rotas administrativas.

📄 Para uma explicação completa da arquitetura, do banco de dados, de cada rota da API e
das proteções de segurança, veja [DOCUMENTACAO.md](DOCUMENTACAO.md).

## Como rodar

Pré-requisito: Node.js 18+.

```bash
# 1. Instalar as dependências do client e do server
npm run install:all

# 2. Popular o banco com dados de exemplo (imóveis, pontos de referência e um usuário admin)
npm run seed

# 3. Subir os dois serviços juntos (API na porta 3333, site na porta 5173)
npm run dev
```

Depois disso:

- Site público: http://localhost:5173
- Painel do corretor: http://localhost:5173/admin/login
  - Admin (vê todos os imóveis/visitas, gerencia corretores): `corretor` / `imoveis123`
  - Corretor comum (só os próprios imóveis/visitas): `joao` / `joao123`

Se preferir rodar cada parte separadamente: `npm run dev:server` e `npm run dev:client`.

Variáveis de ambiente (arquivos `.env`, já configurados para desenvolvimento local — veja
`server/.env.example` para a lista completa): `JWT_SECRET`, `CLIENT_ORIGIN` (domínio
liberado no CORS) e `DATABASE_PATH` no server; `VITE_API_URL` no client.

## Funcionalidades

**Site público**
- Listagem de imóveis com filtros (finalidade, tipo, cidade, faixa de preço).
- Card de imóvel com preço, localização, tipo, metragem e o **corretor responsável**.
- Página de detalhes com galeria de fotos, descrição e "o que tem por perto"
  (estação, praça, ponto de ônibus, mercado, escola, hospital, shopping — com distância).
- Botão "Falar com o corretor": o visitante manda nome/telefone/mensagem e é direcionado
  direto para o **WhatsApp** do corretor responsável pelo imóvel, com uma mensagem já
  pronta. Quem marca o dia e horário da visita é o corretor, combinando com o cliente.

**Painel do corretor** (autenticado)
- Visão geral com estatísticas (imóveis cadastrados, disponíveis, reservados,
  vendidos/alugados, visitas pendentes).
- Cadastro de novo imóvel, incluindo pontos de referência próximos.
- Lista de imóveis com alteração rápida de status (disponível, reservado, vendido, alugado).
- Lista de visitas/solicitações de contato enviadas pelo site, com filtro por status
  e atualização (pendente, confirmada, realizada, cancelada).
- Botão "Agendar visita" para o próprio corretor cadastrar uma visita direto pelo painel
  (ex: quando o cliente liga ou combina pessoalmente, sem precisar preencher o site).
- **Dois papéis de acesso**: cada corretor só vê e gerencia os próprios imóveis e as
  visitas relacionadas a eles; um usuário **admin** vê e gerencia tudo, além de poder
  cadastrar novas contas de corretor na tela "Corretores" e decidir qual corretor cuida
  de cada imóvel (na hora de cadastrar ou reatribuindo um imóvel já existente).
