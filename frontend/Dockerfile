# Imagem da interface da Matriz: build do Vite servido pelo nginx, que encaminha /api para o backend.
# Contexto de build: a raiz do repositório, porque o projeto usa workspaces npm com um só package-lock.json.
#   docker build -f frontend/Dockerfile -t matriz-frontend .
# A interface e a API ficam na mesma origem, para o cookie de sessão funcionar sem CORS (docs/architecture.md, secção 6).

ARG NODE_IMAGEM=node:26.13-alpine

# --- Etapa 1: verificar os tipos e gerar frontend/dist ---
FROM ${NODE_IMAGEM} AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci -w frontend
COPY frontend/ frontend/
RUN npm run build -w frontend

# --- Etapa 2: nginx com os ficheiros estáticos ---
FROM nginx:1.30-alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
