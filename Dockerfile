# syntax=docker/dockerfile:1
# Mỗi module một image (Charter: "đóng gói Docker cho từng module"; deploy độc lập):
#   docker build --target host|chat-remote|progress-remote|personalization-remote|facade -t <tên> .

# ---------- build: biên dịch Host + 3 Remote ----------
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages ./packages
RUN npm ci
COPY . .
RUN npm run poc:build

# ---------- nền cho các image tĩnh (server tĩnh viết tay, không thêm dependency) ----------
FROM node:22-slim AS static-base
WORKDIR /app
ENV NODE_ENV=production
COPY --chown=node:node scripts/poc-serve.cjs scripts/gen-config.cjs ./scripts/
USER node

# ---------- Host: sinh config.json từ biến môi trường rồi phục vụ ----------
FROM static-base AS host
COPY --from=build --chown=node:node /app/apps/host/dist ./apps/host/dist
EXPOSE 3000
CMD ["sh", "-c", "node scripts/gen-config.cjs && node scripts/poc-serve.cjs host=3000"]

FROM static-base AS chat-remote
COPY --from=build --chown=node:node /app/apps/chat-remote/dist ./apps/chat-remote/dist
EXPOSE 3001
CMD ["node", "scripts/poc-serve.cjs", "chat-remote=3001"]

FROM static-base AS progress-remote
COPY --from=build --chown=node:node /app/apps/progress-remote/dist ./apps/progress-remote/dist
EXPOSE 3002
CMD ["node", "scripts/poc-serve.cjs", "progress-remote=3002"]

FROM static-base AS personalization-remote
COPY --from=build --chown=node:node /app/apps/personalization-remote/dist ./apps/personalization-remote/dist
EXPOSE 3003
CMD ["node", "scripts/poc-serve.cjs", "personalization-remote=3003"]

# ---------- Facade: chạy TypeScript trực tiếp (Node 22 strip-types), SQLite có sẵn trong Node ----------
FROM node:22-slim AS facade
WORKDIR /app
ENV NODE_ENV=production PORT=4000 FACADE_DB=/data/facade.db
COPY --chown=node:node packages ./packages
RUN mkdir -p node_modules/@app /data \
 && ln -s ../../packages/shared-types node_modules/@app/shared-types \
 && chown -R node:node /data node_modules
USER node
EXPOSE 4000
VOLUME ["/data"]
CMD ["node", "--experimental-strip-types", "--no-warnings", "packages/ai-service-facade/src/main.ts"]
