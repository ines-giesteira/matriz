# Matriz — Plano de preparação para entrega

Versão 0.1 · 14 de novembro de 2026 · Ficha Prática 05, Exercício 1 (análise e preparação do projeto).

> **Estado: proposta por aprovar.** Este documento analisa o estado atual da Matriz e propõe como preparar a entrega com Docker, Docker Compose e GitHub Actions. Nenhum ficheiro de código ou de configuração foi alterado nesta análise. As decisões e os pressupostos por aprovar estão na secção 9.

## 1. Componentes da aplicação

A Matriz é um **monólito modular** ([architecture.md](architecture.md), aprovado em RV-41), organizado num monorepo com workspaces npm.

| Componente | Onde | Responsabilidade |
|---|---|---|
| **Backend** | `backend/` | API REST em Express 5 e TypeScript, servida em `/api`. Inclui os módulos Contas, Projetos, Tarefas e Progresso e o Relógio de negócio. Aplica as migrations ao arrancar e anonimiza as contas uma vez por dia (RV-33). |
| **Frontend** | `frontend/` | Aplicação de página única (SPA) em React 19, React Router 7 e Vite 8. Chama sempre `/api` com caminhos relativos (`frontend/src/api/cliente.ts`). |
| **Base de dados** | ficheiro SQLite (`dados/matriz.sqlite`) | Usa `node:sqlite`, incluído no Node, em modo WAL. Há 4 migrations em `backend/migrations/`. |
| **CLIs da base de dados** | `backend/src/bd/cli-*.ts` | `bd:migrar`, `bd:seed` (só com `NODE_ENV=development`, RV-37) e `bd:primeiro-admin` (pede os dados de forma interativa). |
| **Contrato da API** | `openapi.yaml` | OpenAPI 3.1. |

**Ponto que afeta o Docker:** em produção, nenhum componente serve o `frontend/dist`. O `npm start` arranca só a API, e a interface só funciona hoje através do servidor de desenvolvimento do Vite, que encaminha `/api` para o backend. A arquitetura exige que a interface e a API estejam na mesma origem, para o cookie de sessão funcionar sem CORS ([architecture.md](architecture.md), secção 6). A forma de servir a interface é a decisão principal deste plano (secção 6).

## 2. Dependências, versões e comandos

- **Runtime:** Node.js ≥ 26 (`engines` do `package.json`); a versão usada no desenvolvimento é a 26.13.0. Não há dependências nativas: o `bcryptjs` é JavaScript puro e o SQLite vem com o Node. Por isso, as imagens não precisam de compilador.
- **Backend (produção):** `express` ^5.3, `zod` ^4.6 e `bcryptjs` ^3.0.
- **Ferramentas de build e teste:** TypeScript 7, `tsx`, Vitest 5, Supertest, jsdom, Testing Library e Playwright 1.64.1.
- **Lockfile:** o `package-lock.json` permite usar `npm ci` e ter builds reproduzíveis.
- **Comandos:** `npm ci`, `npm run typecheck -w backend`, `npm test`, `npm run build` (backend com `tsc` para `dist/`; frontend com `tsc --noEmit` e depois `vite build`), `npm start` (`node backend/dist/servidor.js`) e `npm run test:e2e`.
- **Os CLIs também são compilados:** o `tsc` gera `dist/bd/cli-migrar.js`, `cli-seed.js` e `cli-primeiro-admin.js`. Uma imagem só com as dependências de produção pode, por isso, correr estes CLIs sem `tsx`.

## 3. Serviços externos e variáveis de ambiente

**Serviços externos:** nenhum. Não há servidor de base de dados, email, cache nem chamadas a APIs de terceiros. O Docker Compose terá, portanto, só os componentes da própria aplicação.

| Variável | Valor por omissão | Notas para o Docker |
|---|---|---|
| `NODE_ENV` | (nenhum, conta como produção) | No container fica com um valor diferente de `development`, por isso o cookie leva `Secure` (P37). Os navegadores aceitam cookies `Secure` em `http://localhost`, o que chega para a validação local. |
| `PORTA` | 3000 | Porta interna do backend. |
| `CAMINHO_BD` | `dados/matriz.sqlite` | Relativo à raiz do repositório, que no container é `/app`. Fica em `/app/dados`, onde se monta o volume persistente. |
| `SESSAO_HORAS` | 8 | Horas sem atividade até a sessão expirar (P2). |
| `SEED_PALAVRA_PASSE` | (opcional) | Só para o seed. Nunca entra nas imagens nem no `compose.yaml`; é passada só ao correr o comando. |

O `backend/src/config.ts` carrega o `.env` da raiz quando o ficheiro existe. Como o `.dockerignore` o vai excluir, a configuração no container vem só do ambiente.

## 4. Testes automatizados

Os testes existentes ([test-plan.md](test-plan.md)):

- **Backend:** 13 ficheiros em `backend/testes/` (Vitest e Supertest, com SQLite em memória), que cobrem testes unitários, de integração, de segurança e de endurecimento HTTP.
- **Frontend:** 1 teste de componentes (`frontend/testes/tarefas-projeto.test.tsx`, com jsdom).
- **End-to-End:** `e2e/criar-tarefa.spec.ts`, com Playwright no canal `msedge` e uma base temporária própria.

Os testes não foram executados nesta análise.

## 5. Estratégia para um ambiente reproduzível

- Imagens com **builds multi-stage**, baseadas em `node:26.13-alpine` com a versão fixada, e `npm ci` a partir do lockfile.
- **Um volume nomeado** para `/app/dados`, para os dados sobreviverem quando os containers são recriados.
- **Healthchecks** com `GET /api/saude`, que já confirma a API e a base de dados. Usam o `fetch` do Node, porque a imagem alpine não tem `curl`.
- Os mesmos comandos correm localmente e na CI: `npm ci`, `typecheck`, `test`, `build` e `docker compose build`.
- Os containers correm sem root (utilizador `node`) e as imagens não têm segredos.

## 6. Decisão: como servir a interface

| | **Opção A (recomendada): backend + nginx** | Opção B: só o backend |
|---|---|---|
| Serviços | `backend` (Node) e `frontend` (nginx, que serve o `dist` e encaminha `/api` para `backend:3000`) | Um só container. O Express passa a servir também o `frontend/dist`. |
| Código da aplicação | **Não muda.** | Muda o `app.ts`. A CSP atual (`default-src 'none'`) aplica-se a todas as respostas e bloquearia a SPA, por isso teria de ser separada por caminho. |
| Arquitetura | Mantém a mesma origem ([architecture.md](architecture.md), secção 6) e o comportamento já validado. | Altera uma regra de segurança, o que obriga a rever SEG-02. |
| Custo | Acrescenta um componente (nginx), que é necessário porque hoje nada serve a interface em produção. | Menos um container. |

**Recomendação:** Opção A, porque mantém o comportamento já validado sem alterar o código da aplicação.

## 7. Ficheiros a criar ou alterar

| Ficheiro | Ação |
|---|---|
| `backend/Dockerfile` | Criar. Etapa de build com `npm ci` e `tsc`; etapa final com `npm ci --omit=dev -w backend`, `dist/`, `migrations/`, `USER node`, `EXPOSE 3000`, `HEALTHCHECK` e `CMD node backend/dist/servidor.js`. |
| `frontend/Dockerfile` | Criar. Etapa de build com `npm ci` e `vite build`; etapa final com `nginx:alpine` a servir o `dist`. |
| `frontend/nginx.conf` | Criar. Fallback da SPA (`try_files … /index.html`) e `location /api/` encaminhado para `http://backend:3000`. |
| `.dockerignore` | Criar, na raiz, que é o contexto de build dos dois Dockerfiles por causa dos workspaces. Exclui `node_modules`, `dist`, `dados`, `.env`, `.git`, `.claude`, `test-results` e `e2e`. |
| `compose.yaml` | Criar. Serviços `backend` e `frontend`; rede interna; volume `matriz-dados`; healthchecks; `frontend` com `depends_on: backend (service_healthy)`; só o frontend publica uma porta (por exemplo, `8080:80`). |
| `.env.example` | Acrescentar uma variável para a porta publicada pelo compose. Os valores atuais mantêm-se. |
| `.github/workflows/ci.yml` | Criar. Corre em `push` e `pull_request`, com `permissions: contents: read`. Job `verificar`: setup-node 26, `npm ci`, typecheck, `npm test` e `npm run build`. Job `docker`, com `needs: verificar`: `docker compose build`. |
| `README.md`, `docs/architecture.md` (diagrama Mermaid da implantação), `CHANGELOG.md` e notas da versão candidata | Atualizar ou criar. |
| `docs/implementation-plan.md` | Registar as propostas novas (P42 em diante: Docker, Docker Compose e CI) e o seu estado. |

As alterações ao `README.md` e a `docs/` precisam de aprovação ([AGENTS.md](../AGENTS.md), secção 3). O alojamento da aplicação continua pendente ([constraints.md](constraints.md#4-decisões-técnicas-pendentes)): o Docker garante uma execução reproduzível, mas não decide onde a aplicação fica alojada.

## 8. Etapas de implementação

1. **Containerização:** criar os Dockerfiles, o `.dockerignore` e o `nginx.conf`; construir as duas imagens com `docker build` e validar com `docker run`, `docker ps` e `docker logs`.
2. **Docker Compose:** criar o `compose.yaml` e acrescentar a variável nova ao `.env.example`; correr `docker compose config -q`, `build`, `up -d`, `ps` e `logs`; testar `/api/saude`, a entrada e a criação de uma tarefa; recriar os containers (`down` e `up`) para confirmar que os dados persistem.
3. **Integração contínua:** criar o `ci.yml` e fazer push no ramo; introduzir uma falha controlada num teste, confirmar que a pipeline falha, reverter e confirmar que passa.
4. **Documentação e versão:** atualizar a documentação e o CHANGELOG e propor uma versão segundo Semantic Versioning (por exemplo, `v1.0.0-rc.1`).

## 9. Pressupostos e pontos por decidir

| Ponto | Proposta | Estado |
|---|---|---|
| Como servir a interface | Opção A, backend + nginx (secção 6). | Por decidir |
| Imagem base | `node:26.13-alpine`, alinhada com a versão de desenvolvimento 26.13.0. | Pressuposto por aprovar |
| Dados para validar no compose | O seed exige `NODE_ENV=development` (RV-37). Proposta: correr o seed uma única vez numa base de verificação, com os valores passados só nesse comando (`docker compose run --rm -e NODE_ENV=development -e SEED_PALAVRA_PASSE=… backend node backend/dist/bd/cli-seed.js`). Alternativa: criar só a primeira conta com `cli-primeiro-admin.js`, como no piloto. | Por decidir |
| Teste E2E na CI | O Playwright usa `channel: 'msedge'`. Proposta: incluí-lo num job separado só depois de confirmar que o Edge existe no runner `ubuntu-latest`; caso contrário, fica fora da CI e registado como limitação. | Por confirmar |
| Docker no computador de desenvolvimento | O Docker não está instalado (não está no PATH nem há Docker Desktop). Tem de ser instalado antes de construir as imagens. | Pré-requisito em falta |
