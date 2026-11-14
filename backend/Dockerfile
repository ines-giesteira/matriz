# Imagem do backend da Matriz: API Express com SQLite (node:sqlite).
# Contexto de build: a raiz do repositório, porque o projeto usa workspaces npm com um só package-lock.json.
#   docker build -f backend/Dockerfile -t matriz-backend .
# Sem credenciais: a configuração chega por variáveis de ambiente ao arrancar o container.

ARG NODE_IMAGEM=node:26.13-alpine

# --- Etapa 1: compilar o TypeScript para backend/dist ---
FROM ${NODE_IMAGEM} AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci -w backend
COPY backend/ backend/
RUN npm run build -w backend

# --- Etapa 2: imagem final, só com as dependências de produção ---
FROM ${NODE_IMAGEM}
# Qualquer valor diferente de "development" conta como produção: cookie Secure e seed recusado (RV-37, P37).
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci --omit=dev -w backend && npm cache clean --force
COPY --from=build /app/backend/dist backend/dist
COPY backend/migrations backend/migrations
# Valores fictícios: o seed compara-os para recusar a palavra-passe de exemplo (RV-37).
COPY .env.example ./
# Pasta da base de dados (CAMINHO_BD=dados/matriz.sqlite), onde se monta o volume; pertence ao utilizador node.
RUN mkdir -p dados && chown node:node dados
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORTA || 3000) + '/api/saude').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "backend/dist/servidor.js"]
