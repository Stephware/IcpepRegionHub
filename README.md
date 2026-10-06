# ICpEP Region 3 Hub

ICpEP Region 3 Hub is a centralized platform for ICpEP Region 3 chapters. It is prepared for public announcements, events, chapter information, assistance requests, collaboration workflows, authentication, and an admin portal.

## Technology Stack

- TypeScript
- Next.js, React, and Tailwind CSS for the frontend
- NestJS for the REST API
- Prisma ORM with PostgreSQL
- Jest and Supertest for backend testing
- Vitest for frontend testing
- ESLint and Prettier
- npm workspaces

## Repository Structure

```text
apps/
  web/        Next.js frontend
  api/        NestJS REST API
packages/
  shared/     Shared types and constants for future cross-app use
docs/         Project notes and architecture docs
.github/
  workflows/ CI checks
```

The PostgreSQL and Docker setup is intentionally left untouched.

## Prerequisites

- Node.js 22 or newer
- npm 10 or newer
- Access to the existing PostgreSQL service on `localhost:5432`

## Installation

```bash
npm install
```

## Environment Setup

Copy the backend example environment file and replace placeholder values locally:

```bash
cp apps/api/.env.example apps/api/.env
```

Never commit real secrets or database credentials.

## Development Commands

```bash
npm run dev       # Run web and API together
npm run dev:web   # Run Next.js on http://localhost:3000
npm run dev:api   # Run NestJS on http://localhost:3001
npm run build     # Build all workspaces
npm run lint      # Lint all workspaces
npm run test      # Test all workspaces
```

## Ports

- Frontend: `http://localhost:3000`
- API: `http://localhost:3001`
- PostgreSQL: `localhost:5432`

## Architecture Overview

The frontend uses the Next.js App Router with feature folders and placeholder route pages. The backend is organized by feature modules so controllers stay thin, services contain business logic, and Prisma/database access stays outside controllers. Authentication is not implemented yet, but the API includes role constants for `RegionalAdmin`, `RegionalOfficer`, and `ChapterOfficer` to support future role-based authorization.
