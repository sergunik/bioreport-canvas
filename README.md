# BioReport

Privacy-first medical records platform for managing diagnostic reports and biomarker observations.

## Tech Stack

- **React 18** + **TypeScript**
- **Vite** — build tool
- **Tailwind CSS** + **shadcn/ui** — styling and components
- **React Router v6** — routing with auth guards
- **TanStack React Query** — server state management
- **React Hook Form** + **Zod** — form handling and validation
- **i18next** — internationalization
- **Vitest** + **Testing Library** — testing

## Getting Started

```sh
npm install
npm run dev
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run build:dev` | Development build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run preview` | Preview production build |

## Authentication

The backend uses **JWT via HTTP-only secure cookies** (access + refresh tokens). The frontend relies entirely on cookies for session management — no tokens are stored in `localStorage`.

### Session Persistence

On page reload, the app calls `GET /account` to verify the session. If the access token has expired, the API client automatically attempts a refresh via `POST /auth/refresh`. If both fail, the user is treated as unauthenticated.

### Route Guards

| Route | Type | Guard |
|-------|------|-------|
| `/` | Public | — |
| `/login` | Guest-only | `GuestRoute` |
| `/register` | Guest-only | `GuestRoute` |
| `/forgot-password` | Guest-only | `GuestRoute` |
| `/reset-password` | Guest-only | `GuestRoute` |
| `/account-setup` | Auth + no account | `AccountSetupRoute` |
| `/dashboard` | Protected | `ProtectedRoute` |
| `/diagnostic-reports` | Protected | `ProtectedRoute` |
| `/diagnostic-reports/new` | Protected | `ProtectedRoute` |
| `/settings/*` | Protected | `ProtectedRoute` |
| `*` (404) | Public | — |

- **GuestRoute** — redirects authenticated users to `/dashboard`
- **ProtectedRoute** — redirects unauthenticated users to `/login`, and users without an account to `/account-setup`
- **AccountSetupRoute** — requires authentication but no existing account; redirects to `/dashboard` if setup is completed

## Project Structure

```
src/
├── api/              # API client and service modules
├── components/
│   ├── auth/         # Auth layout, route guards
│   ├── layout/       # Header, footer, page containers
│   └── ui/           # shadcn/ui components
├── contexts/         # React contexts (AuthContext)
├── hooks/            # Custom hooks
├── i18n/             # Internationalization config and locales
├── pages/            # Page components
├── test/             # Test setup
├── types/            # TypeScript type definitions
└── lib/              # Utility functions
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `/api` | Backend API base URL |
