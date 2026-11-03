FROM node:22-bookworm AS build
WORKDIR /app
COPY package.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
COPY packages/care-engine/package.json packages/care-engine/
COPY packages/garden-engine/package.json packages/garden-engine/
COPY packages/bonsai-engine/package.json packages/bonsai-engine/
RUN npm install
COPY . .
RUN npm run build -w @hortis/shared \
 && npm run build -w @hortis/care-engine \
 && npm run build -w @hortis/garden-engine \
 && npm run build -w @hortis/bonsai-engine \
 && npm run build -w @hortis/web \
 && npm run build -w @hortis/api

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
ENV HORTIS_PORT=8787
ENV HORTIS_HOST=0.0.0.0
ENV HORTIS_DB_PATH=/data/hortis.db
ENV HORTIS_UPLOAD_DIR=/data/uploads
ENV HORTIS_CORS_ORIGIN=*
COPY --from=build /app /app
RUN mkdir -p /data/uploads
WORKDIR /app/apps/api
EXPOSE 8787
CMD ["node", "--experimental-sqlite", "dist/index.js"]
