# Coolify Backend Deploy

This guide deploys only `apps/api` with the flow `GitHub Actions -> Docker Hub -> Coolify`.

## Image Strategy

- Shared production tag: `kietphan24/smart-campus-api:v1`
- Immutable traceability tag: `kietphan24/smart-campus-api:sha-<shortsha>`
- Coolify should deploy the shared `v1` tag

## Manual Build and Push

Build from the repository root because the API depends on workspace packages:

```bash
docker build -f apps/api/Dockerfile -t kietphan24/smart-campus-api:v1 .
docker push kietphan24/smart-campus-api:v1
```

## GitHub Actions

Two workflows are expected:

- `API CI`: installs dependencies, runs `pnpm test:api`, and runs `pnpm build:api`
- `API Publish`: builds the Docker image, pushes `v1` and `sha-<shortsha>`, then triggers Coolify with a webhook

Required GitHub repository secrets:

```text
DOCKERHUB_USERNAME
DOCKERHUB_TOKEN
COOLIFY_DEPLOY_WEBHOOK
```

## Coolify Setup

- Create a new service from an existing Docker image
- Image: `kietphan24/smart-campus-api:v1`
- Port: `3000`
- Enable a public domain if the API must be accessible from mobile clients

## Required Environment Variables

Use `apps/api/.env.production.example` as the base template.

Minimum required values:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://<user>:<password>@<server>.postgres.database.azure.com:5432/<database>?sslmode=require
JWT_SECRET=<long-random-secret>
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
CORS_ORIGIN=https://<your-frontend-domain>
APP_BASE_URL=https://<your-api-domain>
REDIS_URL=redis://<host>:6379
IOT_SHARED_SECRET=<secret-if-needed>
```

## Migrations

Do not run migrations in the Docker build step.

The runtime image now runs migrations automatically on container startup with:

```bash
pnpm run db:migrate:prod
```

If migrations fail, the container will fail to start. Check Coolify deployment logs first, then confirm `DATABASE_URL` and Prisma schema access inside the image.
