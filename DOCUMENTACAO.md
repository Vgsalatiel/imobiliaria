# Lar&Chave — Documentação do Sistema

Este documento explica como o site/sistema funciona por dentro: arquitetura, banco de
dados, API, autenticação, segurança e o papel de cada arquivo do código. É voltado para
quem vai continuar desenvolvendo, revisar o código ou decidir como colocar o sistema no ar.

---

## 1. Visão geral

O projeto tem duas partes independentes que conversam por HTTP:

```
projeto/
├── client/   → site (React + TypeScript), o que o visitante e o corretor veem no navegador
└── server/   → API (Node + Express + TypeScript), guarda os dados e as regras de negócio
```

- O **client** não acessa o banco de dados diretamente — ele sempre passa pela API do
  **server** usando `fetch`/`axios`.
- O **server** é quem fala com o banco de dados (PostgreSQL) e é o único lugar que sabe a
  senha do banco, o segredo de autenticação (JWT), etc.
- Os dois rodam como processos separados: o client na porta `5173` (servidor de
  desenvolvimento do Vite) e o server na porta `3333`.

### Por que separado em dois projetos?

Essa separação (front-end / back-end) é o padrão mais comum para esse tipo de site
porque:
- O site público (quem vê os imóveis) não precisa de nenhuma senha nem lógica sensível —
  só precisa consumir dados.
- O painel do corretor precisa de autenticação e de regras (quem pode mudar o quê).
- Colocar tudo isso na API, e não no navegador, impede que qualquer pessoa abra o
  "código-fonte" do site (o navegador sempre permite isso) e veja como criar/editar
  imóveis sem permissão.

---

## 2. Como os dados fluem (visão de 30 segundos)

```
Visitante no navegador
   │
   │  1. Abre o site → React (client) pede a lista de imóveis
   ▼
GET /api/properties  ──────────────►  server (Express)
                                         │
                                         │ 2. Consulta o banco PostgreSQL
                                         ▼
                                    banco Postgres (DATABASE_URL)
                                         │
                                         │ 3. Devolve os imóveis em JSON
   ◄─────────────────────────────────────┘
   │
   │ 4. React desenha os cards na tela
   ▼
Visitante vê os imóveis
```

Para o painel do corretor, o mesmo fluxo acontece, mas cada requisição de
criar/editar/apagar imóvel ou mudar status de visita **precisa enviar um token** (explicado
na seção de autenticação) — sem o token, a API responde `401` e recusa a operação.

---

## 3. Banco de dados

### 3.1 Onde ele fica

É um banco **PostgreSQL**, apontado pela variável de ambiente `DATABASE_URL` (string de
conexão no formato `postgres://usuario:senha@host:porta/banco`). O server se conecta a
ele com um *connection pool* (`server/src/db/connection.ts`, usando o driver `pg`), cria
as tabelas automaticamente se não existirem (`server/src/db/schema.ts`) e os dados de
exemplo são inseridos por `npm run seed`. Localmente isso pode ser um Postgres instalado
na própria máquina; em produção, um serviço gerenciado como Neon ou Supabase (grátis,
veja seção 9) — o código não muda entre os dois casos, só a `DATABASE_URL`.

### 3.2 Tabelas

**`properties`** — cada linha é um imóvel.

| Coluna | Tipo | Descrição |
|---|---|---|
| id | inteiro | identificador único |
| title, description | texto | título e descrição do anúncio |
| price | número | preço (venda) ou valor mensal (aluguel) |
| purpose | `venda` \| `aluguel` | finalidade do anúncio |
| status | `disponivel` \| `reservado` \| `vendido` \| `alugado` | situação atual |
| type | `apartamento` \| `casa` \| `cobertura` \| `terreno` \| `comercial` | tipo do imóvel |
| bedrooms, bathrooms, parkingSpots | inteiro | quartos, banheiros, vagas |
| areaM2 | número | área em m² |
| neighborhood, city, state, addressLine | texto | localização |
| coverImage | texto (URL) | imagem principal do card |
| images | texto (JSON) | lista de URLs da galeria, guardada como texto JSON dentro da coluna |
| corretorId | inteiro (FK) | qual corretor (`admin_users`) é o responsável por este imóvel |
| createdAt | data/hora (`timestamptz`) | data de cadastro |

> Toda vez que um imóvel é buscado (no site público ou no painel), a API já junta
> (`LEFT JOIN`) o nome e o WhatsApp do corretor responsável (`corretorName`,
> `corretorWhatsapp`) — são esses dois campos "virtuais" que aparecem no card do
> site e na página de detalhes, mesmo não sendo colunas de `properties`.

**`nearby_places`** — pontos de referência de cada imóvel (1 imóvel → várias linhas).

| Coluna | Descrição |
|---|---|
| propertyId | a qual imóvel pertence |
| type | `estacao`, `ponto_onibus`, `praca`, `mercado`, `escola`, `hospital`, `shopping` |
| name | nome do local (ex: "Praça da Savassi") |
| distanceMeters | distância em metros até o imóvel |

**`visit_requests`** — cada vez que alguém clica em "Falar com o corretor" e envia o
formulário (ou o próprio corretor agenda pelo painel), nasce uma linha aqui. É o
registro interno do lead/visita, independente do WhatsApp (veja seção 5.2).

| Coluna | Descrição |
|---|---|
| propertyId | imóvel de interesse |
| name, phone, email, message | dados de contato preenchidos pelo visitante (ou pelo corretor, se ele mesmo agendou) |
| preferredDate | data/hora da visita — só é preenchida quando o **corretor** agenda pelo painel; o visitante do site não escolhe data (veja seção 5.2) |
| status | `pendente` \| `confirmada` \| `realizada` \| `cancelada` — controlado pelo corretor |
| createdAt | quando a solicitação chegou |

**`admin_users`** — quem pode entrar no painel do corretor.

| Coluna | Descrição |
|---|---|
| username | login |
| passwordHash | senha **nunca** salva em texto puro — só o hash gerado pelo bcrypt |
| name | nome exibido no painel ("Olá, Ana Corretora") e no site público ("Corretor responsável") |
| role | `admin` \| `corretor` — controla o que a pessoa pode ver e fazer (veja seção 5.1) |
| whatsapp | número de WhatsApp do corretor (só dígitos, com DDI+DDD, ex: `5531999998888`) — para onde vai a mensagem do botão "Falar com o corretor" |

O código que cria essas tabelas está em `server/src/db/schema.ts`, e os dados de
exemplo (15 imóveis, pontos de referência, o usuário admin `corretor` e o corretor de
demonstração `joao`) vêm de `server/src/db/seed.ts`.

### 3.3 Acesso ao banco no código

Cada tabela tem um "repositório" — um arquivo que concentra todo o SQL daquela tabela,
para o resto do código nunca escrever SQL solto:

- `server/src/db/propertiesRepository.ts` — listar, buscar, criar, atualizar e apagar imóveis (e seus pontos de referência).
- `server/src/db/visitsRepository.ts` — criar solicitações de contato/visita e listar/atualizar status.

---

## 4. A API (o que o server oferece)

Todas as rotas começam com `/api`. Body e resposta são sempre JSON.

### Rotas públicas (não precisam de login)

| Método | Rota | Para que serve |
|---|---|---|
| GET | `/api/health` | Verificação simples de que o servidor está de pé |
| GET | `/api/properties` | Lista imóveis **disponíveis**. Aceita filtros via query string: `purpose`, `type`, `city`, `minPrice`, `maxPrice` |
| GET | `/api/properties/:id` | Detalhe de um imóvel, já incluindo os pontos de referência |
| POST | `/api/properties/:id/contato` | Envia o formulário "Falar com o corretor" (cria uma linha em `visit_requests`; não recebe data — quem agenda o dia é o corretor, veja seção 5.2) |
| POST | `/api/auth/login` | Login do corretor — recebe `username`/`password`, devolve um token |

### Rotas do painel (exigem token de autenticação)

Um corretor comum só vê/mexe nos próprios imóveis e visitas; o admin vê e mexe em tudo
(veja seção 5.1).

| Método | Rota | Para que serve |
|---|---|---|
| GET | `/api/properties/admin/todos` | Lista os imóveis do corretor logado (ou **todos**, se for admin), de qualquer status |
| POST | `/api/properties` | Cadastra um novo imóvel. O dono (`corretorId`) é sempre quem está logado — **exceto** se for admin, que pode escolher para qual corretor da equipe o imóvel vai |
| PATCH | `/api/properties/:id` | Atualiza campos de um imóvel (inclusive o status). `403` se não for admin nem o dono. Só o admin pode trocar o `corretorId` (reatribuir o imóvel para outro corretor) |
| DELETE | `/api/properties/:id` | Remove um imóvel. `403` se não for admin nem o dono |
| GET | `/api/visits` | Lista as solicitações de visita/contato dos imóveis do corretor logado (ou todas, se admin) |
| POST | `/api/visits` | O próprio corretor agenda uma visita direto pelo painel (sem o cliente precisar preencher o site). `403` se o imóvel não for dele (e ele não for admin) |
| PATCH | `/api/visits/:id` | Muda o status de uma solicitação. `403` se o imóvel não for do corretor logado (e ele não for admin) |
| GET | `/api/auth/corretores` | **Somente admin.** Lista todos os corretores e quantos imóveis cada um tem |
| POST | `/api/auth/corretores` | **Somente admin.** Cria um novo corretor (username, password, name) |

Cada arquivo de rota faz três coisas, nessa ordem: (1) checa se precisa de login
(`requireAuth`) e, quando é o caso, se precisa ser admin (`requireAdmin`), (2) valida o
formato dos dados recebidos (`validateBody`), (3) chama o repositório correspondente. Os
arquivos são:

- `server/src/routes/auth.ts`
- `server/src/routes/properties.ts`
- `server/src/routes/visits.ts`

---

## 5. Autenticação (como o painel sabe quem é o corretor)

1. O corretor digita usuário/senha na tela de login (`client/src/pages/admin/LoginPage.tsx`).
2. O client manda isso para `POST /api/auth/login`.
3. O server busca o usuário no banco, confere a senha com `bcrypt.compareSync` (compara o
   hash, nunca a senha em texto puro) e, se bater, gera um **token JWT** assinado com um
   segredo (`JWT_SECRET`) que só o servidor conhece. O token expira em 12 horas.
4. O client guarda esse token no `localStorage` do navegador (`client/src/api/http.ts` e
   `client/src/context/AuthContext.tsx`) e passa a enviá-lo em toda requisição ao painel,
   no cabeçalho `Authorization: Bearer <token>`.
5. No server, o middleware `requireAuth` (`server/src/middleware/auth.ts`) confere esse
   token em toda rota administrativa. Se estiver ausente, inválido ou expirado, a resposta
   é `401` e a operação é recusada — mesmo que alguém tente chamar a API diretamente
   (sem passar pelo site).

No client, o componente `RequireAuth` (`client/src/routes/RequireAuth.tsx`) impede que a
tela do painel apareça sem estar logado, redirecionando para `/admin/login`.

### 5.1 Papéis: admin vs corretor

Cada conta em `admin_users` tem um `role`: `admin` ou `corretor`.

- **Corretor comum**: só enxerga e só pode editar/apagar os **próprios** imóveis (o campo
  `properties.corretorId` marca o dono). As visitas/contatos que ele vê são só as dos
  imóveis dele. Não vê o menu "Corretores" no painel.
- **Admin**: enxerga e pode mexer em **qualquer** imóvel e visita de **qualquer**
  corretor, é o único que pode cadastrar novas contas de corretor (tela
  `client/src/pages/admin/CorretoresPage.tsx`, rota `/admin/corretores`), e é quem
  decide qual corretor cuida de cada imóvel: escolhe o responsável ao cadastrar um
  imóvel novo (`client/src/pages/admin/NewPropertyPage.tsx`) e pode reatribuir
  imóveis já existentes a qualquer momento direto na lista de imóveis
  (`client/src/pages/admin/PropertiesAdminPage.tsx`, coluna "Responsável"). Um
  corretor comum nunca escolhe isso — todo imóvel que ele cadastra fica
  automaticamente com ele mesmo.

Isso é garantido em duas camadas:

1. **Servidor** (a que realmente importa): o token JWT carrega o `id` e o `role` de quem
   está logado. As rotas de imóveis/visitas (`server/src/routes/properties.ts`,
   `server/src/routes/visits.ts`) filtram por `corretorId` sempre que quem está logado não
   é admin, e devolvem `403 Forbidden` se um corretor tentar editar/apagar um imóvel ou
   mudar o status de uma visita que não é dele. As rotas de gestão de corretores
   (`server/src/routes/auth.ts`) usam o middleware `requireAdmin`
   (`server/src/middleware/auth.ts`), que bloqueia quem não for admin com `403`.
2. **Cliente** (só para experiência de uso, não é proteção real): o menu "Corretores" só
   aparece para quem é admin, e a rota `/admin/corretores` é protegida por
   `client/src/routes/RequireAdmin.tsx`, que redireciona quem não é admin de volta para o
   painel. Isso evita confusão na interface, mas quem realmente impede o acesso indevido
   é sempre o servidor.

Contas de exemplo criadas pelo seed: `corretor` / `imoveis123` (admin) e `joao` / `joao123`
(corretor, dono de parte dos imóveis de exemplo — bom para testar a diferença entre os
dois papéis).

### 5.2 Contato via WhatsApp e agendamento da visita

O card e a página de detalhes do imóvel mostram o **corretor responsável**
(`client/src/components/property/PropertyCard.tsx` e
`client/src/pages/public/PropertyDetailPage.tsx`). O botão "Falar com o corretor" segue
este fluxo (`client/src/components/property/ContactBrokerForm.tsx`):

1. O visitante preenche nome, telefone e uma mensagem opcional (**sem escolher data** —
   quem marca o dia e horário da visita é sempre o corretor, depois de falar com o
   cliente).
2. O front-end faz duas coisas ao enviar:
   - `POST /api/properties/:id/contato`: grava o lead em `visit_requests` (assim ele
     aparece na tela "Visitas agendadas" do corretor, com status `pendente`, mesmo que a
     conversa role só pelo WhatsApp).
   - Abre `https://wa.me/<whatsapp do corretor>?text=...`
     (`client/src/utils/whatsapp.ts`) em uma nova aba, com uma mensagem já preenchida
     contendo o nome do visitante, o título do imóvel e o bairro/cidade.
3. Se o corretor não tiver WhatsApp cadastrado (`corretorWhatsapp` vazio), o formulário
   só grava o lead no sistema — sem tentar abrir o WhatsApp.
4. Depois de combinar tudo pelo WhatsApp, o corretor volta ao painel (tela "Visitas
   agendadas") e usa o botão **"Agendar visita"** para registrar a data combinada e
   marcar o status como confirmada — isso é feito por `POST /api/visits`, que também
   respeita a regra de dono: um corretor só agenda visita para os próprios imóveis
   (`403` caso contrário; admin agenda para qualquer um).

---

## 6. Segurança — o que foi corrigido e por quê

Esta seção documenta as proteções que existem hoje no código (algumas foram corrigidas
recentemente após uma revisão de segurança).

### 6.1 Injeção de SQL (corrigido)

**O problema:** a rota de editar imóvel (`PATCH /api/properties/:id`) repassava o corpo
da requisição inteiro para dentro de uma query SQL, usando as **chaves do JSON como nomes
de coluna** sem checar quais eram permitidas. Isso permitiria, em teoria, que alguém
autenticado enviasse um corpo malicioso e manipulasse a query.

**A correção (`server/src/db/propertiesRepository.ts`):** agora existe uma lista fixa
(`UPDATABLE_PROPERTY_FIELDS`) com os únicos nomes de coluna que a função `updateProperty`
aceita. Qualquer chave fora dessa lista é simplesmente ignorada — nunca chega a virar
texto de SQL.

**Camada extra (`server/src/validation/schemas.ts`):** antes mesmo de chegar no banco, o
corpo da requisição passa por um schema do Zod que só aceita os campos esperados, com os
tipos e limites certos (ex: preço não pode ser negativo, UF tem no máximo 2 caracteres).
Campos desconhecidos são descartados automaticamente pelo Zod.

### 6.2 Validação de entrada (adicionado)

Todas as rotas que recebem dados do usuário (`POST`/`PATCH`) agora passam pelo middleware
`validateBody` (`server/src/middleware/validate.ts`), que aplica um schema do Zod
(`server/src/validation/schemas.ts`) antes de qualquer outra coisa acontecer. Se os dados
não baterem com o formato esperado, a API responde `400` com detalhes do que está errado,
e o código de negócio nem chega a rodar.

Isso cobre: cadastro de imóvel, edição de imóvel, formulário de contato/visita, mudança
de status de visita e login.

### 6.3 Força bruta no login (adicionado)

`server/src/middleware/rateLimit.ts` limita tentativas de login a 8 por IP a cada 15
minutos (`loginRateLimiter`), e o formulário de contato público a 20 por hora por IP
(`contactRateLimiter`, para evitar spam de solicitações de visita). Depois do limite, a
API responde `429 Too Many Requests`.

### 6.4 CORS (restringido)

Antes, a API aceitava requisições de **qualquer** site (`cors()` sem restrição). Agora
(`server/src/index.ts`), só o domínio configurado em `CLIENT_ORIGIN` (no `.env`) recebe o
cabeçalho de autorização do CORS — os navegadores dos usuários bloqueiam chamadas feitas
por JavaScript de qualquer outro domínio.

### 6.5 Segredo do token (JWT_SECRET)

- O valor de exemplo (`troque-este-segredo-em-producao`) foi trocado por um segredo forte
  gerado aleatoriamente (`openssl rand -hex 32`), guardado só no `.env` (que nunca vai pro
  git — veja `.gitignore`).
- `server/src/middleware/auth.ts` tem uma função (`assertStrongJwtSecret`) que roda ao
  iniciar o servidor: se o `JWT_SECRET` for curto demais ou for um dos valores de exemplo
  conhecidos, o servidor **recusa iniciar** quando `NODE_ENV=production` (evita subir para
  produção com um segredo fraco por descuido) — em desenvolvimento, só avisa no console.

### 6.6 Cabeçalhos de segurança (adicionado)

`helmet()` foi adicionado em `server/src/index.ts` — define automaticamente vários
cabeçalhos HTTP recomendados (ex: `X-Content-Type-Options`, `X-Frame-Options`,
`Strict-Transport-Security`) que dificultam ataques comuns como clickjacking e MIME
sniffing.

### 6.7 Tamanho do corpo da requisição

`express.json({ limit: "200kb" })` evita que alguém mande um corpo de requisição enorme
para tentar sobrecarregar o servidor. Corpos inválidos ou grandes demais recebem uma
resposta `400` limpa (em vez de travar o servidor).

### 6.8 O que já estava correto desde o início

- Senhas sempre com hash `bcrypt`, nunca texto puro.
- A maioria das queries já usava parâmetros posicionais (`$1`, `$2`, ...) do driver `pg`,
  que impedem injeção de SQL nos **valores** — o problema era especificamente nos **nomes
  de coluna** dinâmicos, que a correção da seção 6.1 resolveu.
- Rotas administrativas sempre atrás de `requireAuth`.

### 6.9 O que ainda vale considerar antes de produção

- **HTTPS**: hoje o servidor roda em HTTP puro (normal em desenvolvimento). Em produção,
  o tráfego precisa ser criptografado — geralmente isso é responsabilidade da hospedagem
  (Render, Fly.io, Vercel, um proxy Nginx com Certbot, etc.), não do código Node em si.
- **Backups do banco**: bancos gerenciados gratuitos como Neon e Supabase (veja seção 9)
  já fazem backup automático/point-in-time por conta própria; para um Postgres próprio,
  o backup padrão é `pg_dump` agendado periodicamente.
- **Monitoramento/logs**: não há hoje nenhum registro de tentativas suspeitas além do que
  o rate limiter já bloqueia. Para um site com mais tráfego, vale adicionar um serviço de
  logs (ex: Sentry, Logtail).

---

## 7. Estrutura de pastas

### 7.1 `server/` (API)

```
server/
├── .env                  → segredos e configuração local (NÃO vai pro git)
├── .env.example          → modelo do .env, sem valores reais
└── src/
    ├── index.ts          → ponto de entrada: monta o Express, aplica os middlewares
    │                        globais (helmet, cors, json) e registra as rotas
    ├── types/index.ts    → tipos TypeScript compartilhados (Property, VisitRequest...)
    ├── validation/
    │   └── schemas.ts    → schemas do Zod usados para validar corpos de requisição
    ├── middleware/
    │   ├── auth.ts       → checa o token JWT (requireAuth), exige admin (requireAdmin)
    │   │                    e valida a força do segredo
    │   ├── validate.ts   → aplica um schema do Zod no corpo da requisição
    │   └── rateLimit.ts  → limites de tentativas (login e formulário de contato)
    ├── routes/
    │   ├── auth.ts       → login e gestão de corretores (listar/criar, só admin)
    │   ├── properties.ts → rotas de imóveis (públicas e administrativas, com dono/corretorId)
    │   └── visits.ts     → rotas de visitas/contato (administrativas, filtradas por dono)
    └── db/
        ├── connection.ts           → abre o connection pool do Postgres (DATABASE_URL)
        ├── schema.ts               → cria as tabelas se não existirem
        ├── seed.ts                 → popula o banco com dados de exemplo
        ├── propertiesRepository.ts → todo o SQL de imóveis e pontos de referência
        └── visitsRepository.ts     → todo o SQL de solicitações de visita
```

### 7.2 `client/` (site)

```
client/
├── .env                  → URL da API (VITE_API_URL)
├── public/
│   └── videos/           → vídeo de fundo do hero da home (ver nota abaixo)
└── src/
    ├── main.tsx          → ponto de entrada do React
    ├── App.tsx           → define todas as rotas do site (público + admin)
    ├── types/index.ts    → mesmos tipos de dados usados no server (Property, etc.)
    ├── styles/
    │   ├── variables.css → paleta de cores, fontes, sombras (tema do site inteiro)
    │   └── global.css    → estilos base e classes reutilizáveis (.btn, .card-surface...)
    ├── api/               → funções que chamam a API (uma por área: auth, properties, visits)
    ├── context/
    │   └── AuthContext.tsx → guarda se o corretor está logado, o token e o papel (role)
    ├── routes/
    │   ├── RequireAuth.tsx  → bloqueia acesso ao painel sem login
    │   └── RequireAdmin.tsx → bloqueia acesso a telas de admin para quem não é admin
    ├── components/
    │   ├── layout/        → cabeçalho, rodapé e menu lateral do painel (menu varia por papel)
    │   ├── property/      → card de imóvel, filtros, lista de pontos próximos, formulário de
    │   │                     contato (site público) e de agendamento de visita (painel)
    │   └── common/        → Modal (janela flutuante reutilizável)
    ├── pages/
    │   ├── public/         → HomePage (listagem) e PropertyDetailPage (detalhe do imóvel)
    │   └── admin/          → Login, Dashboard, imóveis, novo imóvel, visitas, Corretores (só admin)
    └── utils/
        └── format.ts       → formata preço, distância, datas e traduz os "enums" para português
```

> **Vídeo de fundo do hero:** `client/public/videos/hero-neighborhood.mp4` (com
> `hero-neighborhood-poster.jpg` como capa exibida antes do vídeo carregar) é usado em
> `HomePage.tsx` como fundo da seção principal da home, com um degradê branco por cima
> para manter o texto legível. É um vídeo aéreo de bairro (Pexels, licença gratuita),
> já cortado para ~9 segundos, sem áudio e comprimido para ~2MB — pesado o suficiente
> para não travar o carregamento do site. Para trocar por outro vídeo, basta substituir
> esses dois arquivos mantendo os mesmos nomes (ou atualizar os caminhos em
> `HomePage.tsx`). Quem tem a preferência do sistema por "reduzir movimento" ativada não
> vê o vídeo — cai automaticamente no fundo claro estático de antes.

---

## 8. Rodando localmente

```bash
npm run install:all   # instala as dependências do client e do server
npm run seed          # cria o banco e popula com dados de exemplo
npm run dev            # sobe a API (porta 3333) e o site (porta 5173) juntos
```

- Site: http://localhost:5173
- Painel do corretor: http://localhost:5173/admin/login
  - Admin (vê tudo, gerencia corretores): usuário `corretor`, senha `imoveis123`
  - Corretor comum (só os próprios imóveis): usuário `joao`, senha `joao123`

Variáveis de ambiente (arquivos `.env`, nunca comitados no git):

| Onde | Variável | Para que serve |
|---|---|---|
| `server/.env` | `PORT` | porta da API (padrão 3333) |
| `server/.env` | `JWT_SECRET` | segredo usado para assinar os tokens de login |
| `server/.env` | `DATABASE_URL` | string de conexão do PostgreSQL (`postgres://usuario:senha@host:porta/banco`) |
| `server/.env` | `CLIENT_ORIGIN` | domínio do site que pode chamar a API (CORS) |
| `client/.env` | `VITE_API_URL` | endereço da API que o site deve chamar |

Para rodar localmente é preciso ter um PostgreSQL rodando e criar o banco antes do
primeiro `npm run seed`, por exemplo:

```bash
sudo -u postgres createuser -s imobiliaria
sudo -u postgres psql -c "ALTER USER imobiliaria WITH PASSWORD 'imobiliaria_dev_pw';"
createdb -U imobiliaria -h localhost imobiliaria_test
# DATABASE_URL correspondente:
# postgres://imobiliaria:imobiliaria_dev_pw@localhost:5432/imobiliaria_test
```

---

## 9. Colocando no ar de graça (produção durável)

O banco já é PostgreSQL (seção 3), então dados **persistem de verdade** entre deploys —
diferente do SQLite antigo, que sumia toda vez que o container do host gratuito era
recriado do zero. Um caminho comum e 100% gratuito para esse projeto:

| Peça | Onde hospedar de graça | O que configurar lá |
|---|---|---|
| Banco Postgres | [Neon](https://neon.tech) ou [Supabase](https://supabase.com) | criar um projeto, copiar a *connection string* e usar como `DATABASE_URL` |
| API (`server/`) | [Render](https://render.com), Fly.io ou Railway | `DATABASE_URL`, `JWT_SECRET` (forte, gerado com `openssl rand -hex 32`), `CLIENT_ORIGIN` (domínio do site publicado), `NODE_ENV=production`; comando de start: `npm run build && npm start` |
| Site (`client/`) | [Vercel](https://vercel.com) ou [Netlify](https://netlify.com) | `VITE_API_URL` apontando para a URL pública da API; comando de build: `npm run build`, pasta de saída: `dist` |

Passos gerais:

1. Criar o banco no Neon/Supabase e rodar `npm run seed` uma vez apontando `DATABASE_URL`
   para essa string de conexão (localmente, ou via um shell temporário na hospedagem da
   API) — isso cria as tabelas (`migrate()` roda sozinho ao iniciar o server) e os dados
   de exemplo.
2. Publicar `server/` no Render/Fly/Railway com as variáveis de ambiente da tabela acima.
   Como o Postgres é gerenciado e externo, **não precisa de disco persistente** — o
   próprio banco garante isso.
3. Publicar `client/` no Vercel/Netlify apontando `VITE_API_URL` para a URL pública da
   API publicada no passo 2.
4. Testar o fluxo completo (site → contato → WhatsApp → painel → login) contra as URLs
   de produção antes de divulgar.

Outros pontos:

- **HTTPS**: obrigatório para não trafegar login/token em texto puro. Todas as
  hospedagens da tabela acima já entregam isso automaticamente, sem configuração extra.
- **Variáveis de ambiente**: `JWT_SECRET` e `CLIENT_ORIGIN` de produção devem ser
  configurados direto no painel da hospedagem (nunca reaproveitar o `.env` de
  desenvolvimento, e nunca reaproveitar a senha de banco local).
- **Neon/Supabase no plano grátis**: o banco pode "hibernar" após um tempo sem uso e
  levar alguns segundos para acordar na próxima requisição — normal no tier gratuito, não
  é um bug.
