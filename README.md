# Matriz

A Matriz é uma aplicação interna de gestão de projetos e tarefas para equipas. É desenvolvida no contexto de aulas, para um **cliente fictício**.

**Versão candidata:** 1.0.0-rc.1 ([notas da versão](docs/release-notes-1.0.0-rc.1.md), [CHANGELOG](CHANGELOG.md)).

A única informação confirmada pelo cliente é esta frase:

> *"Precisamos de uma aplicação onde as nossas equipas possam organizar projetos, gerir tarefas e acompanhar o progresso do trabalho."*

Tudo o resto são pressupostos da dona do produto, registados em [docs/constraints.md](docs/constraints.md).

## Problema

As equipas gerem o trabalho em Excel e email, e ninguém sabe ao certo o estado de cada projeto (pressuposto R-01).

## Objetivos principais

Pressuposto R-02:
- Todas as tarefas ativas da equipa piloto estão registadas na Matriz.
- Os gestores deixam de pedir pontos de situação por email.

## Funcionalidades

O âmbito do MVP está implementado (incrementos I0 a I10, [docs/implementation-plan.md](docs/implementation-plan.md#8-estado-do-plano)):

- **Contas e perfis:** Administrador, Gestor e Membro, com entrada por email e palavra-passe e possibilidade de desativar contas. Uma conta desativada há mais de um ano é anonimizada automaticamente (RV-33).
- **Projetos:** o Administrador cria projetos e indica o Gestor, elimina projetos sem tarefas, transfere projetos entre Gestores e gere os membros de qualquer projeto, mas nunca é membro (RV-32). O Gestor edita, gere os membros, arquiva e desarquiva. Quem não tem o perfil Gestor só é membro de um projeto ativo de cada vez (RV-31). Pesquisa de projetos pelo nome.
- **Tarefas:** criar, editar e eliminar; vários responsáveis por tarefa (ou juntar-se a uma tarefa sem responsáveis); mudar o estado (Por fazer, Em curso, Concluída); filtrar por estado e prioridade; comentários com autor e data.
- **Progresso:** painel inicial com os projetos do utilizador e as contagens por estado; em cada projeto, percentagem concluída e tarefas em atraso.

O detalhe, as regras de negócio e a matriz de permissões estão em [docs/requirements.md](docs/requirements.md).

## Tecnologias

| Área | Tecnologia |
|---|---|
| Runtime e linguagem | Node.js 26 e TypeScript, no backend e no frontend (Q-14) |
| Backend | Express 5, `zod` (validação), `bcryptjs` (hash das palavras-passe) |
| Base de dados | SQLite através de `node:sqlite`, incluído no Node, com migrations em SQL |
| Frontend | React 19, React Router e Vite |
| Testes | Vitest e Supertest (backend), Testing Library e jsdom (componentes), Playwright (End-to-End) |
| Contentores | Docker e Docker Compose; nginx a servir a interface (P42 a P45) |
| Integração contínua | GitHub Actions (P46) |

A arquitetura (monólito modular) está em [docs/architecture.md](docs/architecture.md).

## Organização da documentação

| Ficheiro | Conteúdo |
|---|---|
| `README.md` | Este ficheiro: apresentação e estado do projeto. |
| [`docs/requirements.md`](docs/requirements.md) | Visão, utilizadores, matriz de permissões, requisitos funcionais e não funcionais, âmbito do MVP e critério de conclusão. |
| [`docs/user-stories.md`](docs/user-stories.md) | User Stories do MVP, critérios de aceitação e casos excecionais. |
| [`docs/constraints.md`](docs/constraints.md) | Restrições, pressupostos e decisões (com estado), segurança e privacidade, decisões técnicas pendentes, limitações de âmbito. |
| [`docs/architecture.md`](docs/architecture.md) | Arquitetura do MVP (monólito modular): comparação das alternativas, decisão, componentes e stack. |
| [`docs/database.md`](docs/database.md) | Modelo de dados, diagrama ER (Mermaid) e mapeamento para SQLite. |
| [`openapi.yaml`](openapi.yaml) | Contrato REST (OpenAPI 3.1) com todas as operações do MVP. |
| [`docs/verification.md`](docs/verification.md) | Percurso manual com a API e a base de dados reais (I8), cenários 01 a 09 da Ficha 3 com evidência (I9), revisão para a entrega e exemplos de uso da IA (I10), testes automáticos e problemas encontrados, e validação final da entrega da Ficha 5 (secção 8). |
| [`docs/implementation-plan.md`](docs/implementation-plan.md) | Conciliação com a Ficha 3, propostas técnicas, estrutura prevista, incrementos e estado da implementação. |
| [`docs/test-plan.md`](docs/test-plan.md) | Plano de testes das tarefas e permissões (TP-01 a TP-06), testes unitários, de integração, End-to-End e de componentes, e execução final. |
| [`docs/quality-security-review.md`](docs/quality-security-review.md) | Revisão de código (CR-01 a CR-04) e de segurança (SEG-01 a SEG-10), com evidências, decisões e estado final. |
| [`docs/ui/`](docs/ui/wireframe.md) | Wireframe de baixa fidelidade da página do projeto (`wireframe.png`), com a validação face ao MVP. |
| [`docs/delivery-plan.md`](docs/delivery-plan.md) | Análise do projeto e plano de preparação para entrega com Docker, Docker Compose e GitHub Actions (Ficha 5). |
| [`CHANGELOG.md`](CHANGELOG.md) | Alterações de cada versão entregue. |
| [`docs/release-notes-1.0.0-rc.1.md`](docs/release-notes-1.0.0-rc.1.md) | Notas da versão candidata 1.0.0-rc.1. |
| [`AGENTS.md`](AGENTS.md) | Instruções persistentes para agentes de desenvolvimento. |

## Como executar

### Requisitos

- **Node.js 26** (inclui o npm e o módulo `node:sqlite`, usado como base de dados). Não é preciso instalar nenhum servidor de base de dados nem ferramentas de compilação.
- **Microsoft Edge**, só para o teste End-to-End (`npm run test:e2e`).
- **Docker com Docker Compose**, só para correr a aplicação em containers (secção [Com Docker](#com-docker)); dispensa o Node.js.

### Instalação e configuração

```bash
npm install
```

```bash
cp .env.example .env
```

O `.env` fica fora do Git. Os valores de `.env.example` são fictícios e servem para desenvolvimento:

| Variável | Para que serve | Exemplo |
|---|---|---|
| `NODE_ENV` | `development` no computador de quem desenvolve; sem este valor, a Matriz comporta-se como em produção (RV-37) | `development` |
| `PORTA` | Porta do backend | `3000` |
| `CAMINHO_BD` | Ficheiro SQLite, relativo à raiz do repositório | `dados/matriz.sqlite` |
| `SESSAO_HORAS` | Horas sem atividade até a sessão expirar (P2) | `8` |
| `PORTA_DOCKER` | Porta deste computador onde o Docker Compose publica a interface (P45); só o compose a usa | `8080` |
| `SEED_PALAVRA_PASSE` | Palavra-passe das contas de demonstração (P10), com pelo menos 8 caracteres. **Mude-a no `.env`:** o valor do `.env.example` é público e o seed recusa-o (RV-37) | um valor seu |

O npm 11 avisa que o pacote `esbuild` tem um script de instalação por aprovar. Não é preciso aprová-lo: o `esbuild` funciona sem ele.

### Base de dados

Cria ou atualiza o esquema (pode correr-se várias vezes; cada migration aplica-se uma só vez):

```bash
npm run bd:migrar
```

Em desenvolvimento, cria os dados de demonstração, só se a base de dados ainda não tiver contas (nunca apaga nem duplica dados). Só corre com `NODE_ENV=development` e com uma `SEED_PALAVRA_PASSE` diferente da do `.env.example` (RV-37):

```bash
npm run bd:seed
```

No piloto, sem dados de demonstração, cria-se só a primeira conta, com o perfil Administrador, numa base sem contas (RV-11, RV-37). O comando pede o nome, o email e a palavra-passe; a palavra-passe não aparece no ecrã:

```bash
npm run bd:primeiro-admin
```

O backend também aplica as migrations ao arrancar, mas nunca corre o seed sozinho. Para recomeçar do zero, apaga-se a pasta `dados/` e volta-se a correr os dois comandos.

### Contas de demonstração

Criadas pelo seed; todos os dados são fictícios. A palavra-passe de todas é o valor de `SEED_PALAVRA_PASSE` no `.env`.

| Nome | Email | Perfil | Notas |
|---|---|---|---|
| Helena Matos | `helena.matos@matriz.test` | Administrador | Gere contas, projetos e membros; nunca é membro de um projeto (RV-32). |
| Ana Silva | `ana.silva@matriz.test` | Gestor | Gere "Lançamento do novo site" e "Relatório anual 2025" (arquivado). Não pertence a "Migração do CRM". |
| Paulo Reis | `paulo.reis@matriz.test` | Gestor | Gere "Migração do CRM". |
| Marta Lopes | `marta.lopes@matriz.test` | Membro | Está em "Lançamento do novo site" e em "Relatório anual 2025" (arquivado). |
| João Pires | `joao.pires@matriz.test` | Membro | Está em "Lançamento do novo site". |
| Rui Costa | `rui.costa@matriz.test` | Membro | Conta desativada: não consegue entrar. |

Quem não tem o perfil Gestor só pode ser membro de um projeto ativo de cada vez; os projetos arquivados não contam (RV-31).

O projeto "Lançamento do novo site" tem as 10 tarefas do CA-18.1 e do [wireframe](docs/ui/wireframe.md).

### Sessão

Entra-se em `http://localhost:5173` com o email e a palavra-passe de uma conta de demonstração. O ciclo da sessão (Q-22, P2):

1. Ao entrar, o backend cria a sessão e devolve o cookie `matriz_sessao` (httpOnly, `SameSite=Lax`; `Secure` sempre, exceto com `NODE_ENV=development`, P37). Na base de dados guarda-se só o hash do identificador.
2. Cada pedido relê a conta e os perfis e renova a sessão: expira após `SESSAO_HORAS` horas sem atividade.
3. A sessão termina com "Sair", quando expira ou quando a conta é desativada. A interface volta então à entrada com a mensagem "A sessão terminou. Entre novamente.".

Depois de 5 tentativas de entrada falhadas com o mesmo email em 15 minutos, a entrada com esse email fica bloqueada durante 15 minutos, mesmo com a palavra-passe certa (RV-35).

As palavras-passe são guardadas só como hash (`bcryptjs`). O contrato da sessão está em [`openapi.yaml`](openapi.yaml) (`/sessao`).

### Arranque

Em desenvolvimento (backend em `http://localhost:3000/api`, interface em `http://localhost:5173`):

```bash
npm run dev
```

Build e arranque de produção do backend:

```bash
npm run build
```

```bash
npm start
```

### Testes

Testes unitários e de integração do backend (Vitest e Supertest, com uma base SQLite em memória por teste) e testes de componentes do frontend (Vitest, Testing Library e jsdom, com a API simulada):

```bash
npm test
```

Teste End-to-End (Playwright): entra como Gestora, abre um projeto, cria uma tarefa e confirma-a na lista. Usa o Microsoft Edge instalado no sistema, sem descarregar navegadores, e arranca o backend (porta 3100) e a interface (porta 5174) com uma base temporária própria, por isso não usa a base de desenvolvimento nem precisa de `.env`:

```bash
npm run test:e2e
```

Em caso de falha, o screenshot e o trace ficam em `test-results/` (`npx playwright show-trace <ficheiro trace.zip>`). Os cenários, os resultados e as limitações estão em [docs/test-plan.md](docs/test-plan.md).

Para confirmar que o backend e a base de dados respondem, abre-se `http://localhost:3000/api/saude`.

### Com Docker

Há duas imagens (P42 a P44): `backend/Dockerfile` (a API) e `frontend/Dockerfile` (a interface servida pelo nginx, que encaminha `/api` para o backend). O `compose.yaml` junta-as (P45). É preciso o Docker instalado; o Node.js não.

Do `.env`, o compose só lê `PORTA_DOCKER` (porta da interface neste computador, 8080 por omissão) e `SESSAO_HORAS`; sem `.env`, usa esses valores por omissão. Os containers correm sempre em modo de produção, mesmo com `NODE_ENV=development` no `.env`.

Validar a configuração, construir as imagens e arrancar:

```bash
docker compose config -q
```

```bash
docker compose build
```

```bash
docker compose up -d
```

A interface fica em `http://localhost:8080` e a API em `http://localhost:8080/api` (por exemplo, `/api/saude`). A porta só fica acessível neste computador (`127.0.0.1`), porque o cookie de sessão é `Secure` e, sem HTTPS, os navegadores só o aceitam em `localhost`. O frontend só arranca depois de o backend responder (*healthy*). Estado e registos:

```bash
docker compose ps
```

```bash
docker compose logs --tail=50
```

A base de dados fica no volume `matriz-dados`, que se mantém quando os containers são recriados. `docker compose down` para os containers e mantém os dados; `docker compose down -v` apaga também o volume, com todos os dados.

O container corre em modo de produção e a base começa sem contas. As imagens não incluem o `.env` nem o `.env.example`, por isso o seed de demonstração não corre no container (RV-37, P44). Para criar a primeira conta de Administrador:

```bash
docker compose exec backend node backend/dist/bd/cli-primeiro-admin.js
```

#### Sem o Compose

As imagens também se constroem e correm uma a uma, a partir da raiz do repositório:

```bash
docker build -f backend/Dockerfile -t matriz-backend .
```

```bash
docker build -f frontend/Dockerfile -t matriz-frontend .
```

O nginx procura o backend pelo nome `backend`, por isso os dois containers ficam na mesma rede e o backend arranca primeiro. A base de dados fica num volume, montado em `/app/dados`:

```bash
docker network create matriz
```

```bash
docker run -d --name backend --network matriz -v matriz-dados:/app/dados matriz-backend
```

```bash
docker run -d --name matriz-frontend --network matriz -p 8080:80 matriz-frontend
```

`docker ps` mostra o estado dos containers e `docker logs backend` o registo do backend. A primeira conta cria-se com `docker exec -it backend node backend/dist/bd/cli-primeiro-admin.js`.

### Integração contínua

O workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) (GitHub Actions, P46) corre em cada push e em cada pull request para o `main`. Tem três jobs, e cada um só corre se os anteriores passarem:

1. **Typecheck, testes e build:** `npm ci`, `npm run typecheck -w backend`, `npm test` e `npm run build`.
2. **Teste End-to-End:** `npm run test:e2e`, com o Microsoft Edge do runner. Se falhar, o trace e o screenshot ficam nos artefactos da execução durante 7 dias.
3. **Imagens Docker:** `docker compose config -q`, `build` e `up -d --wait`, um pedido a `/api/saude` através do nginx e `down -v`.

O workflow só tem permissão de leitura sobre o repositório e não usa segredos. Os resultados estão no separador **Actions** do GitHub.

## Estado atual

- **Specification Pack (Aula 1):** concluído e revisto (RV-01 a RV-23).
- **Architecture Pack (Aula 2):** concluído e revisto (RV-24 a RV-30). A arquitetura, o modelo de dados, o contrato OpenAPI e o wireframe foram aprovados pela dona do produto a 08/11/2026 (RV-41); os pressupostos que cada documento assinala continuam por aprovar.
- **Implementação (Aula 3):** plano consolidado em [docs/implementation-plan.md](docs/implementation-plan.md); âmbito conciliado com a Ficha 3 (Q-14 a Q-22). As propostas técnicas do plano estão aprovadas: P1 a P28 na Ficha 3, P29 a P41 na Ficha 4 e P42 a P46 na Ficha 5.
- **Testes e qualidade (Aula 4):** plano de testes, testes unitários, de integração, End-to-End e de componentes do frontend em [docs/test-plan.md](docs/test-plan.md); revisão de código e de segurança em [docs/quality-security-review.md](docs/quality-security-review.md), sem IDOR nem escalada de privilégios, com CR-01 a CR-04 e SEG-01 a SEG-10 corrigidos.
- **Questões:** todas decididas (Q-01 a Q-23). A Q-23 (08/11/2026): as contas anonimizadas não contam para a regra de um só projeto ativo. Revisões da dona do produto a 01/11/2026: RV-31 (um só projeto ativo sem o perfil Gestor), RV-32 (o Administrador nunca é membro e gere os membros) e RV-33 (anonimização das contas desativadas ao fim de um ano, implementada no I3); a 08/11/2026: RV-35 a RV-40 (segunda revisão de segurança) e RV-41 (aprovação do Architecture Pack).
- **Entrega (Aula 5):** análise e plano em [docs/delivery-plan.md](docs/delivery-plan.md); imagens Docker do backend e da interface (P42 a P44), Docker Compose (P45) e integração contínua com GitHub Actions (P46); documentação técnica, [CHANGELOG](CHANGELOG.md) e [notas da versão candidata 1.0.0-rc.1](docs/release-notes-1.0.0-rc.1.md).
- **Stack:** Node.js 26 e TypeScript, Express, React com Vite, SQLite através de `node:sqlite` (Q-14).
- **Código:** incrementos I0 (estrutura, configuração, esquema, migrations, seed e testes), I1 (sessão e autorização base), I2 (projetos e administração de projetos), I3 (contas e perfis, com a anonimização de RV-33), I4 (membros), I5 (tarefas, estado e filtros), I6 (responsáveis e comentários), I7 (progresso e painel inicial), I8 (consolidação do frontend, com o percurso manual em [docs/verification.md](docs/verification.md)), I9 (verificação do MVP: cenários 01 a 09 da Ficha 3 e correção do problema P1) e I10 (revisão e entrega: revisão do código, refatoração, contrato atualizado, execução a partir de uma cópia limpa e exemplos de uso da IA) concluídos, com as regras de RV-31 e RV-32 aplicadas. O estado de cada incremento está em [docs/implementation-plan.md](docs/implementation-plan.md#8-estado-do-plano).
- **Versões entregues:** Ficha 3, tag `entrega-ficha3`; Ficha 4, tag `entrega-ficha4`. Versão candidata: 1.0.0-rc.1 (Ficha 5), tag `entrega-ficha5`.
- **Pendente:** decisões técnicas e requisitos de segurança por definir, em [docs/constraints.md](docs/constraints.md#4-decisões-técnicas-pendentes). As verificações por fazer estão em [docs/quality-security-review.md](docs/quality-security-review.md#8-estado-final).