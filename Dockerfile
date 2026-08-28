# syntax=docker/dockerfile:1.7
ARG NODE_VERSION=26-alpine
ARG PNPM_VERSION=9

FROM node:${NODE_VERSION} AS deps
ARG PNPM_VERSION
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml .npmrc* ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

FROM node:${NODE_VERSION} AS builder
ARG PNPM_VERSION
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM node:${NODE_VERSION} AS runner
ARG PNPM_VERSION
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV CINESTUDIO_DATA_DIR=/data
ENV CINESTUDIO_ARTIFACT_DIR=/artifacts

RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate \
 && addgroup -g 1001 -S cinestudio \
 && adduser -S -u 1001 -G cinestudio cinestudio \
 && mkdir -p /data /artifacts \
 && chown -R cinestudio:cinestudio /data /artifacts

COPY --from=builder --chown=cinestudio:cinestudio /app/public ./public
COPY --from=builder --chown=cinestudio:cinestudio /app/.next/standalone ./
COPY --from=builder --chown=cinestudio:cinestudio /app/.next/static ./.next/static
COPY --from=builder --chown=cinestudio:cinestudio /app/node_modules/@strands-agents ./node_modules/@strands-agents
COPY --from=builder --chown=cinestudio:cinestudio /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY --from=builder --chown=cinestudio:cinestudio /app/scripts ./scripts

USER cinestudio
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q -O - http://127.0.0.1:3000/api/healthz || exit 1

CMD ["node", "server.js"]
