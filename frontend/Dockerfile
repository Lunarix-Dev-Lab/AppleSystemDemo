FROM node:20-alpine AS build

WORKDIR /app

COPY package.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# ─── Runtime ──────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

WORKDIR /app

COPY --from=build /app/dist/frontend ./dist/frontend

EXPOSE 4000
ENV PORT=4000

CMD ["node", "dist/frontend/server/server.mjs"]
