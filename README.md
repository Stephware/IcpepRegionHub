# ICpEP Region 3 Hub

ICpEP Region 3 Hub is a centralized web platform for ICpEP.se Region 3 chapters. It brings regional announcements, events, chapter information, assistance requests, collaboration workflows, account management, and administrative tools into one system.

## Core Modules

- Dashboard
- Announcements
- Calendar & Events
- Chapter Directory
- Request Assistance
- Collaboration Board
- Authentication & Accounts
- Regional Admin Portal

The current V1 intentionally does **not** include Event Attendance or Forms & Files.

## Roles

### Public visitor
Public visitors can access public announcements, published events, and the public chapter directory.

### ChapterOfficer
Chapter officers can:

- Sign in after regional approval
- View the role-based dashboard
- Submit and track assistance requests for their chapter
- Create and manage collaboration posts
- Respond to collaboration opportunities from other chapters
- View member-facing announcements and events

### RegionalOfficer
Regional officers can:

- Use the regional dashboard
- Review and manage chapter assistance requests
- Assign requests
- Post chapter-visible updates
- Add internal notes
- Move requests through the regional support workflow

### RegionalAdmin
Regional admins have Regional Officer capabilities plus the Admin Portal for:

- Account approvals and role management
- Chapter and officer management
- Announcement management
- Event management
- Assistance management
- Collaboration moderation

## Technology Stack

### Frontend

- TypeScript
- Next.js App Router
- React
- Tailwind CSS
- Vitest

### Backend

- TypeScript
- NestJS
- Prisma ORM
- PostgreSQL
- class-validator
- Jest
- Supertest

### Development & CI

- npm workspaces
- ESLint
- Prettier
- GitHub Actions

## Repository Structure

```text
apps/
  web/                    Next.js frontend
  api/                    NestJS REST API
packages/
  shared/                 Shared package for cross-app code
docs/                     Project documentation
.github/
  workflows/              GitHub Actions CI
```

The database and Docker environment are managed separately from the application scaffold and are not recreated automatically by this repository.

## Prerequisites

- Node.js 22+
- npm 10+
- PostgreSQL
- Existing ICpEP Region 3 Hub database configured through `DATABASE_URL`

## Installation

From the repository root:

```bash
npm install
```

## Environment Setup

Copy the API environment template:

```bash
cp apps/api/.env.example apps/api/.env
```

Example values:

```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/IcpepRegionHub?schema=public"
JWT_SECRET="CHANGE_ME_USE_AT_LEAST_32_RANDOM_CHARACTERS"
PORT=3001
FRONTEND_URL="http://localhost:3000"
NODE_ENV="development"
```

Replace `JWT_SECRET` with a random secret of at least 32 characters before using authentication.

For the frontend, the API base URL defaults to:

```text
http://localhost:3001/api
```

To override it, set:

```env
NEXT_PUBLIC_API_BASE_URL="http://localhost:3001/api"
```

## Development Commands

```bash
npm run dev
```

Runs the frontend and API together.

Individual applications:

```bash
npm run dev:web
npm run dev:api
```

Default local ports:

- Frontend: `http://localhost:3000`
- API: `http://localhost:3001`
- PostgreSQL: typically `localhost:5432`

## Quality Checks

Run the same main checks used by CI:

```bash
npm run lint
npm run test
npm run test:e2e
npm run build
```

### Test coverage areas

Current automated tests cover important behavior across:

- Account approval and administration
- Authentication and authorization
- Session token validation
- Role guards
- Chapter management
- Announcements
- Events
- Assistance request submission and management
- Collaboration posts and responses
- Collaboration moderation
- Dashboard helpers
- Frontend permissions and formatting
- API client behavior
- Selected API end-to-end routes

## Authentication

Authentication uses a signed server-issued session token stored in an HttpOnly cookie.

The session cookie uses:

- `HttpOnly`
- `SameSite=Lax`
- `Secure` in production
- An 8-hour maximum age

The API also accepts a Bearer token for guarded requests where needed.

Passwords are stored using Node.js `scrypt` with a random salt. Plaintext passwords are never stored.

## Authorization

Backend authorization is enforced using NestJS guards. Frontend route protection improves the user experience, but backend role checks remain the authoritative security boundary.

Main application roles:

```text
ChapterOfficer
RegionalOfficer
RegionalAdmin
```

## Main Routes

### Public

```text
/
/announcements
/events
/chapters
```

### Authenticated

```text
/dashboard
/collaborations
```

Chapter Officer:

```text
/assistance
```

Regional Officer / Regional Admin:

```text
/regional/assistance
```

Regional Admin:

```text
/admin
/admin/accounts
/admin/chapters
/admin/announcements
/admin/events
/admin/assistance
/admin/collaborations
```

## API Prefix

All backend routes use:

```text
/api
```

Example:

```text
POST /api/auth/login
GET  /api/auth/me
```

## Security Notes

The current application includes:

- DTO validation with unknown-field rejection
- Role-based authorization guards
- HttpOnly authentication cookies
- Secure-cookie support in production
- Strong-secret validation
- Password hashing with `scrypt`
- CORS restricted to the configured frontend origin
- Disabled Express `X-Powered-By` header
- Frontend security headers
- Protected internal assistance notes
- Ownership checks for chapter collaboration management

Before production deployment, configure real secrets, HTTPS, production database access, logging, monitoring, backups, and hosting-specific security settings.

## CI

GitHub Actions runs on pushes to `main` and pull requests. The CI pipeline performs:

1. Dependency installation
2. High/critical production-runtime dependency audit
3. Linting
4. Unit tests
5. API end-to-end tests
6. Production builds

## Development Status

Groups 1–14 of the planned V1 implementation cover the core application, UI cleanup, automated testing, and application hardening.

Production deployment and hosting configuration are handled in the final deployment phase.
