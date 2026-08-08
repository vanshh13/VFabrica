# VFabrica

**Global B2B textile sourcing marketplace**

VFabrica connects verified fabric suppliers with wholesale buyers on a single platform. Buyers can browse catalogs, compare specifications, manage carts and orders, and get AI-assisted sourcing recommendations—without needing an account to explore products. Suppliers manage listings, inventory, warehouses, and order fulfillment. Administrators oversee users, categories, and supplier verification.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [API overview](#api-overview)
- [Deployment](#deployment)
- [Scripts reference](#scripts-reference)

---

## Features

### Public marketplace

- Marketing homepage with featured products, categories, and supplier highlights
- Fabric catalog with search, filters, sorting, and pagination
- Product detail pages (images, variants, specs, MOQ, supplier info)
- Supplier business listings and profile pages
- Dark / light theme

### Buyers

- Registration, login, and profile onboarding
- Shopping cart and checkout
- Order history, cancellation, and reorder
- Saved addresses
- Favorites / wishlist
- AI shopping assistant (catalog-aware chat and product recommendations)

### Suppliers

- Supplier onboarding and company profile
- Product catalog CRUD with images (Cloudinary)
- Order management and status updates
- Multi-warehouse inventory: stock assignment, adjustments, transfers
- Inventory transaction history

### Administrators

- Platform dashboard and metrics
- User directory and account status
- Supplier approval workflow
- Category and catalog taxonomy management

### Platform capabilities

- JWT access + refresh token authentication with role-based access (Buyer, Supplier, Admin)
- REST API with modular Express architecture
- PostgreSQL data layer (Sequelize + migrations)
- WebSocket server for real-time updates
- Structured logging (Pino)
- CORS and security headers (Helmet)

---

## Tech stack

| Layer | Technologies |
|--------|----------------|
| **Frontend** | React 19, Vite 7, React Router 7, Zustand, Axios, Framer Motion, Lucide React, React Hook Form + Zod |
| **Backend** | Node.js, Express 5, Sequelize 6, PostgreSQL, JWT, bcrypt, WebSocket (`ws`) |
| **Integrations** | Cloudinary (product images), Groq-compatible LLM API (AI assistant) |
| **Hosting (typical)** | Vercel (frontend), Render or similar (API + database) |

---

## Architecture

```text
┌─────────────────┐     HTTPS / REST      ┌──────────────────────────────┐
│  React SPA      │ ◄──────────────────► │  Express API  (/api/*)        │
│  (Vite)         │     WebSocket         │  Modular domain modules       │
└─────────────────┘                       └──────────────┬───────────────┘
                                                         │
                                                         ▼
                                              ┌──────────────────────┐
                                              │  PostgreSQL          │
                                              └──────────────────────┘
```

The backend is organized by domain modules under `backend/src/modules/` (auth, buyer, supplier, admin, products, categories, orders, inventory, ai). Each module follows a layered pattern: routes → controllers → use cases → data access.

The frontend uses client-side routing (`BrowserRouter`). For production on Vercel, `frontend/vercel.json` rewrites all routes to `index.html` so deep links and page refreshes work correctly.

---

## Project structure

```text
VFabrica/
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── components/       # UI, layout, role-specific modules
│   │   ├── pages/            # Route-level pages (buyer, supplier, admin, auth)
│   │   ├── routes/           # AppRouter
│   │   ├── services/         # API clients
│   │   ├── store/            # Zustand stores (auth, cart, favorites, theme)
│   │   └── hooks/
│   ├── vercel.json           # SPA fallback for Vercel
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── modules/          # Feature modules
│   │   ├── middleware/       # Auth, permissions
│   │   ├── routes/           # API router mount
│   │   └── utils/            # Logger, Cloudinary, WebSocket, responses
│   ├── migrations/           # Sequelize migrations
│   ├── models/               # Sequelize instance
│   └── package.json
└── README.md
```

---

## Getting started

### Prerequisites

- **Node.js** 20.19+ (or 22.12+) for the frontend; Node 20+ for the backend
- **PostgreSQL** database
- (Optional) Cloudinary account for image uploads
- (Optional) LLM API key for the AI assistant

### 1. Clone and install

```bash
git clone <repository-url>
cd VFabrica

cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment

Create a `.env` file in the `backend` directory (see [Environment variables](#environment-variables)).

Create `frontend/.env` (or `.env.local`) if the API is not on localhost:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 3. Database migrations

From the `backend` directory, with `DATABASE_URL` set in `.env`:

```bash
npx sequelize-cli db:migrate
```

Migrations live in `backend/migrations/` and use `backend/config/config.json` (PostgreSQL via `DATABASE_URL`). They create users, roles, products, inventory, orders, buyer/supplier profiles, and seed catalog master data.

### 4. Run locally

**Terminal 1 — API**

```bash
cd backend
npm run dev
```

API default: `http://localhost:5000`  
Health check: `http://localhost:5000/health`

**Terminal 2 — Frontend**

```bash
cd frontend
npm run dev
```

App default: `http://localhost:5173`

---

## Environment variables

### Backend (required)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Access token signing secret |
| `JWT_REFRESH_SECRET` | Refresh token signing secret |

### Backend (optional)

| Variable | Description |
|----------|-------------|
| `PORT` | HTTP port (default `5000`) |
| `NODE_ENV` | `development` or `production` |
| `FRONTEND_URL` | Used for redirects in development |
| `CLOUDINARY_URL` | Cloudinary configuration for product images |
| `LLM_API_KEY` | API key for AI chat assistant |
| `LLM_BASE_URL` | LLM provider base URL (defaults to Groq OpenAI-compatible API) |

### Frontend

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend API base URL including `/api` (default `http://localhost:5000/api`) |

---

## API overview

All JSON APIs are mounted under `/api`.

| Prefix | Purpose |
|--------|---------|
| `/api/auth` | Register, login, refresh token, logout, profile |
| `/api/products` | Public product catalog and product details |
| `/api/categories` | Category listing |
| `/api/buyer` | Buyer profile, cart, checkout, orders, favorites, marketplace helpers |
| `/api/supplier` | Supplier profile, products, orders, dashboard |
| `/api/inventory` | Warehouses, stock levels, transfers, transactions |
| `/api/orders` | Order checkout and status (role-protected routes) |
| `/api/admin` | Dashboard, users, supplier approvals, category admin |
| `/api/ai` | AI shopping assistant chat |

Protected routes expect `Authorization: Bearer <accessToken>`. The frontend refreshes expired access tokens automatically when a valid refresh token is present.

---

## Deployment

### Frontend (Vercel)

1. Set the project **Root Directory** to `frontend`.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Set `VITE_API_BASE_URL` to your production API URL (e.g. `https://your-api.onrender.com/api`).
5. Ensure `frontend/vercel.json` is deployed (SPA rewrites for client-side routes).

### Backend

Deploy the `backend` folder to a Node host (e.g. Render). Set all required environment variables and allow your frontend origin in CORS (`backend/src/config/development.js` lists allowed origins; extend for your production domain).

Run migrations on the production database before or as part of release.

---

## Scripts reference

### Frontend (`frontend/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |

### Backend (`backend/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API with hot reload (`tsx watch`) |
| `npm start` | Start API (`node`) |

---

## License

ISC (backend package). See repository or package metadata for full license terms.
