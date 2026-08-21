FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

FROM base AS build
WORKDIR /workspace

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY api/nest/package.json api/nest/package.json
COPY api/nest/prisma api/nest/prisma
COPY packages/shared/package.json packages/shared/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json

RUN pnpm install --frozen-lockfile --prod=false

COPY api/nest api/nest
COPY packages/shared packages/shared
COPY packages/eslint-config packages/eslint-config
COPY packages/typescript-config packages/typescript-config

RUN pnpm --filter @smart-campus/shared build
RUN pnpm --filter api exec prisma generate
RUN pnpm --filter api build
RUN pnpm --filter api --prod deploy /app

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app ./
COPY api/nest/docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
