# ===== Etapa 1: build =====
FROM node:20-alpine AS build

WORKDIR /app
ENV NG_CLI_ANALYTICS=false

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx ng build --configuration production

# ===== Etapa 2: runtime =====
FROM nginxinc/nginx-unprivileged:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/investai-frontend/browser /usr/share/nginx/html

EXPOSE 8080
